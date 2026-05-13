import { Auth } from "../core/auth.js";
import { borrowService } from "../services/borrowService.js";
import { usersService } from "../services/usersService.js";
import { hrefPage } from "../core/config.js";

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

function animateValue(element, start, end, duration) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const v = Math.floor(progress * (end - start) + start);
    element.textContent = v.toString().padStart(2, "0");
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

function setProgressBars() {
  setTimeout(() => {
    document.querySelectorAll(".progress-bar").forEach((bar) => {
      const target = bar.getAttribute("data-progress");
      if (target) bar.style.width = `${target}%`;
    });
  }, 300);
}

function renderActiveLoans(loans) {
  const grid = document.querySelector(".books-grid");
  if (!grid) return;

  if (!loans.length) {
    grid.innerHTML = `<p class="body-lg" style="padding:1rem;">No active loans. <a href="${hrefPage("searchBooks")}">Browse the catalog</a>.</p>`;
    return;
  }

  const now = Date.now();
  grid.innerHTML = loans
    .map((loan) => {
      const due = new Date(loan.due_date).getTime();
      const pct = Math.min(95, Math.max(5, Math.round(((now - new Date(loan.borrowed_date)) / (due - new Date(loan.borrowed_date))) * 100)));
      const cover =
        loan.book_cover ||
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
      return `
        <div class="book-card card ghost-border">
          <div class="book-cover">
            <img src="${cover}" alt="${loan.book_title}" class="cover-image">
          </div>
          <div class="book-info">
            <p class="label-md category">On loan</p>
            <h4 class="title-lg">${loan.book_title || "Book"}</h4>
            <p class="body-lg author">${loan.book_author || ""}</p>
            <div class="progress-container">
              <div class="progress-bar" data-progress="${pct}"></div>
            </div>
            <div class="progress-text">
              <span>Due ${new Date(loan.due_date).toLocaleDateString()}</span>
              <strong><a href="${hrefPage("borrowedBooks")}">Manage loan</a></strong>
            </div>
          </div>
        </div>`;
    })
    .join("");

  setProgressBars();
}

async function renewFirstDueLoan(loans) {
  const soon = loans
    .filter((l) => l.status === "active")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  if (!soon) {
    alert("No active loans to renew.");
    return;
  }
  await borrowService.renewBorrowedItem(soon.id);
}

async function bootstrap() {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (Auth.isAdmin()) {
    window.location.href = hrefPage("adminDashboard");
    return;
  }

  const user = Auth.getCurrentUser() || {};
  const welcome = document.querySelector(".welcome-title");
  if (welcome) {
    welcome.innerHTML = `Welcome back,<br><em>${user.name || "Reader"}.</em>`;
  }

  const sideName = document.querySelector(".user-info h2");
  if (sideName) sideName.textContent = user.name || "Member";

  let dash = { active_loans: 0, reviews_written: 0, due_this_week: 0 };
  let loans = [];
  try {
    [dash, loans] = await Promise.all([
      usersService.userDashboard(),
      borrowService.getBorrowedItems(),
    ]);
  } catch (e) {
    console.warn("Dashboard load:", e);
  }

  const rawLoans = Array.isArray(loans) ? loans : loans?.results ?? [];
  const dueSoon = rawLoans.filter((l) => {
    const d = daysUntil(l.due_date);
    return d !== null && d >= 0 && d <= 7;
  });

  const dueCountEl = document.getElementById("due-count");
  if (dueCountEl) dueCountEl.textContent = String(dueSoon.length);

  const noteP = document.querySelector(".scholar-note p");
  if (noteP) {
    noteP.innerHTML =
      dueSoon.length > 0
        ? `You have <span id="due-count">${dueSoon.length}</span> item(s) due within the next week.`
        : "You have no loans due this week.";
  }

  animateValue(document.getElementById("active-loans"), 0, dash.active_loans ?? 0, 800);
  animateValue(document.getElementById("reviews-written"), 0, dash.reviews_written ?? 0, 1000);
  const credits = Math.max(0, 12 - (dash.active_loans ?? 0) * 2);
  animateValue(document.getElementById("available-credits"), 0, credits, 900);

  const activeDesc = document.querySelector(".stats-grid .stat-card:nth-child(1) .stat-desc");
  if (activeDesc) {
    activeDesc.textContent = `${dash.due_this_week ?? 0} books due this week`;
  }

  renderActiveLoans(rawLoans);
}

function bindRenewButtonOnce() {
  const renewBtn = document.getElementById("renew-btn");
  if (!renewBtn || renewBtn.dataset.bound === "1") return;
  renewBtn.dataset.bound = "1";
  renewBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    renewBtn.textContent = "Renewing…";
    renewBtn.disabled = true;
    try {
      const loansData = await borrowService.getBorrowedItems();
      const raw = Array.isArray(loansData) ? loansData : loansData?.results ?? [];
      await renewFirstDueLoan(raw);
      alert("Renewal processed.");
      await bootstrap();
    } catch (err) {
      alert(err?.message || "Renewal failed.");
    } finally {
      renewBtn.disabled = false;
      renewBtn.textContent = "Renew Now";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".top-nav strong")?.addEventListener("click", () => {
    window.location.href = hrefPage("home");
  });

  document.getElementById("dash-browse-catalog")?.addEventListener("click", () => {
    window.location.href = hrefPage("searchBooks");
  });
  document.getElementById("dash-surprise")?.addEventListener("click", () => {
    window.location.href = hrefPage("searchBooks");
  });

  const links = document.querySelectorAll(".ul-Main a");
  links.forEach((a) => {
    const t = (a.textContent || "").trim();
    if (t === "Dashboard") a.href = hrefPage("userDashboard");
    if (t === "Library" || t.includes("Library")) a.href = hrefPage("searchBooks");
    if (t === "Reviews") a.href = hrefPage("writeReview");
    if (t === "History") a.href = hrefPage("readingHistory");
  });

  document.querySelectorAll(".top-nav .nav-links a").forEach((a) => {
    const t = (a.textContent || "").trim();
    if (t === "Browse" || t === "Catalog") a.href = hrefPage("searchBooks");
    if (t === "About") a.href = hrefPage("about");
  });

  const viewArchive = document.querySelector(".view-link");
  if (viewArchive) {
    viewArchive.href = hrefPage("borrowedBooks");
    viewArchive.textContent = "My borrowed books";
  }

  const topAuth = document.getElementById("top-auth-link");
  if (topAuth) {
    topAuth.textContent = "Logout";
    topAuth.href = "#";
    topAuth.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.logout({ redirect: false });
      window.location.href = hrefPage("login");
    });
  }

  bootstrap().then(() => bindRenewButtonOnce());
});
