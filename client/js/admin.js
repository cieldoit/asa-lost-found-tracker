// ==============================================================
// FULL JAVASCRIPT IMPLEMENTATION – photo upload removed from found report
// ==============================================================
const DEFAULT_LOCATIONS = ["Guard House","Overpass","CSU Milk Processing Facility","CED Building","CHED Caraga Regional Office","Gasoline Station","Food Tech. Building","Food Innovation Center","Agro-Workshop/ CAA TESDA","Tissue Culture Laboratory","CAA Building","Green House","H.E.R.O Learning Commons","S & T Building","Hostel Building (e.i Clinic Office)","Executive House","Diagnostic Laboratory","Farm Mechanization Center","New Administration Building","Old Administration Building","Oval","ORGMS Office/ Bookstore","Annex 3/ Senior High School","University Gymnasium & Cultural Center","Physical Fitness Office","Old CAS Building","Kinaadman Building","CEIT Annex Building","Hiraya Building","Hinang Building","Chapel","Eco-Lodge","Old Farm Mechanization Center","Old Gents' Dormitory","Pig Pens","Native Chicken House","OATC","Vermi House/ Nursery/ Poultry","Botanical Garden","COFES Annex","Annex 2 Building","DOST Building","COFES Building","COFES Classroom/ Hostel","New Gents' Dormitory","Micoriza Office","Wood Workshop/ Tech Voc Building","Rooting Recovery Facility","New Ladies' Dormitory"];
const DEFAULT_CATEGORIES = ["Electronics","Clothing","Accessories","Documents","Books","Keys","Others"];
const PICKUP_LOCATIONS = ["CAA LSG Office","CCIS LSG Office","CED LSG Office","CEGS LSG Office","CHASS LSG Office","CMNS LSG Office","COFES LSG Office","Guard House - Main Gate","Guard House - Green Gate"];
const ADMIN_API_BASE = window.API_BASE || window.ASA_API_BASE || `${window.location.origin}/api`;
const token = window.Auth?.getToken?.() || localStorage.getItem("asa_token") || localStorage.getItem("token");
const role = window.Auth?.getRole?.() || localStorage.getItem("asa_role") || localStorage.getItem("role");
const isAdminRole = String(role || "").toLowerCase() === "admin";

if (!token || !isAdminRole) {
  alert("Admin access only.");
  window.location.href = "/login/landing.html";
}

let adminSessionReady = false;

let categories = [...DEFAULT_CATEGORIES];
let locations  = [...DEFAULT_LOCATIONS];
let pickupLocations = [...PICKUP_LOCATIONS];
let categoryIdByName = Object.fromEntries(DEFAULT_CATEGORIES.map((name, index) => [name, index + 1]));
let locationIdByName = {};
let buildingPhotos = {};
let pendingDeleteCard = null;
let currentModalCard  = null;
let pendingTagDelete  = null;
let currentAdminUser = null;
let adminItemsCache = [];
let pendingAdminItemID = new URLSearchParams(window.location.search).get('itemID');

function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  const icons = { success:'<i class="fa-solid fa-circle-check"></i>', error:'<i class="fa-solid fa-circle-xmark"></i>', warning:'<i class="fa-solid fa-triangle-exclamation"></i>', info:'<i class="fa-solid fa-circle-info"></i>' };
  const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div class="toast-icon">${icons[type]||icons.info}</div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${message}</div></div><button class="toast-close" onclick="dismissToast(this.parentElement)"><i class="fa-solid fa-xmark"></i></button><div class="toast-progress"></div>`;
  container.appendChild(toast); setTimeout(() => dismissToast(toast), 4200);
}
function dismissToast(toast) { if(toast && toast.parentElement) { toast.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => toast.remove(), 300); } }
function showErr(id, msg) { const el = document.getElementById(id); if(el) { el.textContent = msg; el.style.display = 'block'; } }
function clearErr(id) { const el = document.getElementById(id); if(el) el.style.display = 'none'; }
function setFieldError(inputId, errId, msg) { document.getElementById(inputId)?.classList.add('error'); showErr(errId, msg); }
function clearFieldError(inputId, errId) { document.getElementById(inputId)?.classList.remove('error'); clearErr(errId); }
function populateSelect(selectId, items) { const sel = document.getElementById(selectId); if(!sel) return; const cur = sel.value; sel.innerHTML = `<option value="">Select…</option>` + items.map(i => `<option value="${i}">${i}</option>`).join(''); if(cur && items.includes(cur)) sel.value = cur; }
function populateAllSelects() { ['lostCat','foundCat'].forEach(id => populateSelect(id, categories)); ['lostCatFilter','foundCatFilter'].forEach(id => { const sel = document.getElementById(id); if(sel) sel.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join(''); }); ['lostLoc','foundLoc'].forEach(id => { const sel = document.getElementById(id); if(sel) sel.innerHTML = '<option value="">Select Location</option>' + locations.map(l => `<option value="${l}">${l}</option>`).join(''); }); const pickup = document.getElementById('foundPickup'); if (pickup) { const cur = pickup.value; pickup.innerHTML = '<option value="">Where is the item kept now?</option>' + pickupLocations.map(l => `<option value="${l}">${l}</option>`).join(''); if (cur && pickupLocations.includes(cur)) pickup.value = cur; } updateFoundPickupPreview(); }
async function loadAdminMeta() {
  try {
    const [dbCategories, dbLocations] = await Promise.all([MetaAPI.getCategories(), MetaAPI.getLocations()]);
    if (Array.isArray(dbCategories) && dbCategories.length) {
      categories = dbCategories.map(c => c.categoryName);
      categoryIdByName = Object.fromEntries(dbCategories.map(c => [c.categoryName, c.categoryID]));
    }
    if (Array.isArray(dbLocations) && dbLocations.length) {
      locations = dbLocations.map(l => l.storageName || l.building).filter(Boolean);
      pickupLocations = [...locations];
      locationIdByName = Object.fromEntries(dbLocations.map(l => [l.storageName || l.building, l.locationID]).filter(([name]) => !!name));
      buildingPhotos = Object.fromEntries(dbLocations.map(l => [l.storageName || l.building, l.photoData]).filter(([name, photo]) => !!name && !!photo));
    }
    populateAllSelects();
  } catch (err) {
    console.warn('Could not load admin metadata:', err.message);
  }
}
function buildTagEditor(editorId, dataArr, onUpdate) {
  const editor = document.getElementById(editorId);
  if(!editor) return;
  editor.innerHTML = '';
  dataArr.forEach((item,i) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${item} <button class="tag-chip-remove" data-index="${i}" title="Remove">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      confirmRemoveTag(dataArr, i, editorId, onUpdate);
    });
    editor.appendChild(chip);
  });
  const input = document.createElement('input');
  input.className = 'tag-input';
  input.placeholder = 'Add new…';
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !dataArr.includes(val)) {
        dataArr.push(val);
        buildTagEditor(editorId, dataArr, onUpdate);
        onUpdate();
        showToast('success', 'Added!', `"${val}" added.`);
      } else if (dataArr.includes(val)) showToast('warning', 'Duplicate', `"${val}" exists`);
      input.value='';
    }
    if (e.key === 'Backspace' && !input.value && dataArr.length) {
      const lastIndex = dataArr.length - 1;
      confirmRemoveTag(dataArr, lastIndex, editorId, onUpdate);
    }
  });
  editor.appendChild(input);
}
function confirmRemoveTag(arr, index, editorId, onUpdate) {
  pendingTagDelete = { arr, index, editorId, onUpdate };
  const itemName = arr[index];
  document.getElementById('tagDeleteMsg').textContent = `Are you sure you want to remove "${itemName}"? This cannot be undone.`;
  document.getElementById('tagDeletePopup').classList.add('active');
}
function closeTagDeletePopup() { document.getElementById('tagDeletePopup').classList.remove('active'); pendingTagDelete = null; }
function executeTagDelete() {
  if (pendingTagDelete) {
    const { arr, index, editorId, onUpdate } = pendingTagDelete;
    const removed = arr.splice(index, 1)[0];
    buildTagEditor(editorId, arr, onUpdate);
    onUpdate();
    showToast('info', 'Removed', `"${removed}" removed successfully.`);
  }
  closeTagDeletePopup();
}
function previewImage(input, areaId) { const area = document.getElementById(areaId); if(input.files && input.files[0] && area) { const reader = new FileReader(); reader.onload = e => { area.innerHTML = `<div class="img-preview-wrap"><img src="${e.target.result}" alt="Preview"><button class="img-remove-btn" onclick="removePreview('${areaId}','${input.id}')" title="Remove"><i class="fa-solid fa-xmark"></i></button></div>`; }; reader.readAsDataURL(input.files[0]); } }
function removePreview(areaId, inputId) { const area = document.getElementById(areaId); if(area) area.innerHTML = `<div class="img-upload-area" onclick="document.getElementById('${inputId}').click()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/></svg><p><strong>Drop photos here</strong><br>or click to browse</p><input type="file" id="${inputId}" accept="image/*" style="display:none" onchange="previewImage(this,'${areaId}')"></div>`; }
function getPreviewImageData(areaId) {
  const src = document.querySelector(`#${areaId} .img-preview-wrap img`)?.src || '';
  return src.startsWith('data:image/') ? src : null;
}

function readImageInputData(inputId) {
  const file = document.getElementById(inputId)?.files?.[0];
  if (!file) return Promise.resolve(null);
  if (!file.type.startsWith('image/')) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read selected image.'));
    };

    image.src = objectUrl;
  });
}

async function getLostItemPhotoData() {
  return await readImageInputData('lostImgInput') || getPreviewImageData('lostImgArea');
}
function syncPreviewTitle() { const val = document.getElementById('lostTitle')?.value.trim(); const prev = document.getElementById('lostPreviewTitle'); if(prev) prev.textContent = val || 'Item Title'; }
async function submitLostItem() {
  const title = document.getElementById('lostTitle').value.trim();
  const description = document.getElementById('lostDesc').value.trim();
  const categoryID = categoryIdByName[document.getElementById('lostCat').value];
  const locationDetail = document.getElementById('lostLoc').value;

  if (!title || !description || !categoryID || !locationDetail) {
    showToast('error', 'Incomplete', 'Fill all required fields');
    return;
  }

  const submitBtn = document.querySelector('#page-report-lost .btn-submit, #page-report-lost button[onclick*="submitLostItem"]');
  const originalSubmitText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    const res = await fetch(`${ADMIN_API_BASE}/items/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        dateOccured: new Date().toISOString().slice(0, 10),
        itemType: "lost",
        categoryID,
        locationID: null,
        locationDetail,
        itemPhotoData: await getLostItemPhotoData()
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to post lost item");

   showToast(
  "success",
  "Lost Item",
  `"${title}" has been posted successfully.`
);

await loadAdminStats();
await loadAdminItems();
await loadAdminNotifications();

setTimeout(() => {
  showPage('dashboard');

  document.getElementById('lostTitle').value = '';
  document.getElementById('lostDesc').value = '';
  document.getElementById('lostCat').value = '';
  document.getElementById('lostLoc').value = '';
  document.getElementById('lostReporterName').value = '';
  document.getElementById('lostReporterRole').value = '';
}, 1200);

  } catch (err) {
    console.error("POST LOST ERROR:", err);
    showToast("error", "Post Failed", err.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalSubmitText || 'Submit Report';
    }
  }
}
async function submitFoundItem() {
  const title = document.getElementById('foundTitle').value.trim();
  const description = document.getElementById('foundDesc').value.trim();
  const categoryID = categoryIdByName[document.getElementById('foundCat').value];
  const foundLocation = document.getElementById('foundLoc').value;
  const pickupLocation = document.getElementById('foundPickup').value;
  const locationID = locationIdByName[pickupLocation] || null;

  if (!title || !description || !categoryID || !foundLocation || !pickupLocation) {
    showToast('error', 'Incomplete', 'Fill all required fields');
    return;
  }

  try {
    const res = await fetch(`${ADMIN_API_BASE}/items/post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        dateOccured: new Date().toISOString().slice(0, 10),
        itemType: "found",
        categoryID,
        locationID,
        locationDetail: pickupLocation
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to post found item");

    showToast(
  "success",
  "Found Item",
  `"${title}" has been posted successfully.`
);

await loadAdminStats();
await loadAdminItems();
await loadAdminNotifications();

// redirect back to dashboard
setTimeout(() => {
  showPage('dashboard');

  // optional: clear form
  document.getElementById('foundTitle').value = '';
  document.getElementById('foundDesc').value = '';
  document.getElementById('foundCat').value = '';
  document.getElementById('foundLoc').value = '';
  document.getElementById('foundPickup').value = '';
  updateFoundPickupPreview();
  document.getElementById('foundReporterName').value = '';
  document.getElementById('foundReporterRole').value = '';

}, 1200);

  } catch (err) {
    console.error("POST FOUND ERROR:", err);
    showToast("error", "Post Failed", err.message);
  }
}
async function resolveItem(btn) {
  const card = btn.closest('.item-card');
  if (!card) return;
  const itemID = card.dataset.itemId;
  const title  = card.dataset.title || 'Item';
  btn.disabled = true;
  btn.textContent = 'Resolving…';
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/items/${itemID}/resolve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Server error');
    card.querySelectorAll('.badge').forEach(b => {
      if (b.classList.contains('badge-pending') || b.textContent.trim() === 'PENDING') {
        b.textContent = 'RESOLVED'; b.classList.remove('badge-pending'); b.classList.add('badge-claimed');
      }
    });
    btn.textContent = '✓ Resolved'; btn.style.opacity = '0.5';
    const statResolved = document.getElementById('statResolved');
    if (statResolved) statResolved.textContent = parseInt(statResolved.textContent || 0) + 1;
    showToast('success', 'Resolved', `"${title}" marked as resolved.`);
    if (typeof loadAdminNotifications === 'function') await loadAdminNotifications();
  } catch (err) {
    showToast('error', 'Error', 'Could not resolve item.'); btn.disabled = false; btn.textContent = '✓ Resolve';
  }
}

async function setAdminItemStatus(btn, action) {
  const card = btn.closest('.item-card');
  if (!card) return;
  const itemID = card.dataset.itemId;
  const title = card.dataset.title || 'Item';
  btn.disabled = true;
  btn.textContent = action === 'approve' ? 'Approving...' : 'Rejecting...';
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/items/${itemID}/${action}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Server error');
    showToast(action === 'approve' ? 'success' : 'info', action === 'approve' ? 'Approved' : 'Rejected', `"${title}" has been ${action === 'approve' ? 'approved' : 'rejected'}.`);
    await loadAdminStats();
    await loadAdminItems();
    await loadAdminNotifications();
  } catch (err) {
    showToast('error', 'Action Failed', `Could not ${action} item.`);
    btn.disabled = false;
    btn.textContent = action === 'approve' ? 'Approve' : 'Reject';
  }
}

function confirmDelete(btn) { pendingDeleteCard = btn.closest('.item-card'); document.getElementById('deletePopup').classList.add('active'); }
function closeDeletePopup() { document.getElementById('deletePopup').classList.remove('active'); pendingDeleteCard = null; }
async function executeDelete() {
  if (!pendingDeleteCard) { closeDeletePopup(); return; }
  const itemID = pendingDeleteCard.dataset.itemId;
  const title  = pendingDeleteCard.dataset.title || 'Item';
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/items/${itemID}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Server error');
    pendingDeleteCard.remove();
    showToast('info', 'Deleted', `"${title}" has been removed.`);
    if (typeof loadAdminStats === 'function') await loadAdminStats();
    if (typeof loadAdminNotifications === 'function') await loadAdminNotifications();
  } catch (err) {
    showToast('error', 'Error', 'Could not delete item.');
  }
  closeDeletePopup();
}
function openItemModal(card) {
  currentModalCard = card;
  const type = card.dataset.type;
  const title = card.dataset.title;
  const cat = card.dataset.cat;
  const desc = card.dataset.desc;
  const loc = card.dataset.loc;
  const date = card.dataset.date;
  const reporterName = card.dataset.reporterName || '—';
  const reporterRole = card.dataset.reporterRole || '—';

  const imgSec = document.getElementById('modalImgSec');
  const cardImgDiv = card.querySelector('.card-img-wrap > div');
  imgSec.innerHTML = cardImgDiv ? `<div style="height:300px;border-radius:12px;overflow:hidden">${cardImgDiv.outerHTML}</div>` : '';

  document.getElementById('modalTypeBadge').textContent = type.toUpperCase();
  document.getElementById('modalTypeBadge').className = `badge badge-${type}`;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalCat').innerHTML = `<span class="category-tag">${cat}</span>`;
  document.getElementById('modalLoc').textContent = `📍 ${loc}`;
  document.getElementById('modalDate').textContent = `🗓 ${date}`;
  document.getElementById('modalDesc').textContent = desc;

  document.getElementById('modalReporterName').textContent = reporterName;
  document.getElementById('modalReporterRole').textContent = `(${reporterRole})`;

  const buildingPhotoContainer = document.getElementById('modalBuildingPhoto');
  const buildingImg = document.getElementById('modalBuildingImg');
  if (type === 'found' && buildingPhotos[loc]) {
    buildingImg.src = buildingPhotos[loc];
    buildingPhotoContainer.style.display = 'block';
  } else {
    buildingPhotoContainer.style.display = 'none';
  }

  document.getElementById('itemModal').classList.add('active');
}
function closeItemModal() { document.getElementById('itemModal').classList.remove('active'); currentModalCard = null; }
function resolveFromModal() { if(currentModalCard){ const btn=currentModalCard.querySelector('.btn-card-resolve'); if(btn) resolveItem(btn); document.getElementById('modalStatusBadge').textContent='RESOLVED'; document.getElementById('modalStatusBadge').classList.remove('badge-pending'); document.getElementById('modalStatusBadge').classList.add('badge-claimed'); } }
function deleteFromModal() { if(currentModalCard){ const btn=currentModalCard.querySelector('.btn-card-delete'); if(btn) confirmDelete(btn); closeItemModal(); } }
function filterItems(type) { const query=document.getElementById(`${type}Search`).value.toLowerCase(); const catVal=document.getElementById(`${type}CatFilter`).value.toLowerCase(); document.querySelectorAll(`#${type}ItemsGrid .item-card`).forEach(card=>{ const matchQuery=!query||(card.dataset.title||'').toLowerCase().includes(query)||(card.dataset.desc||'').toLowerCase().includes(query)||(card.dataset.reporterName||'').toLowerCase().includes(query); const matchCat=!catVal||(card.dataset.cat||'').toLowerCase()===catVal; card.style.display=matchQuery&&matchCat?'':'none'; }); }
function filterAllItems() {
  const query = document.getElementById('allItemsSearch')?.value.toLowerCase() || '';
  const type = document.getElementById('allItemsTypeFilter')?.value || '';
  document.querySelectorAll('#allItemsGrid .item-card').forEach(card => {
    const matchQuery = !query
      || (card.dataset.title || '').toLowerCase().includes(query)
      || (card.dataset.desc || '').toLowerCase().includes(query)
      || (card.dataset.reporterName || '').toLowerCase().includes(query);
    const matchType = !type || card.dataset.type === type;
    card.style.display = matchQuery && matchType ? '' : 'none';
  });
}
function switchSettingsTab(tab, btn) { document.querySelectorAll('.settings-section').forEach(s=>s.classList.remove('active')); document.querySelectorAll('.s-nav-btn').forEach(b=>b.classList.remove('active')); document.getElementById(`set-${tab}`)?.classList.add('active'); if(btn) btn.classList.add('active'); }
function submitAccountInfo(e) { submitAdminAccountInfo(e); }
function submitPasswordChange(e) { submitAdminPasswordChange(e); }
async function handleAvatarChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  document.getElementById('avatarFileName').textContent = file.name;
  try {
    const profilePhotoData = await readProfileImage(file);
    const userName = `${document.getElementById("accFirstName")?.value.trim() || ""} ${document.getElementById("accLastName")?.value.trim() || ""}`.trim()
      || currentAdminUser?.userName
      || "CCIS Admin";
    const data = await UserAPI.updateProfile({ userName, profilePhotoData });
    currentAdminUser = data.user || { ...currentAdminUser, userName, profilePhotoData };
    renderAdminProfilePhoto(currentAdminUser.profilePhotoData);
    showToast('success', 'Photo Updated', 'Your display picture has been saved.');
  } catch (err) {
    showToast('error', 'Upload Failed', err.message || 'Could not update display picture.');
  }
}
function updateFoundPickupPreview() {
  const loc = document.getElementById('foundPickup')?.value || '';
  const photoBox = document.getElementById('foundPickupPreviewPhoto');
  const nameEl = document.getElementById('foundPickupPreviewName');
  const noteEl = document.getElementById('foundPickupPreviewNote');
  if (!photoBox || !nameEl || !noteEl) return;

  nameEl.textContent = loc || 'Choose a location';
  if (!loc) {
    photoBox.innerHTML = '<i class="fa-solid fa-building"></i>';
    noteEl.textContent = 'Choose a pick-up location to preview the office photo claimants will use as their guide.';
    return;
  }

  if (buildingPhotos[loc]) {
    photoBox.innerHTML = `<img src="${buildingPhotos[loc]}" alt="${loc}">`;
    noteEl.textContent = 'Use this office photo as the visual guide claimants will see for item pick-up.';
  } else {
    photoBox.innerHTML = '<i class="fa-solid fa-building"></i>';
    noteEl.textContent = 'No photo is saved yet. Add one in Settings > Building Photos so claimants can find the office faster.';
  }
}
function buildBuildingGrid() {
  const grid = document.getElementById('buildingGrid');
  if (!grid) return;
  grid.innerHTML = pickupLocations.map(loc => {
    const safeLoc = escapeHtml(loc);
    const savedPhoto = buildingPhotos[loc];
    return `
      <div class="building-card">
        <button type="button" class="building-photo-wrap" data-location="${safeLoc}" aria-label="Upload photo for ${safeLoc}">
          ${savedPhoto ? `<img src="${savedPhoto}" alt="${safeLoc} photo">` : '<span style="font-size:36px"><i class="fa-solid fa-building"></i></span>'}
          <span class="building-overlay"><i class="fa-solid fa-camera"></i> ${savedPhoto ? 'Change' : 'Add'}</span>
        </button>
        <div class="building-card-info">
          <p>${safeLoc}</p>
          ${savedPhoto ? '<span style="color:green">Photo saved to database</span>' : '<span>No photo</span>'}
        </div>
      </div>
    `;
  }).join('');
}

function triggerBuildingUpload(loc) {
  if (!loc) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) { input.remove(); return; }
    if (file.size > 4 * 1024 * 1024) {
      input.remove();
      showToast('error', 'Too Large', 'Please choose an image under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const photoData = ev.target.result;
        const res = await fetch(`${ADMIN_API_BASE}/locations/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ storageName: loc, photoData })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not save photo.');
        buildingPhotos[loc] = photoData;
        locationIdByName[loc] = data.locationID || locationIdByName[loc];
        buildBuildingGrid();
        updateBuildingThumbnails();
        updateFoundPickupPreview();
        showToast('success', 'Photo Saved', `Photo for "${loc}" was saved to the database.`);
      } catch (err) {
        showToast('error', 'Upload Failed', err.message);
      } finally {
        input.remove();
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
function updateBuildingThumbnails() {
  document.querySelectorAll('#foundItemsGrid .item-card[data-type="found"]').forEach(card => {
    const loc = card.dataset.loc;
    const thumb = card.querySelector('.building-thumb');
    if (thumb && loc) {
      if (buildingPhotos[loc]) {
        thumb.src = buildingPhotos[loc];
        thumb.style.display = 'inline-block';
      } else {
        thumb.src = "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 21h18M3 7v1a4 4 0 004 4h10a4 4 0 004-4V7M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16'/%3E%3C/svg%3E";
        thumb.style.display = 'inline-block';
      }
    }
  });
}
function closeSuccessPopup() { document.getElementById('successPopup').classList.remove('active'); showPage('dashboard'); }
let currentPage='dashboard';
function showPage(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el) {
    el.classList.add('active');
    currentPage=page;
  }
  const header = document.querySelector('admin-header');
  addAdminManagementNav(header);
  header?.setActivePage(page);
  if(window.closeAllDropdowns) window.closeAllDropdowns();
  const mobileNav=document.getElementById('mobileNav');
  if(mobileNav) mobileNav.classList.remove('open');
  if (page === 'claims') loadAdminClaims();
  if (page === 'users') loadAdminUsers();
  if (page === 'appeals') loadAdminAppeals();
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeAllDropdowns() { const hdr=document.querySelector('admin-header'); if(hdr){ hdr.querySelector('#headerProfileDropdown')?.classList.remove('show'); hdr.querySelector('#headerNotifDropdown')?.classList.remove('show'); } }
function toggleMobileNav() { document.getElementById('mobileNav')?.classList.toggle('open'); }
function closeMobileNav() { document.getElementById('mobileNav')?.classList.remove('open'); }
function adminNavButton(page, iconClass, label, mobile = false) {
  const className = mobile ? 'mnav-item' : 'nav-item';
  const idPrefix = mobile ? 'amnav' : 'anav';
  return `<button class="${className}" id="${idPrefix}-${page}" onclick="showPage('${page}')"><i class="${iconClass}" style="width:16px"></i>${label}</button>`;
}
function addAdminManagementNav(header) {
  if (!header || header.querySelector('#anav-claims')) return;
  const mainNav = header.querySelector('.main-nav');
  const mobileNav = header.querySelector('#mobileNav');
  const postNav = header.querySelector('#anav-post');
  const mobilePostNav = header.querySelector('#amnav-post');
  const managementNav = [
    adminNavButton('claims', 'fa-solid fa-clipboard-check', 'Claims'),
    adminNavButton('users', 'fa-solid fa-users', 'Users'),
    adminNavButton('appeals', 'fa-solid fa-flag', 'Reports')
  ].join('');
  const mobileManagementNav = [
    adminNavButton('claims', 'fa-solid fa-clipboard-check', 'Claims', true),
    adminNavButton('users', 'fa-solid fa-users', 'Users', true),
    adminNavButton('appeals', 'fa-solid fa-flag', 'Reports', true)
  ].join('');
  if (mainNav && postNav) postNav.insertAdjacentHTML('afterend', managementNav);
  if (mobileNav && mobilePostNav) mobilePostNav.insertAdjacentHTML('afterend', mobileManagementNav);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));
}
function formatNotifDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "";
}
function splitFullName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) };
}
function formatAccountUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9._]+/g, "_")
    .replace(/[._]{2,}/g, "_")
    .replace(/^[._]+|[._]+$/g, "");
}
function defaultProfileAvatar() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
}
function renderAdminProfilePhoto(photoData) {
  const content = photoData ? `<img src="${photoData}" alt="Profile photo">` : defaultProfileAvatar();
  document.querySelectorAll('.profile-avatar, .main-avatar').forEach(el => {
    el.innerHTML = content;
  });
}
function readProfileImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please choose an image file.'));
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSize = 420;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read selected image.'));
    };
    image.src = objectUrl;
  });
}
function populateAdminAccountForm(user) {
  const { firstName, lastName } = splitFullName(user?.userName);
  const username = String(user?.userName || "").trim();
  const usernameFallback = formatAccountUsername(user?.accountUsername || username);

  const firstInput = document.getElementById("accFirstName");
  const lastInput = document.getElementById("accLastName");
  const usernameInput = document.getElementById("accUsername");
  const emailInput = document.getElementById("accEmail");

  if (firstInput) firstInput.value = firstName;
  if (lastInput) lastInput.value = lastName;
  if (usernameInput) usernameInput.value = usernameFallback;
  if (emailInput) emailInput.value = user?.email || "";
}
async function ensureAdminSession() {
  try {
    const me = await UserAPI.getMe();
    if (String(me.role || "").toLowerCase() !== "admin") {
      throw new Error("Admin account required.");
    }

    adminSessionReady = true;
    currentAdminUser = me;
    localStorage.setItem("asa_role", "Admin");
    localStorage.setItem("role", "Admin");
    localStorage.setItem("asa_user", me.userName || "CCIS Admin");
    localStorage.setItem("userName", me.userName || "CCIS Admin");
    document.querySelector('admin-header')?.setUsername(me.userName || "CCIS Admin");
    populateAdminAccountForm(me);
    renderAdminProfilePhoto(me.profilePhotoData);
    return true;
  } catch (err) {
    adminSessionReady = false;
    ["asa_token","asa_role","asa_user","token","role","userName"].forEach(k => localStorage.removeItem(k));
    alert("Admin access only. Please login with an admin account.");
    window.location.href = "/login/landing.html";
    return false;
  }
}

// AdminHeader Web Component
class AdminHeader extends HTMLElement {
  connectedCallback() { this.render(); this.initListeners(); }
  render() {
    this.innerHTML = `<div><header class="home-header"><span class="logo-link" onclick="showPage('dashboard')"><img src="/ASA_logo/Final logo.png" alt="ASA Logo" class="main-logo"></span><nav class="main-nav"><button class="nav-item active" id="anav-dashboard" onclick="showPage('dashboard')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Home</button><button class="nav-item" id="anav-lost" onclick="showPage('lost')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Lost Items</button><button class="nav-item" id="anav-found" onclick="showPage('found')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Found Items</button><button class="nav-item" id="anav-post" onclick="showPage('post')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>Post Item</button></nav><div class="header-right"><div class="notif-container"><button class="notif-btn" id="headerNotifBtn" title="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><div class="notif-badge-dot hidden" id="headerNotifDot">1</div></button><div class="notif-dropdown" id="headerNotifDropdown"><div class="notif-panel-header"><h3>Notifications</h3><span class="mark-read" id="headerMarkRead">Mark all as read</span></div><div class="notif-list" id="headerNotifList"><div class="notif-item unread"><div class="notif-icon-box admin-bg"><i class="fa-solid fa-shield-halved"></i></div><div class="notif-text"><p><strong>Admin!</strong> Full control over listings.</p><span class="notif-time">Just now</span></div><div class="status-dot"></div></div></div><div class="notif-panel-footer"><button type="button" id="headerSeeAllNotif">See all notifications</button></div></div></div><div class="profile-wrap"><button class="profile-btn" id="headerProfileBtn"><div class="profile-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span class="profile-name" id="headerProfileName">CCIS Admin</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg></button><div class="dropdown-content" id="headerProfileDropdown"><div class="user-info"><div class="pd-name" id="headerDropName">CCIS Admin</div><div class="pd-role">Administrator</div></div><div class="dropdown-divider"></div><a href="/dashboard" class="dropdown-item" onclick="closeAllDropdowns();"><i class="fa-solid fa-chart-line" style="width:16px;color:var(--text-muted)"></i> Dashboard</a><button class="dropdown-item" onclick="showPage('settings');closeAllDropdowns();"><i class="fa-solid fa-gear" style="width:16px;color:var(--text-muted)"></i> Settings</button><a href="/login/landing.html" class="dropdown-item logout-item" onclick="window.Auth?.logout?.(); return false;"><i class="fa-solid fa-right-from-bracket" style="width:16px"></i> Log Out</a></div></div><button class="mobile-nav-toggle" onclick="toggleMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button></div></header><div class="mobile-nav" id="mobileNav"><button class="mnav-item active" id="amnav-dashboard" onclick="showPage('dashboard');closeMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Home</button><button class="mnav-item" id="amnav-lost" onclick="showPage('lost');closeMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Lost Items</button><button class="mnav-item" id="amnav-found" onclick="showPage('found');closeMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Found Items</button><button class="mnav-item" id="amnav-post" onclick="showPage('post');closeMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>Post Item</button><button class="mnav-item" onclick="showPage('settings');closeMobileNav()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/></svg>Settings</button></div></div>`;
  }

initListeners() {
  const profileBtn = this.querySelector('#headerProfileBtn');
  const profileDropdown = this.querySelector('#headerProfileDropdown');

  const notifBtn = this.querySelector('#headerNotifBtn');
  const notifDropdown = this.querySelector('#headerNotifDropdown');

  const markReadBtn = this.querySelector('#headerMarkRead');
  const seeAllBtn = this.querySelector('#headerSeeAllNotif');

  if (profileBtn) {
    profileBtn.addEventListener('click', e => {
      e.stopPropagation();
      profileDropdown?.classList.toggle('show');
      notifDropdown?.classList.remove('show');
    });
  }

  if (notifBtn) {
    notifBtn.addEventListener('click', e => {
      e.stopPropagation();
      notifDropdown?.classList.toggle('show');
      profileDropdown?.classList.remove('show');

      if (typeof loadAdminNotifications === 'function') {
        loadAdminNotifications();
      }
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      if (typeof markAllAdminNotificationsRead === 'function') {
        markAllAdminNotificationsRead();
      }
    });
  }

  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();

      if (typeof openAdminNotificationsModal === 'function') {
        openAdminNotificationsModal();
      }
    });
  }

  window.addEventListener('click', event => {
    if (!this.contains(event.target)) {
      profileDropdown?.classList.remove('show');
      notifDropdown?.classList.remove('show');
    }
  });
}
  setActivePage(page) { ['dashboard','lost','found','post','claims','users','appeals'].forEach(p=>{ this.querySelector(`#anav-${p}`)?.classList.remove('active'); this.querySelector(`#amnav-${p}`)?.classList.remove('active'); }); this.querySelector(`#anav-${page}`)?.classList.add('active'); this.querySelector(`#amnav-${page}`)?.classList.add('active'); }
  setUsername(name) { const n1=this.querySelector('#headerProfileName'), n2=this.querySelector('#headerDropName'); if(n1) n1.textContent=name; if(n2) n2.textContent=name; }
  renderNotifications(notifs) {

  const list = this.querySelector('#headerNotifList');
  const dot = this.querySelector('#headerNotifDot');

  if (!list) return;

  // no notifications
  if (!notifs || notifs.length === 0) {

    list.innerHTML = `
      <div style="
        padding:20px;
        text-align:center;
        color:#9ca3af;
        font-size:13px;
      ">
        No notifications yet.
      </div>
    `;

    dot?.classList.add('hidden');
    return;
  }

  // unread count
  const unreadCount = notifs.filter(n => !n.isRead).length;

  if (dot) {
    dot.textContent = unreadCount;
    dot.classList.toggle('hidden', unreadCount === 0);
  }

  // render notifications
  list.innerHTML = notifs.map(n => `

    <div 
      class="notif-item ${n.isRead ? 'read' : 'unread'}"
      onclick="markSingleNotificationRead(${n.notifID})"
    >

      <div class="notif-icon-box admin-bg">
        <i class="fa-solid fa-bell"></i>
      </div>

      <div class="notif-text">

        <p>
          ${n.isRead
            ? escapeHtml(n.message)
            : `<strong>${escapeHtml(n.message)}</strong>`
          }
        </p>

        <span class="notif-time">
          ${formatNotifDate(n.createdAt)}
        </span>

      </div>

      ${!n.isRead
        ? '<div class="status-dot"></div>'
        : ''
      }

    </div>

  `).join('');
}

  addNotification(icon, iconClass, title, message) { const list=this.querySelector('#headerNotifList'), dot=this.querySelector('#headerNotifDot'); if(!list) return; const item=document.createElement('div'); item.className='notif-item unread'; item.innerHTML=`<div class="notif-icon-box ${iconClass}">${icon}</div><div class="notif-text"><p><strong>${title}</strong> ${message}</p><span class="notif-time">Just now</span></div><div class="status-dot"></div>`; list.prepend(item); if(dot) { dot.classList.remove('hidden'); dot.textContent=list.querySelectorAll('.unread').length; } }
}
customElements.define('admin-header', AdminHeader);

function ensureAdminNotificationsModal() {
  let modal = document.getElementById('adminNotifModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'popup-overlay admin-notif-modal';
  modal.id = 'adminNotifModal';
  modal.innerHTML = `
    <div class="admin-notif-dialog">
      <div class="admin-notif-dialog-header">
        <div>
          <h3>All Notifications</h3>
          <p>Updates assigned to this admin account.</p>
        </div>
        <button type="button" class="admin-notif-close" onclick="closeAdminNotificationsModal()" aria-label="Close notifications">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="admin-notif-dialog-actions">
        <button type="button" onclick="markAllAdminNotificationsRead()">Mark all as read</button>
      </div>
      <div class="admin-notif-dialog-list" id="adminNotifModalList"></div>
    </div>
  `;
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAdminNotificationsModal();
  });
  document.body.appendChild(modal);
  return modal;
}

function renderAdminNotificationsModal(notifs) {
  const list = document.getElementById('adminNotifModalList');
  if (!list) return;

  if (!notifs || notifs.length === 0) {
    list.innerHTML = '<div class="admin-notif-empty">No notifications yet.</div>';
    return;
  }

  list.innerHTML = notifs.map(n => `
    <button type="button" class="admin-notif-row ${n.isRead ? 'read' : 'unread'}" onclick="markSingleNotificationRead(${n.notifID})">
      <span class="notif-icon-box admin-bg"><i class="fa-solid fa-bell"></i></span>
      <span class="admin-notif-row-text">
        <strong>${escapeHtml(n.message)}</strong>
        <small>${formatNotifDate(n.createdAt)}</small>
      </span>
      ${!n.isRead ? '<span class="status-dot"></span>' : ''}
    </button>
  `).join('');
}

async function refreshAdminNotificationsModal() {
  if (!document.getElementById('adminNotifModal')?.classList.contains('active')) return;
  const notifs = await NotifAPI.getAll();
  renderAdminNotificationsModal(notifs);
}

async function openAdminNotificationsModal() {
  if (!adminSessionReady) return;

  closeAllDropdowns();
  const modal = ensureAdminNotificationsModal();
  const list = modal.querySelector('#adminNotifModalList');
  if (list) list.innerHTML = '<div class="admin-notif-empty">Loading notifications...</div>';
  modal.classList.add('active');

  try {
    const notifs = await NotifAPI.getAll();
    renderAdminNotificationsModal(notifs);
  } catch (err) {
    if (list) list.innerHTML = '<div class="admin-notif-empty">Could not load notifications.</div>';
    console.warn('Could not load all admin notifications:', err.message);
  }
}

function closeAdminNotificationsModal() {
  document.getElementById('adminNotifModal')?.classList.remove('active');
}

async function loadAdminStats() {
  try {

    console.log("loadAdminStats running...");
    console.log("token:", token);
    console.log("role:", role);

    const res = await fetch(`${ADMIN_API_BASE}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    

    console.log("response status:", res.status);

    if (!res.ok) throw new Error("Failed to load stats");

    const stats = await res.json();

    console.log("stats:", stats);

    document.getElementById("statLost").textContent = stats.totalLost ?? 0;
    document.getElementById("statFound").textContent = stats.totalFound ?? 0;

    document.getElementById("statTotal").textContent =
      (stats.totalLost ?? 0) + (stats.totalFound ?? 0);

    document.getElementById("statResolved").textContent =
      stats.resolvedItems ?? 0;

    const statUsers = document.getElementById("statTotalUsers");
    if (statUsers) statUsers.textContent = stats.totalUsers ?? 0;

    const statPendingClaims = document.getElementById("statPendingClaims");
    if (statPendingClaims) statPendingClaims.textContent = stats.pendingClaims ?? 0;

  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    showToast("error", "Stats Error", "Could not load admin dashboard stats.");
  }
}
async function loadAdminItems() {
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/items`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to load items");

    const items = await res.json();
    adminItemsCache = Array.isArray(items) ? items : [];

    const lostGrid = document.getElementById("lostItemsGrid");
    const foundGrid = document.getElementById("foundItemsGrid");
    const allGrid = document.getElementById("allItemsGrid");
    const recentBox = document.getElementById("recentItemsContainer");

    if (lostGrid) lostGrid.innerHTML = "";
    if (foundGrid) foundGrid.innerHTML = "";
    if (allGrid) allGrid.innerHTML = "";
    if (recentBox) recentBox.innerHTML = "";

    items.forEach(item => {
      allGrid?.appendChild(buildAdminItemCard(item));

      if (item.itemType === "lost") {
        lostGrid?.appendChild(buildAdminItemCard(item));
      } else {
        foundGrid?.appendChild(buildAdminItemCard(item));
      }

      recentBox?.appendChild(buildAdminItemCard(item));
    });

    openPendingAdminItem();
    return adminItemsCache;

  } catch (err) {
    console.error("LOAD ITEMS ERROR:", err);
    return [];
  }
}

function openPendingAdminItem() {
  if (!pendingAdminItemID) return;
  const item = adminItemsCache.find(i => String(i.itemID) === String(pendingAdminItemID));
  if (!item) return;
  showPage(item.itemType === 'found' ? 'found' : 'lost');
  openAdminItemModal(item);
  pendingAdminItemID = null;
  const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
  window.history.replaceState({}, '', cleanUrl);
}

async function loadAdminNotifications() {
  if (!adminSessionReady) return;

  try {
    const notifs = await NotifAPI.getAll();
    document.querySelector('admin-header')?.renderNotifications(notifs);
  } catch (err) {
    console.warn("Could not load admin notifications:", err.message);
  }
}

async function markAllAdminNotificationsRead() {
  try {

    await NotifAPI.markAllRead();

    const header = document.querySelector('admin-header');

    if (header) {
      header.renderNotifications([]);
    }

    await loadAdminNotifications();
    await refreshAdminNotificationsModal();

  } catch (err) {
    console.warn(
      "Could not mark notifications read:",
      err.message
    );
  }
}

async function markSingleNotificationRead(notificationID) {
  try {

    await fetch(`${ADMIN_API_BASE}/notifications/${notificationID}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await loadAdminNotifications();
    await refreshAdminNotificationsModal();

  } catch (err) {
    console.error('MARK SINGLE NOTIF ERROR:', err);
  }
}

function buildAdminItemCard(item) {
  const isLost = item.itemType === "lost";
  const statusClass = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-danger', claimed: 'badge-claimed' }[item.itemStatus] || 'badge-pending';
  const card = document.createElement("div");
  card.className = "item-card";
  card.dataset.itemId = item.itemID;
  card.dataset.title  = item.title;
  card.dataset.cat    = item.category || 'General';
  card.dataset.desc   = item.description || '';
  card.dataset.loc    = item.location || item.locationName || item.locationDetail || 'Campus';
  card.dataset.type   = item.itemType;
  const pickupName = item.location || item.locationName || item.locationDetail || "Campus";
  const pickupPhoto = item.locationPhoto || buildingPhotos[pickupName] || buildingPhotos[item.locationDetail] || "";
  const itemPhoto = item.itemPhotoData || "";
  card.dataset.reporterName = item.reporterName || 'Unknown';
  card.dataset.reporterRole = item.reporterRole || 'Student';
  card.innerHTML = `
    <div class="card-img-wrap">
      ${isLost && itemPhoto
        ? `<img src="${itemPhoto}" alt="${item.title} photo">`
        : !isLost && pickupPhoto
          ? `<img src="${pickupPhoto}" alt="${pickupName} building photo">`
          : `<div style="width:100%;height:120px;background:${isLost ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : 'linear-gradient(135deg,#dcfce7,#bbf7d0)'};display:flex;align-items:center;justify-content:center;font-size:42px;">${isLost ? "\u{1F45B}" : "\u{1F4E6}"}</div>`}
      <span class="badge badge-${item.itemType}">${item.itemType.toUpperCase()}</span>
      <span class="badge ${statusClass}">${item.itemStatus.toUpperCase()}</span>
    </div>
    <div class="card-info">
      <h3>${item.title}</h3>
      <span class="category-tag">${item.category || "General"}</span>
      <div class="reporter-info"><i class="fa-solid fa-user"></i> <span class="reporter-name">${item.reporterName || "Unknown"}</span> <span>(${item.reporterRole || "Student"})</span></div>
      <p class="card-desc">${(item.description || "No description").substring(0, 80)}</p>
      <div class="card-footer-row"><span>${!isLost ? `<img class="building-thumb" src="${pickupPhoto || "data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 21h18M3 7v1a4 4 0 004 4h10a4 4 0 004-4V7M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16'/%3E%3C/svg%3E"}" alt="${pickupName} building photo">` : '\u{1F4CD}'} ${pickupName}</span><button class="view-btn" onclick='openAdminItemModal(${JSON.stringify(item)})'>View Details</button></div>
    </div>
    <div class="card-admin-actions">
      <button class="btn-card-action btn-card-resolve">\u2713 Resolve</button>
      <button class="btn-card-action btn-card-delete">\u{1F5D1} Delete</button>
    </div>
  `;
  card.querySelector('.btn-card-resolve').addEventListener('click', function(e) { e.stopPropagation(); resolveItem(this); });
  card.querySelector('.btn-card-delete').addEventListener('click', function(e) { e.stopPropagation(); confirmDelete(this); });
  return card;
}

function openAdminItemModal(item) {
  document.getElementById("modalTypeBadge").textContent = item.itemType.toUpperCase();
  document.getElementById("modalTypeBadge").className = `badge badge-${item.itemType}`;

  document.getElementById("modalStatusBadge").textContent = item.itemStatus.toUpperCase();

  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalCat").innerHTML = `<span class="category-tag">${item.category || "General"}</span>`;
  document.getElementById("modalLoc").textContent = `📍 ${item.locationDetail || item.location || "Campus"}`;
  document.getElementById("modalDate").textContent = `🗓 ${new Date(item.createdAt).toLocaleDateString()}`;
  document.getElementById("modalDesc").textContent = item.description || "No description";

  document.getElementById("modalReporterName").textContent = item.reporterName || "Unknown User";
  document.getElementById("modalReporterRole").textContent = `(${item.reporterRole || "Student"})`;

  const pickupName = item.location || item.locationName || item.locationDetail || "Campus";
  const pickupPhoto = item.locationPhoto || buildingPhotos[pickupName] || buildingPhotos[item.locationDetail];
  const buildingPhotoContainer = document.getElementById('modalBuildingPhoto');
  const buildingImg = document.getElementById('modalBuildingImg');
  if (item.itemType === 'found' && pickupPhoto && buildingPhotoContainer && buildingImg) {
    buildingImg.src = pickupPhoto;
    buildingImg.alt = `${pickupName} photo`;
    buildingPhotoContainer.style.display = 'block';
  } else if (buildingPhotoContainer) {
    buildingPhotoContainer.style.display = 'none';
  }

  const isLost = item.itemType === "lost";
  const itemPhoto = item.itemPhotoData || "";
  document.getElementById("modalImgSec").innerHTML = itemPhoto && isLost
    ? `<img src="${itemPhoto}" alt="${item.title} photo" style="width:100%;height:300px;object-fit:cover;border-radius:12px">`
    : `
    <div style="
      height:300px;
      border-radius:12px;
      background:${isLost ? "linear-gradient(135deg,#dbeafe,#bfdbfe)" : "linear-gradient(135deg,#dcfce7,#bbf7d0)"};
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:80px;
    ">
      ${isLost ? "👛" : "📦"}
    </div>
  `;

  document.getElementById("itemModal").classList.add("active");
}

document.addEventListener('DOMContentLoaded', async () => {

  const header = document.querySelector('admin-header');

  if (header && typeof header.render === 'function') {
    header.render();
    addAdminManagementNav(header);
    header.initListeners();
    header.setActivePage('dashboard');
  }

  if (!(await ensureAdminSession())) return;

  await loadAdminMeta();
  document.getElementById('foundPickup')?.addEventListener('change', updateFoundPickupPreview);
  loadAdminStats();
  loadAdminClaims();
  loadAdminUsers();
  loadAdminAppeals();
  loadAdminNotifications();
  await loadAdminItems();
  const hashPage = { '#lost': 'lost', '#found': 'found', '#post': 'post', '#claims': 'claims', '#users': 'users', '#appeals': 'appeals' }[window.location.hash];
  if (hashPage) showPage(hashPage);

  buildTagEditor('catTagsEditor', categories, populateAllSelects);
  buildTagEditor('locTagsEditor', locations, populateAllSelects);
  buildBuildingGrid();
  document.getElementById('buildingGrid')?.addEventListener('click', event => {
    const target = event.target.closest('.building-photo-wrap');
    if (!target) return;
    triggerBuildingUpload(target.dataset.location);
  });
  updateBuildingThumbnails();

  document.getElementById('itemModal')?.addEventListener('click', e => {
    if(e.target === e.currentTarget) closeItemModal();
  });

  document.getElementById('deletePopup')?.addEventListener('click', e => {
    if(e.target === e.currentTarget) closeDeletePopup();
  });

  document.getElementById('tagDeletePopup')?.addEventListener('click', e => {
    if(e.target === e.currentTarget) closeTagDeletePopup();
  });

  document.getElementById('successPopup')?.addEventListener('click', e => {
    if(e.target === e.currentTarget) closeSuccessPopup();
  });

});
/* ============================================================
   ADMIN CLAIMS
============================================================ */
async function loadAdminClaims() {
  const container = document.getElementById('claimsTableBody') || document.getElementById('claimsList');
  if (!container) return;

  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/claims`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load claims');
    const claims = await res.json();

    const statPending = document.getElementById('statPendingClaims');
    if (statPending) statPending.textContent = claims.filter(c => c.claimStatus === 'pending').length;

    if (!claims.length) {
      container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#9ca3af">No claims yet.</td></tr>';
      return;
    }

    container.innerHTML = claims.map(c => `
      <tr data-claim-id="${c.claimID}">
        <td>${c.userName}</td>
        <td>${c.email}</td>
        <td>${c.itemTitle}</td>
        <td><span class="badge badge-${c.itemType}">${c.itemType.toUpperCase()}</span></td>
        <td><span class="badge badge-${c.claimStatus === 'pending' ? 'pending' : c.claimStatus === 'approved' ? 'claimed' : 'danger'}">${c.claimStatus.toUpperCase()}</span></td>
        <td>
          ${c.claimStatus === 'pending' ? `
            <button class="btn-action btn-approve" onclick="approveClaim(${c.claimID}, this)">Approve</button>
            <button class="btn-action btn-reject" onclick="rejectClaim(${c.claimID}, this)">Reject</button>
          ` : '—'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('LOAD CLAIMS ERROR:', err);
    container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;padding:20px">Failed to load claims.</td></tr>';
  }
}

async function approveClaim(claimID, btn) {
  btn.disabled = true; btn.textContent = 'Approving…';
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/claims/${claimID}/approve`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed');
    showToast('success', 'Claim Approved', 'The claim has been approved and item marked as claimed.');
    await loadAdminClaims();
    await loadAdminStats();
    await loadAdminItems();
  } catch (err) {
    showToast('error', 'Error', 'Could not approve claim.');
    btn.disabled = false; btn.textContent = 'Approve';
  }
}

async function rejectClaim(claimID, btn) {
  btn.disabled = true; btn.textContent = 'Rejecting…';
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/claims/${claimID}/reject`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed');
    showToast('info', 'Claim Rejected', 'The claim has been rejected.');
    await loadAdminClaims();
  } catch (err) {
    showToast('error', 'Error', 'Could not reject claim.');
    btn.disabled = false; btn.textContent = 'Reject';
  }
}

/* ============================================================
   ADMIN USERS
============================================================ */
async function loadAdminUsers() {
  const container = document.getElementById('usersTableBody') || document.getElementById('usersList');
  if (!container) return;

  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load users');
    const users = await res.json();

    const statUsers = document.getElementById('statUsers') || document.getElementById('statTotalUsers');
    if (statUsers) statUsers.textContent = users.length;

    if (!users.length) {
      container.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#9ca3af">No users found.</td></tr>';
      return;
    }

    container.innerHTML = users.map(u => `
      <tr data-user-id="${u.userID}">
        <td>${u.userName}</td>
        <td>${u.email}</td>
        <td><span class="badge badge-${u.role === 'Admin' ? 'claimed' : 'pending'}">${u.role}</span></td>
        <td><span class="badge badge-${u.userStatus === 'active' ? 'claimed' : 'danger'}">${u.userStatus}</span></td>
        <td>
          ${u.userStatus === 'active'
            ? `<button class="btn-action btn-reject" onclick="setUserStatus(${u.userID}, 'suspended', this)">Suspend</button>`
            : `<button class="btn-action btn-approve" onclick="setUserStatus(${u.userID}, 'active', this)">Activate</button>`
          }
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('LOAD USERS ERROR:', err);
  }
}

async function setUserStatus(userID, status, btn) {
  btn.disabled = true;
  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/users/${userID}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed');
    showToast('success', 'User Updated', `User has been ${status === 'active' ? 'activated' : 'suspended'}.`);
    await loadAdminUsers();
  } catch (err) {
    showToast('error', 'Error', 'Could not update user status.');
    btn.disabled = false;
  }
}

/* ============================================================
   ADMIN APPEALS / ITEM REPORTS
============================================================ */
async function loadAdminAppeals() {
  const container = document.getElementById('appealsTableBody');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="6" class="admin-table-empty">Loading reports...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API_BASE}/admin/appeals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load reports');
    const appeals = await res.json();

    if (!appeals.length) {
      container.innerHTML = '<tr><td colspan="6" class="admin-table-empty">No item reports yet.</td></tr>';
      return;
    }

    container.innerHTML = appeals.map(a => `
      <tr data-appeal-id="${a.appealID}">
        <td>${escapeHtml(a.userName || 'Unknown')}</td>
        <td><span class="badge badge-pending">${escapeHtml(a.role || 'User')}</span></td>
        <td>${escapeHtml(a.itemTitle || 'Untitled item')}</td>
        <td><span class="badge badge-${escapeHtml(a.itemType || 'pending')}">${escapeHtml(String(a.itemType || 'item').toUpperCase())}</span></td>
        <td>${escapeHtml(a.reason || 'No reason provided.')}</td>
        <td>${formatNotifDate(a.createdAt)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('LOAD APPEALS ERROR:', err);
    container.innerHTML = '<tr><td colspan="6" class="admin-table-empty" style="color:var(--red-text)">Failed to load item reports.</td></tr>';
  }
}

/* ============================================================
   ADMIN ACCOUNT / PASSWORD SETTINGS (connected to API)
============================================================ */
async function submitAdminAccountInfo(e) {
  e.preventDefault();
  const userName = (document.getElementById('accFirstName')?.value.trim() + ' ' + document.getElementById('accLastName')?.value.trim()).trim()
    || document.getElementById('accUsername')?.value.trim();
  if (!userName) { showToast('error', 'Required', 'Please fill in name fields.'); return; }
  try {
    const data = await UserAPI.updateProfile({
      userName,
      ...(currentAdminUser?.profilePhotoData ? { profilePhotoData: currentAdminUser.profilePhotoData } : {})
    });
    currentAdminUser = data.user || { ...(currentAdminUser || {}), userName };
    localStorage.setItem('asa_user', userName);
    localStorage.setItem('userName', userName);
    document.querySelector('admin-header')?.setUsername(userName);
    renderAdminProfilePhoto(currentAdminUser.profilePhotoData);
    populateAdminAccountForm(currentAdminUser);
    showToast('success', 'Account Updated', 'Your profile has been saved.');
  } catch (err) {
    showToast('error', 'Error', err.message || 'Could not update profile.');
  }
}

async function submitAdminPasswordChange(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPass')?.value;
  const newPassword     = document.getElementById('newPass')?.value;
  const confirmPass     = document.getElementById('confirmPass')?.value;
  if (!currentPassword || !newPassword || !confirmPass) { showToast('error', 'Required', 'Please fill in all password fields.'); return; }
  if (newPassword.length < 8) { showToast('error', 'Too Short', 'New password must be at least 8 characters.'); return; }
  if (newPassword !== confirmPass) { showToast('error', 'Mismatch', 'Passwords do not match.'); return; }
  try {
    const res = await fetch(`${ADMIN_API_BASE}/users/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    ['currentPass','newPass','confirmPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    showToast('success', 'Password Updated', 'Your password has been changed successfully.');
  } catch (err) {
    showToast('error', 'Error', err.message || 'Could not update password.');
  }
}

