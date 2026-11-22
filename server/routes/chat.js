const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const realtime = require('../realtime');
const sessionCurrent = require('../session-version');
require('dotenv').config();

const router = express.Router();
const adminRoles = ['admin', 'administrator'];
const regularRoles = ['student', 'staff', 'visitor'];
const isAdmin = role => adminRoles.includes(String(role || '').trim().toLowerCase());

async function initialize() {
  await db.query(`CREATE TABLE IF NOT EXISTS ITEM_CHATS (
    conversationID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    itemID INT NULL,
    userID INT NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_chat (itemID, userID),
    KEY idx_item_chat_updated (updatedAt),
    CONSTRAINT fk_item_chat_item FOREIGN KEY (itemID) REFERENCES ITEMS(itemID) ON DELETE CASCADE,
    CONSTRAINT fk_item_chat_user FOREIGN KEY (userID) REFERENCES USERS(userID) ON DELETE CASCADE
  )`);
  // Existing deployments created this column as NOT NULL for item-only chats.
  // Migrate those tables once; nullable item IDs support general conversations.
  const [itemColumns] = await db.query("SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ITEM_CHATS' AND COLUMN_NAME = 'itemID'");
  if (itemColumns[0]?.IS_NULLABLE === 'NO') await db.query('ALTER TABLE ITEM_CHATS MODIFY COLUMN itemID INT NULL');
  await db.query(`CREATE TABLE IF NOT EXISTS ITEM_CHAT_MESSAGES (
    messageID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversationID INT NOT NULL,
    senderID INT NOT NULL,
    senderRole VARCHAR(30) NOT NULL,
    messageText TEXT NOT NULL,
    isRead BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_item_chat_messages (conversationID, createdAt, messageID),
    KEY idx_item_chat_unread (conversationID, isRead),
    CONSTRAINT fk_item_chat_message_conversation FOREIGN KEY (conversationID) REFERENCES ITEM_CHATS(conversationID) ON DELETE CASCADE,
    CONSTRAINT fk_item_chat_message_sender FOREIGN KEY (senderID) REFERENCES USERS(userID) ON DELETE CASCADE
  )`);
}

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);
    if (!await sessionCurrent(user, res)) return;
    req.user = user;
    next();
  });
}

router.use(authenticateToken, async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  try {
    const [rows] = await db.execute("SELECT userID, userName, role FROM USERS WHERE userID = ? AND userStatus = 'active'", [req.user.userID]);
    if (!rows.length) return res.status(403).json({ error: 'An active account is required to use Chat.' });
    req.chatUser = rows[0];
    req.user.role = rows[0].role;
    req.user.userName = rows[0].userName;
    if (!isAdmin(rows[0].role) && !regularRoles.includes(String(rows[0].role).toLowerCase())) {
      return res.status(403).json({ error: 'Chat is unavailable for this account role.' });
    }
    next();
  } catch (err) {
    console.error('CHAT AUTH ERROR:', err);
    res.status(503).json({ error: 'Chat is temporarily unavailable.' });
  }
});

function notifyConversation(userID, conversationID) {
  realtime.emitToRole('admin', 'chat-changed', { conversationID });
  realtime.emitToRole('administrator', 'chat-changed', { conversationID });
  realtime.emitToUser(userID, 'chat-changed', { conversationID });
}

router.get('/items/:id', async (req, res) => {
  if (isAdmin(req.chatUser.role)) return res.status(403).json({ error: 'Only regular users can start an item inquiry.' });
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid item.' });
  try {
    const [rows] = await db.execute(`SELECT i.itemID, i.title, i.description, i.itemType, i.itemStatus,
      c.categoryName, COALESCE(sl.storageName, i.locationDetail, 'Campus') AS locationName
      FROM ITEMS i
      LEFT JOIN CATEGORIES c ON c.categoryID = i.categoryID
      LEFT JOIN STORAGE_LOCATIONS sl ON sl.locationID = i.locationID
      WHERE i.itemID = ? AND i.itemStatus IN ('pending','approved','claimed')`, [req.params.id]);
    const item = rows[0];
    if (!item) return res.status(404).json({ error: 'This item is not available for inquiries.' });
    res.json({ item });
  } catch (err) {
    console.error('CHAT ITEM ERROR:', err);
    res.status(500).json({ error: 'Could not load this item for Chat.' });
  }
});

router.get('/conversations', async (req, res) => {
  const admin = isAdmin(req.chatUser.role);
  const incomingSql = admin
    ? "m.senderRole NOT IN ('admin','administrator')"
    : "m.senderRole IN ('admin','administrator')";
  const unreadUserId = admin ? null : req.chatUser.userID;
  try {
    const [rows] = await db.execute(`SELECT ch.conversationID, ch.itemID, ch.userID, ch.createdAt, ch.updatedAt,
      COALESCE(i.title, 'General inquiry') AS itemTitle, i.itemType, i.itemStatus, i.itemPhotoData,
      c.categoryName,
      participant.userName AS participantName, participant.role AS participantRole,
      (SELECT m.messageText FROM ITEM_CHAT_MESSAGES m WHERE m.conversationID = ch.conversationID ORDER BY m.createdAt DESC, m.messageID DESC LIMIT 1) AS lastMessage,
      (SELECT m.createdAt FROM ITEM_CHAT_MESSAGES m WHERE m.conversationID = ch.conversationID ORDER BY m.createdAt DESC, m.messageID DESC LIMIT 1) AS lastMessageAt,
      (SELECT COUNT(*) FROM ITEM_CHAT_MESSAGES m WHERE m.conversationID = ch.conversationID AND m.isRead = FALSE AND ${incomingSql}) AS unreadCount
      FROM ITEM_CHATS ch
      LEFT JOIN ITEMS i ON i.itemID = ch.itemID
      JOIN USERS participant ON participant.userID = ch.userID
      LEFT JOIN CATEGORIES c ON c.categoryID = i.categoryID
      ${admin ? '' : 'WHERE ch.userID = ?'}
      ORDER BY ch.updatedAt DESC, ch.conversationID DESC`, admin ? [] : [unreadUserId]);
    res.json(rows);
  } catch (err) {
    console.error('CHAT LIST ERROR:', err);
    res.status(500).json({ error: 'Could not load conversations.' });
  }
});

router.post('/conversations', async (req, res) => {
  if (isAdmin(req.chatUser.role)) return res.status(403).json({ error: 'Admins reply to conversations and cannot start an inquiry.' });
  const itemID = req.body.itemID == null || req.body.itemID === '' ? null : Number(req.body.itemID);
  const messageText = String(req.body.message || '').trim();
  if (itemID !== null && (!Number.isSafeInteger(itemID) || itemID < 1)) return res.status(400).json({ error: 'Choose a valid item.' });
  if (!messageText || messageText.length > 2000) return res.status(400).json({ error: 'Write a message of up to 2,000 characters.' });
  let connection;
  try {
    if (itemID !== null) {
      const [items] = await db.execute("SELECT itemID FROM ITEMS WHERE itemID = ? AND itemStatus IN ('pending','approved','claimed')", [itemID]);
      if (!items.length) return res.status(404).json({ error: 'This item is not available for inquiries.' });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    let chat;
    if (itemID === null) {
      // Lock the owning user so simultaneous first messages cannot create duplicate general threads.
      await connection.execute('SELECT userID FROM USERS WHERE userID = ? FOR UPDATE', [req.chatUser.userID]);
      const [existing] = await connection.execute('SELECT conversationID FROM ITEM_CHATS WHERE itemID IS NULL AND userID = ? LIMIT 1 FOR UPDATE', [req.chatUser.userID]);
      if (existing.length) chat = existing[0];
      else {
        const [inserted] = await connection.execute('INSERT INTO ITEM_CHATS (itemID, userID) VALUES (NULL, ?)', [req.chatUser.userID]);
        chat = { conversationID: inserted.insertId };
      }
    } else {
      await connection.execute('INSERT INTO ITEM_CHATS (itemID, userID) VALUES (?, ?) ON DUPLICATE KEY UPDATE conversationID = LAST_INSERT_ID(conversationID)', [itemID, req.chatUser.userID]);
      const [[itemChat]] = await connection.execute('SELECT conversationID FROM ITEM_CHATS WHERE itemID = ? AND userID = ? FOR UPDATE', [itemID, req.chatUser.userID]);
      chat = itemChat;
    }
    await connection.execute('INSERT INTO ITEM_CHAT_MESSAGES (conversationID, senderID, senderRole, messageText) VALUES (?, ?, ?, ?)', [chat.conversationID, req.chatUser.userID, String(req.chatUser.role).toLowerCase(), messageText]);
    await connection.execute('UPDATE ITEM_CHATS SET updatedAt = CURRENT_TIMESTAMP WHERE conversationID = ?', [chat.conversationID]);
    await connection.commit();
    notifyConversation(req.chatUser.userID, chat.conversationID);
    res.status(201).json({ conversationID: chat.conversationID });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('CHAT START ERROR:', err);
    res.status(500).json({ error: 'Could not send your inquiry. Please try again.' });
  } finally {
    connection?.release();
  }
});

async function getAuthorizedConversation(conversationID, user, res) {
  if (!/^\d+$/.test(String(conversationID))) {
    res.status(404).json({ error: 'Conversation not found.' });
    return null;
  }
  const admin = isAdmin(user.role);
  const [rows] = await db.execute(`SELECT ch.conversationID, ch.itemID, ch.userID, COALESCE(i.title, 'General inquiry') AS itemTitle,
    i.itemType, i.itemStatus, i.itemPhotoData, c.categoryName,
    participant.userName AS participantName, participant.role AS participantRole
    FROM ITEM_CHATS ch LEFT JOIN ITEMS i ON i.itemID = ch.itemID
    JOIN USERS participant ON participant.userID = ch.userID
    LEFT JOIN CATEGORIES c ON c.categoryID = i.categoryID
    WHERE ch.conversationID = ? ${admin ? '' : 'AND ch.userID = ?'}`,
  admin ? [conversationID] : [conversationID, user.userID]);
  if (!rows.length) {
    res.status(404).json({ error: 'Conversation not found.' });
    return null;
  }
  return rows[0];
}

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversation = await getAuthorizedConversation(req.params.id, req.chatUser, res);
    if (!conversation) return;
    const admin = isAdmin(req.chatUser.role);
    const [readResult] = await db.execute(`UPDATE ITEM_CHAT_MESSAGES SET isRead = TRUE WHERE conversationID = ? AND isRead = FALSE AND ${admin ? "senderRole NOT IN ('admin','administrator')" : "senderRole IN ('admin','administrator')"}`, [conversation.conversationID]);
    const [messages] = await db.execute(`SELECT m.messageID, m.conversationID, m.senderID, m.senderRole,
      m.messageText, m.isRead, m.createdAt, u.userName AS senderName
      FROM ITEM_CHAT_MESSAGES m JOIN USERS u ON u.userID = m.senderID
      WHERE m.conversationID = ? ORDER BY m.createdAt ASC, m.messageID ASC`, [conversation.conversationID]);
    if (readResult.affectedRows > 0) {
      if (admin) realtime.emitToUser(conversation.userID, 'chat-changed', { conversationID: conversation.conversationID });
      else {
        realtime.emitToRole('admin', 'chat-changed', { conversationID: conversation.conversationID });
        realtime.emitToRole('administrator', 'chat-changed', { conversationID: conversation.conversationID });
      }
    }
    res.json({ conversation, messages });
  } catch (err) {
    console.error('CHAT MESSAGE LIST ERROR:', err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  const messageText = String(req.body.message || '').trim();
  if (!messageText || messageText.length > 2000) return res.status(400).json({ error: 'Write a message of up to 2,000 characters.' });
  let connection;
  try {
    const conversation = await getAuthorizedConversation(req.params.id, req.chatUser, res);
    if (!conversation) return;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.execute('INSERT INTO ITEM_CHAT_MESSAGES (conversationID, senderID, senderRole, messageText) VALUES (?, ?, ?, ?)', [conversation.conversationID, req.chatUser.userID, String(req.chatUser.role).toLowerCase(), messageText]);
    await connection.execute('UPDATE ITEM_CHATS SET updatedAt = CURRENT_TIMESTAMP WHERE conversationID = ?', [conversation.conversationID]);
    await connection.commit();
    notifyConversation(conversation.userID, conversation.conversationID);
    res.status(201).json({ messageID: result.insertId });
  } catch (err) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('CHAT SEND ERROR:', err);
    res.status(500).json({ error: 'Could not send your message. Please try again.' });
  } finally {
    connection?.release();
  }
});

module.exports = { router, initialize };
