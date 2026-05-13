import { booksService } from "../services/booksService.js";
import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";

const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");

function wireNavAuth() {
  if (loginButton) {
    if (Auth.isAuthenticated()) {
      loginButton.textContent = Auth.isAdmin() ? "Admin" : "Dashboard";
      loginButton.onclick = () => {
        window.location.href = Auth.isAdmin()
          ? "pages/adminDashboard.html"
          : "pages/userDashboard.html";
      };
    } else {
      loginButton.textContent = "LOGIN";
      loginButton.onclick = () => {
        window.location.href = "pages/loginPage.html";
      };
    }
  }
  if (signupButton) {
    if (Auth.isAuthenticated()) {
      signupButton.textContent = "PROFILE";
      signupButton.onclick = () => {
        window.location.href = "pages/myProfile.html";
      };
    } else {
      signupButton.textContent = "GET STARTED";
      signupButton.onclick = () => {
        window.location.href = "pages/signUp.html";
      };
    }
  }
}

const state = {
  newArrivals: [],
  isLoading: true,
};

const ui = {
  newArrivalsGrid: null,
};

document.addEventListener("DOMContentLoaded", () => {
  wireNavAuth();
  initializeUI();
  loadBooks();
  const newsletterForm = document.getElementById("newsletter-form");
  newsletterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(newsletterForm);
    const email = String(fd.get("email") || "").trim();
    if (!email) return;
    try {
      let list = JSON.parse(localStorage.getItem("shelfsync_newsletter_signups") || "[]");
      if (!Array.isArray(list)) list = [];
      list.push({ email, at: new Date().toISOString() });
      localStorage.setItem("shelfsync_newsletter_signups", JSON.stringify(list.slice(-200)));
    } catch {
      /* ignore */
    }
    alert("Thanks — your interest is recorded. We will follow up at " + email + ".");
    newsletterForm.reset();
  });
});

function initializeUI() {
  ui.newArrivalsGrid =
    document.querySelector("#newly-archived-grid") ||
    document.querySelector(".archived .book-grid");
}

function buildStars(rating) {
  const full = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
  return `${"★".repeat(full)}${"☆".repeat(5 - full)}`;
}

async function loadBooks() {
  try {
    const response = await booksService.getAllBooks({ page_size: 24 });
    const books = Array.isArray(response) ? response : response?.results ?? [];

    state.newArrivals = [...books]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 8);

    state.isLoading = false;

    if (ui.newArrivalsGrid) {
      renderNewArrivals();
    }

    observeElements();
  } catch (error) {
    console.error("Error loading books:", error);
    state.isLoading = false;
  }
}

function renderNewArrivals() {
  if (!ui.newArrivalsGrid) return;

  const fragment = document.createDocumentFragment();

  state.newArrivals.forEach((book) => {
    fragment.appendChild(createBookCard(book));
  });

  ui.newArrivalsGrid.innerHTML = "";
  ui.newArrivalsGrid.appendChild(fragment);
}

function createBookCard(book) {
  const div = domHelper.create("article", {
    class: "book-card arrived-card",
  });

  const cover =
    book.cover ||
    book.cover_url ||
    book.image ||
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
  const title = book.title || book.book_title || "Untitled";
  const author = book.author || book.book_author || "Unknown";
  const rating = book.rating ?? book.average_rating ?? 4.5;

  div.innerHTML = `
    <div class="book-card__img">
      <img src="${cover}" alt="${title}" loading="lazy">
    </div>
    <div class="book-card__meta">
      <span class="book-genre">${book.category || "General"}</span>
      <div class="book-stars">${buildStars(rating)}</div>
    </div>
    <h3 class="book-title">${title}</h3>
    <p class="book-author">${author}</p>
  `;

  div.addEventListener("click", () => {
    window.location.href = `pages/bookDetails.html?id=${book.id}`;
  });

  return div;
}

function observeElements() {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    domHelper
      .queryAll(".book-card, .collection-card, .review-card")
      .forEach((el) => {
        observer.observe(el);
      });
  }
}

const style = document.createElement("style");
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
