console.log("Notifications JS loaded");

const API_URL = window.API_BASE || window.ASA_API_BASE || `${window.location.origin}/api`;
let lastNotifCount = 0;
let allNotifications = [];

document.addEventListener("DOMContentLoaded", () => {
  injectNotificationStyles();
  loadNotifications();
  setInterval(loadNotifications, 3000);
});

function injectNotificationStyles() {
  const style = document.createElement("style");

  style.innerHTML = `
    .notif-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 18px;
      border-bottom: 1px solid #e5e7eb;
    }

    .notif-panel-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
    }

    .mark-read {
      border: none !important;
      background: transparent !important;
      color: #166534 !important;
      font-weight: 800 !important;
      font-size: 12px !important;
      cursor: pointer !important;
    }

    .mark-read:hover {
      text-decoration: underline;
    }

    .notif-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .notif-item {
      padding: 14px 18px;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      background: white;
    }

    .notif-item.unread {
      background: #f0fdf4 !important;
      border-left: 5px solid #166534;
    }

    .notif-item.unread .notif-message {
      font-weight: 800 !important;
      color: #111827 !important;
    }

    .notif-message {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.5;
      color: #374151;
    }

    .notif-time {
      font-size: 12px;
      color: #6b7280;
    }

    .notif-item.unread .notif-time {
      color: #166534;
      font-weight: 700;
    }

    .notif-see-all {
      width: 100%;
      padding: 14px;
      border: none !important;
      background: white !important;
      color: #166534 !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
      border-top: 1px solid #e5e7eb !important;
    }

    .notif-see-all:hover {
      background: #f0fdf4 !important;
    }

    .notif-empty {
      padding: 24px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }

    .notif-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notif-modal {
      width: 520px;
      max-height: 75vh;
      background: white;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
    }

    .notif-modal-header {
      padding: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }

    .notif-modal-header h2 {
      margin: 0;
      font-size: 18px;
    }

    .notif-close {
      border: none;
      background: transparent;
      font-size: 24px;
      cursor: pointer;
    }

    .notif-modal-body {
      max-height: 60vh;
      overflow-y: auto;
    }
  `;

  document.head.appendChild(style);
}

async function loadNotifications() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const notifications = await res.json();

    if (!res.ok) {
      console.error("Notification API error:", notifications);
      return;
    }

    allNotifications = notifications;

    renderNotifications(notifications);
    updateNotificationDot(notifications);

  } catch (err) {
    console.error("Notification error:", err);
  }
}

function renderNotifications(notifications) {
  const dropdown = document.getElementById("headerNotifDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = `
    <div class="notif-panel-header">
      <h3>Notifications</h3>
      <button class="mark-read" id="headerMarkRead" type="button">
        Mark all as read
      </button>
    </div>

    <div class="notif-list" id="notifList"></div>

    <button class="notif-see-all" id="seeAllNotifications" type="button">
      See all notifications
    </button>
  `;

  const list = document.getElementById("notifList");

  if (!notifications || notifications.length === 0) {
    list.innerHTML = `<div class="notif-empty">No notifications yet.</div>`;
  } else {
    list.innerHTML = notifications.slice(0, 4).map(n => createNotifItem(n)).join("");
  }

  bindNotifEvents();

  document.getElementById("headerMarkRead")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  markAllNotificationsRead();
});

  document.getElementById("seeAllNotifications")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAllNotificationsModal();
  });
}

function createNotifItem(n) {
  const isUnread = Number(n.isRead) === 0;

  return `
    <div
      class="notif-item ${isUnread ? "unread" : ""}"
      data-id="${n.notifID}"
      style="
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px 18px;
        border-bottom: 1px solid #e5e7eb;
        cursor: pointer;
        background: ${isUnread ? "#f0fdf4" : "#ffffff"};
      "
    >
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: ${isUnread ? "#166534" : "#e5e7eb"};
        color: ${isUnread ? "#ffffff" : "#6b7280"};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 15px;
      ">
        <i class="fa-solid fa-bell"></i>
      </div>

      <div style="flex:1;">
        <p style="
          margin: 0 0 4px;
          font-size: 13px;
          line-height: 1.45;
          color: ${isUnread ? "#111827" : "#6b7280"};
          font-weight: ${isUnread ? "800" : "400"};
        ">
          ${escapeHtml(n.message)}
        </p>

        <small style="
          font-size: 12px;
          color: ${isUnread ? "#166534" : "#9ca3af"};
          font-weight: ${isUnread ? "700" : "400"};
        ">
          ${new Date(n.createdAt).toLocaleString()}
        </small>
      </div>

      ${
        isUnread
          ? `<span class="notif-dot" style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #1877f2;
              margin-top: 14px;
              flex-shrink: 0;
            "></span>`
          : ``
      }
    </div>
  `;
}

function bindNotifEvents() {
  document.querySelectorAll(".notif-item").forEach(item => {
    item.onclick = async (e) => {
      e.stopPropagation();

      const notifID = item.dataset.id;
      await markNotificationRead(notifID);

      item.classList.remove("unread");
      item.style.background = "#ffffff";

      const text = item.querySelector("p");
      const time = item.querySelector("small");
      const dot = item.querySelector(".notif-dot");

      if (text) {
        text.style.fontWeight = "400";
        text.style.color = "#6b7280";
      }

      if (time) {
        time.style.fontWeight = "400";
        time.style.color = "#9ca3af";
      }

      if (dot) dot.remove();
    };
  });
}

function openAllNotificationsModal() {
  const oldModal = document.getElementById("notifModalOverlay");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.className = "notif-modal-overlay";
  modal.id = "notifModalOverlay";

  modal.innerHTML = `
    <div class="notif-modal">
      <div class="notif-modal-header">
        <h2>All Notifications</h2>
        <button class="notif-close" onclick="closeAllNotificationsModal()">×</button>
      </div>

      <div class="notif-modal-body">
        ${
          allNotifications.length === 0
            ? `<div class="notif-empty">No notifications yet.</div>`
            : allNotifications.map(n => createNotifItem(n)).join("")
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  bindNotifEvents();

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAllNotificationsModal();
  });
}

function closeAllNotificationsModal() {
  document.getElementById("notifModalOverlay")?.remove();
}

function updateNotificationDot(notifications) {
  const dot = document.getElementById("headerNotifDot");
  const bell = document.getElementById("headerNotifBtn");

  const unreadCount = notifications.filter(n => Number(n.isRead) === 0).length;

  if (dot) {
    dot.textContent = "";
    dot.classList.toggle("hidden", unreadCount === 0);
  }

  if (notifications.length > lastNotifCount && bell) {
    bell.classList.add("bell-animate");

    setTimeout(() => {
      bell.classList.remove("bell-animate");
    }, 700);
  }

  lastNotifCount = notifications.length;
}

async function markNotificationRead(notifID) {
  const token = localStorage.getItem("token");
  if (!token || !notifID) return;

  await fetch(`${API_URL}/notifications/${notifID}/read`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  
}

async function markAllNotificationsRead() {
  const token = localStorage.getItem("token");
  if (!token) return;

  await fetch(`${API_URL}/notifications/read-all`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  loadNotifications();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.closeAllNotificationsModal = closeAllNotificationsModal;
