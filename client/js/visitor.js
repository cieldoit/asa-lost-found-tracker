/* ============================================================
   VISITOR HEADER WEB COMPONENT
============================================================ */
class VisitorHeader extends HTMLElement {
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
            <button class="nav-item" id="snav-my-posts" onclick="showPage('my-posts')">
              <i class="fa-solid fa-pen-to-square"></i>
              My Posts
            </button>
          </nav>
          <div class="header-right">
            <div class="notif-container">
              <button class="notif-btn" id="headerNotifBtn" title="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div class="notif-badge-dot" id="headerNotifDot">1</div>
              </button>
              <div class="notif-dropdown" id="headerNotifDropdown">
                <div class="notif-panel-header">
                  <h3>Notifications</h3>
                  <span class="mark-read" id="headerMarkRead">Mark all as read</span>
                </div>
                <div class="notif-list" id="headerNotifList">
                  <div class="notif-item unread">
                    <div class="notif-icon-box welcome-bg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div class="notif-text">
                      <p>Welcome to <strong>ASA Lost &amp; Found!</strong> Start by posting a lost or found item.</p>
                      <span class="notif-time">Just now</span>
                    </div>
                    <div class="status-dot"></div>
                  </div>
                </div>
                <div class="notif-panel-footer"><a href="#" id="headerSeeAllNotifications">See all notifications</a></div>
              </div>
            </div>
            <div class="profile-wrap">
              <button class="profile-btn" id="headerProfileBtn">
                <div class="profile-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span class="profile-name" id="headerProfileName">Visitor</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="dropdown-content" id="headerProfileDropdown">
                <div class="user-info">
                  <div class="pd-name" id="headerDropName">Visitor</div>
                  <div class="pd-role">Visitor</div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="showPage('my-posts');closeAllDropdowns();">
                  <i class="fa-solid fa-pen-to-square" style="width:16px;color:var(--text-muted)"></i> My Post
                </button>
                <button class="dropdown-item" onclick="showPage('settings');closeAllDropdowns();">
                  <i class="fa-solid fa-gear" style="width:16px;color:var(--text-muted)"></i> Settings
                </button>
                <a href="/login/landing.html" class="dropdown-item logout-item" onclick="window.Auth?.logout?.(); return false;">
                  <i class="fa-solid fa-right-from-bracket" style="width:16px"></i> Log Out
                </a>
              </div>
            </div>
            <button class="mobile-nav-toggle" id="mobileToggle" onclick="toggleMobileNav()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </header>
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
          <button class="mnav-item" id="smnav-my-posts" onclick="showPage('my-posts');closeMobileNav()">
            <i class="fa-solid fa-pen-to-square" style="width:16px"></i>
            My Posts
          </button>
          <button class="mnav-item" onclick="showPage('settings');closeMobileNav()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>
            Settings
          </button>
        </div>
      </div>
    `;
  }

  initListeners() {
    const profileBtn       = this.querySelector('#headerProfileBtn');
    const profileDropdown  = this.querySelector('#headerProfileDropdown');
    const notifBtn         = this.querySelector('#headerNotifBtn');
    const notifDropdown    = this.querySelector('#headerNotifDropdown');
    const markReadBtn      = this.querySelector('#headerMarkRead');
    const seeAllBtn        = this.querySelector('#headerSeeAllNotifications');

    profileBtn.addEventListener('click', e => {
      e.stopPropagation();
      dedupeMyPostDropdown(profileDropdown);
      profileDropdown.classList.toggle('show');
      notifDropdown.classList.remove('show');
    });

    notifBtn.addEventListener('click', e => {
      e.stopPropagation();
      notifDropdown.classList.toggle('show');
      profileDropdown.classList.remove('show');
      if (typeof loadNotifications === 'function') loadNotifications();
    });

    markReadBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (typeof markAllNotificationsRead === 'function') {
        await markAllNotificationsRead();
      }
    });

    seeAllBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openVisitorNotificationsModal();
      notifDropdown.classList.remove('show');
    });

    this.querySelector('#headerNotifList')?.addEventListener('click', async e => {
      const item = e.target.closest('.notif-item[data-notif-id]');
      if (!item) return;
      e.stopPropagation();
      await visitorMarkNotificationRead(item.dataset.notifId);
    });

    window.addEventListener('click', event => {
      if (!this.contains(event.target)) {
        profileDropdown.classList.remove('show');
        notifDropdown.classList.remove('show');
      }
    });
  }

  setActivePage(page) {
    const navPages = ['dashboard','lost','found','post','my-posts'];
    navPages.forEach(p => {
      const d = this.querySelector(`#snav-${p}`);
      const m = this.querySelector(`#smnav-${p}`);
      if (d) d.classList.remove('active');
      if (m) m.classList.remove('active');
    });
    const target  = this.querySelector(`#snav-${page}`);
    const mtarget = this.querySelector(`#smnav-${page}`);
    if (target)  target.classList.add('active');
    if (mtarget) mtarget.classList.add('active');
  }

  setUsername(name) {
    const n1 = this.querySelector('#headerProfileName');
    const n2 = this.querySelector('#headerDropName');
    if (n1) n1.textContent = name;
    if (n2) n2.textContent = name;
  }

  renderNotifications(notifs = []) {
    window.visitorNotifications = Array.isArray(notifs) ? notifs : [];

    const list = this.querySelector('#headerNotifList');
    const dot = this.querySelector('#headerNotifDot');
    if (!list) return;

    if (!window.visitorNotifications.length) {
      list.innerHTML = `<div class="notif-empty" style="padding:20px;text-align:center;color:#9ca3af;font-size:13px">No notifications yet.</div>`;
      dot?.classList.add('hidden');
      return;
    }

    const unread = window.visitorNotifications.filter(n => Number(n.isRead) === 0 || n.isRead === false);
    if (dot) {
      dot.textContent = unread.length || '';
      dot.classList.toggle('hidden', unread.length === 0);
    }

    list.innerHTML = window.visitorNotifications.slice(0, 5).map(n => `
      <div class="notif-item ${Number(n.isRead) === 0 || n.isRead === false ? 'unread' : ''}" data-notif-id="${n.notifID}">
        <div class="notif-icon-box welcome-bg"><i class="fa-solid fa-bell"></i></div>
        <div class="notif-text">
          <p>${escapeVisitorHtml(n.message)}</p>
          <span class="notif-time">${formatVisitorNotifDate(n.createdAt)}</span>
        </div>
        ${Number(n.isRead) === 0 || n.isRead === false ? '<div class="status-dot"></div>' : ''}
      </div>
    `).join('');
  }

  addNotification(icon, iconClass, title, message) {
    const list = this.querySelector('#headerNotifList');
    const dot  = this.querySelector('#headerNotifDot');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'notif-item unread';
    item.innerHTML = `
      <div class="notif-icon-box ${iconClass}">${icon}</div>
      <div class="notif-text">
        <p><strong>${title}</strong> ${message}</p>
        <span class="notif-time">Just now</span>
      </div>
      <div class="status-dot"></div>
    `;
    list.prepend(item);
    if (dot) { dot.classList.remove('hidden'); dot.textContent = list.querySelectorAll('.unread').length; }
  }
}

customElements.define('visitor-header', VisitorHeader);

window.visitorNotifications = [];

function escapeVisitorHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatVisitorNotifDate(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
}

async function visitorMarkNotificationRead(notifID) {
  if (!notifID) return;
  try {
    await NotifAPI.markRead(notifID);
    await loadNotifications();
  } catch (err) {
    console.warn('Could not mark notification read:', err.message);
  }
}

function openVisitorNotificationsModal() {
  document.getElementById('visitorNotificationsModal')?.remove();

  const notifs = window.visitorNotifications || [];
  const modal = document.createElement('div');
  modal.id = 'visitorNotificationsModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;';
  modal.innerHTML = `
    <div style="width:min(560px,100%);max-height:82vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0;font-size:18px;font-weight:800;color:#111827;">All Notifications</h2>
        <button type="button" onclick="closeVisitorNotificationsModal()" style="border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#6b7280;">&times;</button>
      </div>
      <div style="max-height:66vh;overflow:auto;">
        ${notifs.length ? notifs.map(n => `
          <button type="button" onclick="visitorMarkNotificationRead('${n.notifID}')" style="width:100%;display:flex;gap:12px;text-align:left;padding:15px 18px;border:0;border-bottom:1px solid #e5e7eb;background:${Number(n.isRead) === 0 || n.isRead === false ? '#f0fdf4' : '#fff'};cursor:pointer;">
            <span style="width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;background:#166534;color:#fff;"><i class="fa-solid fa-bell"></i></span>
            <span style="display:block;flex:1;">
              <span style="display:block;font-size:13.5px;line-height:1.5;color:#111827;font-weight:${Number(n.isRead) === 0 || n.isRead === false ? '800' : '500'};">${escapeVisitorHtml(n.message)}</span>
              <span style="display:block;margin-top:5px;font-size:12px;color:#6b7280;">${formatVisitorNotifDate(n.createdAt)}</span>
            </span>
          </button>
        `).join('') : '<div style="padding:28px;text-align:center;color:#9ca3af;font-size:14px;">No notifications yet.</div>'}
      </div>
    </div>
  `;

  modal.addEventListener('click', e => {
    if (e.target === modal) closeVisitorNotificationsModal();
  });
  document.body.appendChild(modal);
}

function closeVisitorNotificationsModal() {
  document.getElementById('visitorNotificationsModal')?.remove();
}

window.closeVisitorNotificationsModal = closeVisitorNotificationsModal;
window.visitorMarkNotificationRead = visitorMarkNotificationRead;

/* ============================================================
   HELPER: close all dropdowns
============================================================ */
function closeAllDropdowns() {
  const hdr = document.querySelector('visitor-header');
  if (!hdr) return;
  hdr.querySelector('#headerProfileDropdown')?.classList.remove('show');
  hdr.querySelector('#headerNotifDropdown')?.classList.remove('show');
}

/* ============================================================
   MOBILE NAV
============================================================ */
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
let currentItemID = null;
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

function syncVisitorPageUrl(page) {
  const hashPages = new Set(['lost', 'found', 'post', 'my-posts', 'settings']);
  const target = hashPages.has(page) ? `${window.location.pathname}#${page}` : window.location.pathname;
  if (window.location.pathname + window.location.hash !== target) {
    window.history.replaceState({}, '', target);
  }
}

function getInitialVisitorPage() {
  const page = window.location.hash.replace('#', '');
  return ['lost', 'found', 'post', 'my-posts', 'settings'].includes(page) ? page : 'dashboard';
}



function dedupeMyPostDropdown(dropdown) {
  if (!dropdown) return;
  const entries = Array.from(dropdown.querySelectorAll('.dropdown-item')).filter(item => item.textContent.trim().toLowerCase() === 'my post');
  entries.slice(1).forEach(item => item.remove());
}
function normalizeRoleNavState(page) {
  const navPage = page === 'mypost' ? 'my-posts' : (['report-lost', 'report-found'].includes(page) ? 'post' : page);
  document.querySelectorAll('.main-nav .nav-item, .mobile-nav .mnav-item').forEach(item => item.classList.remove('active'));
  document.getElementById(`snav-${navPage}`)?.classList.add('active');
  document.getElementById(`smnav-${navPage}`)?.classList.add('active');
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    const myPostButtons = Array.from(dropdown.querySelectorAll('.dropdown-item')).filter(item => item.textContent.trim().toLowerCase() === 'my post');
    myPostButtons.slice(1).forEach(item => item.remove());
  });
}
function showPage(page) {
  if (page === 'mypost') page = 'my-posts';
  if (page === 'my-posts') ensureMyPostsPage();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); currentPage = page; }
  document.querySelector('student-header, staff-header, visitor-header')?.setActivePage(page);
  normalizeRoleNavState(page);
  if (typeof syncStudentPageUrl === 'function') syncStudentPageUrl(page);
  if (typeof syncStaffPageUrl === 'function') syncStaffPageUrl(page);
  if (typeof syncVisitorPageUrl === 'function') syncVisitorPageUrl(page);
  closeAllDropdowns();
  closeMobileNav();
  if (page === 'my-posts') loadMyPosts();
  requestAnimationFrame(() => normalizeRoleNavState(page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   TOAST SYSTEM
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
    <button class="toast-close" onclick="dismissToast(this.parentElement)"><i class="fa-solid fa-xmark"></i></button>
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
   FORM VALIDATION HELPERS
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
  const input = document.getElementById(inputId);
  if (input) input.classList.add('error');
  showErr(errId, msg);
}
function clearFieldError(inputId, errId) {
  const input = document.getElementById(inputId);
  if (input) input.classList.remove('error');
  clearErr(errId);
}

// Clear error on input
['lostTitle','lostCat','lostLoc','lostDesc',
 'foundTitle','foundCat','foundLoc','foundPickup','foundDesc',
 'currentPass','newPass','confirmPass'].forEach(id => {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => el.classList.remove('error'));
  });
});

/* ============================================================
   IMAGE PREVIEW (generic, only used for lost items now)
============================================================ */
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
  const area  = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  if (area) {
    // Dynamic onclick triggers the correct file input
    const uploadClick = `document.getElementById('${inputId}').click()`;
    area.innerHTML = `
      <div class="img-upload-area" onclick="${uploadClick}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l4-4 4 4 4-4 4 4"/><path d="M3 15l4 4 4-4 4 4 4-4"/></svg>
        <p><strong>Drop photos here</strong><br>or click to browse</p>
        <input type="file" id="${inputId}" accept="image/*" style="display:none" onchange="previewImage(this,'${areaId}')">
      </div>`;
  }
  if (input) input.value = '';
}
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


function syncPreviewTitle() {
  const val = document.getElementById('lostTitle')?.value.trim();
  const prev = document.getElementById('lostPreviewTitle');
  if (prev) prev.textContent = val || 'Item Title';
}

/* ============================================================
   SUBMIT: LOST REPORT
============================================================ */
async function submitLostItem() {
  let valid = true;

  const title = document.getElementById('lostTitle').value.trim();
  const cat   = document.getElementById('lostCat').value;
  const loc   = document.getElementById('lostLoc').value.trim();
  const desc  = document.getElementById('lostDesc').value.trim();

  clearFieldError('lostTitle','lostTitleErr');
  clearFieldError('lostCat','lostCatErr');
  clearFieldError('lostLoc','lostLocErr');
  clearFieldError('lostDesc','lostDescErr');

  if (!title) { setFieldError('lostTitle','lostTitleErr','Item title is required.'); valid = false; }
  if (!cat)   { setFieldError('lostCat','lostCatErr','Please select a category.'); valid = false; }
  const lostLocOtherEl = document.getElementById('lostLocOther');
  const lostLocFinal = loc === 'Others' ? lostLocOtherEl?.value.trim() : loc;
  if (!loc) { setFieldError('lostLoc','lostLocErr','Please select the last seen location.'); valid = false; }
  else if (loc === 'Others' && !lostLocFinal) { showErr('lostLocErr','Please specify the location.'); lostLocOtherEl?.classList.add('error'); valid = false; }
  if (!desc)  { setFieldError('lostDesc','lostDescErr','Please describe the item.'); valid = false; }

  if (!valid) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields before submitting.');
    return;
  }

  const submitBtn = document.querySelector('#page-report-lost .btn-submit, #page-report-lost button[onclick*="submitLostItem"]');
  const originalSubmitText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    await ItemsAPI.report({
      title,
      description: desc,
      dateOccured: new Date().toISOString().split('T')[0],
      itemType: 'lost',
      categoryID: cat,
      itemPhotoData: await getLostItemPhotoData(),
      locationDetail: lostLocFinal
    });

    ['lostTitle','lostDesc'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('lostLoc').value = '';
    const lostLocOtherEl2 = document.getElementById('lostLocOther');
    if (lostLocOtherEl2) { lostLocOtherEl2.value = ''; lostLocOtherEl2.style.display = 'none'; }
    document.getElementById('lostCat').value = '';
    removePreview('lostImgArea','lostImgInput');
    syncPreviewTitle();

    document.getElementById('successTitle').textContent = 'Lost Item Reported!';
    document.getElementById('successMsg').textContent = `"${title}" has been submitted successfully. It is now pending admin review.`;
    document.getElementById('successPopup').classList.add('active');

    if (typeof loadItems === 'function') loadItems();
    if (typeof loadNotifications === 'function') loadNotifications();

  } catch (err) {
    showToast('error', 'Submission Failed', err.message || 'Could not submit lost item. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalSubmitText || 'Submit Report';
    }
  }
}

/* ============================================================
   SUBMIT: FOUND REPORT  (photo upload removed)
============================================================ */
async function submitFoundItem() {
  let valid = true;

  const title  = document.getElementById('foundTitle').value.trim();
  const cat    = document.getElementById('foundCat').value;
  const loc    = document.getElementById('foundLoc').value.trim();
  const pickup = document.getElementById('foundPickup').value;
  const selectedPickup = getSelectedPickup();
  const desc   = document.getElementById('foundDesc').value.trim();

  clearFieldError('foundTitle','foundTitleErr');
  clearFieldError('foundCat','foundCatErr');
  clearFieldError('foundLoc','foundLocErr');
  clearFieldError('foundPickup','foundPickupErr');
  clearFieldError('foundDesc','foundDescErr');

  if (!title)  { setFieldError('foundTitle','foundTitleErr','Item title is required.'); valid = false; }
  if (!cat)    { setFieldError('foundCat','foundCatErr','Please select a category.'); valid = false; }
  const foundLocOtherEl = document.getElementById('foundLocOther');
  const foundLocFinal = loc === 'Others' ? foundLocOtherEl?.value.trim() : loc;
  if (!loc) { setFieldError('foundLoc','foundLocErr','Please select where you found it.'); valid = false; }
  else if (loc === 'Others' && !foundLocFinal) { showErr('foundLocErr','Please specify the location.'); foundLocOtherEl?.classList.add('error'); valid = false; }
  if (!pickup || !selectedPickup) { setFieldError('foundPickup','foundPickupErr','Please select a pick-up location.'); valid = false; }
  if (!desc)   { setFieldError('foundDesc','foundDescErr','Please describe the item.'); valid = false; }

  if (!valid) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields before submitting.');
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

    ['foundTitle','foundDesc'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('foundLoc').value = '';
    const foundLocOtherEl2 = document.getElementById('foundLocOther');
    if (foundLocOtherEl2) { foundLocOtherEl2.value = ''; foundLocOtherEl2.style.display = 'none'; }
    document.getElementById('foundCat').value = '';
    document.getElementById('foundPickup').value = '';
    updateFoundPickupPreview();

    document.getElementById('successTitle').textContent = 'Found Item Submitted!';
    document.getElementById('successMsg').textContent = `"${title}" has been listed. Thank you for being a good samaritan! `;
    document.getElementById('successPopup').classList.add('active');

    if (typeof loadItems === 'function') loadItems();
    if (typeof loadNotifications === 'function') loadNotifications();

  } catch (err) {
    showToast('error', 'Submission Failed', err.message || 'Could not submit found item. Please try again.');
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
   MY POSTS
============================================================ */
let myPosts = [];

function ensureMyPostsPage(forceFresh = false) {
  let page = document.getElementById('page-my-posts');
  const isNestedInHiddenPage = page?.parentElement?.closest?.('.page');

  if (forceFresh || !page || isNestedInHiddenPage || page.parentElement !== document.body) {
    document.querySelectorAll('#page-my-posts, #page-mypost').forEach(existing => existing.remove());
    page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-my-posts';
    const firstPopup = document.querySelector('.popup-overlay, footer.bottom-bar');
    if (firstPopup?.parentElement) firstPopup.parentElement.insertBefore(page, firstPopup);
    else document.body.appendChild(page);
  }

  page.className = page.classList.contains('active') ? 'page active' : 'page';
  page.innerHTML = [
    '<div class="home-container">',
    '<div class="dir-header"><h1>My Posts</h1><p>Manage all the items you have reported as lost or found.</p></div>',
    '<div class="dir-controls">',
    '<div class="search-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input type="text" placeholder="Search my posts..." id="myPostsSearch" oninput="filterMyPosts()"></div>',
    '<select class="filter-select" id="myPostsTypeFilter" onchange="filterMyPosts()"><option value="">All Posts</option><option value="lost">Lost Posts</option><option value="found">Found Posts</option></select>',
    '<button class="btn-report-lost" type="button" onclick="showPage(\'post\')"><i class="fa-solid fa-circle-plus"></i> New Post</button>',
    '</div>',
    '<div class="items-grid" id="myPostsGrid"><div class="empty-state" style="grid-column:1/-1"><h3>Loading your posts...</h3><p>Checking the database for your reports.</p></div></div>',
    '</div>'
  ].join('');
  return page;
}


function withMyPostsTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('My Posts took too long to load.')), 4000))
  ]);
}

function getMyPostsUserKey() {
  return String(localStorage.getItem('userName') || localStorage.getItem('asa_user') || '').trim().toLowerCase();
}

function getMyPostsUserID() {
  const token = localStorage.getItem('token') || localStorage.getItem('asa_token') || '';
  const parts = token.split('.');
  if (parts.length < 2) return '';
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return String(payload.userID || payload.id || '').trim();
  } catch (err) {
    return '';
  }
}

function filterOwnPostsFromList(items) {
  const userID = getMyPostsUserID();
  const userKey = getMyPostsUserKey();
  const list = Array.isArray(items) ? items : [];
  return list.filter(item => {
    const itemUserID = String(item.userID || item.reporterID || '').trim();
    if (userID && itemUserID && itemUserID === userID) return true;
    const reporter = String(item.reporterName || item.userName || '').trim().toLowerCase();
    return !!userKey && reporter === userKey;
  });
}

async function loadMyPostsFallback() {
  try {
    const cached = filterOwnPostsFromList(allItems);
    if (cached.length) return cached;
    const items = await withMyPostsTimeout(ItemsAPI.browse());
    return filterOwnPostsFromList(items);
  } catch (err) {
    console.warn('My Posts fallback failed:', err.message);
    return [];
  }
}

async function loadMyPosts() {
  ensureMyPostActionStyles();
  const page = ensureMyPostsPage();
  const grid = page?.querySelector('#myPostsGrid');
  if (!grid) return;

  const immediatePosts = filterOwnPostsFromList(allItems);
  if (immediatePosts.length) {
    myPosts = immediatePosts;
    renderMyPosts(myPosts);
  } else {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Loading your posts...</h3><p>Checking the database for your reports.</p></div>';
  }

  try {
    let posts = await ItemsAPI.getMyPosts();
    if (!Array.isArray(posts)) posts = [];
    if (!posts.length) posts = await loadMyPostsFallback();
    myPosts = posts;
    renderMyPosts(myPosts);
  } catch (err) {
    console.error('Failed to load my posts:', err);
    const fallbackPosts = await loadMyPostsFallback();
    myPosts = fallbackPosts;
    renderMyPosts(myPosts);
    if (!fallbackPosts.length) {
      showToast('error', 'My Posts Error', err.message || 'Could not load your posts.');
    }
  }
}
function renderMyPosts(posts) {
  const page = document.getElementById('page-my-posts');
  const grid = page?.querySelector('#myPostsGrid');
  if (!grid) return;
  const list = Array.isArray(posts) ? posts : [];
  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>No Posts Yet</h3><p>Your lost and found reports will appear here after you post them.</p></div>';
    return;
  }
  list.forEach(item => {
    try {
      const card = buildItemCard(item);
      attachMyPostActions(card, item);
      grid.appendChild(card);
    } catch (err) {
      console.warn('Could not render my post card:', err.message, item);
    }
  });
}


function attachMyPostActions(card, item) {
  if (!card || !item?.itemID) return;
  card.classList.add('my-post-card');
  const wrap = card.querySelector('.card-img-wrap') || card;
  if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
  const actions = document.createElement('div');
  actions.className = 'my-post-card-actions';
  actions.innerHTML = '<button type="button" class="my-post-icon-btn edit" title="Edit post" aria-label="Edit post"><i class="fa-solid fa-pen-to-square"></i></button><button type="button" class="my-post-icon-btn delete" title="Delete post" aria-label="Delete post"><i class="fa-solid fa-trash"></i></button>';
  actions.querySelector('.edit')?.addEventListener('click', event => {
    event.stopPropagation();
    openMyPostEditModal(item);
  });
  actions.querySelector('.delete')?.addEventListener('click', event => {
    event.stopPropagation();
    deleteMyPost(item);
  });
  wrap.appendChild(actions);
}

function ensureMyPostActionStyles() {
  if (document.getElementById('myPostActionStyles')) return;
  const style = document.createElement('style');
  style.id = 'myPostActionStyles';
  style.textContent = [
    '.my-post-card-actions{position:absolute;top:10px;right:10px;display:flex;gap:8px;z-index:5}',
    '.my-post-icon-btn{width:34px;height:34px;border:1px solid #d1d5db;border-radius:999px;background:rgba(255,255,255,.95);color:#0f172a;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 20px rgba(15,23,42,.12);transition:transform .15s ease,background .15s ease}',
    '.my-post-icon-btn:hover{transform:translateY(-1px);background:#fff}',
    '.my-post-icon-btn.delete{color:#dc2626}',
    '.post-edited-stamp{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;color:#64748b;font-size:12px;font-weight:700}',
    '.my-post-edit-overlay{position:fixed;inset:0;z-index:7000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(4px)}',
    '.my-post-edit-overlay.active{display:flex}',
    '.my-post-edit-dialog{width:min(100%,520px);background:#fff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 24px 70px rgba(15,23,42,.22);padding:26px;font-family:Poppins,Arial,sans-serif}',
    '.my-post-edit-dialog h2{margin:0 0 8px;font-size:22px;font-weight:800}',
    '.my-post-edit-dialog p{margin:0 0 18px;color:#6b7280;font-size:14px;line-height:1.5}',
    '.my-post-edit-dialog label{display:block;margin:14px 0 6px;font-size:13px;font-weight:700}',
    '.my-post-edit-dialog input,.my-post-edit-dialog textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:12px 14px;font-family:inherit;font-size:14px;outline:none}',
    '.my-post-edit-dialog textarea{min-height:120px;resize:vertical}',
    '.my-post-edit-actions{display:flex;gap:12px;margin-top:22px}',
    '.my-post-edit-actions button{border:0;border-radius:10px;padding:12px 18px;font-family:inherit;font-weight:800;cursor:pointer}',
    '.my-post-edit-cancel{background:#f3f4f6;color:#374151}',
    '.my-post-edit-save{flex:1;background:#166534;color:#fff}',
    '.my-post-delete-overlay{position:fixed;inset:0;z-index:7100;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.52);backdrop-filter:blur(5px)}',
    '.my-post-delete-overlay.active{display:flex}',
    '.my-post-delete-dialog{width:min(100%,460px);background:#fff;border-radius:18px;border:1px solid #fee2e2;box-shadow:0 24px 70px rgba(15,23,42,.24);padding:26px;font-family:Poppins,Arial,sans-serif}',
    '.my-post-delete-icon{width:48px;height:48px;border-radius:999px;background:#fee2e2;color:#dc2626;display:flex;align-items:center;justify-content:center;margin-bottom:14px;font-size:20px}',
    '.my-post-delete-dialog h2{margin:0 0 8px;font-size:22px;font-weight:800;color:#111827}',
    '.my-post-delete-dialog p{margin:0;color:#64748b;font-size:14px;line-height:1.6}',
    '.my-post-delete-actions{display:flex;gap:12px;margin-top:24px}',
    '.my-post-delete-actions button{border:0;border-radius:10px;padding:12px 18px;font-family:inherit;font-weight:800;cursor:pointer}',
    '.my-post-delete-cancel{background:#f3f4f6;color:#374151}',
    '.my-post-delete-confirm{flex:1;background:#dc2626;color:#fff}'
  ].join('');
  document.head.appendChild(style);
}

function ensureMyPostEditModal() {
  ensureMyPostActionStyles();
  let overlay = document.getElementById('myPostEditOverlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'myPostEditOverlay';
  overlay.className = 'my-post-edit-overlay';
  overlay.innerHTML = '<div class="my-post-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="myPostEditTitle"><h2 id="myPostEditTitle">Edit Post</h2><p>Update the details saved for this post.</p><input type="hidden" id="myPostEditID"><label for="myPostEditTitleInput">Item Title</label><input type="text" id="myPostEditTitleInput" maxlength="120"><label for="myPostEditDescInput">Description</label><textarea id="myPostEditDescInput" maxlength="2000"></textarea><div class="my-post-edit-actions"><button type="button" class="my-post-edit-cancel" onclick="closeMyPostEditModal()">Cancel</button><button type="button" class="my-post-edit-save" onclick="saveMyPostEdit()">Save Changes</button></div></div>';
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeMyPostEditModal();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function openMyPostEditModal(item) {
  const overlay = ensureMyPostEditModal();
  document.getElementById('myPostEditID').value = item.itemID || '';
  document.getElementById('myPostEditTitleInput').value = item.title || '';
  document.getElementById('myPostEditDescInput').value = item.description || '';
  overlay.classList.add('active');
  document.getElementById('myPostEditTitleInput')?.focus();
}

function closeMyPostEditModal() {
  document.getElementById('myPostEditOverlay')?.classList.remove('active');
}

async function saveMyPostEdit() {
  const itemID = document.getElementById('myPostEditID')?.value;
  const title = document.getElementById('myPostEditTitleInput')?.value.trim();
  const description = document.getElementById('myPostEditDescInput')?.value.trim();
  if (!itemID || !title || !description) {
    showToast('warning', 'Missing Details', 'Please enter both a title and description.');
    return;
  }
  try {
    await ItemsAPI.updateMyPost(itemID, { title, description });
    closeMyPostEditModal();
    showToast('success', 'Post Updated', 'Your post was updated in the database.');
    await loadMyPosts();
    if (typeof loadItems === 'function') await loadItems();
  } catch (err) {
    showToast('error', 'Update Failed', err.message || 'Could not update your post.');
  }
}

function ensureMyPostDeleteModal() {
  ensureMyPostActionStyles();
  let overlay = document.getElementById('myPostDeleteOverlay');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'myPostDeleteOverlay';
  overlay.className = 'my-post-delete-overlay';
  overlay.innerHTML = '<div class="my-post-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="myPostDeleteTitle"><div class="my-post-delete-icon"><i class="fa-solid fa-trash"></i></div><h2 id="myPostDeleteTitle">Delete this post<i class="fa-solid fa-check" aria-hidden="true"></i></h2><p id="myPostDeleteMessage">This post will be removed from the database. This action cannot be undone.</p><input type="hidden" id="myPostDeleteID"><div class="my-post-delete-actions"><button type="button" class="my-post-delete-cancel" onclick="closeMyPostDeleteModal()">Cancel</button><button type="button" class="my-post-delete-confirm" onclick="confirmMyPostDelete()">Delete Post</button></div></div>';
  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeMyPostDeleteModal();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function openMyPostDeleteModal(item) {
  const overlay = ensureMyPostDeleteModal();
  document.getElementById('myPostDeleteID').value = item.itemID || '';
  const title = item.title || 'this post';
  document.getElementById('myPostDeleteMessage').textContent = `Delete "${title}"? It will be removed from the database and cannot be undone.`;
  overlay.classList.add('active');
}

function closeMyPostDeleteModal() {
  document.getElementById('myPostDeleteOverlay')?.classList.remove('active');
}

async function confirmMyPostDelete() {
  const itemID = document.getElementById('myPostDeleteID')?.value;
  if (!itemID) return;
  try {
    await ItemsAPI.deleteMyPost(itemID);
    closeMyPostDeleteModal();
    showToast('success', 'Post Deleted', 'Your post was removed from the database.');
    await loadMyPosts();
    if (typeof loadItems === 'function') await loadItems();
  } catch (err) {
    showToast('error', 'Delete Failed', err.message || 'Could not delete your post.');
  }
}

async function deleteMyPost(item) {
  if (!item?.itemID) return;
  openMyPostDeleteModal(item);
}

function filterMyPosts() {
  const page = document.getElementById('page-my-posts');
  const term = (page?.querySelector('#myPostsSearch')?.value || '').trim().toLowerCase();
  const type = page?.querySelector('#myPostsTypeFilter')?.value || '';
  const filtered = myPosts.filter(item => {
    const itemType = String(item.itemType || '').toLowerCase();
    const matchesType = !type || itemType === type;
    const haystack = [item.title, item.description, item.categoryName, item.locationName, item.locationDetail, item.itemStatus].join(' ').toLowerCase();
    return matchesType && haystack.includes(term);
  });
  renderMyPosts(filtered);
}

/* ============================================================
   ITEM DETAIL MODAL
============================================================ */
function openItemModal(card) {
  currentItemID = card.dataset.itemId || null;
  const type  = card.dataset.type;
  const title = card.dataset.title;
  const cat   = card.dataset.cat;
  const desc  = card.dataset.desc;
  const loc   = card.dataset.loc;
  const date  = card.dataset.date;
  const photo = card.dataset.photo || '';
  const itemPhoto = card.dataset.itemPhoto || '';

  const imgSec = document.getElementById('modalImgSec');
  const cardImg = card.querySelector('.card-img-wrap > div') || card.querySelector('.card-img-wrap > img');

  imgSec.innerHTML = cardImg 
    ? cardImg.outerHTML.replace(
        'width:100%;height:100%',
        'width:100%;height:340px;border-radius:12px'
      ) 
    : '';

  document.getElementById('modalTypeBadge').textContent = type.toUpperCase();
  document.getElementById('modalTypeBadge').className = `badge badge-${type}`;

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalCat').innerHTML  = `<span class="category-tag">${cat}</span>`;
  document.getElementById('modalLoc').textContent = `Location: ${loc}`;
  document.getElementById('modalDate').textContent = `Date: ${date}`;
  document.getElementById('modalDesc').textContent = desc;

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

  // CONDITION FOR BUTTONS
  const claimBtn = document.getElementById('claimBtn');
  const reportBtn = document.getElementById('reportItemBtn');

  if (String(type).toLowerCase() === 'found') {
    if (claimBtn) claimBtn.style.display = 'block';
  } else {
    if (claimBtn) claimBtn.style.display = 'none';
  }
  if (reportBtn) reportBtn.style.display = 'block';

  document.getElementById('itemModal').classList.add('active');
}

function closeItemModal() {
  document.getElementById('itemModal').classList.remove('active');
}

/* ============================================================
   CLAIM FORM
============================================================ */
function openClaimForm() {
  const selectedItemID = currentItemID;
  closeItemModal();
  currentItemID = selectedItemID;
  document.getElementById('claimFormPopup').classList.add('active');
}

function closeClaimForm() {
  document.getElementById('claimFormPopup').classList.remove('active');
  document.getElementById('claimEvidence').value = '';
  document.getElementById('claimFile').value = '';
  clearErr('claimEvidenceErr');
}

async function submitClaim() {
  const evidence = document.getElementById('claimEvidence').value.trim();
  clearErr('claimEvidenceErr');

  if (!evidence) {
    showErr('claimEvidenceErr', 'Please provide your proof of ownership.');
    document.getElementById('claimEvidence').classList.add('error');
    showToast('error', 'Missing Evidence', 'Please describe your proof of ownership before submitting.');
    return;
  }

  if (!currentItemID) {
    showToast('error', 'No Item Selected', 'Please open an item again before submitting a claim.');
    return;
  }

  const btn = document.querySelector('#claimFormPopup .btn-submit-evidence');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

  try {
    await ClaimsAPI.submit(currentItemID, evidence);
    closeClaimForm();
    showToast('success', 'Claim Submitted!', 'Your claim request has been sent for review.');
    await loadNotifications();
  } catch (err) {
    showToast('error', 'Claim Failed', err.message || 'Could not submit claim.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Evidence'; }
  }
}

/* ============================================================
   REPORT ITEM FORM
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
    showToast('success', 'Report Submitted!', 'Your report has been sent for review.');
    await loadNotifications();
  } catch (err) {
    showToast('error', 'Report Failed', err.message || 'Could not submit report.');
  }
}

/* ============================================================
   SEARCH & FILTER
============================================================ */
function filterItems(type) {
  const query  = document.getElementById(`${type}Search`).value.toLowerCase();
  const catVal = document.getElementById(`${type}CatFilter`).value.toLowerCase();
  const cards  = document.querySelectorAll(`#${type}ItemsGrid .item-card`);

  cards.forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const desc  = (card.dataset.desc  || '').toLowerCase();
    const cat   = (card.dataset.cat   || '').toLowerCase();
    const matchQuery = !query  || title.includes(query) || desc.includes(query);
    const matchCat   = !catVal || cat === catVal;
    card.style.display = (matchQuery && matchCat) ? '' : 'none';
  });
}

function filterAllItems() {
  const query = document.getElementById('allItemsSearch')?.value.toLowerCase() || '';
  const type = document.getElementById('allItemsTypeFilter')?.value || '';
  document.querySelectorAll('#allItemsGrid .item-card').forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const desc = (card.dataset.desc || '').toLowerCase();
    const matchQuery = !query || title.includes(query) || desc.includes(query);
    const matchType = !type || card.dataset.type === type;
    card.style.display = matchQuery && matchType ? '' : 'none';
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
  const icon = '<i class="fa-solid fa-user"></i>';
  const content = photoData ? `<img src="${photoData}" alt="Profile photo">` : icon;
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

function populateAccountForm(user) {
  const fullName = String(user?.userName || '').trim();
  const { firstName, lastName } = splitFullName(fullName);
  const username = formatAccountUsername(user?.accountUsername || fullName);

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
  const storedName = typeof Auth !== 'undefined' ? Auth.getUser() : (localStorage.getItem('userName') || 'Visitor');
  const storedRole = typeof Auth !== 'undefined' ? Auth.getRole() : (localStorage.getItem('role') || 'Visitor');
  let user = { userName: storedName, role: storedRole, email: localStorage.getItem('asa_email') || '' };

  try {
    if (typeof UserAPI !== 'undefined' && UserAPI.getMe) {
      const dbUser = await UserAPI.getMe();
      if (dbUser?.userName) user = dbUser;
    }
  } catch (err) {
    console.warn('Could not load account profile:', err.message);
  }

  const displayName = user.userName || storedName || 'Visitor';
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
  document.querySelector('visitor-header')?.setUsername?.(displayName, user.role || storedRole);
  populateAccountForm(user);
  renderProfilePhoto(user.profilePhotoData);
  return user;
}

async function submitAccountInfo(e) {
  e.preventDefault();
  const first = document.getElementById('accFirstName').value.trim();
  const last  = document.getElementById('accLastName').value.trim();
  const user  = document.getElementById('accUsername').value.trim();
  const email = document.getElementById('accEmail').value.trim();

  if (!first || !last || !user || !email) {
    showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
    return;
  }
  if (!email.includes('@')) {
    showToast('warning', 'Invalid Email', 'Please enter a valid email address.');
    return;
  }

  try {
    const fullName = `${first} ${last}`;
    await UserAPI.updateProfile(fullName);
    localStorage.setItem('userName', fullName);
    localStorage.setItem('asa_user', fullName);
    document.getElementById('welcomeName').textContent = first;
    document.querySelector('visitor-header')?.setUsername(fullName);
    populateAccountForm({ userName: fullName, email });
    showToast('success', 'Account Updated!', 'Your account information has been saved successfully.');
  } catch (err) {
    showToast('error', 'Update Failed', err.message || 'Could not update account.');
  }
}

async function submitPasswordChange(e) {
  e.preventDefault();
  const current  = document.getElementById('currentPass').value;
  const newP     = document.getElementById('newPass').value;
  const confirm  = document.getElementById('confirmPass').value;
  let valid = true;

  clearFieldError('currentPass','currentPassErr');
  clearFieldError('newPass','newPassErr');
  clearFieldError('confirmPass','confirmPassErr');

  if (!current) { setFieldError('currentPass','currentPassErr','Current password is required.'); valid = false; }
  if (newP.length < 8) { setFieldError('newPass','newPassErr','Password must be at least 8 characters.'); valid = false; }
  if (newP !== confirm) { setFieldError('confirmPass','confirmPassErr','Passwords do not match.'); valid = false; }

  if (!valid) {
    showToast('error', 'Fix Errors', 'Please correct the errors before submitting.');
    return;
  }

  try {
    await UserAPI.changePassword(current, newP);
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmPass').value = '';
    showToast('success', 'Password Updated!', 'Your password has been changed successfully.');
  } catch (err) {
    showToast('error', 'Password Failed', err.message || 'Could not update password.');
  }
}

async function handleAvatarChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  document.getElementById('avatarFileName').textContent = file.name;
  try {
    const profilePhotoData = await readProfilePhoto(file);
    const userName = `${document.getElementById('accFirstName').value.trim()} ${document.getElementById('accLastName').value.trim()}`.trim()
      || localStorage.getItem('userName')
      || 'Visitor';
    const data = await UserAPI.updateProfile({ userName, profilePhotoData });
    renderProfilePhoto(data.user?.profilePhotoData || profilePhotoData);
    showToast('success', 'Photo Updated', 'Your display picture has been saved.');
  } catch (err) {
    showToast('error', 'Upload Failed', err.message || 'Could not update display picture.');
  }
}

/* ============================================================
   CLOSE MODALS ON OVERLAY CLICK
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

/* Toggle "Others" specify field for location dropdowns */
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
/* ============================================================
   API DATA LOADING
============================================================ */
let allItems = [];
const VISITOR_ITEMS_CACHE_KEY = 'asa_visitor_items_cache';

function applyVisitorItems(items, shouldCache = true) {
  const itemList = Array.isArray(items) ? items : [];
  allItems = itemList;
  if (shouldCache) {
    try { localStorage.setItem(VISITOR_ITEMS_CACHE_KEY, JSON.stringify(itemList.slice(0, 40))); }
    catch (err) { localStorage.removeItem(VISITOR_ITEMS_CACHE_KEY); }
  }

  const lostItems = itemList.filter(i => i.itemType === 'lost');
  const foundItems = itemList.filter(i => i.itemType === 'found');
  const claimedItems = itemList.filter(i => String(i.itemStatus || '').toLowerCase() === 'claimed');

  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('statLost', lostItems.length);
  set('statFound', foundItems.length);
  set('statResolved', claimedItems.length);
  set('statClaimed', claimedItems.length);

  renderItemGrid('allItemsGrid', itemList);
  renderItemGrid('lostItemsGrid', lostItems);
  renderItemGrid('foundItemsGrid', foundItems);
  renderRecentItems(itemList.slice(0, 4));
}

function hydrateVisitorItemsFromCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(VISITOR_ITEMS_CACHE_KEY) || 'null');
    if (cached) applyVisitorItems(cached, false);
  } catch (err) {
    localStorage.removeItem(VISITOR_ITEMS_CACHE_KEY);
  }
}

async function loadItems() {
  try {
    const items = window.ASA_ITEMS_PRELOAD ? await window.ASA_ITEMS_PRELOAD : await ItemsAPI.browse();
    applyVisitorItems(items);
    window.ASA_ITEMS_PRELOAD = null;
  } catch (err) {
    console.error('Failed to load items:', err);
    showToast('error', 'Connection Error', 'Could not load items. Is the server running<i class="fa-solid fa-check" aria-hidden="true"></i>');
  }
}

function getCategoryEmoji(cat) {
  if (!cat) return '<i class="fa-solid fa-box" aria-hidden="true"></i>';
  const map = { 'electronics':'<i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i>','clothing':'<i class="fa-solid fa-shirt" aria-hidden="true"></i>','accessories':'<i class="fa-solid fa-glasses" aria-hidden="true"></i>','documents':'<i class="fa-solid fa-file-lines" aria-hidden="true"></i>','books':'<i class="fa-solid fa-book" aria-hidden="true"></i>','keys':'<i class="fa-solid fa-key" aria-hidden="true"></i>','others':'<i class="fa-solid fa-box" aria-hidden="true"></i>' };
  return map[cat.toLowerCase()] || '<i class="fa-solid fa-box" aria-hidden="true"></i>';
}

function buildItemCard(item) {
  const data = item || {};
  const itemType = String(data.itemType || 'lost').toLowerCase();
  const title = data.title || 'Untitled Item';
  const categoryName = data.categoryName || 'General';
  const description = data.description || '';
  const isLost = itemType === 'lost';
  const gradient = isLost ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : 'linear-gradient(135deg,#dcfce7,#bbf7d0)';
  const emoji = getCategoryEmoji(categoryName);
  const rawDate = data.createdAt || data.dateOccured || new Date().toISOString();
  const date = Number.isNaN(new Date(rawDate).getTime()) ? '' : new Date(rawDate).toLocaleString();
  const editedRaw = data.editedAt || null;
  const editedDate = editedRaw && !Number.isNaN(new Date(editedRaw).getTime()) ? new Date(editedRaw).toLocaleString() : '';
  const pickupName = data.locationName || data.location || data.locationDetail || 'Campus';
  const pickupPhoto = data.locationPhoto || '';
  const itemPhoto = data.itemPhotoData || '';

  const div = document.createElement('div');
  div.className = 'item-card';
  div.dataset.itemId = data.itemID || '';
  div.dataset.title = title;
  div.dataset.cat = categoryName;
  div.dataset.desc = description;
  div.dataset.loc = pickupName;
  div.dataset.date = date;
  div.dataset.type = itemType;
  div.dataset.photo = pickupPhoto;
  div.dataset.itemPhoto = itemPhoto;
  div.setAttribute('onclick', 'openItemModal(this)');

  const imageMarkup = isLost && itemPhoto
    ? `<img src="${itemPhoto}" alt="${title} photo">`
    : !isLost && pickupPhoto
      ? `<img src="${pickupPhoto}" alt="${pickupName} building photo">`
      : `<div style="width:100%;height:100%;background:${gradient};display:flex;align-items:center;justify-content:center;font-size:48px;">${isLost ? '<i class="fa-solid fa-wallet" aria-hidden="true"></i>' : emoji}</div>`;

  div.innerHTML = `
    <div class="card-img-wrap">
      ${imageMarkup}
      <span class="badge badge-${itemType}">${itemType.toUpperCase()}</span>
    </div>
    <div class="card-info">
      <h3>${title}</h3>
      <span class="category-tag">${categoryName}</span>
      <p class="card-desc">${description.substring(0, 80)}${description.length > 80 ? '...' : ''}</p>
      ${editedDate ? `<div class="post-edited-stamp"><i class="fa-regular fa-clock"></i> Edited ${editedDate}</div>` : ''}
      <div class="card-footer-row">
        <span>${!isLost && pickupPhoto ? `<img class="building-thumb" src="${pickupPhoto}" alt="${pickupName} building photo">` : '<i class="fa-solid fa-location-dot"></i>'} ${pickupName}</span>
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
  if (!items.length) { grid.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px 0">No items found.</p>'; return; }
  items.forEach(item => grid.appendChild(buildItemCard(item)));
}

function renderRecentItems(items) {
  const dashboard = document.getElementById('page-dashboard');
  if (!dashboard) return;

  const emptyState = dashboard.querySelector('.empty-state');
  let box = document.getElementById('recentItemsContainer');

  if (!box) {
    box = document.createElement('div');
    box.id = 'recentItemsContainer';
    box.className = 'items-grid';
    box.style.marginTop = '16px';
    const sectionHeader = dashboard.querySelector('.section-header');
    if (emptyState) emptyState.insertAdjacentElement('afterend', box);
    else sectionHeader?.insertAdjacentElement('afterend', box);
  }

  box.innerHTML = '';

  if (!items || items.length === 0) {
    if (emptyState) emptyState.style.display = '';
    box.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  box.style.display = '';
  items.forEach(item => box.appendChild(buildItemCard(item)));
}

async function loadFormDropdowns() {
  try {
    const [categories, locations] = await Promise.all([ MetaAPI.getCategories(), MetaAPI.getLocations() ]);

    const catOptions = categories.map(c => `<option value="${c.categoryID}">${c.categoryName}</option>`).join('');
    ['lostCat','foundCat'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.innerHTML = `<option value="">Select Category</option>` + catOptions;
    });

    const filterOptions = categories.map(c => `<option value="${c.categoryName.toLowerCase()}">${c.categoryName}</option>`).join('');
    ['lostCatFilter','foundCatFilter'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) sel.innerHTML = `<option value="">All Categories</option>` + filterOptions;
    });

    const foundPickup = document.getElementById('foundPickup');
    if (foundPickup) {
      pickupLocations = locations;
      pickupLocationByID = Object.fromEntries(locations.map(l => [String(l.locationID), l]));
      foundPickup.innerHTML = `<option value="">Where is the item kept now<i class="fa-solid fa-check" aria-hidden="true"></i></option>` +
        locations.map(l => {
          const photo = l.photoData ? String(l.photoData).replace(/"/g, '&quot;') : '';
          const building = l.building && l.building !== l.storageName ? " - " + l.building : "";
          return `<option value="${l.locationID}" data-name="${l.storageName}" data-photo="${photo}">${l.storageName}${building}</option>`;
        }).join('');
      foundPickup.addEventListener('change', updateFoundPickupPreview);
      updateFoundPickupPreview();
    }
  } catch (err) {
    console.error('Dropdown loading failed:', err);
  }
}

async function loadNotifications() {
  try {
    const notifs = await NotifAPI.getAll();
    document.querySelector('visitor-header')?.renderNotifications(notifs);
  } catch (err) {
    console.warn('Could not load notifications:', err.message);
  }
}

async function markAllNotificationsRead() {
  try {
    await NotifAPI.markAllRead();
    await loadNotifications();
    if (document.getElementById('visitorNotificationsModal')) openVisitorNotificationsModal();
  } catch (err) {
    console.warn('Could not mark notifications read:', err.message);
  }
}


/* ============================================================
   INIT
============================================================ */

const refreshVisitorRealtime = (window.asaRealtimeDebounce || ((fn) => fn))(async event => {
  const type = event.detail?.type;
  if (type === 'connected' || type === 'heartbeat') return;

  const tasks = [];
  if (['items-changed', 'claims-changed', 'admin-data-changed'].includes(type) && typeof loadItems === 'function') tasks.push(loadItems());
  if (currentPage === 'my-posts' && ['items-changed', 'claims-changed', 'admin-data-changed'].includes(type)) tasks.push(loadMyPosts());
  if (['notifications-changed', 'items-changed', 'claims-changed'].includes(type) && typeof loadNotifications === 'function') tasks.push(loadNotifications());

  await Promise.allSettled(tasks);
}, 300);

window.addEventListener('asa:realtime', refreshVisitorRealtime);

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof requireAuth === 'function' && !requireAuth('/login/landing.html')) return;
  ensureMyPostsPage();
  dedupeMyPostDropdown(document.getElementById('headerProfileDropdown'));
  showPage(getInitialVisitorPage());
  hydrateVisitorItemsFromCache();
  await syncCurrentUserProfile();

  await Promise.all([ loadItems(), loadFormDropdowns(), loadNotifications() ]);
});
