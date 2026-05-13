import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { borrowService } from "../services/borrowService.js";

const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", () => {
  window.location.href = "../index.html";
});

const profileButton = document.getElementById("btn-nav");
profileButton?.addEventListener("click", () => {
  window.location.href = "myProfile.html";
});

const state = {
  readingHistory: [],
  filtered: [],
  totalBooks: 0,
  totalPages: 0,
  avgRating: 0,
  readingMonth: 0,
  sortFilter: "date-completed",
};

const ui = {
  timelineContainer: domHelper.query("#timelineContainer"),
  emptyState: domHelper.query("#emptyState"),
  sortFilter: domHelper.query("#sortFilter"),
  applySortBtn: domHelper.query("#applySortFilter"),
  totalBooks: domHelper.query("#totalBooks"),
  totalPages: domHelper.query("#totalPages"),
  avgRating: domHelper.query("#avgRating"),
  readingMonth: domHelper.query("#readingMonth"),
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = "loginPage.html";
    return;
  }
  await loadReadingHistory();
  setupEventListeners();
});

function setupEventListeners() {
  ui.applySortBtn?.addEventListener("click", () => {
    state.sortFilter = ui.sortFilter?.value || "date-completed";
    filterAndRender();
  });
}

async function loadReadingHistory() {
  try {
    const data = await borrowService.getLoanHistory();
    const raw = Array.isArray(data) ? data : data?.results ?? [];
    state.readingHistory = raw.map((row) => ({
      id: row.id,
      book_title: row.book_title,
      book_author: row.book_author,
      book_cover: row.book_cover,
      pages: row.pages || 0,
      rating: Number(row.rating) || 0,
      completed_date: row.completed_date,
      time_to_read: row.time_to_read ?? 0,
    }));
    calculateStatistics();
    filterAndRender();
  } catch (error) {
    console.error("Error loading reading history:", error);
    showEmptyState();
  }
}

function calculateStatistics() {
  const books = state.readingHistory;

  state.totalBooks = books.length;
  state.totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
  state.avgRating =
    books.length > 0
      ? (books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length).toFixed(1)
      : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  state.readingMonth = books.filter((book) => {
    const date = new Date(book.completed_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  updateStatistics();
}

function updateStatistics() {
  if (ui.totalBooks) ui.totalBooks.textContent = state.totalBooks;
  if (ui.totalPages) ui.totalPages.textContent = state.totalPages;
  if (ui.avgRating) ui.avgRating.textContent = state.avgRating;
  if (ui.readingMonth) ui.readingMonth.textContent = state.readingMonth;
}

function filterAndRender() {
  let filtered = [...state.readingHistory];
  filtered = sortBooks(filtered, state.sortFilter);
  state.filtered = filtered;

  if (filtered.length === 0) {
    showEmptyState();
  } else {
    renderTimeline(filtered);
  }
}

function sortBooks(books, sortBy) {
  const sorted = [...books];

  switch (sortBy) {
    case "date-completed":
      sorted.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
      break;
    case "title":
      sorted.sort((a, b) => a.book_title?.localeCompare(b.book_title) || 0);
      break;
    case "rating":
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case "pages":
      sorted.sort((a, b) => (b.pages || 0) - (a.pages || 0));
      break;
  }
  return sorted;
}

function renderTimeline(books) {
  if (!ui.timelineContainer || !ui.emptyState) return;
  ui.timelineContainer.innerHTML = books.map((book) => createTimelineItem(book)).join("");
  ui.emptyState.style.display = "none";
}

function createTimelineItem(book) {
  const cover = book.book_cover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
  const stars = buildStars(book.rating || 5);
  const pagesLabel = book.pages > 0 ? `${book.pages} pages` : "—";

  return `
        <div class="timeline-item">
            <div class="timeline-book-cover">
                <img src="${cover}" alt="${book.book_title}">
            </div>
            <div class="timeline-info">
                <h3 class="timeline-title">${book.book_title || "Untitled"}</h3>
                <p class="timeline-author">${book.book_author || "Unknown"}</p>
                <div class="timeline-meta">
                    <span>${pagesLabel}</span>
                    <span>${book.time_to_read || 0} days borrowed</span>
                </div>
            </div>
            <div class="timeline-stats">
                <div class="timeline-rating">${stars}</div>
                <div class="timeline-pages">${book.rating || 0}/5 rating</div>
                <div class="timeline-pages" style="font-size: 11px; margin-top: 4px;">
                    ${formatDate(book.completed_date)}
                </div>
            </div>
        </div>
    `;
}

function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  const empty = 5 - full;
  return `${"★".repeat(full)}${empty > 0 ? `${"☆".repeat(empty)}` : ""}`;
}

function showEmptyState() {
  if (!ui.timelineContainer || !ui.emptyState) return;
  ui.timelineContainer.innerHTML = "";
  ui.emptyState.style.display = "block";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
