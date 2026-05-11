const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* GET notifications for current user */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT notifID, userID, message, isRead, createdAt
      FROM NOTIFICATIONS
      WHERE userID = ?
      ORDER BY createdAt DESC
      LIMIT 50
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
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

module.exports = router;
