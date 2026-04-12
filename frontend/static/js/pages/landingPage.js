import { booksService } from "../services/booksService.js";
import { domHelper } from "../utils/domHelper.js";


// ─ Navigation Buttons ─
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const exploreButton = document.querySelector('a[href="/pages/searchBooks.html"]');

if (loginButton) {
  loginButton.addEventListener('click', () => {
    window.location.href = 'pages/loginPage.html';
  });
}

if (signupButton) {
  signupButton.addEventListener('click', () => {
    window.location.href = 'pages/signUp.html';
  });
}

if (exploreButton) {
  exploreButton.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'pages/searchBooks.html';
  });
}

// ─ State ─
const state = {
  newArrivals: [],
  topRated: [],
  isLoading: true,
};

// ─ UI Elements ─
const ui = {
  newArrivalsGrid: null,
  topRatedGrid: null,
  loadingContainer: null,
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadBooks();
});

// Initialize UI references
function initializeUI() {
  // Try to find or create book display containers
  const collectionsSection = domHelper.query('.collections');
  if (collectionsSection) {
    // Look for a grid to populate or create one
    const existingGrid = collectionsSection.querySelector('.book-grid');
    if (existingGrid) {
      ui.newArrivalsGrid = existingGrid;
    }
  }
}

// Load books from API
async function loadBooks() {
  try {
    // Fetch books from API
    const response = await booksService.getAllBooks();
    const books = response?.data || [];

    // Sort and categorize
    state.newArrivals = books
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8);

    state.topRated = books
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8);

    state.isLoading = false;

    // Render new arrivals if grid exists
    if (ui.newArrivalsGrid) {
      renderNewArrivals();
    }

    // Add scroll observer for animations
    observeElements();
  } catch (error) {
    console.error('Error loading books:', error);
    state.isLoading = false;
    // Continue without books - landing page will still work with static content
  }
}

// Render new arrivals
function renderNewArrivals() {
  if (!ui.newArrivalsGrid) return;

  const fragment = document.createDocumentFragment();

  state.newArrivals.forEach(book => {
    const bookCard = createBookCard(book);
    fragment.appendChild(bookCard);
  });

  ui.newArrivalsGrid.innerHTML = '';
  ui.newArrivalsGrid.appendChild(fragment);
}

// Create book card element
function createBookCard(book) {
  const div = domHelper.create('article', {
    class: 'book-card arrived-card',
  });

  const cover = book.cover || book.image || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80';
  const title = book.title || book.book_title || 'Untitled';
  const author = book.author || book.book_author || 'Unknown';
  const rating = book.rating || 4.5;

  div.innerHTML = `
    <div class="book-card__img">
      <img src="${cover}" alt="${title}" loading="lazy">
    </div>
    <div class="book-card__meta">
      <span class="book-genre">${book.category || 'General'}</span>
      <div class="book-stars">${buildStars(rating)}</div>
    </div>
    <h3 class="book-title">${title}</h3>
    <p class="book-author">${author}</p>
  `;

  div.addEventListener('click', () => {
    window.location.href = `pages/bookDetails.html?id=${book.id}`;
  });

  return div;
}

// Build star HTML
function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  return `${'★'.repeat(full)}${'☆'.repeat(5 - full)}`;
}

// Observe elements for scroll animations
function observeElements() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    domHelper.queryAll('.book-card, .collection-card, .review-card').forEach(el => {
      observer.observe(el);
    });
  }
}

// Add CSS class for animations
const style = document.createElement('style');
style.textContent = `
  .book-card, .collection-card, .review-card {
    opacity: 0;
    transform: translateY(16px);
    animation: none;
  }
  
  .book-card.visible, .collection-card.visible, .review-card.visible {
    animation: slideUp 0.6s ease forwards;
  }
  
  @keyframes slideUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);


