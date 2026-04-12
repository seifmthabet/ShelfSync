import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";

// Navigation
const homeButton = document.getElementById("navbar__brand");
homeButton.addEventListener("click", () => {
    window.location.href = "adminDashboard.html";
});

const logoutButton = document.getElementById("btn-logout");
logoutButton.addEventListener("click", () => {
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

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isAuthenticated() || !Auth.isAdmin()) {
        window.location.href = "loginPage.html";
        return;
    }
    await loadUsers();
    setupEventListeners();
});

// Setup event listeners
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

// Load users
async function loadUsers() {
    try {
        // Mock data for now - replace with API call
        const mockUsers = [
            {
                id: "1",
                name: "Alice Johnson",
                email: "alice@example.com",
                role: "admin",
                joined: "2024-01-15",
                active_loans: 2,
                reviews: 8,
                status: "active",
            },
            {
                id: "2",
                name: "Bob Smith",
                email: "bob@example.com",
                role: "user",
                joined: "2024-02-20",
                active_loans: 3,
                reviews: 5,
                status: "active",
            },
            {
                id: "3",
                name: "Carol Davis",
                email: "carol@example.com",
                role: "user",
                joined: "2024-03-10",
                active_loans: 1,
                reviews: 2,
                status: "inactive",
            },
            {
                id: "4",
                name: "David Wilson",
                email: "david@example.com",
                role: "user",
                joined: "2024-01-05",
                active_loans: 0,
                reviews: 12,
                status: "active",
            },
        ];

        state.users = mockUsers;
        filterAndRender();
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

// Filter users
function filterAndRender() {
    let filtered = state.users.filter(user => {
        const matchesSearch = !state.searchQuery || 
            user.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(state.searchQuery.toLowerCase());

        const matchesRole = !state.roleFilter || 
            user.role.toLowerCase() === state.roleFilter.toLowerCase();

        const matchesStatus = !state.statusFilter || 
            user.status.toLowerCase() === state.statusFilter.toLowerCase();

        return matchesSearch && matchesRole && matchesStatus;
    });

    state.filtered = filtered;
    state.currentPage = 1;
    renderTable();
}

// Render table
function renderTable() {
    if (state.filtered.length === 0) {
        ui.usersContainer.style.display = "none";
        ui.emptyState.style.display = "block";
        ui.pageNumbers.innerHTML = "";
        return;
    }

    ui.usersContainer.style.display = "block";
    ui.emptyState.style.display = "none";

    // Paginate
    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;
    const paginatedUsers = state.filtered.slice(startIdx, endIdx);

    // Render rows
    ui.usersTableBody.innerHTML = paginatedUsers.map(user => createTableRow(user)).join("");

    // Render pagination
    renderPagination();

    // Add event listeners for row clicks
    document.querySelectorAll(".user-row").forEach(row => {
        row.addEventListener("click", () => {
            const userId = row.dataset.userId;
            const user = state.users.find(u => u.id === userId);
            showUserModal(user);
        });
    });
}

// Create table row
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

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(state.filtered.length / state.pageSize);
    let paginationHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === state.currentPage ? "page-num--active" : "";
        paginationHTML += `<button class="page-num ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }

    ui.pageNumbers.innerHTML = paginationHTML;

    ui.prevPage.disabled = state.currentPage === 1;
    ui.nextPage.disabled = state.currentPage === totalPages;
}

// Go to page
window.goToPage = function(pageNum) {
    state.currentPage = pageNum;
    renderTable();
};

// Edit user
window.editUser = function(userId, event) {
    event.stopPropagation();
    const user = state.users.find(u => u.id === userId);
    if (user) {
        // TODO: Implement edit functionality
        alert("Edit user: " + user.name);
    }
};

// Suspend user
window.suspendUser = function(userId, event) {
    event.stopPropagation();
    const user = state.users.find(u => u.id === userId);
    if (user && confirm(`Are you sure you want to ${user.status === "active" ? "suspend" : "reactivate"} ${user.name}?`)) {
        // TODO: Make API call to suspend user
        user.status = user.status === "active" ? "inactive" : "active";
        renderTable();
    }
};

// Show user modal
function showUserModal(user) {
    ui.modalBody.innerHTML = `
        <div>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Joined:</strong> ${formatDate(user.joined)}</p>
            <p><strong>Active Loans:</strong> ${user.active_loans}</p>
            <p><strong>Reviews:</strong> ${user.reviews}</p>
            <p><strong>Status:</strong> ${user.status}</p>
        </div>
    `;
    ui.userModal.style.display = "flex";
}

// Close user modal
function closeUserModal() {
    ui.userModal.style.display = "none";
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
    });
}

// Close modal on background click
window.addEventListener("click", (e) => {
    if (e.target === ui.userModal) {
        closeUserModal();
    }
});
