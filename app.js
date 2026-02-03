const STORAGE_KEY = "almoxarifado-estoque";
const DEFAULT_DATA = [
  {
    id: "MAT-001",
    name: "Cimento CP-II 50kg",
    category: "Cimentos",
    location: "Galpão A",
    unit: "saco",
    stock: 120,
    minimum: 40,
    supplier: "Construmax",
    updatedAt: "2024-02-02T08:30:00",
  },
  {
    id: "MAT-002",
    name: "Vergalhão CA-50 10mm",
    category: "Aço",
    location: "Pátio 2",
    unit: "barra",
    stock: 60,
    minimum: 80,
    supplier: "Ferrometal",
    updatedAt: "2024-02-01T16:45:00",
  },
  {
    id: "MAT-003",
    name: "Areia lavada",
    category: "Agregados",
    location: "Caixa 3",
    unit: "m³",
    stock: 12,
    minimum: 15,
    supplier: "Pedreira Silva",
    updatedAt: "2024-02-01T11:20:00",
  },
  {
    id: "MAT-004",
    name: "Tubo PVC 100mm",
    category: "Hidráulica",
    location: "Almox 1",
    unit: "barra",
    stock: 30,
    minimum: 10,
    supplier: "HidroMais",
    updatedAt: "2024-02-02T09:10:00",
  },
];

const inventoryRows = document.getElementById("inventoryRows");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const statusFilter = document.getElementById("statusFilter");
const totalItems = document.getElementById("totalItems");
const totalStock = document.getElementById("totalStock");
const criticalItems = document.getElementById("criticalItems");
const lastMove = document.getElementById("lastMove");

const itemModal = document.getElementById("itemModal");
const moveModal = document.getElementById("moveModal");
const openModalButton = document.getElementById("openModal");
const closeModalButton = document.getElementById("closeModal");
const cancelModalButton = document.getElementById("cancelModal");
const itemForm = document.getElementById("itemForm");
const resetDataButton = document.getElementById("resetData");

const moveButtons = document.querySelectorAll("[data-move]");
const moveTitle = document.getElementById("moveTitle");
const closeMoveModalButton = document.getElementById("closeMoveModal");
const cancelMoveModalButton = document.getElementById("cancelMoveModal");
const moveForm = document.getElementById("moveForm");

let inventory = loadInventory();
let lastMoveEntry = null;
let activeMoveType = "entrada";

function loadInventory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Erro ao carregar estoque", error);
    }
  }
  return DEFAULT_DATA;
}

function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatus(item) {
  if (item.stock === 0) return "out";
  if (item.stock <= item.minimum) return "low";
  return "ok";
}

function buildFilters() {
  const categories = new Set();
  const locations = new Set();
  inventory.forEach((item) => {
    categories.add(item.category);
    locations.add(item.location);
  });

  categoryFilter.innerHTML = "<option value=\"\">Todas as categorias</option>";
  locationFilter.innerHTML = "<option value=\"\">Todos os locais</option>";

  [...categories].sort().forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  [...locations].sort().forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

function renderSummary() {
  totalItems.textContent = inventory.length;
  totalStock.textContent = inventory.reduce((sum, item) => sum + item.stock, 0);
  criticalItems.textContent = inventory.filter((item) => item.stock <= item.minimum).length;
  lastMove.textContent = lastMoveEntry ? formatDate(lastMoveEntry.date) : "-";
}

function renderTable() {
  const query = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;
  const status = statusFilter.value;

  const rows = inventory.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.supplier.toLowerCase().includes(query);
    const matchesCategory = category ? item.category === category : true;
    const matchesLocation = location ? item.location === location : true;
    const matchesStatus = status ? getStatus(item) === status : true;
    return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
  });

  inventoryRows.innerHTML = "";

  rows.forEach((item) => {
    const statusClass = getStatus(item);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <strong>${item.name}</strong>
        <div class="muted">${item.id} · ${item.unit}</div>
      </td>
      <td>${item.category}</td>
      <td>${item.location}</td>
      <td>
        <span class="status-pill ${statusClass}">
          ${item.stock} ${item.unit}
        </span>
      </td>
      <td>${item.minimum} ${item.unit}</td>
      <td>${item.supplier}</td>
      <td>${formatDate(item.updatedAt)}</td>
      <td>
        <div class="action-buttons">
          <button data-action="entrada" data-id="${item.id}">Entrada</button>
          <button data-action="saida" data-id="${item.id}">Saída</button>
        </div>
      </td>
    `;
    inventoryRows.appendChild(row);
  });
}

function updateView() {
  buildFilters();
  renderSummary();
  renderTable();
  updateMoveSelect();
}

function toggleModal(modal, open) {
  if (open) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  } else {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
}

function handleItemSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(itemForm));
  const newItem = {
    id: `MAT-${String(inventory.length + 1).padStart(3, "0")}`,
    name: data.name,
    category: data.category,
    location: data.location,
    unit: data.unit,
    stock: Number(data.stock),
    minimum: Number(data.minimum),
    supplier: data.supplier,
    updatedAt: new Date().toISOString(),
  };
  inventory = [newItem, ...inventory];
  saveInventory();
  itemForm.reset();
  toggleModal(itemModal, false);
  updateView();
}

function updateMoveSelect() {
  const select = moveForm.querySelector("select[name='item']");
  select.innerHTML = "";
  inventory.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} (${item.stock} ${item.unit})`;
    select.appendChild(option);
  });
}

function handleMoveSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(moveForm));
  const item = inventory.find((entry) => entry.id === data.item);
  if (!item) return;

  const amount = Number(data.amount);
  if (activeMoveType === "saida") {
    item.stock = Math.max(0, item.stock - amount);
  } else {
    item.stock += amount;
  }
  item.updatedAt = new Date().toISOString();
  lastMoveEntry = {
    date: item.updatedAt,
    type: activeMoveType,
    responsible: data.responsible,
    notes: data.notes,
  };
  saveInventory();
  moveForm.reset();
  toggleModal(moveModal, false);
  updateView();
}

function openMoveModal(type, itemId) {
  activeMoveType = type;
  moveTitle.textContent = type === "entrada" ? "Registrar entrada" : "Registrar saída";
  updateMoveSelect();
  if (itemId) {
    moveForm.querySelector("select[name='item']").value = itemId;
  }
  toggleModal(moveModal, true);
}

searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);
locationFilter.addEventListener("change", renderTable);
statusFilter.addEventListener("change", renderTable);

openModalButton.addEventListener("click", () => toggleModal(itemModal, true));
closeModalButton.addEventListener("click", () => toggleModal(itemModal, false));
cancelModalButton.addEventListener("click", () => toggleModal(itemModal, false));
itemModal.addEventListener("click", (event) => {
  if (event.target === itemModal) toggleModal(itemModal, false);
});

resetDataButton.addEventListener("click", () => {
  inventory = [...DEFAULT_DATA];
  saveInventory();
  updateView();
});

itemForm.addEventListener("submit", handleItemSubmit);

moveButtons.forEach((button) => {
  button.addEventListener("click", () => openMoveModal(button.dataset.move));
});

inventoryRows.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const action = target.dataset.action;
  const itemId = target.dataset.id;
  if (action && itemId) {
    openMoveModal(action, itemId);
  }
});

closeMoveModalButton.addEventListener("click", () => toggleModal(moveModal, false));
cancelMoveModalButton.addEventListener("click", () => toggleModal(moveModal, false));
moveModal.addEventListener("click", (event) => {
  if (event.target === moveModal) toggleModal(moveModal, false);
});
moveForm.addEventListener("submit", handleMoveSubmit);

updateView();
