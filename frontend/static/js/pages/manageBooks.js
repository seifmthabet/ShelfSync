import { booksService } from "../services/booksService.js";
import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";
import { hrefPage } from "../core/config.js";

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

function promptBookPayload() {
  const title = window.prompt("Title (required)")?.trim();
  const author = window.prompt("Author (required)")?.trim();
  if (!title || !author) {
    alert("Title and author are required.");
    return null;
  }
  const isbn = window.prompt("ISBN (optional)")?.trim() || "";
  const description = window.prompt("Description (optional)")?.trim() || "";
  const yearRaw = window.prompt("Publication year (optional)")?.trim();
  const publication_year = yearRaw ? parseInt(yearRaw, 10) : null;
  const cover_url = window.prompt("Cover image URL (optional)")?.trim() || "";
  const totalRaw = window.prompt("Total copies", "1")?.trim() || "1";
  const availRaw = window.prompt("Available copies", totalRaw)?.trim() || totalRaw;
  const total_copies = Math.max(1, parseInt(totalRaw, 10) || 1);
  let available_copies = Math.max(0, parseInt(availRaw, 10) || 0);
  if (available_copies > total_copies) available_copies = total_copies;
  const category_slug = window.prompt("Category slug (optional, e.g. fiction)")?.trim() || null;

  return {
    title,
    author,
    isbn,
    description,
    publication_year: Number.isFinite(publication_year) ? publication_year : null,
    cover_url,
    total_copies,
    available_copies,
    category_slug: category_slug || null,
  };
}

function promptEditPayload(book) {
  const title = window.prompt("Title", book.title || "")?.trim();
  const author = window.prompt("Author", book.author || "")?.trim();
  if (!title || !author) return null;
  const isbn = window.prompt("ISBN", book.isbn ?? "")?.trim() ?? "";
  const description = window.prompt(
    "Description",
    book.summary ?? book.description ?? ""
  )?.trim() ?? "";
  const yearRaw = window.prompt(
    "Publication year",
    book.year != null ? String(book.year) : ""
  )?.trim();
  const publication_year = yearRaw ? parseInt(yearRaw, 10) : null;
  const cover_url = window.prompt(
    "Cover URL",
    book.cover ?? book.cover_url ?? ""
  )?.trim() ?? "";
  const total_copies = Math.max(
    1,
    parseInt(
      window.prompt("Total copies", String(book.total_copies ?? 1)) || "1",
      10
    ) || 1
  );
  let available_copies = Math.max(
    0,
    parseInt(
      window.prompt(
        "Available copies",
        String(book.available_copies ?? total_copies)
      ) || String(total_copies),
      10
    ) || 0
  );
  if (available_copies > total_copies) available_copies = total_copies;

  return {
    title,
    author,
    isbn,
    description,
    publication_year: Number.isFinite(publication_year) ? publication_year : null,
    cover_url,
    total_copies,
    available_copies,
  };
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

  const tableBody = domHelper.query("tbody");
  const searchInput = domHelper.query(".header-search");
  const addBtn = domHelper.query(".btn-add");
  const filterBtn = domHelper.query(".btn-filter");
  const exportBtn = domHelper.query(".btn-export");
  const paginationBtns = domHelper.queryAll(".pagination button");

  if (!tableBody) return;

  let tableRows = [];

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

    if (edit) {
      try {
        const full = await booksService.getBookById(id);
        const b = full?.data ?? full;
        const payload = promptEditPayload(b);
        if (!payload) return;
        await booksService.updateBook(id, payload);
        await reloadBooks();
      } catch (err) {
        alert(err?.message || "Update failed.");
      }
    }
  });

  if (addBtn) {
    domHelper.on(addBtn, "click", async () => {
      const payload = promptBookPayload();
      if (!payload) return;
      try {
        await booksService.addBook(payload);
        await reloadBooks();
      } catch (err) {
        alert(err?.message || "Could not add book.");
      }
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
