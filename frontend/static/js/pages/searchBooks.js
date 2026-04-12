import { booksService } from "../services/booksService.js";
import { domHelper } from "../utils/domHelper.js";

const homeButton = document.getElementById("navbar__brand");
homeButton.addEventListener("click", () => {
    window.location.href = "../index.html";
});
const loginButton = document.getElementById("btn-login");
loginButton.addEventListener("click", () => {
    window.location.href = "loginPage.html";
});

const state = {
  books: [],
  filtered: [],
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
  const availability = book.availability || fallbackAvailability(title, author);

  return {
    id: book.id ?? index + 1,
    title,
    author,
    category,
    rating: isNaN(rating) ? 5 : rating,
    cover,
    availability,
  };
}

function fallbackAvailability(title, author) {
  const hash = [...`${title}-${author}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % 2 === 0 ? "In Stock" : "Out of Stock";
}

function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, rating)));
  const empty = 5 - full;
  return `<span class="stars filled">${"★".repeat(full)}</span>${empty > 0 ? `<span class="stars empty">${"★".repeat(empty)}</span>` : ""}`;
}

function buildBookCard(book) {
  const cover = book.cover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
  return `
    <article class="book-card">
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

  const start = (state.currentPage - 1) * state.pageSize;
  const pageBooks = state.filtered.slice(start, start + state.pageSize);

  if (pageBooks.length === 0) {
    ui.grid.innerHTML = `
      <div class="no-results">
        <p>No books found. Try a different search or filter.</p>
      </div>`;
    renderPagination();
    return;
  }

  ui.grid.innerHTML = pageBooks.map(buildBookCard).join("");
  renderPagination();
}

function applyFilters() {
  state.filtered = state.books.filter((book) => {
    const query = state.searchQuery.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query);

    const matchesCategory = state.category === "All Collections" || book.category === state.category;
    const matchesAvailability = state.availability === "All" || book.availability === state.availability;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  state.currentPage = 1;
  renderGrid();
}

function renderPagination() {
  if (!ui.pageNumbers || !ui.prevBtn || !ui.nextBtn) return;

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
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
      renderGrid();
    });
  });
}

function setupEvents() {
  if (ui.searchInput) {
    let timer = null;
    ui.searchInput.addEventListener("input", () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.searchQuery = ui.searchInput.value.trim();
        applyFilters();
      }, 250);
    });
  }

  if (ui.selects.length >= 2) {
    const [categorySelect, availabilitySelect] = ui.selects;
    categorySelect.addEventListener("change", () => {
      state.category = categorySelect.value;
      applyFilters();
    });
    availabilitySelect.addEventListener("change", () => {
      state.availability = availabilitySelect.value;
      applyFilters();
    });
  }

  if (ui.refineBtn) {
    ui.refineBtn.addEventListener("click", (event) => {
      event.preventDefault();
      applyFilters();
      ui.searchInput?.focus();
    });
  }

  if (ui.prevBtn) {
    ui.prevBtn.addEventListener("click", () => {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
        renderGrid();
      }
    });
  }

  if (ui.nextBtn) {
    ui.nextBtn.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if (state.currentPage < totalPages) {
        state.currentPage += 1;
        renderGrid();
      }
    });
  }
}

function parseStaticCards() {
  const cards = Array.from(domHelper.queryAll(".main-grid .book-card"));
  return cards.map((card, index) => {
    const title = domHelper.query(".book-title", card)?.textContent?.trim() || "Untitled";
    const author = domHelper.query(".book-author", card)?.textContent?.trim() || "Unknown Author";
    const category = domHelper.query(".book-genre", card)?.textContent?.trim() || "General";
    const starText = domHelper.query(".book-stars", card)?.textContent?.trim() || "★★★★★";
    const rating = starText.replace(/[^0-9]/g, "").length || 5;
    const img = domHelper.query("img", card)?.src || "";

    return normalizeBook(
      {
        title,
        author,
        category,
        rating,
        cover: img,
      },
      index
    );
  });
}

async function loadBooks() {
  if (!ui.grid) return;

  try {
    const result = await booksService.getAllBooks();
    const rawBooks = Array.isArray(result) ? result : result?.results ?? [];
    state.books = rawBooks.map(normalizeBook);
  } catch (error) {
    state.books = parseStaticCards();
  }

  state.filtered = [...state.books];
  renderGrid();
}

domHelper.ready(() => {
  setupEvents();
  loadBooks();
});
