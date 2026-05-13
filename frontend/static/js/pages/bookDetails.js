import { booksService } from "../services/booksService.js";
import { borrowService } from "../services/borrowService.js";
import { ReviewsService } from "../services/reviewsService.js";
import { domHelper } from "../utils/domHelper.js";
import { formatters } from "../utils/formatters.js";
import { Auth } from "../core/auth.js";
import { hrefPage } from "../core/config.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAVED_BOOKS_KEY = "shelfsync_saved_book_ids";

const state = {
  bookId: null,
  book: null,
  reviews: [],
  isUserAuthenticated: Auth.isAuthenticated(),
  loadMoreBound: false,
};

const ui = {
  bookTitle: domHelper.query(".book-title"),
  bookAuthor: domHelper.query(".book-author"),
  bookSummary: domHelper.query(".book-summary"),
  bookCover: domHelper.query(".cover-frame"),
  ratingValue: domHelper.query(".rating-value"),
  ratingStars: domHelper.query(".rating-stars"),
  ratingNote: domHelper.query(".rating-note"),
  borrowBtn: domHelper.query(".borrow-btn"),
  saveBtn: domHelper.query(".save-btn"),
  reviewGrid: domHelper.query(".review-grid"),
  writeReviewLink: domHelper.query('a[href*="writeReview"]'),
  ratingBars: domHelper.query(".bars"),
  loadMoreBtn: domHelper.query(".load-btn"),
  shelfStatus: domHelper.query(".shelf-status"),
  categoryChip: domHelper.query(".cat-chip"),
  yearChip: domHelper.query(".yr-chip"),
};

document.addEventListener("DOMContentLoaded", () => {
  if (!extractBookId()) {
    return;
  }
  syncSavedButton();
  loadBook();
  setupEventListeners();
});

function extractBookId() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id")?.trim();
  if (!id || !UUID_RE.test(id)) {
    alert("Invalid or missing book. Please choose a book from the catalog.");
    window.location.href = hrefPage("searchBooks");
    return false;
  }
  state.bookId = id;
  return true;
}

function getSavedIds() {
  try {
    const raw = localStorage.getItem(SAVED_BOOKS_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavedIds(ids) {
  localStorage.setItem(SAVED_BOOKS_KEY, JSON.stringify(ids));
}

function syncSavedButton() {
  if (!ui.saveBtn || !state.bookId) return;
  const saved = getSavedIds().includes(state.bookId);
  ui.saveBtn.classList.toggle("saved", saved);
  ui.saveBtn.textContent = saved ? "✓ Saved" : "Save to list";
}

async function loadBook() {
  try {
    const bookResponse = await booksService.getBookById(state.bookId);
    state.book = bookResponse?.data ?? bookResponse;

    try {
      const reviewsResponse = await ReviewsService.getReviewsForBook(state.bookId);
      const raw = reviewsResponse?.data ?? reviewsResponse?.results ?? reviewsResponse ?? [];
      state.reviews = Array.isArray(raw) ? raw : [];
    } catch (error) {
      console.warn("Could not load reviews:", error);
      state.reviews = [];
    }

    renderBookDetails();
    renderReviews();
  } catch (error) {
    console.error("Error loading book:", error);
    alert(error?.message || "Could not load this book.");
    window.location.href = hrefPage("searchBooks");
  }
}

function buildStars(rating) {
  const n = Number(rating);
  const full = Math.round(Math.max(0, Math.min(5, Number.isFinite(n) ? n : 0)));
  const empty = 5 - full;
  return `${"★".repeat(full)}${"☆".repeat(empty)}`;
}

function renderBookDetails() {
  const book = state.book;
  if (!book) return;

  if (ui.bookTitle) ui.bookTitle.textContent = book.title || "Untitled";
  if (ui.bookAuthor) ui.bookAuthor.textContent = book.author || "Unknown";
  if (ui.bookSummary) ui.bookSummary.textContent = book.summary || "No summary available.";

  if (ui.bookCover) {
    const src =
      book.cover ||
      "https://images.unsplash.com/photo-1524995997946-a1c024e0a177?auto=format&fit=crop&w=600&q=80";
    ui.bookCover.style.backgroundImage = `url(${src})`;
    ui.bookCover.innerHTML = "";
    const img = domHelper.create("img", {
      attributes: { src, alt: book.title || "Book cover" },
    });
    ui.bookCover.appendChild(img);
  }

  if (ui.categoryChip) ui.categoryChip.textContent = book.category || "General";
  if (ui.yearChip) ui.yearChip.textContent = String(book.year ?? "—");

  if (ui.shelfStatus) {
    ui.shelfStatus.textContent = book.availability || "Unknown";
    ui.shelfStatus.classList.toggle("shelf-status--ok", book.availability === "On Shelf");
  }

  if (ui.ratingValue) ui.ratingValue.textContent = formatters.rating(book.rating);
  if (ui.ratingStars) ui.ratingStars.textContent = buildStars(book.rating);
  if (ui.ratingNote) {
    ui.ratingNote.textContent = `Based on ${(book.total_reviews ?? 0).toLocaleString()} reviews`;
  }

  renderRatingBars(book.rating_breakdown);
}

function renderRatingBars(breakdown) {
  if (!ui.ratingBars || !breakdown || typeof breakdown !== "object") return;

  const order = ["5", "4", "3", "2", "1"];
  const html = order
    .map((stars) => {
      const percent = Number(breakdown[stars] ?? 0);
      return `
        <div class="bar-row">
          <span>${stars} star</span>
          <span class="track"><span class="fill" style="width: ${percent}%;"></span></span>
          <span>${percent}%</span>
        </div>`;
    })
    .join("");

  ui.ratingBars.innerHTML = html;
}

function renderReviews() {
  if (!ui.reviewGrid) return;

  if (state.reviews.length === 0) {
    ui.reviewGrid.innerHTML =
      '<p class="reviews-empty">No approved reviews yet. Be the first to review this book.</p>';
    if (ui.loadMoreBtn) ui.loadMoreBtn.style.display = "none";
    return;
  }

  ui.reviewGrid.innerHTML = state.reviews
    .slice(0, 3)
    .map((review) => createReviewCard(review))
    .join("");

  if (ui.loadMoreBtn) {
    if (state.reviews.length > 3) {
      ui.loadMoreBtn.style.display = "block";
      if (!state.loadMoreBound) {
        state.loadMoreBound = true;
        ui.loadMoreBtn.addEventListener("click", () => {
          ui.reviewGrid.innerHTML = state.reviews.map((r) => createReviewCard(r)).join("");
          ui.loadMoreBtn.style.display = "none";
        });
      }
    } else {
      ui.loadMoreBtn.style.display = "none";
    }
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createReviewCard(review) {
  const userInitials = (review.user_name || "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

  const body = escapeHtml(review.content || review.text || "");
  const name = escapeHtml(review.user_name || "Anonymous");

  return `
    <article class="review-card">
      <div class="reviewer">
        <span class="review-avatar">${escapeHtml(userInitials)}</span>
        <div class="review-meta">
          <strong>${name}</strong>
          <span>${formatters.date(review.created_at, { style: "long" })}</span>
        </div>
      </div>
      <p class="review-stars">${buildStars(review.rating || 5)}</p>
      <p class="review-text">"${body}"</p>
      <span class="review-like">♡ ${review.likes ?? 0}</span>
    </article>
  `;
}

function setupEventListeners() {
  const homeButton = domHelper.query(".logo");
  if (homeButton) {
    homeButton.style.cursor = "pointer";
    homeButton.addEventListener("click", () => {
      window.location.href = hrefPage("home");
    });
  }

  const loginLink = domHelper.query('a[href*="loginPage"]');
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = hrefPage("login");
    });
  }

  if (ui.borrowBtn) {
    ui.borrowBtn.addEventListener("click", async () => {
      if (!state.isUserAuthenticated) {
        alert("Please sign in to borrow books.");
        window.location.href = hrefPage("login");
        return;
      }
      try {
        await borrowService.createBorrowRequest({ book_id: state.bookId });
        alert("Borrow request submitted. A librarian will review it shortly.");
        ui.borrowBtn.disabled = true;
        ui.borrowBtn.textContent = "Request submitted";
      } catch (error) {
        console.error(error);
        alert(error?.message || "Could not submit borrow request.");
      }
    });
  }

  if (ui.saveBtn) {
    ui.saveBtn.addEventListener("click", () => {
      if (!state.isUserAuthenticated) {
        alert("Please sign in to save books.");
        window.location.href = hrefPage("login");
        return;
      }
      let ids = getSavedIds();
      const idx = ids.indexOf(state.bookId);
      if (idx === -1) {
        ids.push(state.bookId);
        ui.saveBtn.classList.add("saved");
        ui.saveBtn.textContent = "✓ Saved";
      } else {
        ids = ids.filter((id) => id !== state.bookId);
        ui.saveBtn.classList.remove("saved");
        ui.saveBtn.textContent = "Save to list";
      }
      setSavedIds(ids);
    });
  }

  if (ui.writeReviewLink) {
    ui.writeReviewLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (!state.isUserAuthenticated) {
        alert("Please sign in to write a review.");
        window.location.href = hrefPage("login");
        return;
      }
      sessionStorage.setItem("reviewBookId", state.bookId);
      window.location.href = `${hrefPage("writeReview")}?bookId=${encodeURIComponent(state.bookId)}`;
    });
  }
}
