const API_URL = window.API_BASE || window.ASA_API_BASE || `${window.location.origin}/api`;

let guestItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadGuestItems();
  await loadGuestCategories();
});

class GuestHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div>
        <header class="home-header">
          <div class="logo-container">
            <span class="logo-link" onclick="gShowPage('browse')">
              <img src="/ASA_logo/Final logo.png" alt="ASA Logo" class="main-logo">
            </span>
          </div>

          <nav class="main-nav">
            <button class="nav-item active" id="gnav-browse" onclick="gShowPage('browse')">
              <i class="fa-solid fa-table-cells-large"></i> Browse
            </button>

            <button class="nav-item" id="gnav-lost" onclick="gShowPage('lost')">
              <i class="fa-solid fa-triangle-exclamation"></i> Lost Items
            </button>

            <button class="nav-item" id="gnav-found" onclick="gShowPage('found')">
              <i class="fa-solid fa-magnifying-glass"></i> Found Items
            </button>

            <button class="nav-item" onclick="triggerLoginGate('post')">
              <i class="fa-solid fa-circle-plus"></i> Post Item
            </button>
          </nav>

          <div class="header-right">
            <a href="/login/landing.html" class="gbtn gbtn-primary">Login</a>
          </div>
        </header>
      </div>
    `;
  }
}

customElements.define("guest-header", GuestHeader);

function gShowPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`gnav-${page}`)?.classList.add("active");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadGuestItems() {
  try {
    const res = await fetch(`${API_URL}/items/browse`);
    const items = await res.json();

    if (!res.ok) {
      throw new Error(items.error || "Failed to load items.");
    }

    guestItems = items;

    const lostItems = items.filter(item => item.itemType === "lost");
    const foundItems = items.filter(item => item.itemType === "found");

    renderGuestItems("lostItemsGrid", lostItems);
    renderGuestItems("foundItemsGrid", foundItems);
    renderGuestItems("recentItemsGrid", items.slice(0, 4));

    document.getElementById("guestLostCount").textContent = lostItems.length;
    document.getElementById("guestFoundCount").textContent = foundItems.length;

  } catch (err) {
    console.error("Guest items error:", err);
  }
}

async function loadGuestCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`);
    const categories = await res.json();

    if (!res.ok) return;

    const options = categories
      .map(c => `<option value="${c.categoryName.toLowerCase()}">${c.categoryName}</option>`)
      .join("");

    const lostFilter = document.getElementById("lostCatFilter");
    const foundFilter = document.getElementById("foundCatFilter");

    if (lostFilter) {
      lostFilter.innerHTML = `<option value="">All Categories</option>${options}`;
    }

    if (foundFilter) {
      foundFilter.innerHTML = `<option value="">All Categories</option>${options}`;
    }

  } catch (err) {
    console.error("Guest categories error:", err);
  }
}

function renderGuestItems(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No items found</h3>
        <p>There are no items to show yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const isLost = item.itemType === "lost";
    const date = new Date(item.dateOccured).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const emoji = getGuestEmoji(item.categoryName, item.itemType);
    const gradient = isLost
      ? "linear-gradient(135deg,#dbeafe,#bfdbfe)"
      : "linear-gradient(135deg,#dcfce7,#bbf7d0)";

    return `
      <div class="item-card"
        data-title="${escapeHtml(item.title)}"
        data-cat="${escapeHtml(item.categoryName)}"
        data-desc="${escapeHtml(item.description || "No description available.")}"
        data-loc="${escapeHtml(item.locationDetail)}"
        data-date="${date}"
        data-type="${item.itemType}"
        onclick="triggerLoginGate('details')"
      >
        <div class="card-img-wrap">
          <div style="
            width:100%;
            height:100%;
            background:${gradient};
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:48px;
          ">
            ${emoji}
          </div>

          <span class="badge badge-${item.itemType}">${item.itemType.toUpperCase()}</span>
          <span class="badge badge-pending">PENDING</span>
        </div>

        <div class="card-info">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="category-tag">${escapeHtml(item.categoryName)}</span>
          <p class="card-desc">${escapeHtml(item.description || "No description available.")}</p>

          <div class="card-footer-row">
            <span>📍 ${escapeHtml(item.locationDetail)}</span>
            <span class="view-link">VIEW DETAILS</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function openItemModal(card) {
  const type = card.dataset.type;
  const title = card.dataset.title;
  const cat = card.dataset.cat;
  const desc = card.dataset.desc;
  const loc = card.dataset.loc;
  const date = card.dataset.date;

  const isLost = type === "lost";
  const emoji = getGuestEmoji(cat, type);
  const gradient = isLost
    ? "linear-gradient(135deg,#dbeafe,#bfdbfe)"
    : "linear-gradient(135deg,#dcfce7,#bbf7d0)";

  const imgSec = document.getElementById("modalImgSec");
  imgSec.style.background = gradient;
  imgSec.style.minHeight = "240px";
  imgSec.style.borderRadius = "12px";
  imgSec.style.fontSize = "80px";
  imgSec.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:240px">
      ${emoji}
    </span>
  `;

  document.getElementById("modalTypeBadge").textContent = type.toUpperCase();
  document.getElementById("modalTypeBadge").className = `badge badge-${type}`;
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalCat").innerHTML = `<span class="category-tag">${cat}</span>`;
  document.getElementById("modalLoc").textContent = `📍 ${loc}`;
  document.getElementById("modalDate").textContent = `🗓 ${date}`;
  document.getElementById("modalDesc").textContent = desc;

  const claimBtn = document.querySelector("#itemModal .btn-claim");
const gateHint = document.querySelector("#itemModal .guest-modal-hint");

if (claimBtn) {
  claimBtn.style.display = type === "found" ? "block" : "none";
}

if (gateHint) {
  gateHint.style.display = type === "found" ? "block" : "none";
}

  document.getElementById("itemModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeItemModal() {
  document.getElementById("itemModal").classList.remove("active");
  document.body.style.overflow = "";
}

function triggerLoginGate(action = "default") {
  const title = document.getElementById("gateTitle");
  const msg = document.getElementById("gateMsg");

  if (action === "claim") {
    title.textContent = "Login Required to Claim";
    msg.textContent = "Please login or create an account first before requesting a claim.";
  } else if (action === "post") {
    title.textContent = "Login Required to Post";
    msg.textContent = "Please login or create an account first before posting lost or found items.";
  } else if (action === "report") {
    title.textContent = "Login Required to Report";
    msg.textContent = "Please login or create an account first before reporting or appealing an item.";
  } else if (action === "details") {
  title.textContent = "Login Required to View Details";
  msg.textContent = "Please login or create an account first to view full item details.";
} else {
    title.textContent = "Login Required";
    msg.textContent = "You need an account to continue.";
  }

  document.getElementById("loginGatePopup").classList.add("active");
}

function closeLoginGate() {
  document.getElementById("loginGatePopup").classList.remove("active");
}

function filterItems(type) {
  const query = document.getElementById(`${type}Search`)?.value.toLowerCase() || "";
  const catVal = document.getElementById(`${type}CatFilter`)?.value.toLowerCase() || "";
  const cards = document.querySelectorAll(`#${type}ItemsGrid .item-card`);

  cards.forEach(card => {
    const title = (card.dataset.title || "").toLowerCase();
    const desc = (card.dataset.desc || "").toLowerCase();
    const cat = (card.dataset.cat || "").toLowerCase();

    const matchesSearch = !query || title.includes(query) || desc.includes(query);
    const matchesCategory = !catVal || cat === catVal;

    card.style.display = matchesSearch && matchesCategory ? "" : "none";
  });
}

function getGuestEmoji(category, type) {
  if (type === "lost") return "👛";

  const key = (category || "").toLowerCase();

  if (key.includes("electronic")) return "📱";
  if (key.includes("document") || key.includes("id")) return "🪪";
  if (key.includes("key")) return "🔑";
  if (key.includes("book")) return "📚";
  if (key.includes("bag")) return "🎒";
  if (key.includes("clothing")) return "👕";
  if (key.includes("accessor")) return "👓";

  return "📦";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", (e) => {
  if (e.target.id === "itemModal") closeItemModal();
  if (e.target.id === "loginGatePopup") closeLoginGate();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeItemModal();
    closeLoginGate();
  }
});
