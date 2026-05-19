// server/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const realtime = require('../realtime');

/* ================= ADMIN STATS ================= */
router.get('/stats', async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM USERS) AS totalUsers,
        (SELECT COUNT(*) FROM ITEMS WHERE itemType = 'lost') AS totalLost,
        (SELECT COUNT(*) FROM ITEMS WHERE itemType = 'found') AS totalFound,
        (SELECT COUNT(*) FROM CLAIMS WHERE claimStatus = 'pending') AS pendingClaims,
        (SELECT COUNT(*) FROM ITEMS WHERE itemStatus = 'claimed') AS resolvedItems
    `);

    res.json({
      totalUsers: stats.totalUsers || 0,
      totalLost: stats.totalLost || 0,
      totalFound: stats.totalFound || 0,
      pendingClaims: stats.pendingClaims || 0,
      resolvedItems: stats.resolvedItems || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

/* ================= USERS ================= */
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT userID, userName, email, role, userStatus, profilePhotoData, createdAt
      FROM USERS
      ORDER BY userID DESC
    `);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/users/:userID/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.query(`UPDATE USERS SET userStatus = ? WHERE userID = ?`, [status, req.params.userID]);
    res.json({ message: 'User status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

/* ================= ITEMS ================= */
router.get('/items', async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT
        i.itemID,
        i.title,
        i.description,
        i.itemType,
        i.itemStatus,
        i.locationID,
        i.locationDetail,
        i.itemPhotoData,
        i.dateOccured,
        i.createdAt,
        c.categoryName AS category,
        u.userName AS reporterName,
        u.role AS reporterRole,
        sl.storageName AS location,
        sl.photoData AS locationPhoto,
        pending.claimID AS pendingClaimID,
        pending.userName AS pendingClaimantName,
        pending.email AS pendingClaimantEmail
      FROM ITEMS i
      LEFT JOIN CATEGORIES c ON i.categoryID = c.categoryID
      LEFT JOIN USERS u ON i.userID = u.userID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      LEFT JOIN (
        SELECT c.claimID, c.itemID, u2.userName, u2.email
        FROM CLAIMS c
        JOIN USERS u2 ON c.userID = u2.userID
        WHERE c.claimStatus = 'pending'
          AND c.claimID = (
            SELECT MIN(c2.claimID)
            FROM CLAIMS c2
            WHERE c2.itemID = c.itemID AND c2.claimStatus = 'pending'
          )
      ) pending ON pending.itemID = i.itemID
      ORDER BY i.createdAt DESC
    `);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

router.put('/items/:id/approve', async (req, res) => {
  try {
    const [items] = await db.query('SELECT userID, title FROM ITEMS WHERE itemID = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: "Item not found." });
    const item = items[0];

    await db.query(`UPDATE ITEMS SET itemStatus = 'approved' WHERE itemID = ?`, [req.params.id]);

    await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
      item.userID, req.params.id,
      `Your item "${item.title}" has been approved and is now visible.`
    ]);

    realtime.emitToUser(item.userID, 'notifications-changed', { reason: 'item-approved', itemID: req.params.id });
    realtime.emitToAll('items-changed', { reason: 'item-approved', itemID: req.params.id });
    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'item-approved', itemID: req.params.id });

    res.json({ message: 'Item approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve item' });
  }
});

router.put('/items/:id/reject', async (req, res) => {
  try {
    const [items] = await db.query('SELECT userID, title FROM ITEMS WHERE itemID = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: "Item not found." });
    const item = items[0];

    await db.query(`UPDATE ITEMS SET itemStatus = 'rejected' WHERE itemID = ?`, [req.params.id]);

    await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
      item.userID, req.params.id,
      `Your item "${item.title}" has been rejected.`
    ]);

    realtime.emitToUser(item.userID, 'notifications-changed', { reason: 'item-rejected', itemID: req.params.id });
    realtime.emitToAll('items-changed', { reason: 'item-rejected', itemID: req.params.id });
    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'item-rejected', itemID: req.params.id });

    res.json({ message: 'Item rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject item' });
  }
});

router.put('/items/:id/resolve', async (req, res) => {
  try {
    const [items] = await db.query('SELECT userID, title FROM ITEMS WHERE itemID = ?', [req.params.id]);
    if (items.length === 0) return res.status(404).json({ error: "Item not found." });
    const item = items[0];

    await db.query(`UPDATE ITEMS SET itemStatus = 'claimed' WHERE itemID = ?`, [req.params.id]);

    await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
      item.userID, req.params.id,
      `Your item "${item.title}" has been marked as resolved/claimed.`
    ]);

    realtime.emitToUser(item.userID, 'notifications-changed', { reason: 'item-resolved', itemID: req.params.id });
    realtime.emitToAll('items-changed', { reason: 'item-resolved', itemID: req.params.id });
    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'item-resolved', itemID: req.params.id });

    res.json({ message: 'Item resolved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resolve item' });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM CLAIMS WHERE itemID = ?', [req.params.id]);
    await db.query('DELETE FROM NOTIFICATIONS WHERE itemID = ?', [req.params.id]);
    await db.query('DELETE FROM ITEMS WHERE itemID = ?', [req.params.id]);
    realtime.emitToAll('items-changed', { reason: 'item-deleted', itemID: req.params.id });
    realtime.emitToRole('admin', 'admin-data-changed', { reason: 'item-deleted', itemID: req.params.id });

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

/* ================= CLAIMS ================= */
router.get('/claims', async (req, res) => {
  try {
    const [claims] = await db.query(`
      SELECT
        c.claimID,
        c.claimStatus,
        c.proof,
        c.createdAt,
        c.pickupLocation,
        c.pickupSchedule,
        c.adminNote,
        u.userName,
        u.email,
        i.title AS itemTitle,
        i.itemType,
        i.itemID,
        COALESCE(sl.storageName, i.locationDetail, 'Campus') AS pickupLocationSource
      FROM CLAIMS c
      JOIN USERS u ON c.userID = u.userID
      JOIN ITEMS i ON c.itemID = i.itemID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      ORDER BY c.createdAt DESC
    `);
    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
});

router.put('/claims/:id/approve', async (req, res) => {
  try {
    const { pickupSchedule, adminNote } = req.body || {};

    if (!pickupSchedule) {
      return res.status(400).json({ error: 'Pickup schedule is required.' });
    }

    const [claims] = await db.query(`
      SELECT
        c.userID,
        c.itemID,
        i.title,
        i.userID AS ownerID,
        COALESCE(sl.storageName, i.locationDetail, 'Campus') AS pickupLocation
      FROM CLAIMS c
      JOIN ITEMS i ON c.itemID = i.itemID
      LEFT JOIN STORAGE_LOCATIONS sl ON i.locationID = sl.locationID
      WHERE c.claimID = ?
    `, [req.params.id]);

    if (claims.length === 0) return res.status(404).json({ error: "Claim not found." });
    const claim = claims[0];

    await db.query(`
      UPDATE CLAIMS
      SET claimStatus = 'approved', pickupLocation = ?, pickupSchedule = ?, adminNote = ?
      WHERE claimID = ?
    `, [claim.pickupLocation, pickupSchedule, adminNote || '', req.params.id]);

    await db.query(`UPDATE ITEMS SET itemStatus = 'claimed' WHERE itemID = ?`, [claim.itemID]);

    await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
      claim.userID,
      claim.itemID,
      `Your claim for "${claim.title}" has been approved. Please go to ${claim.pickupLocation} on ${pickupSchedule} for verification and pickup.${adminNote ? ` Note: ${adminNote}` : ''}`
    ]);

    if (claim.ownerID !== claim.userID) {
      await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
        claim.ownerID,
        claim.itemID,
        `Your item "${claim.title}" has an approved claim and is ready for claimant verification.`
      ]);
    }

    realtime.emitToUser(claim.userID, 'notifications-changed', { reason: 'claim-approved', itemID: claim.itemID });
    if (claim.ownerID !== claim.userID) realtime.emitToUser(claim.ownerID, 'notifications-changed', { reason: 'claim-approved-owner', itemID: claim.itemID });
    realtime.emitToAll('items-changed', { reason: 'claim-approved', itemID: claim.itemID });
    realtime.emitToRole('admin', 'claims-changed', { reason: 'claim-approved', itemID: claim.itemID });

    res.json({ message: 'Claim approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve claim' });
  }
});

router.put('/claims/:id/reject', async (req, res) => {
  try {
    const { adminNote } = req.body || {};

    const [claims] = await db.query(`
      SELECT c.userID, c.itemID, i.title
      FROM CLAIMS c
      JOIN ITEMS i ON c.itemID = i.itemID
      WHERE c.claimID = ?
    `, [req.params.id]);

    if (claims.length === 0) return res.status(404).json({ error: "Claim not found." });
    const claim = claims[0];

    await db.query(`
      UPDATE CLAIMS
      SET claimStatus = 'rejected', adminNote = ?
      WHERE claimID = ?
    `, [adminNote || '', req.params.id]);

    await db.query(`INSERT INTO NOTIFICATIONS (userID, itemID, message) VALUES (?, ?, ?)`, [
      claim.userID,
      claim.itemID,
      `Your claim for "${claim.title}" has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`
    ]);

    realtime.emitToUser(claim.userID, 'notifications-changed', { reason: 'claim-rejected', itemID: claim.itemID });
    realtime.emitToRole('admin', 'claims-changed', { reason: 'claim-rejected', itemID: claim.itemID });

    res.json({ message: 'Claim rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject claim' });
  }
});

/* ================= APPEALS / ITEM REPORTS ================= */
router.get('/appeals', async (req, res) => {
  try {
    const [appeals] = await db.query(`
      SELECT
        a.appealID,
        a.userID,
        a.itemID,
        a.reason,
        a.createdAt,
        u.userName,
        u.role,
        i.title AS itemTitle,
        i.itemType,
        i.itemStatus
      FROM ITEM_APPEALS a
      JOIN USERS u ON a.userID = u.userID
      JOIN ITEMS i ON a.itemID = i.itemID
      ORDER BY a.createdAt DESC
    `);
    res.json(appeals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch item reports' });
  }
});

module.exports = router;
