const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const GENERIC = 'If an active account matches that email, a reset link will be sent. Check your inbox and spam folder.';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

module.exports = function passwordResetRoutes({ db, mailer, configured = () => Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL), origin = () => process.env.FRONTEND_URL }) {
  const router = express.Router();
  const limits = new Map();
  function limited(key, maximum) {
    const now = Date.now();
    for (const [k, value] of limits) if (value.until <= now) limits.delete(k);
    let bucket = limits.get(key);
    if (!bucket) {
      if (limits.size >= 10000) return true;
      bucket = { count: 0, until: now + 15 * 60 * 1000 }; limits.set(key, bucket);
    }
    return ++bucket.count > maximum;
  }
  router.post('/forgot-password', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (limited('forgot-ip:' + req.ip, 10) || limited('email:' + digest(email), 3)) return res.status(429).json({ error: 'Too many reset requests. Try again in 15 minutes.' });
    let base;
    try { base = new URL(origin()); } catch { return res.status(503).json({ error: 'Password recovery is not configured. Please contact the administrator.' }); }
    if (!configured() || !['https:', 'http:'].includes(base.protocol) || (base.protocol === 'http:' && !['localhost','127.0.0.1'].includes(base.hostname))) return res.status(503).json({ error: 'Password recovery email is not available yet. Please contact the administrator.' });
    let tokenHash;
    try {
      const [users] = await db.execute("SELECT email FROM USERS WHERE email = ? AND userStatus = 'active'", [email]);
      if (!users.length) return res.status(202).json({ message: GENERIC });
      const token = crypto.randomBytes(32).toString('hex');
      tokenHash = digest(token);
      await db.execute(`INSERT INTO PASSWORD_RESETS (email, token, expiresAt) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE))
        ON DUPLICATE KEY UPDATE token = VALUES(token), expiresAt = VALUES(expiresAt), createdAt = UTC_TIMESTAMP()`, [users[0].email, tokenHash]);
      const url = new URL('/login/reset-password.html', base.origin);
      url.hash = 'token=' + token;
      // Only the random hexadecimal token is included in the email URL.
      await mailer.sendMail({ to: users[0].email, subject: 'Reset your ASA password', html: '<p>You requested a password reset for ASA Lost and Found.</p><p><a href="' + url.href + '">Reset your password</a></p><p>This link expires in 15 minutes and can be used once. If you did not request this, ignore this email; your password has not changed.</p>' });
      return res.status(202).json({ message: GENERIC });
    } catch {
      if (tokenHash) await db.execute('DELETE FROM PASSWORD_RESETS WHERE token = ?', [tokenHash]).catch(() => {});
      // Do not reveal account existence or provider details to the requester.
      console.warn('Password reset request failed; check database and email provider configuration.');
      return res.status(202).json({ message: GENERIC });
    }
  });
  router.post('/reset-password', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (limited('reset-ip:' + req.ip, 20)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    const { token, password } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new link.' });
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return res.status(400).json({ error: 'Use at least 8 characters and no more than 72 bytes for your password.' });
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute(`SELECT r.resetID, r.email, u.userID FROM PASSWORD_RESETS r JOIN USERS u ON u.email = r.email
        WHERE r.token = ? AND r.expiresAt > UTC_TIMESTAMP() AND u.userStatus = 'active' FOR UPDATE`, [digest(token)]);
      if (!rows.length) {
        await connection.rollback();
        return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new link.' });
      }
      const hashed = await bcrypt.hash(password, 10);
      await connection.execute('UPDATE USERS SET password = ?, authVersion = authVersion + 1 WHERE email = ?', [hashed, rows[0].email]);
      await connection.execute('DELETE FROM PASSWORD_RESETS WHERE resetID = ?', [rows[0].resetID]);
      await connection.commit();
      require('../realtime').disconnectUser(rows[0].userID);
      return res.json({ message: 'Password updated. You can now log in with your new password.' });
    } catch {
      if (connection) await connection.rollback().catch(() => {});
      return res.status(500).json({ error: 'Could not reset your password. Please try again.' });
    } finally { if (connection) connection.release(); }
  });
  return router;
};
