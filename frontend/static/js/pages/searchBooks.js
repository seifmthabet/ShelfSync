import { booksService } from "../services/booksService.js";
import { Auth } from "../core/auth.js";
import { domHelper } from "../utils/domHelper.js";

const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", () => {
  window.location.href = "../index.html";
});
const loginButton = document.getElementById("btn-login");
loginButton?.addEventListener("click", (e) => {
  e.preventDefault();
  if (Auth.isAuthenticated()) {
    window.location.href = Auth.isAdmin() ? "adminDashboard.html" : "userDashboard.html";
  } else {
    window.location.href = "loginPage.html";
  }
});

const profileButton = document.getElementById("btn-nav");
profileButton?.addEventListener("click", (e) => {
  e.preventDefault();
  if (Auth.isAuthenticated()) {
    window.location.href = "myProfile.html";
  } else {
    window.location.href = "loginPage.html";
  }
});

const state = {
  books: [],
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 8,
  searchQuery: "",
  category: "All Collections",
  availability: "All",
};

const ui = {
  grid: domHelper.query(".main-grid"),
  searchInput: domHelper.query(".search-box input"),
  selects: domHelper.queryAll(".filters .select-wrap select"),
  refineBtn: domHelper.query(".btn-refine"),
  prevBtn: domHelper.query(".pagination .page-nav:first-child"),
  nextBtn: domHelper.query(".pagination .page-nav:last-child"),
  pageNumbers: domHelper.query(".pagination .page-numbers"),
};

function normalizeBook(book, index) {
  const title = book.title || book.book_title || "Untitled";
  const author = book.author || book.book_author || "Unknown Author";
  const category = book.category || book.genre || "General";
  const rating = Number(book.rating ?? book.stars ?? 5);
  const cover = book.cover || book.image || book.cover_url || book.img || "";
  const availability = book.availability || "In Stock";

  return {
    id: book.id ?? index + 1,
    title,
    author,
    category,
    rating: Number.isNaN(rating) ? 5 : rating,
    cover,
    availability,
  };
}

function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  const empty = 5 - full;
  return `<span class="stars filled">${"★".repeat(full)}</span>${empty > 0 ? `<span class="stars empty">${"★".repeat(empty)}</span>` : ""}`;
}

function buildBookCard(book) {
  const cover = book.cover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
  return `
    <article class="book-card" data-book-id="${book.id}">
      <div class="book-card__img book-card__img--light">
        <img src="${cover}" alt="${book.title}">
      </div>
      <div class="book-card__meta">
        <span class="book-genre">${book.category}</span>
        <div class="book-stars">${buildStars(book.rating)}</div>
      </div>
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">${book.author}</p>
      <p class="book-availability">${book.availability}</p>
    </article>`;
}

function renderGrid() {
  if (!ui.grid) return;

  if (state.books.length === 0) {
    ui.grid.innerHTML = `
      <div class="no-results">
        <p>No books found. Try a different search or filter.</p>
      </div>`;
    renderPagination();
    return;
  }

  ui.grid.innerHTML = state.books.map(buildBookCard).join("");
  renderPagination();
}

function renderPagination() {
  if (!ui.pageNumbers || !ui.prevBtn || !ui.nextBtn) return;

  const totalPages = state.totalPages;
  const current = Math.min(state.currentPage, totalPages);

  ui.prevBtn.disabled = current === 1;
  ui.nextBtn.disabled = current === totalPages;

  ui.pageNumbers.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return `<button class="page-num ${page === current ? "page-num--active" : ""}" data-page="${page}">${page.toString().padStart(2, "0")}</button>`;
  }).join("");

  ui.pageNumbers.querySelectorAll(".page-num").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentPage = Number(button.dataset.page);
      fetchBooks();
    });
  });
}

function buildQuery() {
  const params = { page: state.currentPage, page_size: state.pageSize };
  if (state.searchQuery) params.search = state.searchQuery;
  if (state.category && state.category !== "All Collections") {
    params.category = state.category;
  }
  if (state.availability === "In Stock") params.availability = "in_stock";
  if (state.availability === "Out of Stock") params.availability = "out_of_stock";
  return params;
}

async function fetchBooks() {
  if (!ui.grid) return;
  try {
    const result = await booksService.getAllBooks(buildQuery());
    const rawBooks = Array.isArray(result) ? result : result?.results ?? [];
    state.books = rawBooks.map(normalizeBook);
    state.totalCount = result.count ?? rawBooks.length;
    state.totalPages = Math.max(1, Math.ceil(state.totalCount / state.pageSize));
  } catch (error) {
    console.error(error);
    state.books = [];
    state.totalCount = 0;
    state.totalPages = 1;
  }
  renderGrid();
}

function setupGridNavigation() {
  ui.grid?.addEventListener("click", (e) => {
    const card = e.target.closest(".book-card[data-book-id]");
    if (!card) return;
    const id = card.getAttribute("data-book-id");
    if (id) window.location.href = `bookDetails.html?id=${encodeURIComponent(id)}`;
  });
}

function setupEvents() {
  if (ui.searchInput) {
    let timer = null;
    ui.searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.searchQuery = ui.searchInput.value.trim();
        state.currentPage = 1;
        fetchBooks();
      }, 400);
    });
  }

  if (ui.selects.length >= 2) {
    const [categorySelect, availabilitySelect] = ui.selects;
    categorySelect.addEventListener("change", () => {
      state.category = categorySelect.value;
      state.currentPage = 1;
      fetchBooks();
    });
    availabilitySelect.addEventListener("change", () => {
      state.availability = availabilitySelect.value;
      state.currentPage = 1;
      fetchBooks();
    });
  }

  if (ui.refineBtn) {
    ui.refineBtn.addEventListener("click", (event) => {
      event.preventDefault();
      state.currentPage = 1;
      fetchBooks();
      ui.searchInput?.focus();
    });
  }

  if (ui.prevBtn) {
    ui.prevBtn.addEventListener("click", () => {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
        fetchBooks();
      }
    });
  }

  if (ui.nextBtn) {
    ui.nextBtn.addEventListener("click", () => {
      if (state.currentPage < state.totalPages) {
        state.currentPage += 1;
        fetchBooks();
      }
    });
  }
}

domHelper.ready(() => {
  if (loginButton) {
    loginButton.textContent = Auth.isAuthenticated() ? (Auth.isAdmin() ? "Admin" : "Dashboard") : "Login";
  }
  setupEvents();
  setupGridNavigation();
  fetchBooks();
});
