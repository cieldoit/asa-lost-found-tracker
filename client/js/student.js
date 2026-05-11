/* ============================================================
   STUDENT HEADER WEB COMPONENT
============================================================ */
class StudentHeader extends HTMLElement {
  connectedCallback() {
    this.render();
    this.initListeners();
  }
 
  render() {
    this.innerHTML = `
      <div>
        <header class="home-header">
          <div class="logo-container">
            <span class="logo-link" onclick="showPage('dashboard')">
              <img src="/ASA_logo/Final logo.png" alt="ASA Logo" class="main-logo">
            </span>
          </div>
          <nav class="main-nav">
            <button class="nav-item active" id="snav-dashboard" onclick="showPage('dashboard')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </button>
            <button class="nav-item" id="snav-lost" onclick="showPage('lost')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              Lost Items
            </button>
            <button class="nav-item" id="snav-found" onclick="showPage('found')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Found Items
            </button>
            <button class="nav-item" id="snav-post" onclick="showPage('post')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              Post Item
            </button>
          </nav>
          <div class="header-right">
            <!-- Notifications -->
            <div class="notif-container">
              <button class="notif-btn" id="headerNotifBtn" title="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div class="notif-badge-dot hidden" id="headerNotifDot"></div>
              </button>
              <div class="notif-dropdown" id="headerNotifDropdown">
                <div class="notif-panel-header">
                  <h3>Notifications</h3>
                  <span class="mark-read" id="headerMarkRead">Mark all as read</span>
                </div>
                <div class="notif-list" id="headerNotifList">
                  <div class="notif-empty" style="padding:20px;text-align:center;color:#9ca3af;font-size:13px">
                    No notifications yet.
                  </div>
                </div>
                <div class="notif-panel-footer"><a href="#" id="headerSeeAllNotifications">See all notifications</a></div>
              </div>
            </div>
            <!-- Profile -->
            <div class="profile-wrap">
              <button class="profile-btn" id="headerProfileBtn">
                <div class="profile-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span class="profile-name" id="headerProfileName">Student</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="dropdown-content" id="headerProfileDropdown">
                <div class="user-info">
                  <div class="pd-name" id="headerDropName">Student</div>
                  <div class="pd-role" id="headerDropRole">Student</div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="showPage('settings');closeAllDropdowns();">
                  <i class="fa-solid fa-gear" style="width:16px;color:var(--text-muted)"></i> Settings
                </button>
                <button class="dropdown-item logout-item" onclick="Auth.logout()">
                  <i class="fa-solid fa-right-from-bracket" style="width:16px"></i> Log Out
                </button>
              </div>
            </div>
            <!-- Mobile toggle -->
            <button class="mobile-nav-toggle" id="mobileToggle" onclick="toggleMobileNav()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </header>
 
        <!-- Mobile Nav -->
        <div class="mobile-nav" id="mobileNav">
          <button class="mnav-item active" id="smnav-dashboard" onclick="showPage('dashboard');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>
          <button class="mnav-item" id="smnav-lost" onclick="showPage('lost');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            Lost Items
          </button>
          <button class="mnav-item" id="smnav-found" onclick="showPage('found');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Found Items
          </button>
          <button class="mnav-item" id="smnav-post" onclick="showPage('post');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            Post Item
          </button>
          <button class="mnav-item" onclick="showPage('settings');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </button>
        </div>
      </div>
    `;
  }
 
  initListeners() {
    const profileBtn      = this.querySelector('#headerProfileBtn');
    const profileDropdown = this.querySelector('#headerProfileDropdown');
    const notifBtn        = this.querySelector('#headerNotifBtn');
    const notifDropdown   = this.querySelector('#headerNotifDropdown');
    const markReadBtn     = this.querySelector('#headerMarkRead');
    const seeAllBtn       = this.querySelector('#headerSeeAllNotifications');
    profileBtn.addEventListener('click', e => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
      notifDropdown.classList.remove('show');
    });
 
    notifBtn.addEventListener('click', e => {
  e.stopPropagation();

  notifDropdown.classList.toggle('show');
  profileDropdown.classList.remove('show');

  if (typeof loadNotifications === 'function') {
    loadNotifications();
  }
});
  
   markReadBtn.addEventListener('click', async e => {
  e.preventDefault();
  e.stopPropagation();

  if (typeof markAllNotificationsRead === 'function') {
    await markAllNotificationsRead();
  }
});

    seeAllBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openStudentNotificationsModal();
      notifDropdown.classList.remove('show');
    });
 
    window.addEventListener('click', event => {
      if (!this.contains(event.target)) {
        profileDropdown.classList.remove('show');
        notifDropdown.classList.remove('show');
      }
    });
  }
 
  setActivePage(page) {
    ['dashboard','lost','found','post'].forEach(p => {
      this.querySelector(`#snav-${p}`)?.classList.remove('active');
      this.querySelector(`#smnav-${p}`)?.classList.remove('active');
    });
    this.querySelector(`#snav-${page}`)?.classList.add('active');
    this.querySelector(`#smnav-${page}`)?.classList.add('active');
  }
 
  setUsername(name, role) {
    const n1 = this.querySelector('#headerProfileName');
    const n2 = this.querySelector('#headerDropName');
    const r1 = this.querySelector('#headerDropRole');
    if (n1) n1.textContent = name;
    if (n2) n2.textContent = name;
    if (r1 && role) r1.textContent = role;
  }
 
  renderNotifications(notifs) {
    window.studentNotifications = Array.isArray(notifs) ? notifs : [];
    const list = this.querySelector('#headerNotifList');
    const dot  = this.querySelector('#headerNotifDot');
    if (!list) return;
 
    if (!window.studentNotifications.length) {
      list.innerHTML = `<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px">No notifications yet.</div>`;
      dot.classList.add('hidden');
      return;
    }
 
    const unread = window.studentNotifications.filter(isUnreadNotification);
    dot.textContent = unread.length;
    dot.classList.toggle('hidden', unread.length === 0);
 
    list.innerHTML = window.studentNotifications.slice(0, 5).map(n => `
      <div class="notif-item ${isUnreadNotification(n) ? 'unread' : ''}" data-notif-id="${n.notifID}">
        <div class="notif-icon-box welcome-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M14 2H6a2 2 0 0 0-2 2v16"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="notif-text">
          <p>${n.message}</p>
          <span class="notif-time">${new Date(n.createdAt).toLocaleDateString()}</span>
        </div>
        ${isUnreadNotification(n) ? '<div class="status-dot"></div>' : ''}
      </div>
    `).join('');
  }
}
 
customElements.define('student-header', StudentHeader);

window.studentNotifications = [];

function isUnreadNotification(notification) {
  return Number(notification?.isRead) === 0 || notification?.isRead === false;
}

function escapeNotificationHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNotificationDate(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
}

function openStudentNotificationsModal() {
  document.getElementById('studentNotificationsModal')?.remove();
  const notifs = window.studentNotifications || [];
  const modal = document.createElement('div');
  modal.id = 'studentNotificationsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;';
  modal.innerHTML = `
    <div style="width:min(560px,100%);max-height:82vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0;font-size:18px;font-weight:800;color:#111827;">All Notifications</h2>
        <button type="button" onclick="closeStudentNotificationsModal()" style="border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#6b7280;">&times;</button>
      </div>
      <div style="max-height:66vh;overflow:auto;">
        ${notifs.length ? notifs.map(n => `
          <button type="button" onclick="studentMarkNotificationRead('${n.notifID}')" style="width:100%;display:flex;gap:12px;text-align:left;padding:15px 18px;border:0;border-bottom:1px solid #e5e7eb;background:${isUnreadNotification(n) ? '#f0fdf4' : '#fff'};cursor:pointer;">
            <span style="width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:#166534;color:#fff;"><i class="fa-solid fa-bell"></i></span>
            <span style="display:block;flex:1;">
              <span style="display:block;font-size:13.5px;line-height:1.5;color:#111827;font-weight:${isUnreadNotification(n) ? '800' : '500'};">${escapeNotificationHtml(n.message)}</span>
              <span style="display:block;margin-top:5px;font-size:12px;color:#6b7280;">${formatNotificationDate(n.createdAt)}</span>
            </span>
          </button>
        `).join('') : '<div style="padding:28px;text-align:center;color:#9ca3af;font-size:14px;">No notifications yet.</div>'}
      </div>
    </div>
  `;
  modal.addEventListener('click', e => {
    if (e.target === modal) closeStudentNotificationsModal();
  });
  document.body.appendChild(modal);
}

function closeStudentNotificationsModal() {
  document.getElementById('studentNotificationsModal')?.remove();
}

async function studentMarkNotificationRead(notifID) {
  if (!notifID) return;
  try {
    await NotifAPI.markRead(notifID);
    await loadNotifications();
    openStudentNotificationsModal();
  } catch (err) {
    console.warn('Could not mark notification read:', err.message);
  }
}

window.closeStudentNotificationsModal = closeStudentNotificationsModal;
window.studentMarkNotificationRead = studentMarkNotificationRead; 
/* ============================================================
   HELPERS
============================================================ */
function closeAllDropdowns() {
  const hdr = document.querySelector('student-header');
  if (!hdr) return;
  hdr.querySelector('#headerProfileDropdown')?.classList.remove('show');
  hdr.querySelector('#headerNotifDropdown')?.classList.remove('show');
}
 
function toggleMobileNav() {
  document.getElementById('mobileNav')?.classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('mobileNav')?.classList.remove('open');
}
 
/* ============================================================
   PAGE NAVIGATION
============================================================ */
let currentPage = 'dashboard';
 
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); currentPage = page; }
  document.querySelector('student-header')?.setActivePage(page);
  closeAllDropdowns();
  closeMobileNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
/* ============================================================
   TOAST
============================================================ */
function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>',
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress"></div>
  `;
  container.appendChild(toast);
  setTimeout(() => dismissToast(toast), 4200);
}
 
function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  toast.style.animation = 'toastOut 0.3s ease forwards';
  setTimeout(() => toast.remove(), 300);
}
 
/* ============================================================
   LOAD ITEMS FROM API
============================================================ */
let allItems = [];
let currentItemID = null; // tracks which item is open in modal
let pickupLocations = [];
let pickupLocationByID = {};

function getSelectedPickup() {
  const select = document.getElementById('foundPickup');
  const selected = select?.selectedOptions?.[0];
  if (!select?.value || !selected) return null;
  return {
    id: select.value,
    name: selected.dataset.name || selected.textContent.trim(),
    photo: selected.dataset.photo || ''
  };
}

function ensureFoundPickupPreviewCard() {
  if (document.getElementById('foundPickupPreview')) return;
  const page = document.getElementById('page-report-found');
  const formCard = page?.querySelector('.form-card');
  if (!page || !formCard || !formCard.parentElement) return;

  const layout = document.createElement('div');
  layout.className = 'found-report-layout';
  formCard.classList.add('found-form-card');
  formCard.style.maxWidth = '';
  formCard.style.margin = '';
  formCard.parentElement.insertBefore(layout, formCard);
  layout.appendChild(formCard);
  layout.insertAdjacentHTML('beforeend', `
    <aside class="pickup-preview-card" id="foundPickupPreview">
      <div class="pickup-preview-photo" id="foundPickupPreviewPhoto">
        <i class="fa-solid fa-building"></i>
      </div>
      <div class="pickup-preview-body">
        <span class="pickup-preview-label">Pick-up location</span>
        <h3 id="foundPickupPreviewName">Choose a location</h3>
        <p id="foundPickupPreviewNote">Choose a pick-up location to see the saved office photo and where the item should be claimed.</p>
      </div>
    </aside>`);
}

function updateFoundPickupPreview() {
  ensureFoundPickupPreviewCard();
  const pickup = getSelectedPickup();
  const photoBox = document.getElementById('foundPickupPreviewPhoto');
  const nameEl = document.getElementById('foundPickupPreviewName');
  const noteEl = document.getElementById('foundPickupPreviewNote');
  if (!photoBox || !nameEl || !noteEl) return;

  nameEl.textContent = pickup?.name || 'Choose a location';
  if (pickup?.photo) {
    photoBox.innerHTML = `<img src="${pickup.photo}" alt="${pickup.name}">`;
    noteEl.textContent = 'Use this office photo as your visual guide when picking up the item.';
  } else {
    photoBox.innerHTML = '<i class="fa-solid fa-building"></i>';
    noteEl.textContent = pickup ? 'No photo is saved yet, but this office name is the official pick-up point.' : 'Choose a pick-up location to see the saved office photo and where the item should be claimed.';
  }
}
 
async function loadItems() {
  try {
    const items = await ItemsAPI.browse();
    allItems = items;
 
    const lostItems  = items.filter(i => i.itemType === 'lost');
    const foundItems = items.filter(i => i.itemType === 'found');
 
    // Update dashboard stats
    document.getElementById('statLost').textContent  = lostItems.length;
    document.getElementById('statFound').textContent = foundItems.length;
 
    renderItemGrid('lostItemsGrid',  lostItems);
    renderItemGrid('foundItemsGrid', foundItems);
    renderRecentItems(items.slice(0, 4));
 
  } catch (err) {
    console.error('Failed to load items:', err);
    showToast('error', 'Connection Error', 'Could not load items. Is the server running?');
  }
}
 
function getCategoryEmoji(cat) {
  if (!cat) return '📦';
  const map = {
    'electronics': '📱', 'clothing': '👕', 'accessories': '👓',
    'documents': '📄', 'id / documents': '🪪', 'books': '📚',
    'books / stationery': '📚', 'keys': '🔑', 'bags': '🎒', 'others': '📦'
  };
  return map[cat.toLowerCase()] || '📦';
}
 
function buildItemCard(item) {
  const isLost   = item.itemType === 'lost';
  const gradient = isLost
    ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)'
    : 'linear-gradient(135deg,#dcfce7,#bbf7d0)';
  const emoji = getCategoryEmoji(item.categoryName);
  const date  = new Date(item.dateOccured).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
 
  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.itemId = item.itemID;
  div.dataset.title  = item.title;
  div.dataset.cat    = item.categoryName;
  div.dataset.desc   = item.description || '';
  div.dataset.loc    = item.locationDetail;
  div.dataset.date   = date;
  div.dataset.type   = item.itemType;
  div.dataset.photo  = item.locationPhoto || '';
  div.setAttribute('onclick', 'openItemModal(this)');
 
  div.innerHTML = `
    <div class="card-img-wrap">
      <div style="width:100%;height:100%;background:${gradient};
                  display:flex;align-items:center;justify-content:center;font-size:48px;">
        ${isLost ? '👛' : emoji}
      </div>
      <span class="badge badge-${item.itemType}">${item.itemType.toUpperCase()}</span>
    </div>
    <div class="card-info">
      <h3>${item.title}</h3>
      <span class="category-tag">${item.categoryName}</span>
      <p class="card-desc">${(item.description || '').substring(0, 80)}${(item.description || '').length > 80 ? '…' : ''}</p>
      <div class="card-footer-row">
        <span>${!isLost && item.locationPhoto ? `<img class="building-thumb" src="${item.locationPhoto}" alt="Pickup location photo">` : '<i class="fa-solid fa-location-dot"></i>'} ${item.locationDetail}</span>
        <span class="view-link">VIEW DETAILS</span>
      </div>
    </div>
  `;
  return div;
}
 
function renderItemGrid(gridId, items) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
 
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="56" height="56">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <h3>No items found</h3>
        <p>Nothing reported yet.</p>
      </div>`;
    return;
  }
  items.forEach(item => grid.appendChild(buildItemCard(item)));
}
 
function renderRecentItems(items) {
  const emptyState = document.querySelector('#page-dashboard .empty-state');
  if (!emptyState || items.length === 0) return;
 
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  grid.style.marginTop = '16px';
  items.forEach(item => grid.appendChild(buildItemCard(item)));
  emptyState.replaceWith(grid);
}
 
/* ============================================================
   LOAD CATEGORY & LOCATION DROPDOWNS FROM API
============================================================ */
async function loadFormDropdowns() {
  try {
    const apiBase = window.API_BASE || window.ASA_API_BASE || `${window.location.origin}/api`;
    const categoriesRes = await fetch(`${apiBase}/categories`);
    const locationsRes = await fetch(`${apiBase}/locations`);

    const categories = await categoriesRes.json();
    const locations = await locationsRes.json();

    console.log("Loaded categories:", categories);
    console.log("Loaded locations:", locations);

    const lostCat = document.getElementById("lostCat");
    const foundCat = document.getElementById("foundCat");

    const categoryOptions = categories.map(c => {
      return `<option value="${c.categoryID}">${c.categoryName}</option>`;
    }).join("");

    if (lostCat) {
      lostCat.innerHTML = `<option value="">Select Category</option>` + categoryOptions;
    }

    if (foundCat) {
      foundCat.innerHTML = `<option value="">Select Category</option>` + categoryOptions;
    }

    const lostFilter = document.getElementById("lostCatFilter");
    const foundFilter = document.getElementById("foundCatFilter");

    const filterOptions = categories.map(c => {
      return `<option value="${c.categoryName.toLowerCase()}">${c.categoryName}</option>`;
    }).join("");

    if (lostFilter) {
      lostFilter.innerHTML = `<option value="">All Categories</option>` + filterOptions;
    }

    if (foundFilter) {
      foundFilter.innerHTML = `<option value="">All Categories</option>` + filterOptions;
    }

    const foundPickup = document.getElementById('foundPickup');
    if (foundPickup) {
      pickupLocations = locations;
      pickupLocationByID = Object.fromEntries(locations.map(l => [String(l.locationID), l]));
      foundPickup.innerHTML = `<option value="">Where is the item kept now?</option>` +
        locations.map(l => {
          const photo = l.photoData ? String(l.photoData).replace(/"/g, '&quot;') : '';
          const building = l.building && l.building !== l.storageName ? " - " + l.building : "";
          return `<option value="${l.locationID}" data-name="${l.storageName}" data-photo="${photo}">${l.storageName}${building}</option>`;
        }).join('');
      foundPickup.addEventListener('change', updateFoundPickupPreview);
      updateFoundPickupPreview();
    }

  } catch (err) {
    console.error("Dropdown loading failed:", err);
    showToast("error", "Dropdown Error", "Could not load categories or locations.");
  }
}
 
/* ============================================================
   LOAD NOTIFICATIONS FROM API
============================================================ */
async function loadNotifications() {
  try {
    const notifs = await NotifAPI.getAll();
    document.querySelector('student-header')?.renderNotifications(notifs);
  } catch (err) {
    console.warn('Could not load notifications:', err.message);
  }
}
 
async function markAllNotifsRead() {
  try {
    await NotifAPI.markAllRead();
    await loadNotifications();
    if (document.getElementById('studentNotificationsModal')) openStudentNotificationsModal();
  } catch (err) {
    console.warn('Could not mark notifications read:', err.message);
  }
}

// Alias so the header component's markAllNotificationsRead call works
const markAllNotificationsRead = markAllNotifsRead;
 
/* ============================================================
   FORM HELPERS
============================================================ */
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearErr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function setFieldError(inputId, errId, msg) {
  document.getElementById(inputId)?.classList.add('error');
  showErr(errId, msg);
}
function clearFieldError(inputId, errId) {
  document.getElementById(inputId)?.classList.remove('error');
  clearErr(errId);
}
 
function syncPreviewTitle() {
  const val  = document.getElementById('lostTitle')?.value.trim();
  const prev = document.getElementById('lostPreviewTitle');
  if (prev) prev.textContent = val || 'Item Title';
}
 
function toggleOtherLoc(otherId, selectEl) {
  const otherInput = document.getElementById(otherId);
  if (!otherInput) return;
  if (selectEl.value === 'Others') {
    otherInput.style.display = 'block';
    otherInput.focus();
  } else {
    otherInput.style.display = 'none';
    otherInput.value = '';
    otherInput.classList.remove('error');
  }
}
 
function previewImage(input, areaId) {
  const area = document.getElementById(areaId);
  if (!input.files || !input.files[0] || !area) return;
  const reader = new FileReader();
  reader.onload = e => {
    area.innerHTML = `
      <div class="img-preview-wrap">
        <img src="${e.target.result}" alt="Preview">
        <button class="img-remove-btn" onclick="removePreview('${areaId}','${input.id}')" title="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  };
  reader.readAsDataURL(input.files[0]);
}
 
function removePreview(areaId, inputId) {
  const area = document.getElementById(areaId);
  if (area) {
    area.innerHTML = `
      <div class="img-upload-area" onclick="document.getElementById('${inputId}').click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/>
        </svg>
        <p><strong>Drop photos here</strong><br>or click to browse</p>
        <input type="file" id="${inputId}" accept="image/*" style="display:none" onchange="previewImage(this,'${areaId}')">
      </div>`;
  }
}
 
/* ============================================================
   SUBMIT: LOST REPORT  →  POST /api/items/post
============================================================ */
async function submitLostItem() {
  let valid = true;

  const title = document.getElementById('lostTitle').value.trim();
  const cat = document.getElementById('lostCat').value;
  const loc = document.getElementById('lostLoc').value;
  const desc = document.getElementById('lostDesc').value.trim();

  const locOther = document.getElementById('lostLocOther')?.value.trim();
  const locationDetail = loc === 'Others' ? locOther : loc;

  clearFieldError('lostTitle', 'lostTitleErr');
  clearFieldError('lostCat', 'lostCatErr');
  clearFieldError('lostLoc', 'lostLocErr');
  clearFieldError('lostDesc', 'lostDescErr');

  if (!title) { setFieldError('lostTitle', 'lostTitleErr', 'Item title is required.'); valid = false; }
  if (!cat) { setFieldError('lostCat', 'lostCatErr', 'Please select a category.'); valid = false; }
  if (!loc) { setFieldError('lostLoc', 'lostLocErr', 'Please select a location.'); valid = false; }
  else if (loc === 'Others' && !locOther) { showErr('lostLocErr', 'Please specify the location.'); valid = false; }
  if (!desc) { setFieldError('lostDesc', 'lostDescErr', 'Please describe the item.'); valid = false; }

  if (!valid) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
    return;
  }

  try {
    await ItemsAPI.report({
      title,
      description: desc,
      dateOccured: new Date().toISOString().split('T')[0],
      itemType: 'lost',
      categoryID: cat,
      locationDetail
    });

    showToast('success', 'Lost Item Submitted', `"${title}" has been posted successfully and is now visible.`);

    // Reset form
    document.getElementById('lostTitle').value = '';
    document.getElementById('lostDesc').value = '';
    document.getElementById('lostCat').value = '';
    document.getElementById('lostLoc').value = '';

    if (locOther) document.getElementById('lostLocOther').value = '';

    document.getElementById('successTitle').textContent = 'Lost Item Submitted!';
    document.getElementById('successMsg').textContent = `"${title}" has been posted successfully and is now visible.`;
    document.getElementById('successPopup').classList.add('active');

    if (typeof loadNotifications === 'function') loadNotifications();

  } catch (err) {
    showToast('error', 'Submission Failed', err.message || 'Could not submit lost item.');
  }
}
 
/* ============================================================
   SUBMIT: FOUND REPORT  →  POST /api/items/post
============================================================ */
async function submitFoundItem() {
  let valid = true;

  const title = document.getElementById('foundTitle').value.trim();
  const cat = document.getElementById('foundCat').value;
  const loc = document.getElementById('foundLoc').value;
  const pickup = document.getElementById('foundPickup').value;
  const selectedPickup = getSelectedPickup();
  const desc = document.getElementById('foundDesc').value.trim();

  const locOther = document.getElementById('foundLocOther')?.value.trim();
  const locationDetail = loc === 'Others' ? locOther : loc;

  clearFieldError('foundTitle', 'foundTitleErr');
  clearFieldError('foundCat', 'foundCatErr');
  clearFieldError('foundLoc', 'foundLocErr');
  clearFieldError('foundPickup', 'foundPickupErr');
  clearFieldError('foundDesc', 'foundDescErr');

  if (!title) { setFieldError('foundTitle', 'foundTitleErr', 'Item title is required.'); valid = false; }
  if (!cat) { setFieldError('foundCat', 'foundCatErr', 'Please select a category.'); valid = false; }
  if (!loc) { setFieldError('foundLoc', 'foundLocErr', 'Please select where you found it.'); valid = false; }
  else if (loc === 'Others' && !locOther) { showErr('foundLocErr', 'Please specify the location.'); valid = false; }
  if (!pickup || !selectedPickup) { setFieldError('foundPickup', 'foundPickupErr', 'Please select a pick-up location.'); valid = false; }
  if (!desc) { setFieldError('foundDesc', 'foundDescErr', 'Please describe the item.'); valid = false; }

  if (!valid) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
    return;
  }

  try {
    await ItemsAPI.report({
      title,
      description: desc,
      dateOccured: new Date().toISOString().split('T')[0],
      itemType: 'found',
      categoryID: cat,
      locationID: selectedPickup.id,
      locationDetail: selectedPickup.name
    });

    showToast('success', 'Found Item Submitted', `"${title}" has been posted successfully and is now visible.`);

    // Reset form
    document.getElementById('foundTitle').value = '';
    document.getElementById('foundDesc').value = '';
    document.getElementById('foundCat').value = '';
    document.getElementById('foundLoc').value = '';
    document.getElementById('foundPickup').value = '';
    updateFoundPickupPreview();

    const locOtherEl = document.getElementById('foundLocOther');
    if (locOtherEl) {
      locOtherEl.value = '';
      locOtherEl.style.display = 'none';
    }

    document.getElementById('successTitle').textContent = 'Found Item Submitted!';
    document.getElementById('successMsg').textContent = `"${title}" has been posted successfully and is now visible.`;
    document.getElementById('successPopup').classList.add('active');

    if (typeof loadNotifications === 'function') loadNotifications();

  } catch (err) {
    showToast('error', 'Submission Failed', err.message || 'Could not submit found item.');
  }
}
 
/* ============================================================
   SUCCESS POPUP
============================================================ */
function closeSuccessPopup() {
  document.getElementById('successPopup').classList.remove('active');
  showPage('dashboard');
}
 
/* ============================================================
   ITEM DETAIL MODAL
============================================================ */
function openItemModal(card) {
  const type  = card.dataset.type;
  const title = card.dataset.title;
  const cat   = card.dataset.cat;
  const desc  = card.dataset.desc;
  const loc   = card.dataset.loc;
  const date  = card.dataset.date;
  const photo = card.dataset.photo || '';
 
  currentItemID = card.dataset.itemId || null;
 
  const imgSec = document.getElementById('modalImgSec');
  const isLost = type === 'lost';
  const gradient = isLost
    ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)'
    : 'linear-gradient(135deg,#dcfce7,#bbf7d0)';
  const emoji = isLost ? '👛' : getCategoryEmoji(cat);
 
  imgSec.style.background   = gradient;
  imgSec.style.minHeight    = '240px';
  imgSec.style.borderRadius = '12px';
  imgSec.style.fontSize     = '80px';
  imgSec.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:240px">${emoji}</span>`;
 
  document.getElementById('modalTypeBadge').textContent = type.toUpperCase();
  document.getElementById('modalTypeBadge').className   = `badge badge-${type}`;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent  = desc || '—';

  let buildingPhoto = document.getElementById('modalBuildingPhoto');
  if (!buildingPhoto) {
    document.querySelector('#itemModal .modal-meta')?.insertAdjacentHTML('afterend', '<div class="modal-building-photo" id="modalBuildingPhoto" style="display:none"><img id="modalBuildingImg" src="" alt="Pickup location photo"></div>');
    buildingPhoto = document.getElementById('modalBuildingPhoto');
  }
  const buildingImg = document.getElementById('modalBuildingImg');
  if (String(type).toLowerCase() === 'found' && photo && buildingPhoto && buildingImg) {
    buildingImg.src = photo;
    buildingImg.alt = loc ? `${loc} photo` : 'Pickup location photo';
    buildingPhoto.style.display = 'block';
  } else if (buildingPhoto) {
    buildingPhoto.style.display = 'none';
  }
  document.getElementById('modalCat').innerHTML  = `<span class="category-tag">${cat}</span>`;
  document.getElementById('modalLoc').textContent  = `📍 ${loc}`;
  document.getElementById('modalDate').textContent = `🗓 ${date}`;
 
  // Show claim button only for found items
  const claimBtn  = document.getElementById('claimBtn');
  const reportBtn = document.getElementById('reportItemBtn');
  if (type === 'found') {
    if (claimBtn)  claimBtn.style.display  = 'block';
    if (reportBtn) reportBtn.style.display = 'block';
  } else {
    if (claimBtn)  claimBtn.style.display  = 'none';
    if (reportBtn) reportBtn.style.display = 'none';
  }
 
  document.getElementById('itemModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
 
function closeItemModal() {
  document.getElementById('itemModal').classList.remove('active');
  document.body.style.overflow = '';
  currentItemID = null;
}
 
/* ============================================================
   CLAIM FORM  →  POST /api/claims
============================================================ */
function openClaimForm() {
  closeItemModal();
  document.getElementById('claimFormPopup').classList.add('active');
}
 
function closeClaimForm() {
  document.getElementById('claimFormPopup').classList.remove('active');
  document.getElementById('claimEvidence').value = '';
  clearErr('claimEvidenceErr');
}
 
async function submitClaim() {
  const evidence = document.getElementById('claimEvidence').value.trim();
  clearErr('claimEvidenceErr');
 
  if (!evidence) {
    showErr('claimEvidenceErr', 'Please provide your proof of ownership.');
    document.getElementById('claimEvidence').classList.add('error');
    showToast('error', 'Missing Evidence', 'Please describe your proof before submitting.');
    return;
  }
 
  if (!currentItemID) {
    showToast('error', 'Error', 'No item selected. Please try again.');
    closeClaimForm();
    return;
  }
 
  const btn = document.querySelector('#claimFormPopup .btn-submit-evidence');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
 
  try {
    await ClaimsAPI.submit(currentItemID, evidence);
 
    closeClaimForm();
    showToast('success', 'Claim Submitted!', 'Your claim is under review by the admin.');
    await loadNotifications();
 
  } catch (err) {
    showToast('error', 'Claim Failed', err.message || 'Could not submit claim.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Evidence'; }
  }
}
 
/* ============================================================
   REPORT ITEM POPUP (dispute)
============================================================ */
function openReportItemForm() {
  document.getElementById('reportItemPopup').classList.add('active');
}
 
function closeReportItemForm() {
  document.getElementById('reportItemPopup').classList.remove('active');
  document.getElementById('reportReason').value = '';
  clearErr('reportReasonErr');
}
 
async function submitItemReport() {
  const reason = document.getElementById('reportReason').value.trim();
  clearErr('reportReasonErr');
 
  if (!reason) {
    showErr('reportReasonErr', 'Please provide a reason for your report.');
    document.getElementById('reportReason').classList.add('error');
    showToast('error', 'Missing Reason', 'Please explain why you believe this item is yours.');
    return;
  }
 
  if (!currentItemID) {
    showToast('error', 'No Item Selected', 'Please open an item again before submitting a report.');
    return;
  }

  try {
    await AppealsAPI.submit(currentItemID, reason);
    closeReportItemForm();
    showToast('success', 'Report Submitted!', 'Your dispute has been sent for admin review.');
    await loadNotifications();
  } catch (err) {
    showToast('error', 'Report Failed', err.message || 'Could not submit report.');
  }
}
 
/* ============================================================
   FILTER
============================================================ */
function filterItems(type) {
  const query  = document.getElementById(`${type}Search`).value.toLowerCase();
  const catVal = document.getElementById(`${type}CatFilter`).value.toLowerCase();
  const cards  = document.querySelectorAll(`#${type}ItemsGrid .item-card`);
 
  cards.forEach(card => {
    const matchQuery = !query  ||
      (card.dataset.title || '').toLowerCase().includes(query) ||
      (card.dataset.desc  || '').toLowerCase().includes(query);
    const matchCat = !catVal || (card.dataset.cat || '').toLowerCase() === catVal;
    card.style.display = (matchQuery && matchCat) ? '' : 'none';
  });
}
 
/* ============================================================
   SETTINGS
============================================================ */
function switchSettingsTab(tab, btn) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.s-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`set-${tab}`)?.classList.add('active');
  if (btn) btn.classList.add('active');
}
 

function splitFullName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}

function populateAccountForm(user) {
  const fullName = String(user?.userName || '').trim();
  const { firstName, lastName } = splitFullName(fullName);
  const username = fullName ? fullName.toLowerCase().replace(/\s+/g, '') : '';

  const firstInput = document.getElementById('accFirstName');
  const lastInput = document.getElementById('accLastName');
  const usernameInput = document.getElementById('accUsername');
  const emailInput = document.getElementById('accEmail');

  if (firstInput) firstInput.value = firstName;
  if (lastInput) lastInput.value = lastName;
  if (usernameInput) usernameInput.value = username;
  if (emailInput && user?.email) emailInput.value = user.email;
}

async function syncCurrentUserProfile() {
  const storedName = typeof Auth !== 'undefined' ? Auth.getUser() : (localStorage.getItem('userName') || 'Student');
  const storedRole = typeof Auth !== 'undefined' ? Auth.getRole() : (localStorage.getItem('role') || 'Student');
  let user = { userName: storedName, role: storedRole, email: localStorage.getItem('asa_email') || '' };

  try {
    if (typeof UserAPI !== 'undefined' && UserAPI.getMe) {
      const dbUser = await UserAPI.getMe();
      if (dbUser?.userName) user = dbUser;
    }
  } catch (err) {
    console.warn('Could not load account profile:', err.message);
  }

  const displayName = user.userName || storedName || 'Student';
  const firstName = splitFullName(displayName).firstName || displayName;
  localStorage.setItem('userName', displayName);
  localStorage.setItem('asa_user', displayName);
  if (user.role) {
    localStorage.setItem('role', user.role);
    localStorage.setItem('asa_role', user.role);
  }
  if (user.email) localStorage.setItem('asa_email', user.email);

  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName) welcomeName.textContent = firstName;
  document.querySelector('student-header')?.setUsername?.(displayName, user.role || storedRole);
  populateAccountForm(user);
  return user;
}

async function submitAccountInfo(e) {
  e.preventDefault();
  const first = document.getElementById('accFirstName').value.trim();
  const last  = document.getElementById('accLastName').value.trim();
  const email = document.getElementById('accEmail').value.trim();
 
  if (!first || !last || !email) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
    return;
  }
  try {
    const userName = `${first} ${last}`;
    await UserAPI.updateProfile(userName);
    localStorage.setItem('userName', userName);
    localStorage.setItem('asa_user', userName);
    document.querySelector('student-header')?.setUsername(userName);
    populateAccountForm({ userName, email });
    showToast('success', 'Account Updated!', 'Your account information has been saved.');
  } catch (err) {
    showToast('error', 'Update Failed', err.message || 'Could not update account.');
  }
}
 
async function submitPasswordChange(e) {
  e.preventDefault();
  const current = document.getElementById('currentPass').value;
  const newP    = document.getElementById('newPass').value;
  const confirm = document.getElementById('confirmPass').value;
  let valid = true;
 
  clearFieldError('currentPass', 'currentPassErr');
  clearFieldError('newPass',     'newPassErr');
  clearFieldError('confirmPass', 'confirmPassErr');
 
  if (!current) { setFieldError('currentPass','currentPassErr','Current password is required.'); valid = false; }
  if (newP.length < 8) { setFieldError('newPass','newPassErr','Password must be at least 8 characters.'); valid = false; }
  if (newP !== confirm) { setFieldError('confirmPass','confirmPassErr','Passwords do not match.'); valid = false; }
 
  if (!valid) { showToast('error', 'Fix Errors', 'Please correct the errors before submitting.'); return; }
 
  try {
    await UserAPI.changePassword(current, newP);
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value     = '';
    document.getElementById('confirmPass').value = '';
    showToast('success', 'Password Updated!', 'Your password has been changed successfully.');
  } catch (err) {
    showToast('error', 'Password Failed', err.message || 'Could not update password.');
  }
}
 
function handleAvatarChange(input) {
  if (!input.files || !input.files[0]) return;
  document.getElementById('avatarFileName').textContent = input.files[0].name;
  showToast('info', 'Photo Selected', 'Click Update to save your new photo.');
}
 
/* ============================================================
   MODAL OVERLAY CLICKS
============================================================ */
document.getElementById('itemModal').addEventListener('click', function(e) {
  if (e.target === this) closeItemModal();
});
document.getElementById('claimFormPopup').addEventListener('click', function(e) {
  if (e.target === this) closeClaimForm();
});
document.getElementById('successPopup').addEventListener('click', function(e) {
  if (e.target === this) closeSuccessPopup();
});
document.getElementById('reportItemPopup').addEventListener('click', function(e) {
  if (e.target === this) closeReportItemForm();
});
 
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('claimFormPopup').classList.contains('active')) closeClaimForm();
  else if (document.getElementById('itemModal').classList.contains('active')) closeItemModal();
  else if (document.getElementById('reportItemPopup').classList.contains('active')) closeReportItemForm();
});
 
/* ============================================================
   INIT — runs on page load
============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard — redirect to login if not logged in
  if (!requireAuth('/login/landing.html')) return;
 
  // 2. Sync the header and settings form with the current account.
  await syncCurrentUserProfile();
 
  // 3. Load data
  await Promise.all([
    loadItems(),
    loadFormDropdowns(),
    loadNotifications()
  ]);
});

setTimeout(loadFormDropdowns, 500);
 
