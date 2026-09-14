const db = require('./db');
const media = require('./media');
// Database changes succeed together before removing remote files.
module.exports = async function deleteItem(itemID, ownerID) {
  const connection = await db.getConnection();
  const assets = [];
  try {
    await connection.beginTransaction();
    const [items] = await connection.execute('SELECT userID, itemPhotoData FROM ITEMS WHERE itemID = ? FOR UPDATE', [itemID]);
    if (!items.length || (ownerID !== undefined && String(items[0].userID) !== String(ownerID))) {
      throw Object.assign(new Error('Post not found or not owned by this account.'), { status: 404 });
    }
    assets.push(media.publicAsset(items[0].itemPhotoData));
    const [claims] = await connection.execute('SELECT attachment FROM CLAIMS WHERE itemID = ?', [itemID]);
    for (const claim of claims) if (claim.attachment) assets.push(JSON.parse(claim.attachment));
    for (const table of ['CLAIMS', 'NOTIFICATIONS', 'ITEM_APPEALS', 'IMAGES']) await connection.query('DELETE FROM ?? WHERE itemID = ?', [table, itemID]);
    await connection.execute('DELETE FROM ITEMS WHERE itemID = ?', [itemID]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally { connection.release(); }
  await media.cleanup(assets);
};
