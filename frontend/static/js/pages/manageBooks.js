import { booksService } from "../services/booksService.js";
import { usersService } from "../services/usersService.js";
import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { hrefPage } from "../core/config.js";
import { wireAdminLogout } from "../core/adminNav.js";

function availabilityLabel(book) {
  const a = book?.availability;
  if (typeof a === "string") {
    if (a.includes("On Shelf") || a.toLowerCase().includes("in stock")) return true;
    if (a.includes("Out") || a.includes("Off")) return false;
  }
  const ac = book?.available_copies;
  if (typeof ac === "number") return ac > 0;
  return true;
}

function topCategoryFromList(list) {
  const counts = {};
  for (const b of list) {
    const cat =
      typeof b.category === "string"
        ? b.category
        : b.category?.name || "Uncategorized";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  let best = null;
  let n = 0;
  Object.entries(counts).forEach(([k, v]) => {
    if (v > n) {
      n = v;
      best = k;
    }
  });
  return best && n > 0 ? { name: best, count: n } : null;
}

domHelper.ready(async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (!Auth.isAdmin()) {
    window.location.href = hrefPage("userDashboard");
    return;
  }

  wireAdminLogout();

  const tableBody = domHelper.query("tbody");
  const searchInput = domHelper.query(".header-search");
  const addBtn = domHelper.query(".btn-add");
  const filterBtn = domHelper.query(".btn-filter");
  const exportBtn = domHelper.query(".btn-export");
  const paginationBtns = domHelper.queryAll(".pagination button");

  if (!tableBody) return;

  let tableRows = [];

  async function applyAdminStats(rawList) {
    const totalEl = document.getElementById("stat-total-books");
    const loansEl = document.getElementById("stat-active-loans");
    const catEl = document.getElementById("stat-top-category");
    const catNote = document.getElementById("stat-top-category-note");
    try {
      const d = await usersService.adminDashboard();
      if (totalEl) totalEl.textContent = Number(d.catalog_size || 0).toLocaleString();
      if (loansEl) loansEl.textContent = Number(d.borrowed_books || 0).toLocaleString();
    } catch {
      if (totalEl) totalEl.textContent = "—";
      if (loansEl) loansEl.textContent = "—";
    }
    const top = topCategoryFromList(rawList);
    if (catEl) catEl.textContent = top ? top.name : "—";
    if (catNote) {
      catNote.textContent = top
        ? `${top.count} title${top.count === 1 ? "" : "s"} in current page sample`
        : "Add books to see distribution";
    }
  }

  async function reloadBooks() {
    try {
      const data = await booksService.getAllBooks({ page_size: 200 });
      const list = Array.isArray(data) ? data : data?.results ?? [];
      const rows = list.map((b) => ({
        id: String(b.id),
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: typeof b.category === "string" ? b.category : b.category?.name || "—",
        rating: b.rating ?? b.average_rating ?? "0.0",
        available: availabilityLabel(b),
        raw: b,
      }));
      renderBooks(rows);
      await applyAdminStats(list);
    } catch (error) {
      console.error(error);
      alert(error?.message || "Could not load books. Check API URL and sign-in.");
    }
  }

  function renderBooks(books) {
    tableBody.innerHTML = "";
    books.forEach((book) => {
      const row = domHelper.create("tr");
      row.dataset.bookId = book.id;
      row.innerHTML = `
        <td class="book-cell">
          <div class="book-info">
            <div class="book-cover" role="presentation"></div>
            <div>
              <h4>${escapeHtml(book.title)}</h4>
              <p>ISBN: ${escapeHtml(book.isbn || "N/A")}</p>
            </div>
          </div>
        </td>
        <td>${escapeHtml(book.author)}</td>
        <td><span class="badge">${escapeHtml(book.category)}</span></td>
        <td>
          <span class="status ${book.available ? "available" : "loaned"}">
            ● ${book.available ? "AVAILABLE" : "UNAVAILABLE"}
          </span>
        </td>
        <td class="rating">★ ${escapeHtml(String(book.rating))}</td>
        <td class="actions">
          <button type="button" class="btn-edit" aria-label="Edit">✏️</button>
          <button type="button" class="btn-delete" aria-label="Delete">🗑️</button>
        </td>
      `;
      domHelper.append(tableBody, row);
    });
    updateRows();
    const footer = domHelper.query(".table-footer p");
    if (footer) {
      footer.textContent = `SHOWING ${books.length} ENTRIES`;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateRows() {
    tableRows = Array.from(domHelper.queryAll("tbody tr"));
  }

  await reloadBooks();

  if (searchInput) {
    domHelper.on(searchInput, "input", (e) => {
      const value = e.target.value.toLowerCase();
      tableRows.forEach((row) => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
      });
    });
  }

  domHelper.on(tableBody, "click", async (e) => {
    const del = e.target.closest?.(".btn-delete");
    const edit = e.target.closest?.(".btn-edit");
    const row = e.target.closest?.("tr[data-book-id]");
    if (!row) return;
    const id = row.dataset.bookId;

    if (del) {
      if (!window.confirm("Remove this book from the catalog? (It will be deactivated.)")) return;
      try {
        await booksService.deleteBook(id);
        await reloadBooks();
      } catch (err) {
        alert(err?.message || "Delete failed.");
      }
    }

    if (edit && id) {
      window.location.href = `adminBookForm.html?id=${encodeURIComponent(id)}`;
    }
  });

  if (addBtn) {
    domHelper.on(addBtn, "click", () => {
      window.location.href = "adminBookForm.html";
    });
  }

  paginationBtns.forEach((btn) => {
    domHelper.on(btn, "click", () => {
      paginationBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  if (filterBtn) {
    domHelper.on(filterBtn, "click", () => {
      const onlyAvailable = window.confirm("Show only AVAILABLE books?");
      updateRows();
      tableRows.forEach((row) => {
        const status = row.querySelector(".status")?.textContent || "";
        if (onlyAvailable) {
          row.style.display = status.includes("AVAILABLE") ? "" : "none";
        } else {
          row.style.display = "";
        }
      });
    });
  }

  if (exportBtn) {
    domHelper.on(exportBtn, "click", () => {
      updateRows();
      const data = tableRows.map((row) => ({
        title: row.querySelector("h4")?.textContent,
        author: row.children[1]?.textContent,
      }));
      console.log("Export:", data);
      alert(`Exported ${data.length} rows to the browser console.`);
    });
  }
});
