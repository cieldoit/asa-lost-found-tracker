const API_URL = window.API_BASE || window.ASA_API_BASE || `${window.location.origin}/api`;

document.addEventListener("DOMContentLoaded", () => {
  loadStudentItems();
});

async function loadStudentStats() {
  const response = await fetch(`${API_URL}/items/stats`);
  const stats = await response.json();
  if (!response.ok) throw new Error(stats.error || 'Failed to load item statistics.');

  document.getElementById("statLost").textContent = Number(stats.totalLost || 0);
  document.getElementById("statFound").textContent = Number(stats.totalFound || 0);
  document.getElementById("statClaimed").textContent = Number(stats.totalClaimed || 0);
}
async function loadStudentItems() {
  const lostGrid = document.getElementById("lostItemsGrid");
  const foundGrid = document.getElementById("foundItemsGrid");

  try {
    const response = await fetch(`${API_URL}/items/browse`);
    const items = await response.json();

    console.log("Loaded items:", items);

    const lostItems = items.filter(item => item.itemType === "lost");
    const foundItems = items.filter(item => item.itemType === "found");

    await loadStudentStats();

    lostGrid.innerHTML = lostItems.map(createItemCard).join("");
    foundGrid.innerHTML = foundItems.map(createItemCard).join("");

  } catch (error) {
    console.error("Failed to load student items:", error);

    lostGrid.innerHTML = "<p>Failed to load lost items.</p>";
    foundGrid.innerHTML = "<p>Failed to load found items.</p>";
  }
}

function createItemCard(item) {
  const typeColor = item.itemType === "lost" ? "#ef4444" : "#22c55e";

  return `
    <div style="
      background:white;
      border-radius:16px;
      padding:20px;
      margin:15px 0;
      box-shadow:0 8px 20px rgba(0,0,0,0.08);
      cursor:pointer;
    "
    onclick='openModal(${JSON.stringify(item)})'
    >

      <div style="display:flex; justify-content:space-between;">
        <h3>${item.title}</h3>
        <span style="
          background:${typeColor};
          color:white;
          padding:5px 10px;
          border-radius:8px;
          font-size:12px;
        ">
          ${item.itemType.toUpperCase()}
        </span>
      </div>

      <p><strong><i class="fa-solid fa-folder-open" aria-hidden="true"></i></strong> ${item.categoryName}</p>
      <p><strong><i class="fa-solid fa-location-dot" aria-hidden="true"></i></strong> ${item.locationDetail}</p>
      <p><strong><i class="fa-solid fa-calendar-days" aria-hidden="true"></i></strong> ${formatDate(item?.dateOccured)}</p>

    </div>
  `;
}


function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function openModal(item) {
  document.getElementById("itemModal").style.display = "flex";

  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalCategory").textContent = item.categoryName;
  document.getElementById("modalLocation").textContent = item.locationDetail;
  document.getElementById("modalType").textContent = item.itemType;
  document.getElementById("modalDate").textContent = formatDate(item?.dateOccured);
}

function closeModal() {
  document.getElementById("itemModal").style.display = "none";
}
