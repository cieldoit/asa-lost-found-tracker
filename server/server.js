const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const transporter = require('./mailer');
const realtime = require('./realtime');

const app = express();

const ASA_EMAIL_FROM = `"ASA" <${process.env.EMAIL_USER}>`;

function escapeEmailHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

function buildVerificationEmail({ code, name = 'there', intro = 'Use this code to verify your email address.' }) {
  const safeCode = escapeEmailHtml(code);
  const safeName = escapeEmailHtml(name);
  const safeIntro = escapeEmailHtml(intro);

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7f2;font-family:Arial,Helvetica,sans-serif;color:#172016;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfe7dc;box-shadow:0 12px 32px rgba(26,92,42,0.12);">
            <tr>
              <td style="background:#1a5c2a;padding:24px 28px;color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;color:#f5c518;">ASA</div>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:800;">Verify your email address</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#2f3b2d;">Hi ${safeName},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#2f3b2d;">${safeIntro}</p>
                <div style="background:#f8faf5;border:1px solid #e1eadf;border-radius:16px;padding:22px;text-align:center;margin:0 0 24px;">
                  <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#66735f;font-weight:700;margin-bottom:10px;">Your verification code</div>
                  <div style="font-size:36px;line-height:1;letter-spacing:0.22em;font-weight:800;color:#1a5c2a;">${safeCode}</div>
                </div>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#4b5b45;">This code expires in <strong>10 minutes</strong>. For your security, do not share it with anyone.</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7667;">If you did not create an ASA account, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fbfcf8;border-top:1px solid #e8efe5;padding:18px 28px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#778274;">ASA Lost and Found Tracker</p>
                <p style="margin:3px 0 0;font-size:12px;line-height:1.6;color:#9aa495;">Helping the CSU community return lost items safely.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '8mb' }));

const clientDir = path.resolve(__dirname, '../client');
app.use(express.static(clientDir, { index: false }));













const PORT = process.env.PORT || 5000;

/* ================= AUTH MIDDLEWARE ================= */

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

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    if (!isAdminRole(user.role)) {
      return res.status(403).json({ error: "Admin only" });
    }

    req.admin = user;
    req.user = user;
    next();
  });
}

/* ================= ROUTE MODULES ================= */
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

app.get('/api/events', (req, res) => {
  const token = req.query.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    realtime.addClient(user, res);
  });
});


async function ensureStoragePhotoColumn() {
  try {
    await db.execute(`
      ALTER TABLE STORAGE_LOCATIONS
      ADD COLUMN photoData LONGTEXT NULL
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.warn('Could not ensure STORAGE_LOCATIONS.photoData:', err.message);
    }
  }
}

async function ensureItemPhotoColumn() {
  try {
    await db.execute(`
      ALTER TABLE ITEMS
      ADD COLUMN itemPhotoData LONGTEXT NULL
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.warn('Could not ensure ITEMS.itemPhotoData:', err.message);
    }
  }
}

async function ensureUserProfilePhotoColumn() {
  try {
    await db.execute(`
      ALTER TABLE USERS
      ADD COLUMN profilePhotoData LONGTEXT NULL
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.warn('Could not ensure USERS.profilePhotoData:', err.message);
    }
  }
}

async function ensureUserCreatedAtColumn() {
  try {
    await db.execute(`
      ALTER TABLE USERS
      ADD COLUMN createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.warn('Could not ensure USERS.createdAt:', err.message);
    }
  }
}
async function ensureClaimPickupColumns() {
  const columns = [
    ['pickupLocation', 'VARCHAR(255) NULL'],
    ['pickupSchedule', 'VARCHAR(255) NULL'],
    ['adminNote', 'TEXT NULL']
  ];

  for (const [column, definition] of columns) {
    try {
      await db.execute(`ALTER TABLE CLAIMS ADD COLUMN ${column} ${definition}`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.warn(`Could not ensure CLAIMS.${column}:`, err.message);
      }
    }
  }
}
 
async function ensureDatabaseColumns() {
  await ensureStoragePhotoColumn();
  await ensureItemPhotoColumn();
  await ensureUserProfilePhotoColumn();
  await ensureUserCreatedAtColumn();
  await ensureClaimPickupColumns();
}


ensureStoragePhotoColumn();
ensureItemPhotoColumn();
ensureUserProfilePhotoColumn();
ensureUserCreatedAtColumn();
ensureClaimPickupColumns();


function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9._]+/g, '_')
    .replace(/[._]{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '');
}

function compactUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function isAdminRole(role) {
  return ['admin', 'administrator'].includes(String(role || '').trim().toLowerCase());
}

function isAdminLoginAlias(value) {
  return ['admin', 'administrator', 'ccisadmin'].includes(compactUsername(value));
}

function usernameFromRegistration(name, email) {
  const fromEmail = normalizeUsername(email);
  const fromName = normalizeUsername(name);
  return fromEmail || fromName;
}

function isValidUsernameFormat(username) {
  return /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/.test(username);
}

async function ensureDefaultAdminAccount() {
  if (String(process.env.ADMIN_BOOTSTRAP_DISABLED || '').toLowerCase() === 'true') {
    return;
  }

  const adminLoginName = process.env.ADMIN_USERNAME || 'ccis_admin';
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'CCIS Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@carsu.edu.ph';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  try {
    const [admins] = await db.execute(
      `SELECT userID FROM USERS
       WHERE LOWER(email) = LOWER(?)
          OR LOWER(userName) = LOWER(?)
          OR userName = ?
          OR LOWER(REPLACE(REPLACE(REPLACE(userName, ' ', ''), '_', ''), '.', '')) = ?
       LIMIT 1`,
      [adminEmail, adminDisplayName, normalizeUsername(adminLoginName), compactUsername(adminLoginName)]
    );

    if (admins.length) {
      const shouldResetPassword = String(process.env.ADMIN_FORCE_PASSWORD_RESET || '').toLowerCase() === 'true';
      const passwordSql = shouldResetPassword ? ', password = ?' : '';
      const params = shouldResetPassword
        ? [adminDisplayName, adminEmail, passwordHash, admins[0].userID]
        : [adminDisplayName, adminEmail, admins[0].userID];

      await db.execute(
        `UPDATE USERS
         SET userName = ?, email = ?${passwordSql}, role = 'Admin', userStatus = 'active'
         WHERE userID = ?`,
        params
      );
    } else {
      await db.execute(
        `INSERT INTO USERS (userName, email, password, role, userStatus)
         VALUES (?, ?, ?, 'Admin', 'active')`,
        [adminDisplayName, adminEmail, passwordHash]
      );
    }
  } catch (err) {
    console.warn('Could not ensure default admin account:', err.message);
  }
}

const defaultAdminBootstrap = ensureDefaultAdminAccount();

/* ================= AUTH ================= */

app.post('/api/login', async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || '').trim();
  const { password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email/username and password are required." });
  }

  try {
    const [users] = await db.execute(
      `SELECT * FROM USERS
       WHERE LOWER(email) = LOWER(?)
          OR LOWER(userName) = LOWER(?)
          OR userName = ?
          OR LOWER(REPLACE(REPLACE(REPLACE(userName, ' ', ''), '_', ''), '.', '')) = ?
          OR (? = 1 AND LOWER(role) IN ('admin', 'administrator'))
       LIMIT 1`,
      [identifier, identifier, normalizeUsername(identifier), compactUsername(identifier), isAdminLoginAlias(identifier) ? 1 : 0]
    );

   if (users.length === 0)
  return res.status(401).json({ error: "Invalid credentials" });

const user = users[0];
const role = isAdminRole(user.role) ? "Admin" : user.role;

/* ================= USER STATUS CHECK ================= */

if (!isAdminRole(user.role) && user.userStatus === "pending") {
  return res.status(403).json({
    error: "Please verify your email first."
  });
}

if (user.userStatus === "suspended") {
  return res.status(403).json({
    error: "Your account has been suspended."
  });
}

const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      {
        userID: user.userID,
        role,
        userName: user.userName
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      role,
      userName: user.userName
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= POST ITEM ================= */

app.post('/api/items/post', authenticateToken, async (req, res) => {
  const {
    title,
    description,
    dateOccured,
    itemType,
    categoryID,
    locationID,
    locationDetail,
    itemPhotoData
  } = req.body;

  const userID = req.user.userID;
  const cleanItemPhoto = typeof itemPhotoData === 'string' && itemPhotoData.startsWith('data:image/') ? itemPhotoData : null;

  if (cleanItemPhoto && cleanItemPhoto.length > 6_000_000) {
    return res.status(413).json({ error: "Item photo is too large. Please upload a smaller image." });
  }

  if (!title || !description || !dateOccured || !itemType || !categoryID || !locationDetail) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await db.execute(`
      INSERT INTO ITEMS
      (userID, title, description, dateOccured, itemType, categoryID, locationID, locationDetail, itemPhotoData, itemStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      userID,
      title,
      description,
      dateOccured,
      itemType,
      categoryID,
      locationID || null,
      locationDetail,
      cleanItemPhoto
    ]);

    const [users] = await db.execute(
  'SELECT userName FROM USERS WHERE userID = ?',
  [userID]
);

const userName = users[0]?.userName || "Someone";

await db.execute(`
  INSERT INTO NOTIFICATIONS (userID, itemID, message)
  VALUES (?, ?, ?)
`, [
  userID,
  result.insertId,
  `${userName} reported a ${itemType} item: "${title}".`
]);

const [admins] = await db.execute(
  `SELECT userID FROM USERS WHERE LOWER(role) = 'admin' AND userID <> ?`,
  [userID]
);
await Promise.all(admins.map(admin => db.execute(`
  INSERT INTO NOTIFICATIONS (userID, itemID, message)
  VALUES (?, ?, ?)
`, [
  admin.userID,
  result.insertId,
  `${userName} reported a ${itemType} item: "${title}".`
])));

    realtime.emitToAll('items-changed', { reason: 'item-posted', itemID: result.insertId });
    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'item-posted', itemID: result.insertId });
    realtime.emitToUser(userID, 'notifications-changed', { reason: 'item-posted', itemID: result.insertId });

    res.status(201).json({
      message: "Item posted successfully.",
      itemID: result.insertId
    });

  } catch (err) {
    console.error("POST ITEM ERROR:", err);
    res.status(500).json({
      error: "Failed to post item.",
      details: err.message
    });
  }
});

/* ================= CLAIM ITEM ================= */

app.post('/api/claims', authenticateToken, async (req, res) => {
  const { itemID, proof } = req.body;
  const userID = req.user.userID;
  const isAdmin = String(req.user.role || "").toLowerCase() === "admin";

  try {
    if (isAdmin) {
      await db.execute(`
        INSERT INTO NOTIFICATIONS (userID, itemID, message, createdAt)
        SELECT
          ?,
          c.itemID,
          CONCAT(u.userName, ' requested to claim ', i.itemType, ' item: "', i.title, '".'),
          c.createdAt
        FROM CLAIMS c
        JOIN USERS u ON c.userID = u.userID
        JOIN ITEMS i ON c.itemID = i.itemID
        WHERE c.userID <> ?
          AND NOT EXISTS (
            SELECT 1
            FROM NOTIFICATIONS n
            WHERE n.userID = ?
              AND n.itemID = c.itemID
              AND n.message = CONCAT(u.userName, ' requested to claim ', i.itemType, ' item: "', i.title, '".')
          )
      `, [userID, userID, userID]);
    }
    const [claimants] = await db.execute(
      `SELECT userName, email FROM USERS WHERE userID = ?`,
      [userID]
    );
    const [items] = await db.execute(
      `SELECT title, itemType FROM ITEMS WHERE itemID = ?`,
      [itemID]
    );

    const claimantName = claimants[0]?.userName || 'Someone';
    const itemTitle = items[0]?.title || 'an item';
    const itemType = items[0]?.itemType || 'item';

    await db.execute(`
      INSERT INTO CLAIMS (userID, itemID, proof, claimStatus)
      VALUES (?, ?, ?, 'pending')
    `, [userID, itemID, proof || '']);

    await db.execute(`
      INSERT INTO NOTIFICATIONS (userID, itemID, message)
      VALUES (?, ?, ?)
    `, [
      userID,
      itemID,
      `Your claim request for "${itemTitle}" has been submitted.`
    ]);

    const [admins] = await db.execute(
      `SELECT userID FROM USERS WHERE LOWER(role) = 'admin' AND userID <> ?`,
      [userID]
    );
    await Promise.all(admins.map(admin => db.execute(`
      INSERT INTO NOTIFICATIONS (userID, itemID, message)
      VALUES (?, ?, ?)
    `, [
      admin.userID,
      itemID,
      `${claimantName} requested to claim ${itemType} item: "${itemTitle}".`
    ])));

    realtime.emitToRole('admin', 'claims-changed', { reason: 'claim-submitted', itemID });
    realtime.emitToUser(userID, 'notifications-changed', { reason: 'claim-submitted', itemID });

    res.json({ message: "Claim submitted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= APPEAL SYSTEM ================= */

app.post('/api/appeals', authenticateToken, async (req, res) => {
  const { itemID, reason } = req.body;
  const userID = req.user.userID;
  const cleanReason = String(reason || '').trim();

  if (!itemID) {
    return res.status(400).json({ error: "Item is required." });
  }
  if (!cleanReason) {
    return res.status(400).json({ error: "Please provide a reason for the appeal." });
  }

  try {
    const [items] = await db.execute(
      'SELECT title FROM ITEMS WHERE itemID = ?',
      [itemID]
    );
    const [users] = await db.execute(
      'SELECT userName FROM USERS WHERE userID = ?',
      [userID]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: "Item not found." });
    }

    const itemTitle = items[0]?.title || 'this item';
    const userName = users[0]?.userName || 'Someone';

    await db.execute(`
      INSERT INTO ITEM_APPEALS (userID, itemID, reason)
      VALUES (?, ?, ?)
    `, [userID, itemID, cleanReason]);

    await db.execute(`
      INSERT INTO NOTIFICATIONS (userID, itemID, message)
      VALUES (?, ?, ?)
    `, [
      userID,
      itemID,
      `Your appeal for "${itemTitle}" has been submitted.`
    ]);

    const [admins] = await db.execute(
      `SELECT userID FROM USERS WHERE LOWER(role) = 'admin' AND userID <> ?`,
      [userID]
    );
    await Promise.all(admins.map(admin => db.execute(`
      INSERT INTO NOTIFICATIONS (userID, itemID, message)
      VALUES (?, ?, ?)
    `, [
      admin.userID,
      itemID,
      `${userName} submitted an appeal for "${itemTitle}".`
    ])));

    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'appeal-submitted', itemID });
    realtime.emitToUser(userID, 'notifications-changed', { reason: 'appeal-submitted', itemID });

    res.json({ message: "Appeal submitted" });

  } catch (err) {
    console.error('APPEAL ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});
/* ================= NOTIFICATIONS ================= */

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const userID = req.user.userID;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM NOTIFICATIONS WHERE userID = ? ORDER BY createdAt DESC',
      [userID]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const notifID = req.params.id;
  const userID = req.user.userID;

  await db.execute(
    'UPDATE NOTIFICATIONS SET isRead = 1 WHERE notifID = ? AND userID = ?',
    [notifID, userID]
  );

  realtime.emitToUser(userID, 'notifications-changed', { reason: 'notification-read' });

  res.json({ message: "Marked as read" });
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  const userID = req.user.userID;

  await db.execute(
    'UPDATE NOTIFICATIONS SET isRead = 1 WHERE userID = ?',
    [userID]
  );

  realtime.emitToUser(userID, 'notifications-changed', { reason: 'notifications-read-all' });

  res.json({ message: "All notifications marked as read" });
});

/* ================= SERVER ================= */

app.get('/api/items/browse', async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT
        i.itemID,
        i.title,
        i.description,
        i.itemType,
        i.locationDetail,
        i.itemPhotoData,
        sl.storageName AS locationName,
        i.dateOccured,
        i.createdAt,
        i.itemStatus,
        c.categoryName,
        sl.photoData AS locationPhoto
      FROM ITEMS i
      LEFT JOIN CATEGORIES c ON i.categoryID = c.categoryID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      WHERE i.itemStatus IN ('pending', 'approved')
      ORDER BY i.createdAt DESC
    `);

    res.json(items);

  } catch (err) {
    console.error("BROWSE ITEMS ERROR:", err);

    res.status(500).json({
      error: "Could not fetch items.",
      details: err.message
    });
  }
});


app.get('/api/items/my', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT
        i.itemID,
        i.title,
        i.description,
        i.itemType,
        i.locationDetail,
        i.itemPhotoData,
        sl.storageName AS locationName,
        i.dateOccured,
        i.createdAt,
        i.itemStatus,
        c.categoryName,
        sl.photoData AS locationPhoto
      FROM ITEMS i
      LEFT JOIN CATEGORIES c ON i.categoryID = c.categoryID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      WHERE i.userID = ?
      ORDER BY i.createdAt DESC
    `, [req.user.userID]);

    res.json(items);
  } catch (err) {
    console.error('MY POSTS ERROR:', err);
    res.status(500).json({ error: 'Could not fetch your posts.', details: err.message });
  }
});

/* ================= CATEGORIES & LOCATIONS ================= */

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT categoryID, categoryName 
      FROM CATEGORIES
      ORDER BY categoryName ASC
    `);

    res.json(categories);
  } catch (err) {
    console.error("CATEGORIES ERROR:", err);
    res.status(500).json({
      error: "Could not fetch categories.",
      details: err.message
    });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const [locations] = await db.execute(`
      SELECT locationID, storageName, building, photoData
      FROM STORAGE_LOCATIONS
      ORDER BY storageName ASC
    `);

    res.json(locations);
  } catch (err) {
    console.error("LOCATIONS ERROR:", err);
    res.status(500).json({
      error: "Could not fetch locations.",
      details: err.message
    });
  }
});

/* ================= REGISTER WITH OTP ================= */

app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  const campusEmailPattern = /^[a-zA-Z]+(\.[a-zA-Z]+)+@carsu\.edu\.ph$/;
  const visitorEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const userName = usernameFromRegistration(name, email);

  if (!isValidUsernameFormat(userName)) {
    return res.status(400).json({
      error: "Username must be 3-30 characters and use only lowercase letters, numbers, dots, or underscores."
    });
  }

  if (["Student", "Staff"].includes(role) && !campusEmailPattern.test(email)) {
    return res.status(400).json({
      error: "Email must follow firstname.lastname@carsu.edu.ph format."
    });
  }

  if (role === "Visitor" && !visitorEmailPattern.test(email)) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

  if (!["Student", "Staff", "Visitor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    const [existing] = await db.execute(
      "SELECT userID, email, userName FROM USERS WHERE email = ? OR userName = ? LIMIT 1",
      [email, userName]
    );

    if (existing.length > 0) {
      if (String(existing[0].email).toLowerCase() === String(email).toLowerCase()) {
        return res.status(400).json({ error: "Email already registered." });
      }
      return res.status(400).json({ error: "Username already taken. Please use a different email or contact support." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(`
      INSERT INTO USERS (userName, email, password, role, userStatus)
      VALUES (?, ?, ?, ?, 'pending')
    `, [userName, email, hashedPassword, role]);

    await db.execute(`
      INSERT INTO OTP_VERIFICATIONS (email, otpCode, expiresAt)
      VALUES (?, ?, ?)
    `, [email, otp, expiresAt]);

    await transporter.sendMail({
      from: ASA_EMAIL_FROM,
      to: email,
      subject: "ASA Email Verification Code",
      text: `Hi ${name}, your ASA username is ${userName}. Your verification code is ${otp}. This code expires in 10 minutes.`,
      html: buildVerificationEmail({
        code: otp,
        name,
        intro: `Welcome to ASA. Your username is ${userName}. Use this code to verify your email address and activate your lost and found account.`
      })
    });

    res.status(201).json({
      message: "Account created. Please verify your email.",
      email,
      userName
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      error: "Registration failed.",
      details: err.message
    });
  }
});


/* ================= VERIFY OTP ================= */

app.post('/api/verify-otp', async (req, res) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const [users] = await db.execute(
      "SELECT * FROM USERS WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = users[0];

    if (user.userStatus === "active") {
      return res.status(400).json({ error: "Account already verified." });
    }

    const [otps] = await db.execute(`
      SELECT *
      FROM OTP_VERIFICATIONS
      WHERE email = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `, [email]);

    if (otps.length === 0) {
      return res.status(400).json({ error: "No OTP found. Please register again." });
    }

    const otp = otps[0];

    if (otp.attempts >= 5) {
      return res.status(400).json({ error: "Too many attempts. Please register again." });
    }

    if (new Date(otp.expiresAt) < new Date()) {
      return res.status(400).json({ error: "OTP expired. Please register again." });
    }

    if (otp.otpCode !== otpCode) {
      await db.execute(
        "UPDATE OTP_VERIFICATIONS SET attempts = attempts + 1 WHERE otpID = ?",
        [otp.otpID]
      );

      return res.status(400).json({ error: "Invalid OTP." });
    }

    await db.execute(
      "UPDATE USERS SET userStatus = 'active' WHERE email = ?",
      [email]
    );

    await db.execute(
      "DELETE FROM OTP_VERIFICATIONS WHERE email = ?",
      [email]
    );

    res.json({ message: "Email verified successfully. You can now login." });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({
      error: "OTP verification failed.",
      details: err.message
    });
  }
});


/* ================= RESEND OTP ================= */

app.post('/api/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const [users] = await db.execute(
      "SELECT * FROM USERS WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    if (users[0].userStatus === "active") {
      return res.status(400).json({ error: "Account already verified." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(
      "DELETE FROM OTP_VERIFICATIONS WHERE email = ?",
      [email]
    );

    await db.execute(`
      INSERT INTO OTP_VERIFICATIONS (email, otpCode, expiresAt)
      VALUES (?, ?, ?)
    `, [email, otp, expiresAt]);

    await transporter.sendMail({
      from: ASA_EMAIL_FROM,
      to: email,
      subject: "ASA New Verification Code",
      text: `Hi ${users[0].userName || 'there'}, your new ASA verification code is ${otp}. This code expires in 10 minutes.`,
      html: buildVerificationEmail({
        code: otp,
        name: users[0].userName || 'there',
        intro: 'Here is your new ASA verification code. Use it to finish activating your account.'
      })
    });

    res.json({ message: "New OTP sent to your email." });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    res.status(500).json({
      error: "Could not resend OTP.",
      details: err.message
    });
  }
});

/* ================= ADMIN LOGIN ================= */

app.post('/api/admin/login', async (req, res) => {
  const { managedBy, password } = req.body;

  try {
    await defaultAdminBootstrap;

    const [users] = await db.execute(
      `SELECT * FROM USERS
       WHERE LOWER(role) IN ('admin', 'administrator')
         AND (
           LOWER(email) = LOWER(?)
           OR LOWER(userName) = LOWER(?)
           OR userName = ?
           OR LOWER(REPLACE(REPLACE(REPLACE(userName, ' ', ''), '_', ''), '.', '')) = ?
           OR ? = 1
         )
       LIMIT 1`,
      [managedBy, managedBy, normalizeUsername(managedBy), compactUsername(managedBy), isAdminLoginAlias(managedBy) ? 1 : 0]
    );

    if (users.length === 0)
      return res.status(401).json({ error: "Invalid admin credentials" });

    const user = users[0];

    if (user.userStatus === "suspended")
      return res.status(403).json({ error: "Account suspended." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid admin credentials" });

    const token = jwt.sign(
      { userID: user.userID, role: "Admin", userName: user.userName },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: "Admin", userName: user.userName, managedBy: user.userName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/admin', authenticateAdmin, adminRoutes);

/* ================= MY CLAIMS ================= */

app.get('/api/claims/my', authenticateToken, async (req, res) => {
  const userID = req.user.userID;
  try {
    const [rows] = await db.execute(`
      SELECT
        c.claimID,
        c.claimStatus,
        c.createdAt,
        i.title AS itemTitle,
        i.itemType,
        i.description
      FROM CLAIMS c
      JOIN ITEMS i ON c.itemID = i.itemID
      WHERE c.userID = ?
      ORDER BY c.createdAt DESC
    `, [userID]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ITEM DETAILS ================= */

app.get('/api/items/details/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        i.*,
        c.categoryName,
        u.userName AS reporterName,
        u.role AS reporterRole,
        sl.storageName AS locationName,
        sl.photoData AS locationPhoto
      FROM ITEMS i
      LEFT JOIN CATEGORIES c ON i.categoryID = c.categoryID
      LEFT JOIN USERS u ON i.userID = u.userID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      WHERE i.itemID = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: "Item not found" });
    res.json({
      ...rows[0],
      accountUsername: normalizeUsername(rows[0].userName)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CHANGE PASSWORD ================= */

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT userID, userName, email, role, userStatus, profilePhotoData FROM USERS WHERE userID = ?',
      [req.user.userID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/locations/photo', authenticateAdmin, async (req, res) => {
  const { storageName, photoData } = req.body;

  if (!storageName || typeof storageName !== 'string') {
    return res.status(400).json({ error: "Pick-up location is required." });
  }

  if (!photoData || typeof photoData !== 'string' || !photoData.startsWith('data:image/')) {
    return res.status(400).json({ error: "A valid image is required." });
  }

  if (photoData.length > 6_000_000) {
    return res.status(413).json({ error: "Image is too large. Please upload a smaller photo." });
  }

  try {
    const cleanName = storageName.trim();
    const [existing] = await db.execute(
      `SELECT locationID FROM STORAGE_LOCATIONS WHERE storageName = ? OR building = ? LIMIT 1`,
      [cleanName, cleanName]
    );

    let locationID;
    if (existing.length) {
      locationID = existing[0].locationID;
      await db.execute(
        `UPDATE STORAGE_LOCATIONS SET photoData = ? WHERE locationID = ?`,
        [photoData, locationID]
      );
    } else {
      const [result] = await db.execute(
        `INSERT INTO STORAGE_LOCATIONS (storageName, building, photoData) VALUES (?, ?, ?)`,
        [cleanName, cleanName, photoData]
      );
      locationID = result.insertId;
    }

    res.json({ message: "Building photo saved.", locationID, storageName: cleanName, photoData });
  } catch (err) {
    console.error("LOCATION PHOTO SAVE ERROR:", err);
    res.status(500).json({ error: "Could not save building photo.", details: err.message });
  }
});

app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userID = req.user.userID;

  try {
    const [users] = await db.execute('SELECT * FROM USERS WHERE userID = ?', [userID]);
    if (users.length === 0) return res.status(404).json({ error: "User not found." });

    const match = await bcrypt.compare(currentPassword, users[0].password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE USERS SET password = ? WHERE userID = ?', [hashed, userID]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE PROFILE ================= */

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { userName, profilePhotoData } = req.body;
  const userID = req.user.userID;
  const isAdmin = String(req.user.role || "").toLowerCase() === "admin";

  try {
    if (isAdmin) {
      await db.execute(`
        INSERT INTO NOTIFICATIONS (userID, itemID, message, createdAt)
        SELECT
          ?,
          c.itemID,
          CONCAT(u.userName, ' requested to claim ', i.itemType, ' item: "', i.title, '".'),
          c.createdAt
        FROM CLAIMS c
        JOIN USERS u ON c.userID = u.userID
        JOIN ITEMS i ON c.itemID = i.itemID
        WHERE c.userID <> ?
          AND NOT EXISTS (
            SELECT 1
            FROM NOTIFICATIONS n
            WHERE n.userID = ?
              AND n.itemID = c.itemID
              AND n.message = CONCAT(u.userName, ' requested to claim ', i.itemType, ' item: "', i.title, '".')
          )
      `, [userID, userID, userID]);
    }
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    const cleanPhoto = typeof profilePhotoData === 'string' && profilePhotoData.startsWith('data:image/')
      ? profilePhotoData
      : null;

    if (profilePhotoData !== undefined && profilePhotoData !== null && !cleanPhoto) {
      return res.status(400).json({ error: "A valid profile image is required." });
    }

    if (cleanPhoto && cleanPhoto.length > 4_000_000) {
      return res.status(413).json({ error: "Profile image is too large. Please upload a smaller photo." });
    }

    if (profilePhotoData !== undefined) {
      await db.execute('UPDATE USERS SET userName = ?, profilePhotoData = ? WHERE userID = ?', [userName.trim(), cleanPhoto, userID]);
    } else {
      await db.execute('UPDATE USERS SET userName = ? WHERE userID = ?', [userName.trim(), userID]);
    }

    const [rows] = await db.execute(
      'SELECT userID, userName, email, role, userStatus, profilePhotoData FROM USERS WHERE userID = ?',
      [userID]
    );
    res.json({
      message: "Profile updated successfully.",
      user: rows[0] ? { ...rows[0], accountUsername: normalizeUsername(rows[0].userName) } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CLIENT ROUTES ================= */

const pageRoutes = {
  '/login': 'login/landing.html',
  '/selection': 'login/selection.html',
  '/signup/student': 'login/signupStud.html',
  '/signup/staff': 'login/signupStaff.html',
  '/signup/visitor': 'login/signupVisitor.html',
  '/student': 'user/student.html',
  '/staff': 'user/staff.html',
  '/visitor': 'user/visitor.html',
  '/admin': 'user/admin.html',
  '/guest': 'user/guest.html',
  '/dashboard': 'user/dashboard .html',
  '/privacy': 'ASA_details/info.html',
  '/terms': 'ASA_details/info.html',
  '/about': 'ASA_details/about.html'
};

Object.entries(pageRoutes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(clientDir, file));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(clientDir, 'login/index.html'));
});

// Catch-all: return index for any unmatched route
app.use((req, res) => {
  res.sendFile(path.join(clientDir, 'login/index.html'));
});

async function startServer() {
  try {
    await ensureDatabaseColumns();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
