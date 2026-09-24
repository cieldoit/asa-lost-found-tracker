// A single conditional update protects ownership and the allowed transition.
module.exports = (db, realtime) => async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({error:'Invalid report ID.'});
  try {
    const [result] = await db.execute("UPDATE ITEMS SET itemStatus='claimed', editedAt=CURRENT_TIMESTAMP WHERE itemID=? AND userID=? AND itemType='lost' AND itemStatus='approved'", [req.params.id, req.user.userID]);
    if (!result.affectedRows) return res.status(409).json({error:'Only your own approved lost report can be marked as recovered. Refresh your profile.'});
    realtime.emitToAll('items-changed', {reason:'item-recovered',itemID:req.params.id});
    realtime.emitToRole('admin','admin-data-changed',{reason:'item-recovered',itemID:req.params.id});
    res.json({itemStatus:'claimed',message:'Your lost item has been marked as recovered.'});
  } catch { res.status(500).json({error:'Could not mark this report as recovered.'}); }
};
