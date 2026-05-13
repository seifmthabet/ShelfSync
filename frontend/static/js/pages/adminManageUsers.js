import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { usersService } from "../services/usersService.js";

const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", () => {
  window.location.href = "adminDashboard.html";
});

const logoutButton = document.getElementById("btn-logout");
logoutButton?.addEventListener("click", () => {
  Auth.logout();
  window.location.href = "loginPage.html";
});

const state = {
  users: [],
  filtered: [],
  currentPage: 1,
  pageSize: 20,
  searchQuery: "",
  roleFilter: "",
  statusFilter: "",
};

const ui = {
  searchInput: domHelper.query("#searchInput"),
  roleFilter: domHelper.query("#roleFilter"),
  statusFilter: domHelper.query("#statusFilter"),
  applyFiltersBtn: domHelper.query("#applyFilters"),
  usersTableBody: domHelper.query("#usersTableBody"),
  emptyState: domHelper.query("#emptyState"),
  usersContainer: domHelper.query("#usersContainer"),
  pageNumbers: domHelper.query("#pageNumbers"),
  prevPage: domHelper.query("#prevPage"),
  nextPage: domHelper.query("#nextPage"),
  userModal: domHelper.query("#userModal"),
  closeModal: domHelper.query("#closeModal"),
  closeModalBtn: domHelper.query("#closeModalBtn"),
  modalBody: domHelper.query("#modalBody"),
};

function mapApiUser(u) {
  const role = (u.role || "USER").toString().toLowerCase();
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    joined: u.date_joined,
    active_loans: 0,
    reviews: 0,
    status: u.is_active === false ? "inactive" : "active",
    raw: u,
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isAuthenticated() || !Auth.isAdmin()) {
    window.location.href = "loginPage.html";
    return;
  }
  await loadUsers();
  setupEventListeners();
});

function setupEventListeners() {
  ui.applyFiltersBtn?.addEventListener("click", () => {
    state.searchQuery = ui.searchInput?.value || "";
    state.roleFilter = ui.roleFilter?.value || "";
    state.statusFilter = ui.statusFilter?.value || "";
    state.currentPage = 1;
    filterAndRender();
  });

  ui.searchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      ui.applyFiltersBtn?.click();
    }
  });

  ui.closeModal?.addEventListener("click", closeUserModal);
  ui.closeModalBtn?.addEventListener("click", closeUserModal);

  ui.prevPage?.addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });

  ui.nextPage?.addEventListener("click", () => {
    const totalPages = Math.ceil(state.filtered.length / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderTable();
    }
  });
}

async function loadUsers() {
  try {
    const data = await usersService.getAllUsers();
    const list = Array.isArray(data) ? data : data?.results ?? [];
    state.users = list.map(mapApiUser);
    filterAndRender();
  } catch (error) {
    console.error("Error loading users:", error);
    state.users = [];
    filterAndRender();
  }
}

function filterAndRender() {
  let filtered = state.users.filter((user) => {
    const matchesSearch =
      !state.searchQuery ||
      user.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(state.searchQuery.toLowerCase());

    const matchesRole =
      !state.roleFilter || user.role.toLowerCase() === state.roleFilter.toLowerCase();

    const matchesStatus =
      !state.statusFilter || user.status.toLowerCase() === state.statusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  state.filtered = filtered;
  state.currentPage = 1;
  renderTable();
}

function renderTable() {
  if (state.filtered.length === 0) {
    if (ui.usersContainer) ui.usersContainer.style.display = "none";
    if (ui.emptyState) ui.emptyState.style.display = "block";
    if (ui.pageNumbers) ui.pageNumbers.innerHTML = "";
    return;
  }

  if (ui.usersContainer) ui.usersContainer.style.display = "block";
  if (ui.emptyState) ui.emptyState.style.display = "none";

  const startIdx = (state.currentPage - 1) * state.pageSize;
  const endIdx = startIdx + state.pageSize;
  const paginatedUsers = state.filtered.slice(startIdx, endIdx);

  if (ui.usersTableBody) {
    ui.usersTableBody.innerHTML = paginatedUsers.map(createTableRow).join("");
  }

  renderPagination();

  document.querySelectorAll(".user-row").forEach((row) => {
    row.addEventListener("click", () => {
      const userId = row.dataset.userId;
      const user = state.users.find((u) => u.id === userId);
      showUserModal(user);
    });
  });
}

function createTableRow(user) {
  const roleClass = user.role === "admin" ? "role-badge--admin" : "role-badge--user";
  const statusClass = user.status === "active" ? "status-badge--active" : "status-badge--inactive";
  const statusText = user.status === "active" ? "Active" : "Inactive";

  return `
        <tr class="user-row" data-user-id="${user.id}">
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${roleClass}">${user.role}</span></td>
            <td>${formatDate(user.joined)}</td>
            <td>${user.active_loans}</td>
            <td>${user.reviews}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm" onclick="editUser('${user.id}', event)">Edit</button>
                    <button class="btn-sm" onclick="suspendUser('${user.id}', event)">Suspend</button>
                </div>
            </td>
        </tr>
    `;
}

function renderPagination() {
  const totalPages = Math.ceil(state.filtered.length / state.pageSize);
  let paginationHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const activeClass = i === state.currentPage ? "page-num--active" : "";
    paginationHTML += `<button class="page-num ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (ui.pageNumbers) ui.pageNumbers.innerHTML = paginationHTML;
  if (ui.prevPage) ui.prevPage.disabled = state.currentPage === 1;
  if (ui.nextPage) ui.nextPage.disabled = state.currentPage === totalPages;
}

window.goToPage = function (pageNum) {
  state.currentPage = pageNum;
  renderTable();
};

window.editUser = async function (userId, event) {
  event.stopPropagation();
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;
  const name = prompt("Full name", user.name);
  if (name === null) return;
  const rolePick = prompt("Role: USER or ADMIN", user.raw?.role || "USER");
  if (rolePick === null) return;
  const role = rolePick.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
  try {
    await usersService.patchAdminUser(userId, { name: name.trim(), role });
    await loadUsers();
  } catch (e) {
    alert(e?.message || "Update failed");
  }
};

window.suspendUser = async function (userId, event) {
  event.stopPropagation();
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;
  const nextActive = user.status !== "active";
  const msg = nextActive ? `Reactivate ${user.name}?` : `Suspend ${user.name}?`;
  if (!confirm(msg)) return;
  try {
    await usersService.patchAdminUser(userId, { is_active: nextActive });
    await loadUsers();
  } catch (e) {
    alert(e?.message || "Update failed");
  }
};

function showUserModal(user) {
  if (!ui.modalBody || !ui.userModal) return;
  ui.modalBody.innerHTML = `
        <div>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Joined:</strong> ${formatDate(user.joined)}</p>
            <p><strong>Status:</strong> ${user.status}</p>
        </div>
    `;
  ui.userModal.style.display = "flex";
}

function closeUserModal() {
  if (ui.userModal) ui.userModal.style.display = "none";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

window.addEventListener("click", (e) => {
  if (e.target === ui.userModal) {
    closeUserModal();
  }
});
