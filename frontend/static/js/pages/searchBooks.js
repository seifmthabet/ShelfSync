import { booksService } from "../services/booksService.js";
import { Auth } from "../core/auth.js";
import { domHelper } from "../utils/domHelper.js";
import { hrefPage } from "../core/config.js";

const homeButton = document.getElementById("navbar__brand");
homeButton?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = hrefPage("home");
});

const loginButton = document.getElementById("btn-login");
loginButton?.addEventListener("click", (e) => {
  e.preventDefault();
  if (Auth.isAuthenticated()) {
    window.location.href = Auth.isAdmin() ? hrefPage("adminDashboard") : hrefPage("userDashboard");
  } else {
    window.location.href = hrefPage("login");
  }
});

const profileButton = document.getElementById("btn-nav");
profileButton?.addEventListener("click", (e) => {
  e.preventDefault();
  if (Auth.isAuthenticated()) {
    window.location.href = Auth.isAdmin() ? hrefPage("adminDashboard") : hrefPage("myProfile");
  } else {
    window.location.href = hrefPage("login");
  }
});

const state = {
  books: [],
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 12,
  searchQuery: "",
  categorySlug: "",
  availability: "All",
  loadError: null,
};

const ui = {
  grid: domHelper.query(".main-grid"),
  searchInput: domHelper.query(".search-box input"),
  categorySelect: document.getElementById("category-filter"),
  availabilitySelect: document.getElementById("availability-filter"),
  refineBtn: domHelper.query(".btn-refine"),
  prevBtn: document.querySelector(".pagination__inner > button.page-nav:first-of-type"),
  nextBtn: document.querySelector(".pagination__inner > button.page-nav:last-of-type"),
  pageNumbers: domHelper.query(".pagination .page-numbers"),
};

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeBook(book) {
  const title = book.title || book.book_title || "Untitled";
  const author = book.author || book.book_author || "Unknown author";
  const category =
    typeof book.category === "string"
      ? book.category
      : book.category?.name || "General";
  const rating = Number(book.rating ?? book.average_rating ?? book.stars ?? 0);
  const cover = book.cover || book.cover_url || book.image || book.img || "";
  const availability = book.availability || "—";

  return {
    id: book.id,
    title,
    author,
    category,
    rating: Number.isNaN(rating) ? 0 : rating,
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
  const cover =
    book.cover ||
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
  const title = escapeHtml(book.title);
  const author = escapeHtml(book.author);
  const cat = escapeHtml(book.category);
  const avail = escapeHtml(book.availability);
  return `
    <article class="book-card" data-book-id="${escapeHtml(String(book.id))}">
      <div class="book-card__img book-card__img--light">
        <img src="${escapeHtml(cover)}" alt="${title}" loading="lazy">
      </div>
      <div class="book-card__meta">
        <span class="book-genre">${cat}</span>
        <div class="book-stars">${buildStars(book.rating)}</div>
      </div>
      <h3 class="book-title">${title}</h3>
      <p class="book-author">${author}</p>
      <p class="book-availability">${avail}</p>
    </article>`;
}

function renderGrid() {
  if (!ui.grid) return;

  if (state.loadError) {
    ui.grid.innerHTML = `
      <div class="catalog-message catalog-message--error" role="alert">
        <p><strong>Could not load the catalog.</strong></p>
        <p>${escapeHtml(state.loadError)}</p>
        <p class="catalog-hint">Check that the API is running and CORS allows this origin, then refresh.</p>
        <button type="button" class="btn-refine" id="catalog-retry">Try again</button>
      </div>`;
    document.getElementById("catalog-retry")?.addEventListener("click", () => {
      state.loadError = null;
      fetchBooks();
    });
    renderPagination();
    return;
  }

  if (state.books.length === 0) {
    ui.grid.innerHTML = `
      <div class="catalog-message">
        <p>No books match your search or filters.</p>
        <p class="catalog-hint">Try clearing the category filter or search terms.</p>
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
  const current = Math.min(Math.max(1, state.currentPage), totalPages);

  ui.prevBtn.disabled = current === 1;
  ui.nextBtn.disabled = current === totalPages || totalPages === 0;

  const maxButtons = 8;
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const buttons = [];
  for (let page = start; page <= end; page += 1) {
    buttons.push(
      `<button type="button" class="page-num ${page === current ? "page-num--active" : ""}" data-page="${page}">${String(page).padStart(2, "0")}</button>`
    );
  }
  ui.pageNumbers.innerHTML = buttons.join("");

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
  if (state.categorySlug) params.category = state.categorySlug;
  if (state.availability === "In Stock") params.availability = "in_stock";
  if (state.availability === "Out of Stock") params.availability = "out_of_stock";
  return params;
}

async function fetchBooks() {
  if (!ui.grid) return;
  state.loadError = null;
  const hasCards = ui.grid.querySelector(".book-card");
  if (!hasCards) {
    ui.grid.innerHTML = `<div class="catalog-message"><p>Loading catalog…</p></div>`;
  }

  try {
    const result = await booksService.getAllBooks(buildQuery());
    const rawBooks = Array.isArray(result) ? result : result?.results ?? [];
    state.books = rawBooks.filter((b) => b?.id).map(normalizeBook);
    state.totalCount = result.count ?? rawBooks.length;
    state.totalPages = Math.max(1, Math.ceil((state.totalCount || 0) / state.pageSize));
    if (state.currentPage > state.totalPages) {
      state.currentPage = state.totalPages;
    }
  } catch (error) {
    console.error(error);
    state.books = [];
    state.totalCount = 0;
    state.totalPages = 1;
    state.loadError = error?.message || "Request failed";
  }
  renderGrid();
}

async function populateCategoryFilter() {
  const sel = ui.categorySelect;
  if (!sel) return;
  const current = state.categorySlug;
  try {
    const data = await booksService.getCategories();
    const list = Array.isArray(data) ? data : [];
    sel.innerHTML = '<option value="">All collections</option>';
    list.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.slug || "";
      opt.textContent = c.name || c.slug || "Category";
      sel.appendChild(opt);
    });
    sel.value = current && [...sel.options].some((o) => o.value === current) ? current : "";
    state.categorySlug = sel.value || "";
  } catch (e) {
    console.warn("Categories unavailable:", e);
    if (!sel.options.length) {
      sel.innerHTML = '<option value="">All collections</option>';
    }
  }
}

function setupGridNavigation() {
  ui.grid?.addEventListener("click", (e) => {
    const card = e.target.closest(".book-card[data-book-id]");
    if (!card) return;
    const id = card.getAttribute("data-book-id");
    if (id) window.location.href = `${hrefPage("bookDetails")}?id=${encodeURIComponent(id)}`;
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

  ui.categorySelect?.addEventListener("change", () => {
    state.categorySlug = ui.categorySelect.value || "";
    state.currentPage = 1;
    fetchBooks();
  });

  ui.availabilitySelect?.addEventListener("change", () => {
    state.availability = ui.availabilitySelect.value || "All";
    state.currentPage = 1;
    fetchBooks();
  });

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

domHelper.ready(async () => {
  if (loginButton) {
    loginButton.textContent = Auth.isAuthenticated()
      ? Auth.isAdmin()
        ? "Admin"
        : "Dashboard"
      : "Login";
  }
  if (profileButton) {
    profileButton.textContent = Auth.isAuthenticated()
      ? Auth.isAdmin()
        ? "Admin"
        : "Profile"
      : "Profile";
  }

  setupEvents();
  setupGridNavigation();
  await populateCategoryFilter();
  await fetchBooks();
});
