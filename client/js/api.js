/* ============================================================
   api.js â€” ASA Lost and Found Tracker
============================================================ */

const API_BASE = window.ASA_API_BASE || `${window.location.origin}/api`;

const Auth = {
  save(token, role, userName) {
    localStorage.setItem('asa_token', token);
    localStorage.setItem('asa_role', role);
    localStorage.setItem('asa_user', userName || 'Student');
    // compatibility with your older auth.js
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userName', userName || 'Student');
  },
  saveAdmin(token, managedBy) {
    localStorage.setItem('asa_token', token);
    localStorage.setItem('asa_role', 'Admin');
    localStorage.setItem('asa_user', managedBy || 'Admin');
    localStorage.setItem('token', token);
    localStorage.setItem('role', 'Admin');
    localStorage.setItem('userName', managedBy || 'Admin');
  },
  getToken() { return localStorage.getItem('token') || localStorage.getItem('asa_token'); },
  getRole() { return localStorage.getItem('role') || localStorage.getItem('asa_role'); },
  getUser() { return localStorage.getItem('userName') || localStorage.getItem('asa_user') || 'Student'; },
  isLoggedIn() { return !!this.getToken(); },
  logout(skipConfirm = false) {
    if (!skipConfirm) {
      showLogoutConfirmation();
      return;
    }
    window.RealtimeAPI?.disconnect?.();
    ['asa_token','asa_role','asa_user','token','role','userName'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/login/landing.html';
  }
};

function ensureLogoutConfirmation() {
  if (!document.getElementById('logoutConfirmStyles')) {
    const style = document.createElement('style');
    style.id = 'logoutConfirmStyles';
    style.textContent = `
      .logout-confirm-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(15, 23, 42, 0.48);
        backdrop-filter: blur(4px);
        z-index: 6000;
      }
      .logout-confirm-overlay.active { display: flex; }
      .logout-confirm-dialog {
        width: min(100%, 420px);
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
        padding: 26px;
        font-family: 'Poppins', Arial, sans-serif;
        color: #111827;
      }
      .logout-confirm-icon {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fef2f2;
        color: #dc2626;
        margin-bottom: 16px;
        font-size: 20px;
      }
      .logout-confirm-dialog h2 {
        font-size: 21px;
        font-weight: 800;
        margin: 0 0 8px;
      }
      .logout-confirm-dialog p {
        font-size: 14px;
        line-height: 1.65;
        color: #6b7280;
        margin: 0;
      }
      .logout-confirm-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
      }
      .logout-confirm-actions button {
        border: 0;
        border-radius: 10px;
        padding: 11px 18px;
        font-family: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      .logout-confirm-cancel {
        background: #f3f4f6;
        color: #374151;
      }
      .logout-confirm-proceed {
        background: #dc2626;
        color: #fff;
      }
      @media (max-width: 480px) {
        .logout-confirm-dialog { padding: 22px; }
        .logout-confirm-actions { flex-direction: column-reverse; }
        .logout-confirm-actions button { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  let overlay = document.getElementById('logoutConfirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'logoutConfirmOverlay';
    overlay.className = 'logout-confirm-overlay';
    overlay.innerHTML = `
      <div class="logout-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle">
        <div class="logout-confirm-icon"><i class="fa-solid fa-right-from-bracket"></i></div>
        <h2 id="logoutConfirmTitle">Sign out of ASA?</h2>
        <p>Your current session will end and you will need to sign in again to manage reports, claims, and notifications.</p>
        <div class="logout-confirm-actions">
          <button type="button" class="logout-confirm-cancel" id="logoutConfirmCancel">Stay signed in</button>
          <button type="button" class="logout-confirm-proceed" id="logoutConfirmProceed">Yes, sign out</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      if (event.target === overlay) hideLogoutConfirmation();
    });
    overlay.querySelector('#logoutConfirmCancel')?.addEventListener('click', hideLogoutConfirmation);
    overlay.querySelector('#logoutConfirmProceed')?.addEventListener('click', () => Auth.logout(true));
  }
  return overlay;
}

function showLogoutConfirmation() {
  const overlay = ensureLogoutConfirmation();
  overlay.classList.add('active');
  overlay.querySelector('#logoutConfirmCancel')?.focus();
}

function hideLogoutConfirmation() {
  document.getElementById('logoutConfirmOverlay')?.classList.remove('active');
}

document.addEventListener('click', event => {
  const logoutTarget = event.target.closest?.('.logout-item, .sidebar-logout-btn, .logout');
  if (!logoutTarget) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showLogoutConfirmation();
}, true);

async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      // Do not instantly logout on public endpoints; throw readable error
    }
    throw new Error(data.error || data.message || 'Something went wrong.');
  }
  return data;
}

const AuthAPI = {
  async register(name, email, password, role) {
    return apiFetch('/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
  },
  async verifyOtp(email, otpCode) {
    return apiFetch('/verify-otp', { method: 'POST', body: JSON.stringify({ email, otpCode }) });
  },
  async resendOtp(email) {
    return apiFetch('/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async login(identifier, password) {
    const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
    if (data?.token) Auth.save(data.token, data.role, data.userName);
    return data;
  },
  async adminLogin(managedBy, password) {
    const data = await apiFetch('/admin/login', { method: 'POST', body: JSON.stringify({ managedBy, password }) });
    if (data?.token) Auth.saveAdmin(data.token, data.managedBy);
    return data;
  },
  async forgotPassword(email) {
    return apiFetch('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async resetPassword(token, newPassword) {
    return apiFetch('/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  }
};

const ItemsAPI = {
  async browse() { return apiFetch('/items/browse'); },
  async getDetails(itemID) { return apiFetch(`/items/details/${itemID}`); },
  async report(itemData) {
  return apiFetch('/items/post', { method: 'POST', body: JSON.stringify(itemData) });
}
};

const ClaimsAPI = {
  async submit(itemID, proof) {
    return apiFetch('/claims', { method: 'POST', body: JSON.stringify({ itemID, proof }) });
  },
  async getMyClaims() { return apiFetch('/claims/my'); }
};

const AppealsAPI = {
  async submit(itemID, reason) {
    return apiFetch('/appeals', { method: 'POST', body: JSON.stringify({ itemID, reason }) });
  }
};

const UserAPI = {
  async getMe() {
    return apiFetch('/users/me');
  },
  async updateProfile(userNameOrProfile, profilePhotoData) {
    const payload = typeof userNameOrProfile === 'object'
      ? userNameOrProfile
      : { userName: userNameOrProfile };
    if (profilePhotoData !== undefined) payload.profilePhotoData = profilePhotoData;
    return apiFetch('/users/profile', { method: 'PUT', body: JSON.stringify(payload) });
  },
  async changePassword(currentPassword, newPassword) {
    return apiFetch('/users/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  }
};

const MetaAPI = {
  async getCategories() { return apiFetch('/categories'); },
  async getLocations() { return apiFetch('/locations'); }
};

const NotifAPI = {
  async getAll() { return apiFetch('/notifications'); },
  async markRead(notifID) { return apiFetch(`/notifications/${notifID}/read`, { method: 'PUT' }); },
  async markAllRead() { return apiFetch('/notifications/read-all', { method: 'PUT' }); }
};

const AdminAPI = {
  async getAllItems() { return apiFetch('/admin/items'); },
  async approveItem(itemID) { return apiFetch(`/admin/items/${itemID}/approve`, { method: 'PUT' }); },
  async rejectItem(itemID) { return apiFetch(`/admin/items/${itemID}/reject`, { method: 'PUT' }); },
  async getAllClaims() { return apiFetch('/admin/claims'); },
  async approveClaim(claimID) { return apiFetch(`/admin/claims/${claimID}/approve`, { method: 'PUT' }); },
  async rejectClaim(claimID) { return apiFetch(`/admin/claims/${claimID}/reject`, { method: 'PUT' }); },
  async getAllUsers() { return apiFetch('/admin/users'); },
  async updateUserStatus(userID, status) {
    return apiFetch(`/admin/users/${userID}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  }
};

function requireAuth(redirectTo = '/login/landing.html', requiredRole = null) {
  if (!Auth.isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  if (requiredRole && Auth.getRole() !== requiredRole) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}


function asaRealtimeDebounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


function ensureImagePreviewModal() {
  if (!document.getElementById('asaImagePreviewStyles')) {
    const style = document.createElement('style');
    style.id = 'asaImagePreviewStyles';
    style.textContent = `
      [data-preview-src],
      .card-img-wrap img,
      .building-thumb,
      .modal-image-sec img,
      .modal-building-photo img,
      .pickup-preview-photo img,
      .profile-avatar img,
      .main-avatar img,
      .building-photo-wrap img,
      .img-preview-wrap img {
        cursor: zoom-in;
      }
      .asa-image-preview-overlay {
        position: fixed;
        inset: 0;
        z-index: 9000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 28px;
        background: rgba(3, 7, 18, 0.9);
      }
      .asa-image-preview-overlay.active { display: flex; }
      .asa-image-preview-frame {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .asa-image-preview-frame img {
        max-width: min(96vw, 1280px);
        max-height: 88vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      }
      .asa-image-preview-close {
        position: fixed;
        top: 18px;
        right: 18px;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255,255,255,0.32);
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.74);
        color: #fff;
        font-size: 24px;
        cursor: pointer;
      }
      @media (max-width: 640px) {
        .asa-image-preview-overlay { padding: 14px; }
        .asa-image-preview-frame img {
          max-width: 96vw;
          max-height: 82vh;
          border-radius: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  let overlay = document.getElementById('asaImagePreviewOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'asaImagePreviewOverlay';
    overlay.className = 'asa-image-preview-overlay';
    overlay.innerHTML = `
      <button type="button" class="asa-image-preview-close" aria-label="Close image preview">&times;</button>
      <div class="asa-image-preview-frame" role="dialog" aria-modal="true" aria-label="Image preview">
        <img id="asaImagePreviewImg" alt="">
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.asa-image-preview-close')) {
        closeImagePreview();
      }
    });
  }
  return overlay;
}

function openImagePreview(src, alt = 'Photo') {
  if (!src || !String(src).trim()) return;
  const overlay = ensureImagePreviewModal();
  const img = overlay.querySelector('#asaImagePreviewImg');
  img.src = src;
  img.alt = alt || 'Photo';
  overlay.classList.add('active');
  document.body.dataset.imagePreviewWasOverflow = document.body.style.overflow || '';
  document.body.style.overflow = 'hidden';
}

function closeImagePreview() {
  const overlay = document.getElementById('asaImagePreviewOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.querySelector('#asaImagePreviewImg')?.removeAttribute('src');
  document.body.style.overflow = document.body.dataset.imagePreviewWasOverflow || '';
  delete document.body.dataset.imagePreviewWasOverflow;
}

const ASA_PREVIEW_IMAGE_SELECTOR = [
  '[data-preview-src]',
  '.card-img-wrap img',
  '.building-thumb',
  '.modal-image-sec img',
  '.modal-building-photo img',
  '.pickup-preview-photo img',
  '.profile-avatar img',
  '.main-avatar img',
  '.building-photo-wrap img',
  '.img-preview-wrap img'
].join(',');

document.addEventListener('click', event => {
  const target = event.target.closest?.(ASA_PREVIEW_IMAGE_SELECTOR);
  if (!target) return;
  const src = target.dataset.previewSrc || target.currentSrc || target.src;
  if (!src || src.includes('/ASA_logo/')) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openImagePreview(src, target.dataset.previewAlt || target.alt || 'Photo');
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeImagePreview();
});
const RealtimeAPI = (() => {
  let source = null;
  let reconnectTimer = null;

  function publish(event) {
    window.dispatchEvent(new CustomEvent('asa:realtime', { detail: event }));
    if (event?.type) {
      window.dispatchEvent(new CustomEvent(`asa:realtime:${event.type}`, { detail: event.payload || {} }));
    }
  }

  function connect() {
    const token = Auth.getToken();
    if (!token || !window.EventSource) return;
    if (source) source.close();

    source = new EventSource(`${API_BASE}/events?token=${encodeURIComponent(token)}`);
    source.onmessage = event => {
      try {
        publish(JSON.parse(event.data));
      } catch (err) {
        console.warn('Realtime message ignored:', err.message);
      }
    };
    source.onerror = () => {
      source?.close();
      source = null;
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 5000);
    };
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    source?.close();
    source = null;
  }

  return { connect, disconnect };
})();

window.API_BASE = API_BASE;
window.Auth = Auth;
window.AuthAPI = AuthAPI;
window.ItemsAPI = ItemsAPI;
window.ClaimsAPI = ClaimsAPI;
window.AppealsAPI = AppealsAPI;
window.UserAPI = UserAPI;
window.MetaAPI = MetaAPI;
window.NotifAPI = NotifAPI;
window.AdminAPI = AdminAPI;
window.requireAuth = requireAuth;
window.asaRealtimeDebounce = asaRealtimeDebounce;
window.RealtimeAPI = RealtimeAPI;
window.openImagePreview = openImagePreview;
window.closeImagePreview = closeImagePreview;
document.addEventListener('DOMContentLoaded', () => RealtimeAPI.connect());
window.addEventListener('beforeunload', () => RealtimeAPI.disconnect());
