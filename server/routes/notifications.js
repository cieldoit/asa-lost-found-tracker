const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const realtime = require('../realtime');
const sessionCurrent = require('../session-version');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);
    if (!await sessionCurrent(user, res)) return;
    req.user = user;
    next();
  });
}

/* GET notifications for current user */
router.get('/', authenticateToken, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const [rows] = await db.query(`
      SELECT notifID, userID, itemID, message, isRead, createdAt
      FROM NOTIFICATIONS
      WHERE userID = ?
      ORDER BY createdAt DESC, notifID DESC
    `, [req.user.userID]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/* Mark single notification as read */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.query(
      `UPDATE NOTIFICATIONS SET isRead = 1 WHERE notifID = ? AND userID = ?`,
      [req.params.id, req.user.userID]
    );
    realtime.emitToUser(req.user.userID, 'notifications-changed', { reason: 'notification-read' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

/* Mark all as read */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await db.query(
      `UPDATE NOTIFICATIONS SET isRead = 1 WHERE userID = ?`,
      [req.user.userID]
    );
    realtime.emitToUser(req.user.userID, 'notifications-changed', { reason: 'notifications-read-all' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
