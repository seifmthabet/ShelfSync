import { ReviewsService } from "../services/reviewsService.js";
import { domHelper } from "../utils/domHelper.js";
import { formatters } from "../utils/formatters.js";

const adminDashboardButton = document.getElementById("admin-dashboard");
adminDashboardButton.addEventListener("click", () => {
  window.location.href = "adminDashboard.html";
});

// ══════════════════════════════════════════
//  State
// ══════════════════════════════════════════
const state = {
  allReviews: [],       // full list from API
  filtered: [],         // after search + filter
  currentPage: 1,
  pageSize: 5,
  activityFilter: "All Time",
  ratingFilter: 0,      // 0 = all ratings
  searchQuery: "",
};

// ══════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════

/** Build a filled/empty star string for a numeric rating (1-5). */
function buildStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  let html = "";
  if (full  > 0) html += `<span class="stars filled">${"★".repeat(full)}</span>`;
  if (empty > 0) html += `<span class="stars empty">${"★".repeat(empty)}</span>`;
  return html;
}

/** Random muted colour used as book thumbnail background. */
const THUMB_COLOURS = [
  "#4a7c5a","#5a8a7a","#c8a86a","#7a6a9a",
  "#b06a5a","#6a8aaa","#a07060","#608070",
];
function thumbColour(id) {
  return THUMB_COLOURS[id % THUMB_COLOURS.length];
}

// ══════════════════════════════════════════
//  Filter & search
// ══════════════════════════════════════════

function applyFilters() {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  state.filtered = state.allReviews.filter((review) => {
    // ── Period filter ──
    const created = new Date(review.created_at);
    if (state.activityFilter === "This Month" && created < monthStart) return false;
    if (state.activityFilter === "Today"      && created < today)      return false;

    // ── Rating filter ──
    if (state.ratingFilter > 0 && Math.round(review.rating) !== state.ratingFilter) return false;

    // ── Search filter ──
    if (state.searchQuery) {
      const q   = state.searchQuery.toLowerCase();
      const hit =
        (review.book_title  || "").toLowerCase().includes(q) ||
        (review.user_name   || "").toLowerCase().includes(q) ||
        (review.comment     || "").toLowerCase().includes(q);
      if (!hit) return false;
    }

    return true;
  });

  state.currentPage = 1;
  renderTable();
  updateTableCount();
  updatePagination();
  updateStats();
}

// ══════════════════════════════════════════
//  Stats cards
// ══════════════════════════════════════════

function updateStats() {
  const reviews = state.filtered;
  const total   = reviews.length;

  // total
  const totalEl = domHelper.query(".stat-card:nth-child(1) .stat-value");
  if (totalEl) totalEl.textContent = total.toLocaleString();

  // pending
  const pending    = reviews.filter((r) => r.status === "pending").length;
  const pendingEl  = domHelper.query(".stat-card--accent .stat-value");
  if (pendingEl) pendingEl.textContent = pending;

  // average rating
  const avgEl = domHelper.query(".stat-card:nth-child(3) .stat-value");
  if (avgEl) {
    if (total === 0) {
      avgEl.textContent = "—";
    } else {
      const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / total;
      avgEl.textContent = avg.toFixed(1);
    }
  }
}

// ══════════════════════════════════════════
//  Table rendering
// ══════════════════════════════════════════

function renderTable() {
  const tbody = domHelper.query(".review-table tbody");
  if (!tbody) return;

  const start   = (state.currentPage - 1) * state.pageSize;
  const pageRows = state.filtered.slice(start, start + state.pageSize);

  if (pageRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">
          No reviews match the current filters.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = pageRows.map((review) => buildRow(review)).join("");

  // Attach delete listeners
  tbody.querySelectorAll(".delete-btn[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(Number(btn.dataset.id)));
  });

  // Attach approve / reject listeners
  tbody.querySelectorAll(".btn-approve[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => handleApprove(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll(".btn-reject[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => handleReject(Number(btn.dataset.id)));
  });
}

function buildRow(review) {
  const colour  = thumbColour(review.id);
  const stars   = buildStars(review.rating);
  const comment = formatters.truncate(review.comment || "", 46);
  const date    = formatters.date(review.created_at, { style: "long" });
  const badge   = formatters.statusBadge(review.status || "approved");

  const pendingActions =
    review.status === "pending"
      ? `<button class="btn btn--primary btn-approve" data-id="${review.id}" style="padding:4px 10px;font-size:12px;margin-bottom:4px;">Approve</button>
         <button class="btn btn--ghost   btn-reject"  data-id="${review.id}" style="padding:4px 10px;font-size:12px;">Reject</button>`
      : `<span class="stat-badge ${badge.class}" style="font-size:11px;">${badge.text}</span>`;

  return `
    <tr>
      <td>
        <div class="book-cell">
          <div class="book-thumb" style="background:${colour};"></div>
          <span>${review.book_title || "Unknown Book"}</span>
        </div>
      </td>
      <td><strong>${review.user_name || "Unknown User"}</strong></td>
      <td class="rating-cell">${stars}</td>
      <td class="comment-cell"><em>"${comment}"</em></td>
      <td class="date-cell">${date.replace(/ /g, "<br>") || "—"}</td>
      <td class="action-cell" style="text-align:center;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          ${pendingActions}
          <button class="delete-btn" data-id="${review.id}" title="Delete review">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
}

// ══════════════════════════════════════════
//  Pagination
// ══════════════════════════════════════════

function updateTableCount() {
  const countEl = domHelper.query(".table-count");
  if (!countEl) return;
  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end   = Math.min(state.currentPage * state.pageSize, state.filtered.length);
  const label = state.filtered.length === 0
    ? "No entries found"
    : `Showing ${start}–${end} of ${state.filtered.length.toLocaleString()} ${formatters.pluralize("entry", state.filtered.length)}`;
  countEl.textContent = label;
}

function updatePagination() {
  const container = domHelper.query(".pagination");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  const cur = state.currentPage;

  // Build page number buttons (show up to 5 around current page)
  let pages = [];
  const delta = 2;
  for (let p = Math.max(1, cur - delta); p <= Math.min(totalPages, cur + delta); p++) {
    pages.push(p);
  }

  const prevDisabled = cur === 1          ? "disabled" : "";
  const nextDisabled = cur === totalPages ? "disabled" : "";

  container.innerHTML = `
    <button class="page-btn" id="prevPage" ${prevDisabled}>&lsaquo;</button>
    ${pages.map((p) =>
      `<button class="page-btn ${p === cur ? "page-btn--active" : ""}" data-page="${p}">${p}</button>`
    ).join("")}
    <button class="page-btn" id="nextPage" ${nextDisabled}>&rsaquo;</button>`;

  domHelper.on(domHelper.id("prevPage"), "click", () => {
    if (state.currentPage > 1) { state.currentPage--; renderTable(); updateTableCount(); updatePagination(); }
  });
  domHelper.on(domHelper.id("nextPage"), "click", () => {
    if (state.currentPage < totalPages) { state.currentPage++; renderTable(); updateTableCount(); updatePagination(); }
  });
  container.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentPage = Number(btn.dataset.page);
      renderTable(); updateTableCount(); updatePagination();
    });
  });
}

// ══════════════════════════════════════════
//  Actions
// ══════════════════════════════════════════

async function handleDelete(reviewId) {
  if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
  try {
    // ReviewsService doesn't expose a delete endpoint; we use reject as the closest admin action.
    await ReviewsService.rejectReview(reviewId);
    state.allReviews = state.allReviews.filter((r) => r.id !== reviewId);
    applyFilters();
  } catch (err) {
    console.error("Failed to delete review:", err);
    alert("Could not delete the review. Please try again.");
  }
}

async function handleApprove(reviewId) {
  try {
    await ReviewsService.approveReview(reviewId);
    const review = state.allReviews.find((r) => r.id === reviewId);
    if (review) review.status = "approved";
    renderTable();
    updateStats();
  } catch (err) {
    console.error("Failed to approve review:", err);
    alert("Could not approve the review. Please try again.");
  }
}

async function handleReject(reviewId) {
  try {
    await ReviewsService.rejectReview(reviewId);
    const review = state.allReviews.find((r) => r.id === reviewId);
    if (review) review.status = "rejected";
    renderTable();
    updateStats();
  } catch (err) {
    console.error("Failed to reject review:", err);
    alert("Could not reject the review. Please try again.");
  }
}

// ══════════════════════════════════════════
//  Filter tabs
// ══════════════════════════════════════════

function initFilterTabs() {
  // ── Activity / Period tabs ──
  const activityContainer = domHelper.id("activityTabs");
  if (activityContainer) {
    activityContainer.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        activityContainer.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        state.activityFilter = tab.textContent.trim();
        applyFilters();
      });
    });
  }

  // ── Rating tabs ──
  const ratingContainer = domHelper.id("ratingTabs");
  if (ratingContainer) {
    ratingContainer.querySelectorAll(".filter-tab").forEach((tab, index) => {
      tab.addEventListener("click", () => {
        ratingContainer.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        // index 0 = "All Ratings", index 1 = 5 stars, …, index 5 = 1 star
        state.ratingFilter = index === 0 ? 0 : 6 - index;
        applyFilters();
      });
    });
  }
}

// ══════════════════════════════════════════
//  Search
// ══════════════════════════════════════════

function initSearch() {
  const input = domHelper.query(".topbar__search input");
  if (!input) return;

  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = input.value.trim();
      applyFilters();
    }, 300);
  });
}

// ══════════════════════════════════════════
//  Export button
// ══════════════════════════════════════════

function initExport() {
  const exportBtn = domHelper.query(".btn--ghost");
  if (!exportBtn) return;

  exportBtn.addEventListener("click", () => {
    if (state.filtered.length === 0) {
      alert("No reviews to export.");
      return;
    }

    const headers = ["ID", "Book Title", "User", "Rating", "Comment", "Status", "Date"];
    const rows    = state.filtered.map((r) => [
      r.id,
      `"${(r.book_title || "").replace(/"/g, '""')}"`,
      `"${(r.user_name  || "").replace(/"/g, '""')}"`,
      r.rating,
      `"${(r.comment    || "").replace(/"/g, '""')}"`,
      r.status || "approved",
      formatters.date(r.created_at),
    ]);

    const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `shelfsync-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ══════════════════════════════════════════
//  Bootstrap
// ══════════════════════════════════════════

async function loadReviews() {
  try {
    const tbody = domHelper.query(".review-table tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">
            Loading reviews…
          </td>
        </tr>`;
    }

    const data = await ReviewsService.getPendingReviews();
    // The API returns pending reviews; merge with what we already know
    state.allReviews = Array.isArray(data) ? data : (data?.results ?? []);
    applyFilters();
  } catch (err) {
    console.error("Failed to load reviews:", err);
    const tbody = domHelper.query(".review-table tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:32px;color:var(--delete-color);">
            Failed to load reviews. Please refresh the page.
          </td>
        </tr>`;
    }
  }
}

domHelper.ready(() => {
  initFilterTabs();
  initSearch();
  initExport();
  loadReviews();
});
