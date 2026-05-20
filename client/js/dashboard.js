/* ============================================================
   JAVASCRIPT – Admin header + Dashboard logic + Settings
============================================================ */
const PICKUP_LOCATIONS = ["CAA LSG Office","CCIS LSG Office","CED LSG Office","CEGS LSG Office","CHASS LSG Office","CMNS LSG Office","COFES LSG Office","Guard House - Main Gate","Guard House - Green Gate"];
const DASH_API_BASE = window.ASA_API_BASE || `${window.location.origin}/api`;
const DASH_TOKEN = localStorage.getItem('asa_token') || localStorage.getItem('token');
let buildingPhotos = {};
let dashboardProfilePhotoData = null;
let dashboardItemsCache = [];
let dashboardClaimsCache = [];
let dashboardUsersCache = [];
let dashboardAppealsCache = [];
let dashboardLogsCache = [];

function setDashboardStats(stats = {}) {
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? 0; };
  set('countLost', stats.totalLost);
  set('countFound', stats.totalFound);
  set('countPending', stats.pendingClaims);
  set('countUsers', stats.totalUsers);
  set('countClaimed', stats.resolvedItems);
}

function hydrateDashboardStatsFromCache() {
  try {
    const cached = JSON.parse(localStorage.getItem('asa_dashboard_stats') || 'null');
    if (cached) setDashboardStats(cached);
  } catch (err) {
    localStorage.removeItem('asa_dashboard_stats');
  }
}


// ── Header dropdowns (Admin style) ──
const headerNotifBtn = document.getElementById('headerNotifBtn');
const headerNotifDropdown = document.getElementById('headerNotifDropdown');
const headerProfileBtn = document.getElementById('headerProfileBtn');
const headerProfileDropdown = document.getElementById('headerProfileDropdown');
const headerMarkRead = document.getElementById('headerMarkRead');

headerNotifBtn.addEventListener('click', e => {
  e.stopPropagation();
  headerNotifDropdown.classList.toggle('show');
  headerProfileDropdown.classList.remove('show');
});
headerProfileBtn.addEventListener('click', e => {
  e.stopPropagation();
  headerProfileDropdown.classList.toggle('show');
  headerNotifDropdown.classList.remove('show');
});
headerMarkRead.addEventListener('click', async () => {
  try {
    await NotifAPI.markAllRead();
    await loadDashboardNotifications();
  } catch (err) {
    showToast('error', 'Notification Error', err.message || 'Could not mark notifications as read.');
  }
});
window.addEventListener('click', () => {
  headerNotifDropdown.classList.remove('show');
  headerProfileDropdown.classList.remove('show');
});

function closeAllDropdowns() {
  headerNotifDropdown?.classList.remove('show');
  headerProfileDropdown?.classList.remove('show');
}

function renderDashboardNotifications(notifs = []) {
  const list = document.getElementById('headerNotifList');
  const dot = document.getElementById('headerNotifDot');
  if (!list) return;
  const rows = Array.isArray(notifs) ? notifs : [];
  const unreadCount = rows.filter(n => Number(n.isRead) === 0 || n.isRead === false).length;
  if (dot) {
    dot.textContent = unreadCount || '';
    dot.classList.toggle('hidden', unreadCount === 0);
  }
  if (!rows.length) {
    list.innerHTML = '<div class="notif-empty" style="padding:18px;text-align:center;color:#9ca3af;font-size:13px">No notifications yet.</div>';
    return;
  }
  list.innerHTML = rows.slice(0, 6).map(n => `
    <button type="button" class="notif-item ${Number(n.isRead) === 0 || n.isRead === false ? 'unread' : ''}" onclick="openDashboardNotification(${Number(n.notifID) || 0}, ${n.itemID ? Number(n.itemID) : 'null'})">
      <div class="notif-icon-box admin-bg"><i class="fa-solid fa-bell"></i></div>
      <div class="notif-text"><p>${n.message || 'Notification'}</p><span class="notif-time">${formatLogDate(n.createdAt)}</span></div>
      ${Number(n.isRead) === 0 || n.isRead === false ? '<div class="status-dot"></div>' : ''}
    </button>
  `).join('');
}

async function loadDashboardNotifications() {
  if (!DASH_TOKEN) return;
  try {
    const notifs = await NotifAPI.getAll();
    renderDashboardNotifications(notifs);
  } catch (err) {
    console.warn('Could not load dashboard notifications:', err.message);
  }
}

async function openDashboardNotification(notifID, itemID) {
  try {
    if (notifID) await NotifAPI.markRead(notifID);
  } catch (err) {
    console.warn('Could not mark notification read:', err.message);
  }
  closeAllDropdowns();
  if (itemID) {
    window.location.href = `/admin<i class="fa-solid fa-check" aria-hidden="true"></i>itemID=${encodeURIComponent(itemID)}`;
  } else {
    window.location.href = '/admin#claims';
  }
}
window.openDashboardNotification = openDashboardNotification;

// ── Mobile nav toggle ──
function toggleMobileNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('mobileNav')?.classList.remove('open');
}

function fallbackAvatarIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
}

function formatAccountUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9._]+/g, '_')
    .replace(/[._]{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '');
}

function renderProfilePhoto(photoData) {
  dashboardProfilePhotoData = photoData || dashboardProfilePhotoData || null;
  const content = dashboardProfilePhotoData
    ? `<img src="${dashboardProfilePhotoData}" alt="Profile photo">`
    : fallbackAvatarIcon();
  document.querySelectorAll('.profile-avatar, .main-avatar').forEach(el => {
    el.innerHTML = content;
  });
}

function readProfilePhoto(file) {
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

// ── SPA page switcher (Dashboard + Settings + Reports) ──
function switchPage(page) {
  const mainContainer = document.getElementById('mainContainer');
  const settingsPage = document.getElementById('page-settings');

  if (page === 'settings') {
    mainContainer.style.display = 'none';
    settingsPage.style.display = 'block';
    document.querySelectorAll('.menu-item').forEach(a => a.classList.remove('active'));
  } else {
    mainContainer.style.display = 'flex';
    settingsPage.style.display = 'none';
    document.querySelectorAll('.dash-page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(a => a.classList.remove('active'));
    const sl = document.getElementById('slink-' + page);
    if (sl) sl.classList.add('active');
  }
  document.querySelectorAll('.main-nav .nav-item, .mobile-nav .mnav-item').forEach(a => a.classList.remove('active'));
  const navPage = page === 'overview' ? 'overview' : page;
  document.querySelectorAll(`[data-dash-nav="${navPage}"]`).forEach(a => a.classList.add('active'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Settings tabs switching ──
function switchSettingsTab(tab, btn) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.s-nav-btn').forEach(b => b.classList.remove('active'));
  const section = document.getElementById(`set-${tab}`);
  if (section) section.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Building photos ──
function buildBuildingGrid() {
  const grid = document.getElementById('buildingGrid');
  if (!grid) return;
  grid.innerHTML = PICKUP_LOCATIONS.map(loc =>
    `<div class="building-card">
      <div class="building-photo-wrap" onclick="triggerBuildingUpload('${loc}')">
        ${buildingPhotos[loc] ? `<img src="${buildingPhotos[loc]}">` : '<span style="font-size:36px"><i class="fa-solid fa-building" aria-hidden="true"></i></span>'}
        <div class="building-overlay"><i class="fa-solid fa-camera"></i> ${buildingPhotos[loc] ? 'Change' : 'Add'}</div>
      </div>
      <div class="building-card-info">
        <p>${loc}</p>
        ${buildingPhotos[loc] ? '<span style="color:green"><i class="fa-solid fa-check" aria-hidden="true"></i> Photo set</span>' : '<span>No photo</span>'}
      </div>
    </div>`
  ).join('');
}

function triggerBuildingUpload(loc) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        buildingPhotos[loc] = ev.target.result;
        buildBuildingGrid();
        showToast('success', 'Photo Updated', `Photo for "${loc}" saved.`);
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function handleAvatarChange(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    document.getElementById('avatarFileName').textContent = file.name;
    readProfilePhoto(file)
      .then(async photoData => {
        const userName = `${document.getElementById('accFirstName')?.value.trim() || ''} ${document.getElementById('accLastName')?.value.trim() || ''}`.trim()
          || document.getElementById('accUsername')?.value.trim()
          || localStorage.getItem('userName')
          || 'CCIS Admin';
        const saved = await dashFetch('/users/profile', { method: 'PUT', body: JSON.stringify({ userName, profilePhotoData: photoData }) });
        renderProfilePhoto(saved.user?.profilePhotoData || photoData);
        showToast('success', 'Photo Updated', 'Your display picture has been saved.');
      })
      .catch(err => showToast('error', 'Upload Failed', err.message));
  }
}

// ── Toast ──
function showToast(type, title, msg) {
  const c = document.getElementById('toast-container');
  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>'
  };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
    <button class="toast-close" onclick="killToast(this.parentElement)"><i class="fa-solid fa-xmark"></i></button>
    <div class="toast-progress"></div>`;
  c.appendChild(t);
  setTimeout(() => killToast(t), 4200);
}

function killToast(t) {
  if (!t || !t.parentElement) return;
  t.style.animation = 'toastOut .3s ease forwards';
  setTimeout(() => t.remove(), 300);
}

// ── Settings form submissions (dummy) ──
async function dashFetch(endpoint, options = {}) {
  const res = await fetch(`${DASH_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(DASH_TOKEN ? { Authorization: `Bearer ${DASH_TOKEN}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

async function submitAccountInfo(e) {
  e.preventDefault();
  const userName = `${document.getElementById('accFirstName')?.value.trim() || ''} ${document.getElementById('accLastName')?.value.trim() || ''}`.trim()
    || document.getElementById('accUsername')?.value.trim();
  try {
    await dashFetch('/users/profile', { method: 'PUT', body: JSON.stringify({ userName }) });
    showToast('success', 'Account Updated', 'Information saved to the database.');
  } catch (err) {
    showToast('error', 'Update Failed', err.message);
  }
}

async function submitPasswordChange(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPass')?.value;
  const newPassword = document.getElementById('newPass')?.value;
  const confirm = document.getElementById('confirmPass')?.value;
  if (!currentPassword || !newPassword || newPassword !== confirm) {
    showToast('error', 'Invalid Password', 'Please complete the password fields correctly.');
    return;
  }
  try {
    await dashFetch('/users/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
    ['currentPass','newPass','confirmPass'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    showToast('success', 'Password Updated', 'Password changed in the database.');
  } catch (err) {
    showToast('error', 'Password Failed', err.message);
  }
}

// ── Search / filter ──
function searchTable(tbodyId, query) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const page = tbody.closest('.dash-page');
  if (page) {
    applyDashboardFilters(page.id);
    return;
  }
  const q = query.toLowerCase();
  tbody.querySelectorAll('tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function dateKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function normalizeFilterValue(value) {
  return String(value || '').trim().toLowerCase();
}

function rowMatchesFilter(row, filters) {
  return Object.entries(filters).every(([key, expected]) => {
    const wanted = normalizeFilterValue(expected);
    if (!wanted) return true;
    return normalizeFilterValue(row.dataset[key]) === wanted;
  });
}

function applyDashboardFilters(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;
  const selects = Array.from(page.querySelectorAll('.filter-bar select'));
  const dateInput = page.querySelector('.filter-bar input[type="date"]');
  const searchValue = normalizeFilterValue(page.querySelector('.mini-search input')?.value || '');
  const tbody = page.querySelector('tbody');
  if (!tbody) return;

  let filters = {};
  if (pageId === 'page-lost') {
    filters = { category: selects[0]?.value, status: selects[1]?.value, date: dateInput?.value };
  } else if (pageId === 'page-found') {
    filters = { category: selects[0]?.value, location: selects[1]?.value, status: selects[2]?.value, date: dateInput?.value };
  } else if (pageId === 'page-pending') {
    filters = { role: selects[0]?.value, status: selects[1]?.value, date: dateInput?.value };
  } else if (pageId === 'page-claimed') {
    filters = { category: selects[0]?.value, location: selects[1]?.value, date: dateInput?.value };
  } else if (pageId === 'page-users') {
    filters = { role: selects[0]?.value, status: selects[1]?.value, date: dateInput?.value };
  } else if (pageId === 'page-updates') {
    filters = { type: selects[0]?.value, status: selects[1]?.value, date: dateInput?.value };
  } else if (pageId === 'page-reports') {
    filters = { type: selects[0]?.value, status: selects[1]?.value, date: dateInput?.value };
  }

  let visibleCount = 0;
  tbody.querySelectorAll('tr').forEach(row => {
    if (!row.dataset.filterable) return;
    const matchesSearch = !searchValue || normalizeFilterValue(row.textContent).includes(searchValue);
    const visible = matchesSearch && rowMatchesFilter(row, filters);
    row.style.display = visible ? '' : 'none';
    if (visible) visibleCount += 1;
  });

  const empty = page.querySelector('.empty-state');
  if (empty) empty.style.display = visibleCount ? 'none' : '';
}

// ── Delete popup ──
let pendingDelRow = null;
function confirmDel(btn) {
  pendingDelRow = btn.closest('tr');
  document.getElementById('deletePopup').classList.add('active');
}
function closeDelPopup() {
  document.getElementById('deletePopup').classList.remove('active');
  pendingDelRow = null;
}
function execDelete() {
  if (pendingDelRow) {
    const name = pendingDelRow.querySelector('td:nth-child(2)')?.textContent || 'Item';
    pendingDelRow.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => pendingDelRow?.remove(), 300);
    showToast('info', 'Deleted', `"${name}" has been removed.`);
  }
  closeDelPopup();
}
document.getElementById('deletePopup').addEventListener('click', function(e) {
  if (e.target === this) closeDelPopup();
});

// ── Filter reset helpers ──
document.querySelectorAll('.filter-reset').forEach(btn => {
  btn.addEventListener('click', () => {
    const bar = btn.closest('.filter-bar');
    bar.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    bar.querySelectorAll('input[type=date]').forEach(i => i.value = '');
    const page = btn.closest('.dash-page');
    if (page) applyDashboardFilters(page.id);
  });
});

document.querySelectorAll('.filter-apply').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.closest('.dash-page');
    if (page) applyDashboardFilters(page.id);
  });
});

// Initialize building grid on page load
document.addEventListener('DOMContentLoaded', () => {
  hydrateDashboardStatsFromCache();
  loadDashboardProfile();
  loadDashboardData();
  loadDashboardNotifications();
  buildBuildingGrid();
});


const refreshDashboardRealtime = (window.asaRealtimeDebounce || ((fn) => fn))(async event => {
  const type = event.detail?.type;
  if (type === 'connected' || type === 'heartbeat') return;
  if (typeof loadDashboardData === 'function') await loadDashboardData();
  if (typeof loadDashboardNotifications === 'function') await loadDashboardNotifications();
}, 300);

window.addEventListener('asa:realtime', refreshDashboardRealtime);

async function loadDashboardProfile() {
  if (!DASH_TOKEN) return;
  try {
    const user = await dashFetch('/users/me');
    const displayName = user.userName || localStorage.getItem('userName') || 'CCIS Admin';
    localStorage.setItem('userName', displayName);
    localStorage.setItem('asa_user', displayName);

    const nameParts = displayName.trim().split(/\s+/);
    const first = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : displayName;
    const last = nameParts.length > 1 ? nameParts.at(-1) : '';

    document.getElementById('headerProfileName').textContent = displayName;
    document.querySelector('.pd-name').textContent = displayName;
    const firstInput = document.getElementById('accFirstName');
    const lastInput = document.getElementById('accLastName');
    const usernameInput = document.getElementById('accUsername');
    const emailInput = document.getElementById('accEmail');
    if (firstInput) firstInput.value = first;
    if (lastInput) lastInput.value = last;
    if (usernameInput) usernameInput.value = formatAccountUsername(user.accountUsername || displayName);
    if (emailInput) emailInput.value = user.email || '';
    renderProfilePhoto(user.profilePhotoData);
  } catch (err) {
    console.warn('Could not load dashboard profile:', err.message);
  }
}

function dashBadge(status) {
  const cls = status === 'approved' ? 'badge-approved' : status === 'claimed' ? 'badge-claimed' : status === 'rejected' ? 'badge-danger' : 'badge-pending';
  return `<span class="badge ${cls}">${String(status || 'pending')}</span>`;
}

async function loadDashboardData() {
  if (!DASH_TOKEN) return;

  const updateStats = stats => {
    localStorage.setItem('asa_dashboard_stats', JSON.stringify(stats));
    setDashboardStats(stats);
  };

  try {
    const statsPromise = dashFetch('/admin/stats').then(stats => {
      updateStats(stats);
      return stats;
    });

    const itemsPromise = dashFetch('/admin/items').then(items => {
      const itemList = Array.isArray(items) ? items : [];
      dashboardItemsCache = itemList;
      renderItemRows('lost-tbody', itemList.filter(i => i.itemType === 'lost'));
      renderItemRows('found-tbody', itemList.filter(i => i.itemType === 'found'));
      renderItemRows('claimed-tbody', itemList.filter(i => i.itemStatus === 'claimed'));
      renderUpdates(itemList);
      return itemList;
    });

    const claimsPromise = dashFetch('/admin/claims').then(claims => {
      const claimList = Array.isArray(claims) ? claims : [];
      dashboardClaimsCache = claimList;
      document.getElementById('countPending').textContent = claimList.filter(c => c.claimStatus === 'pending').length;
      renderClaims(claimList);
      return claimList;
    });

    const usersPromise = dashFetch('/admin/users').then(users => {
      const userList = Array.isArray(users) ? users : [];
      dashboardUsersCache = userList;
      document.getElementById('countUsers').textContent = userList.length;
      renderUsers(userList);
      return userList;
    });

    const appealsPromise = dashFetch('/admin/appeals').then(appeals => {
      const appealList = Array.isArray(appeals) ? appeals : [];
      dashboardAppealsCache = appealList;
      renderReports(appealList);
      return appealList;
    }).catch(() => []);

    const [items, claims, appeals] = await Promise.all([itemsPromise, claimsPromise, appealsPromise]);
    await Promise.allSettled([statsPromise, usersPromise]);
    renderActivityLogs(items, claims, appeals);
  } catch (err) {
    showToast('error', 'Dashboard Error', err.message || 'Could not load dashboard data.');
  }
}

function renderItemRows(tbodyId, items) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const colspan = tbodyId === 'found-tbody' ? 7 : 6;
  tbody.innerHTML = items.length ? items.map(i => {
    const isFound = i.itemType === 'found';
    const img = `<div style="width:40px;height:40px;background:${isFound ? '#dcfce7' : '#dbeafe'};border-radius:8px;display:flex;align-items:center;justify-content:center">${isFound ? 'F' : 'L'}</div>`;
    const rawDate = i.createdAt || i.dateOccured;
    const date = formatLogDate(rawDate);
    const rowData = `data-filterable="1" data-category="${i.category || 'General'}" data-status="${i.itemStatus || 'pending'}" data-date="${dateKey(rawDate)}" data-type="${i.itemType || ''}" data-location="${i.locationDetail || i.location || ''}"`;
    const actions = `<button class="list-btn" title="View post" onclick="openDashboardItem(${i.itemID})"><i class="fa-solid fa-eye"></i></button><button class="list-btn" title="Delete post" onclick="deleteDashboardItem(${i.itemID})"><i class="fa-solid fa-trash"></i></button>`;
    if (tbodyId === 'found-tbody') {
      return `<tr data-item-id="${i.itemID}" ${rowData}><td>${img}</td><td>${i.title}</td><td>${i.category || 'General'}</td><td>${date}</td><td>${i.locationDetail || i.location || ''}</td><td>${dashBadge(i.itemStatus)}</td><td>${actions}</td></tr>`;
    }
    return `<tr data-item-id="${i.itemID}" ${rowData}><td>${img}</td><td>${i.title}</td><td>${i.category || 'General'}</td><td>${date}</td><td>${dashBadge(i.itemStatus)}</td><td>${actions}</td></tr>`;
  }).join('') : `<tr><td colspan="${colspan}" style="text-align:center;padding:24px;color:#9ca3af">No records found.</td></tr>`;
  applyDashboardFilters(`page-${tbodyId.replace('-tbody', '')}`);
}

function openDashboardItem(itemID) {
  window.location.href = `/admin<i class="fa-solid fa-check" aria-hidden="true"></i>itemID=${encodeURIComponent(itemID)}`;
}

function formatLogDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '';
}

function renderActivityLogs(items, claims, appeals) {
  const logs = [
    ...items.map(item => ({
      user: item.reporterName || 'Unknown User',
      action: `Submitted ${item.itemType === 'found' ? 'Found' : 'Lost'} Item`,
      item: item.title || 'Untitled item',
      date: item.createdAt || item.dateOccured
    })),
    ...claims.map(claim => ({
      user: claim.userName || 'Unknown User',
      action: claim.claimStatus === 'approved' ? 'Approved Claim' : claim.claimStatus === 'rejected' ? 'Rejected Claim' : 'Claim Request',
      item: claim.itemTitle || 'Untitled item',
      date: claim.createdAt
    })),
    ...appeals.map(appeal => ({
      user: appeal.userName || 'Unknown User',
      action: 'Submitted Item Report',
      item: appeal.itemTitle || 'Untitled item',
      date: appeal.createdAt
    }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const logsBody = document.getElementById('logs-tbody');
  if (logsBody) {
    logsBody.innerHTML = logs.length ? logs.map((log, index) => `
      <tr>
        <td>${String(index + 1).padStart(3, '0')}</td>
        <td>${log.user}</td>
        <td>${log.action}</td>
        <td>${log.item}</td>
        <td>${formatLogDate(log.date)}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" style="text-align:center;padding:24px;color:#9ca3af">No activity yet.</td></tr>`;
  }

  const activityList = document.getElementById('activityList');
  if (activityList) {
    activityList.innerHTML = logs.slice(0, 5).map(log => `
      <div class="act-item">
        <span class="act-dot dot-green"></span>
        <div class="act-text">
          <strong>${log.action}</strong><br>
          ${log.user} - ${log.item}
        </div>
        <span class="act-time">${formatLogDate(log.date)}</span>
      </div>
    `).join('') || '<p style="color:#9ca3af">No activity yet.</p>';
  }
}


function safeJsText(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function ensureDashClaimDecisionModal() {
  let modal = document.getElementById('dashClaimDecisionModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'popup-overlay';
  modal.id = 'dashClaimDecisionModal';
  modal.innerHTML = `
    <div class="popup-box claim-decision-box">
      <h3 id="dashClaimDecisionTitle">Claim Decision</h3>
      <p id="dashClaimDecisionSubtitle" style="color:#6b7280;margin-bottom:14px"></p>
      <input type="hidden" id="dashClaimDecisionID">
      <input type="hidden" id="dashClaimDecisionAction">
      <div id="dashClaimApproveFields">
        <label class="form-label">Storage / Pick-Up Location</label>
        <input class="form-input" id="dashClaimPickupLocation" readonly>
        <label class="form-label" style="margin-top:12px">Available Schedule</label>
        <input class="form-input" id="dashClaimPickupSchedule" placeholder="Example: May 18, 2026, 9:00 AM - 4:00 PM">
      </div>
      <label class="form-label" style="margin-top:12px">Message / Note</label>
      <textarea class="form-textarea" id="dashClaimAdminNote" placeholder="Optional note for the claimant"></textarea>
      <div class="popup-actions claim-decision-actions">
        <button class="btn-cancel claim-decision-cancel" onclick="closeDashClaimDecisionModal()">Cancel</button>
        <button class="claim-decision-send" onclick="submitDashClaimDecision()">Send</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => {
    if (e.target === modal) closeDashClaimDecisionModal();
  });
  document.body.appendChild(modal);
  return modal;
}

function openDashClaimDecisionModal(claimID, action, itemTitle = 'this item', pickupLocation = '') {
  const modal = ensureDashClaimDecisionModal();
  document.getElementById('dashClaimDecisionID').value = claimID;
  document.getElementById('dashClaimDecisionAction').value = action;
  document.getElementById('dashClaimDecisionTitle').textContent = action === 'approve' ? 'Approve Claim' : 'Reject Claim';
  document.getElementById('dashClaimDecisionSubtitle').textContent = action === 'approve'
    ? `Tell the claimant when to verify ownership and pick up "${itemTitle}".`
    : `Tell the claimant why the request for "${itemTitle}" was rejected.`;
  document.getElementById('dashClaimApproveFields').style.display = action === 'approve' ? 'block' : 'none';
  document.getElementById('dashClaimPickupLocation').value = pickupLocation || 'Stored location not specified';
  document.getElementById('dashClaimPickupSchedule').value = '';
  document.getElementById('dashClaimAdminNote').value = '';
  modal.classList.add('active');
}

function closeDashClaimDecisionModal() {
  document.getElementById('dashClaimDecisionModal')?.classList.remove('active');
}

async function submitDashClaimDecision() {
  const claimID = document.getElementById('dashClaimDecisionID').value;
  const action = document.getElementById('dashClaimDecisionAction').value;
  const payload = {
    pickupSchedule: document.getElementById('dashClaimPickupSchedule').value.trim(),
    adminNote: document.getElementById('dashClaimAdminNote').value.trim()
  };

  if (action === 'approve' && !payload.pickupSchedule) {
    showToast('error', 'Missing Details', 'Available schedule is required.');
    return;
  }

  try {
    await dashFetch(`/admin/claims/${claimID}/${action}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    closeDashClaimDecisionModal();
    showToast(action === 'approve' ? 'success' : 'info', action === 'approve' ? 'Claim Approved' : 'Claim Rejected', action === 'approve' ? 'The claimant was notified with pickup instructions.' : 'The claimant was notified.');
    await loadDashboardData();
  } catch (err) {
    showToast('error', 'Claim Update Failed', err.message);
  }
}
window.openDashClaimDecisionModal = openDashClaimDecisionModal;
window.closeDashClaimDecisionModal = closeDashClaimDecisionModal;
window.submitDashClaimDecision = submitDashClaimDecision;
function claimProofCell(claim) {
  return claim.proof ? '<i class="fa-solid fa-paperclip" style="color:var(--green)"></i> Provided' : 'No proof';
}

function renderClaims(claims) {
  const pending = claims.filter(c => c.claimStatus === 'pending');
  const overview = document.getElementById('overview-pending-body');
  if (overview) {
    overview.innerHTML = pending.length ? pending.map(c => `
      <tr data-filterable="1" data-role="${c.role || ''}" data-status="${c.claimStatus || 'pending'}" data-date="${dateKey(c.createdAt)}" data-type="${c.itemType || ''}">
        <td>${c.itemTitle || 'Untitled item'}</td>
        <td>${c.userName || 'Unknown'}${c.email ? ` (${c.email})` : ''}</td>
        <td>${c.itemType || 'Item'}</td>
        <td>${formatLogDate(c.createdAt)}</td>
        <td>${dashBadge(c.claimStatus)}</td>
        <td><button class="list-btn" title="View post" onclick="openDashboardItem(${c.itemID})"><i class="fa-solid fa-eye"></i></button> <button class="list-btn" title="Approve claim" onclick="openDashClaimDecisionModal(${c.claimID}, 'approve', '${safeJsText(c.itemTitle || "item")}', '${safeJsText(c.pickupLocationSource || "Campus")}')"><i class="fa-solid fa-check"></i></button> <button class="list-btn" title="Reject claim" onclick="openDashClaimDecisionModal(${c.claimID}, 'reject', '${safeJsText(c.itemTitle || "item")}')"><i class="fa-solid fa-xmark"></i></button></td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#9ca3af">No pending claims.</td></tr>`;
  }

  const pendingBody = document.getElementById('pending-tbody');
  if (pendingBody) {
    pendingBody.innerHTML = pending.length ? pending.map(c => `
      <tr data-filterable="1" data-role="${c.role || ''}" data-status="${c.claimStatus || 'pending'}" data-date="${dateKey(c.createdAt)}" data-type="${c.itemType || ''}">
        <td>${claimProofCell(c)}</td>
        <td>${c.userName || 'Unknown'}${c.email ? ` (${c.email})` : ''}</td>
        <td>${c.itemTitle || 'Untitled item'}</td>
        <td>${c.itemType || 'Item'}</td>
        <td>${formatLogDate(c.createdAt)}</td>
        <td>${dashBadge(c.claimStatus)}</td>
        <td><button class="list-btn" title="View post" onclick="openDashboardItem(${c.itemID})"><i class="fa-solid fa-eye"></i></button> <button class="list-btn" title="Approve claim" onclick="openDashClaimDecisionModal(${c.claimID}, 'approve', '${safeJsText(c.itemTitle || "item")}', '${safeJsText(c.pickupLocationSource || "Campus")}')"><i class="fa-solid fa-check"></i></button> <button class="list-btn" title="Reject claim" onclick="openDashClaimDecisionModal(${c.claimID}, 'reject', '${safeJsText(c.itemTitle || "item")}')"><i class="fa-solid fa-xmark"></i></button></td>
      </tr>
    `).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af">No pending claim items.</td></tr>`;
    applyDashboardFilters('page-pending');
  }
}

function renderUpdates(items) {
  const visible = items.filter(i => !['approved', 'rejected'].includes(String(i.itemStatus || '').toLowerCase())).slice(0, 10);
  const overviewRows = visible.map(i => `<tr><td>${i.itemID}</td><td>${i.title}</td><td>${i.category || 'General'}</td><td>${formatLogDate(i.createdAt || i.dateOccured)}</td><td>${dashBadge(i.itemStatus)}</td></tr>`).join('');
  const updateRows = visible.map(i => `<tr data-filterable="1" data-type="${i.itemType || ''}" data-status="${i.itemStatus || 'pending'}" data-date="${dateKey(i.createdAt || i.dateOccured)}"><td>${i.title}</td><td>${i.reporterName || 'Unknown'}</td><td>${i.category || 'General'}</td><td>${i.itemType || 'Item'}</td><td>${dashBadge(i.itemStatus)}</td><td>${formatLogDate(i.createdAt || i.dateOccured)}</td></tr>`).join('');
  const overviewBody = document.getElementById('overview-updates-body');
  const updatesBody = document.getElementById('updates-tbody');
  if (overviewBody) overviewBody.innerHTML = overviewRows || `<tr><td colspan="5" style="text-align:center;padding:24px;color:#9ca3af">No recent updates.</td></tr>`;
  if (updatesBody) updatesBody.innerHTML = updateRows || `<tr><td colspan="6" style="text-align:center;padding:24px;color:#9ca3af">No recent updates.</td></tr>`;
  applyDashboardFilters('page-updates');
}

function renderUsers(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = users.map(u => `<tr data-filterable="1" data-role="${u.role || ''}" data-status="${u.userStatus || ''}" data-date="${dateKey(u.createdAt)}"><td></td><td>${u.userName}</td><td>${u.email}</td><td>${u.role}</td><td>${formatLogDate(u.createdAt)}</td><td>${dashBadge(u.userStatus)}</td><td></td></tr>`).join('');
  applyDashboardFilters('page-users');
}

function renderReports(appeals) {
  const tbody = document.getElementById('reports-tbody');
  if (!tbody) return;
  tbody.innerHTML = appeals.length ? appeals.map(a => `
    <tr data-filterable="1" data-type="${a.itemType || ''}" data-status="${a.itemStatus || ''}" data-date="${dateKey(a.createdAt)}">
      <td>${a.appealID}</td>
      <td>${a.itemTitle}</td>
      <td>${a.role} (${a.userName})</td>
      <td>${a.reason}</td>
      <td>${formatLogDate(a.createdAt)}</td>
      <td>${dashBadge(a.itemStatus)}</td>
      <td></td>
    </tr>
  `).join('') : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af">No item reports found.</td></tr>`;
  applyDashboardFilters('page-reports');
}

async function deleteDashboardItem(itemID) {
  try {
    await dashFetch(`/admin/items/${itemID}`, { method: 'DELETE' });
    showToast('info', 'Deleted', 'Item deleted from the database.');
    await loadDashboardData();
  } catch (err) {
    showToast('error', 'Delete Failed', err.message);
  }
}
