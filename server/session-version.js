const db = require('./db');
module.exports = async function sessionCurrent(user, res) {
  try {
    const [rows] = await db.execute('SELECT authVersion FROM USERS WHERE userID = ?', [user.userID]);
    if (!rows.length || Number(rows[0].authVersion) !== Number(user.authVersion || 0)) {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' }); return false;
    }
    return true;
  } catch { res.status(503).json({ error: 'Unable to validate your session. Please try again.' }); return false; }
};
