import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { borrowService } from "../services/borrowService.js";
import { hrefPage } from "../core/config.js";

// Navigation
const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", () => {
    window.location.href = "adminDashboard.html";
});

const logoutButton = document.getElementById("btn-logout");
logoutButton?.addEventListener("click", () => {
    Auth.logout({ redirect: false });
    window.location.href = hrefPage("login");
});

const state = {
    borrowRequests: [],
    filtered: [],
    stats: {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
    },
    statusFilter: "",
    sortFilter: "date-requested",
};

const ui = {
    statusFilter: domHelper.query("#statusFilter"),
    sortFilter: domHelper.query("#sortFilter"),
    applyFiltersBtn: domHelper.query("#applyFilters"),
    requestsContainer: domHelper.query("#requestsContainer"),
    emptyState: domHelper.query("#emptyState"),
    totalRequests: domHelper.query("#totalRequests"),
    pendingRequests: domHelper.query("#pendingRequests"),
    approvedRequests: domHelper.query("#approvedRequests"),
    rejectedRequests: domHelper.query("#rejectedRequests"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = hrefPage("login");
        return;
    }
    if (!Auth.isAdmin()) {
        window.location.href = hrefPage("userDashboard");
        return;
    }
    await loadBorrowRequests();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    ui.applyFiltersBtn?.addEventListener("click", () => {
        state.statusFilter = ui.statusFilter?.value || "";
        state.sortFilter = ui.sortFilter?.value || "date-requested";
        filterAndRender();
    });
}

// Load borrow requests
async function loadBorrowRequests() {
    try {
        const data = await borrowService.getAllBorrowRequests();
        const list = Array.isArray(data) ? data : data?.results ?? [];
        state.borrowRequests = list.map((r) => ({
            ...r,
            risk_score: r.risk_score || "low",
            requested_date: r.requested_date || r.requested_at,
        }));
        calculateStatistics();
        filterAndRender();
    } catch (error) {
        console.error("Error loading borrow requests:", error);
    }
}

// Calculate statistics
function calculateStatistics() {
    const requests = state.borrowRequests;
    state.stats.totalRequests = requests.length;
    state.stats.pendingRequests = requests.filter(r => r.status === "pending").length;
    state.stats.approvedRequests = requests.filter(r => r.status === "approved").length;
    state.stats.rejectedRequests = requests.filter(r => r.status === "rejected").length;

    updateStatistics();
}

// Update statistics UI
function updateStatistics() {
    if (ui.totalRequests) ui.totalRequests.textContent = state.stats.totalRequests;
    if (ui.pendingRequests) ui.pendingRequests.textContent = state.stats.pendingRequests;
    if (ui.approvedRequests) ui.approvedRequests.textContent = state.stats.approvedRequests;
    if (ui.rejectedRequests) ui.rejectedRequests.textContent = state.stats.rejectedRequests;
}

// Filter and render
function filterAndRender() {
    let filtered = state.borrowRequests.filter(request => {
        if (!state.statusFilter) return true;
        return request.status.toLowerCase() === state.statusFilter.toLowerCase();
    });

    // Sort
    filtered = sortRequests(filtered, state.sortFilter);
    state.filtered = filtered;

    if (filtered.length === 0) {
        showEmptyState();
    } else {
        renderCards(filtered);
    }
}

// Sort requests
function sortRequests(requests, sortBy) {
    const sorted = [...requests];

    switch (sortBy) {
        case "date-requested":
            sorted.sort((a, b) => new Date(b.requested_date) - new Date(a.requested_date));
            break;
        case "oldest":
            sorted.sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date));
            break;
        case "risk-score":
            const riskOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => {
                const ra = riskOrder[a.risk_score] ?? 2;
                const rb = riskOrder[b.risk_score] ?? 2;
                return ra - rb;
            });
            break;
    }

    return sorted;
}

// Render cards
function renderCards(requests) {
    ui.requestsContainer.innerHTML = requests.map(request => createRequestCard(request)).join("");
    ui.emptyState.style.display = "none";

    // Add event listeners
    document.querySelectorAll(".btn-approve").forEach(btn => {
        btn.addEventListener("click", (e) => approveRequest(e.target.dataset.id));
    });

    document.querySelectorAll(".btn-reject").forEach(btn => {
        btn.addEventListener("click", (e) => rejectRequest(e.target.dataset.id));
    });
}

// Create request card
function createRequestCard(request) {
    const riskClass = `risk-${request.risk_score}`;

    return `
        <div class="request-card">
            <div class="request-card__header">
                <div>
                    <h3 class="request-title">${request.book_title}</h3>
                    <p style="font-size: 12px; color: var(--ink-muted); margin-top: 4px;">${request.book_author}</p>
                </div>
                <div>
                    <span class="request-status status--${request.status}">${request.status.toUpperCase()}</span>
                    <span class="risk-score risk-${request.risk_score}">Risk: ${request.risk_score.toUpperCase()}</span>
                </div>
            </div>

            <div class="request-info">
                <div class="info-group">
                    <span class="info-label">Requester</span>
                    <span class="info-value">${request.user_name}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">Email</span>
                    <span class="info-value">${request.user_email}</span>
                </div>
                <div class="info-group">
                    <span class="info-label">User History</span>
                    <span class="info-value">${request.user_loans_count} loans, ${request.review_count} reviews</span>
                </div>
            </div>

            <div class="request-dates">
                Requested: ${formatDate(request.requested_date)}
            </div>

            ${request.status === "pending" ? `
                <div class="card-actions">
                    <button class="btn btn-approve" data-id="${request.id}">Approve</button>
                    <button class="btn btn-reject" data-id="${request.id}">Reject</button>
                </div>
            ` : ""}
        </div>
    `;
}

// Approve request
async function approveRequest(requestId) {
    try {
        if (confirm("Are you sure you want to approve this borrow request?")) {
            await borrowService.approveBorrowRequest(requestId);
            alert("Request approved successfully!");
            await loadBorrowRequests();
        }
    } catch (error) {
        console.error("Error approving request:", error);
        alert(error?.message || "Failed to approve request");
    }
}

// Reject request
async function rejectRequest(requestId) {
    try {
        if (confirm("Are you sure you want to reject this borrow request?")) {
            const reason = prompt("Optional rejection reason:", "") || "";
            await borrowService.rejectBorrowRequest(requestId, { rejection_reason: reason });
            alert("Request rejected successfully!");
            await loadBorrowRequests();
        }
    } catch (error) {
        console.error("Error rejecting request:", error);
        alert(error?.message || "Failed to reject request");
    }
}

// Show empty state
function showEmptyState() {
    ui.requestsContainer.innerHTML = "";
    ui.emptyState.style.display = "block";
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

// Make functions globally accessible
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
