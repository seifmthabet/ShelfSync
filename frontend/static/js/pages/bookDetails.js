import { booksService } from "../services/booksService.js";
import { borrowService } from "../services/borrowService.js";
import { ReviewsService } from "../services/reviewsService.js";
import { domHelper } from "../utils/domHelper.js";
import { formatters } from "../utils/formatters.js";
import { Auth } from "../core/auth.js";

// ─ State ─
const state = {
  bookId: null,
  book: null,
  reviews: [],
  isLoading: true,
  isUserAuthenticated: Auth.isAuthenticated(),
};

// ─ UI Elements ─
const ui = {
  bookTitle: domHelper.query('.book-title'),
  bookAuthor: domHelper.query('.book-author'),
  bookSummary: domHelper.query('.book-summary'),
  bookCover: domHelper.query('.cover-frame'),
  ratingValue: domHelper.query('.rating-value'),
  ratingStars: domHelper.query('.rating-stars'),
  ratingNote: domHelper.query('.rating-note'),
  borrowBtn: domHelper.query('.borrow-btn'),
  saveBtn: domHelper.query('.save-btn'),
  reviewGrid: domHelper.query('.review-grid'),
  writeReviewLink: domHelper.query('a[href*="writeReview"]'),
  ratingBars: domHelper.query('.bars'),
  loadMoreBtn: domHelper.query('.load-btn'),
  shelfTag: domHelper.query('.shelf-tag span'),
  categoryChip: domHelper.query('.cat-chip'),
  yearChip: domHelper.query('.yr-chip'),
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  extractBookId();
  loadBook();
  setupEventListeners();
});

// Extract book ID from URL params
function extractBookId() {
  const params = new URLSearchParams(window.location.search);
  state.bookId = params.get('id') || '1'; // Default to ID 1 for demo
}

// Load book details
async function loadBook() {
  try {
    if (state.bookId) {
      const bookResponse = await booksService.getBookById(state.bookId);
      state.book = bookResponse?.data ?? bookResponse ?? getMockBook();

      // Load reviews
      try {
        const reviewsResponse = await ReviewsService.getReviewsForBook(state.bookId);
        const raw = reviewsResponse?.data ?? reviewsResponse?.results ?? reviewsResponse ?? [];
        state.reviews = Array.isArray(raw) ? raw : [];
      } catch (error) {
        console.warn('Could not load reviews:', error);
        state.reviews = [];
      }

      state.isLoading = false;
      renderBookDetails();
      renderReviews();
    }
  } catch (error) {
    console.error('Error loading book:', error);
    state.book = getMockBook();
    state.isLoading = false;
    renderBookDetails();
  }
}

// Get mock book data
function getMockBook() {
  return {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
    summary: `An exquisite portrait of the Roaring Twenties, Fitzgerald's mastery explores the American Dream through the eyes of Nick Carraway as he becomes entangled in the mysterious life of Jay Gatsby and his unrequited love for Daisy Buchanan.`,
    category: 'Classic Literature',
    year: 1925,
    rating: 4.8,
    total_reviews: 1240,
    availability: 'On Shelf',
    rating_breakdown: {
      5: 82,
      4: 12,
      3: 4,
      2: 1,
      1: 1,
    },
  };
}

// Render book details
function renderBookDetails() {
  const book = state.book;

  if (ui.bookTitle) ui.bookTitle.textContent = book.title || 'Untitled';
  if (ui.bookAuthor) ui.bookAuthor.textContent = book.author || 'Unknown';
  if (ui.bookSummary) ui.bookSummary.textContent = book.summary || 'No summary available';

  // Set cover image
  if (ui.bookCover) {
    const img = domHelper.create('img', {
      attributes: {
        src: book.cover || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
        alt: book.title || 'Book cover',
      },
    });
    ui.bookCover.style.backgroundImage = `url(${book.cover})`;
    ui.bookCover.innerHTML = '';
    ui.bookCover.appendChild(img);
  }

  // Set metadata chips
  if (ui.categoryChip) ui.categoryChip.textContent = book.category || 'General';
  if (ui.yearChip) ui.yearChip.textContent = book.year || new Date().getFullYear();

  // Set availability
  if (ui.shelfTag) {
    ui.shelfTag.textContent = book.availability || 'On Shelf';
    ui.shelfTag.className = book.availability === 'On Shelf' ? 'available' : 'unavailable';
  }

  // Set ratings
  if (ui.ratingValue) ui.ratingValue.textContent = formatters.rating(book.rating);
  if (ui.ratingStars) ui.ratingStars.textContent = buildStars(book.rating);
  if (ui.ratingNote)
    ui.ratingNote.textContent = `Based on ${book.total_reviews?.toLocaleString() || 0} reviews`;

  // Render rating bars
  renderRatingBars(book.rating_breakdown);
}

// Render rating bars
function renderRatingBars(breakdown) {
  if (!ui.ratingBars || !breakdown) return;

  const html = Object.entries(breakdown)
    .reverse()
    .map(([stars, percent]) => {
      return `
        <div class="bar-row">
          <span>${stars} star</span>
          <span class="track"><span class="fill" style="width: ${percent}%;"></span></span>
          <span>${percent}%</span>
        </div>
      `;
    })
    .join('');

  ui.ratingBars.innerHTML = html;
}

// Render reviews
function renderReviews() {
  if (!ui.reviewGrid) return;

  if (state.reviews.length === 0) {
    ui.reviewGrid.innerHTML =
      '<p style="text-align: center; color: #6b6b60; padding: 30px;">No reviews yet. Be the first to review this book!</p>';
    return;
  }

  const reviewsHTML = state.reviews.slice(0, 3).map(review => createReviewCard(review)).join('');
  ui.reviewGrid.innerHTML = reviewsHTML;

  if (state.reviews.length > 3 && ui.loadMoreBtn) {
    ui.loadMoreBtn.style.display = 'block';
    ui.loadMoreBtn.addEventListener('click', () => {
      const allReviews = state.reviews.map(review => createReviewCard(review)).join('');
      ui.reviewGrid.innerHTML = allReviews;
      ui.loadMoreBtn.style.display = 'none';
    });
  }
}

// Create review card element
function createReviewCard(review) {
  const userInitials = (review.user_name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase();

  return `
    <article class="review-card">
      <div class="reviewer">
        <span class="review-avatar">${userInitials}</span>
        <div class="review-meta">
          <strong>${review.user_name || 'Anonymous'}</strong>
          <span>${formatters.date(review.created_at, { style: 'long' })}</span>
        </div>
      </div>
      <p class="review-stars">${buildStars(review.rating || 5)}</p>
      <p class="review-text">"${review.content || review.text || ''}"</p>
      <span class="review-like">♡ ${review.likes || 0}</span>
    </article>
  `;
}

// Build star HTML
function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  return `${'★'.repeat(full)}${' '.repeat(Math.max(0, 5 - full))}`;
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  const homeButton = domHelper.query('.logo');
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      window.location.href = '../index.html';
    });
  }

  const loginLink = domHelper.query('a[href*="loginPage"]');
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = './loginPage.html';
    });
  }

  // Borrow button
  if (ui.borrowBtn) {
    ui.borrowBtn.addEventListener('click', async () => {
      if (!state.isUserAuthenticated) {
        alert('Please login to borrow books');
        window.location.href = './loginPage.html';
        return;
      }

      try {
        const result = await borrowService.createBorrowRequest({
          book_id: state.bookId,
        });

        if (result) {
          alert('Borrow request submitted! Admin will review it shortly.');
          ui.borrowBtn.disabled = true;
          ui.borrowBtn.textContent = 'Request Submitted';
        }
      } catch (error) {
        console.error('Error creating borrow request:', error);
        alert('Failed to submit borrow request');
      }
    });
  }

  // Save button
  if (ui.saveBtn) {
    ui.saveBtn.addEventListener('click', () => {
      if (!state.isUserAuthenticated) {
        alert('Please login to save books');
        window.location.href = './loginPage.html';
        return;
      }

      // Toggle save state
      const isSaved = ui.saveBtn.classList.toggle('saved');
      ui.saveBtn.textContent = isSaved ? '✓ Saved' : 'Save to list';

      // TODO: Make API call to save/unsave book
      console.log(`Book ${isSaved ? 'saved' : 'unsaved'}`);
    });
  }

  // Write review link
  if (ui.writeReviewLink) {
    ui.writeReviewLink.addEventListener('click', (e) => {
      if (!state.isUserAuthenticated) {
        e.preventDefault();
        alert('Please login to write reviews');
        window.location.href = './loginPage.html';
      } else {
        // Store book ID for review page
        sessionStorage.setItem('reviewBookId', state.bookId);
        window.location.href = './writeReview.html?bookId=' + state.bookId;
      }
    });
  }
}
