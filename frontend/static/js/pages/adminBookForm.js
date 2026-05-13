import { booksService } from "../services/booksService.js";
import { Auth } from "../core/auth.js";
import { hrefPage } from "../core/config.js";
import { wireAdminLogout } from "../core/adminNav.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let editId = null;

function getIdFromQuery() {
  const id = new URLSearchParams(window.location.search).get("id")?.trim();
  if (id && UUID_RE.test(id)) return id;
  return null;
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v ?? "";
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (!Auth.isAdmin()) {
    window.location.href = hrefPage("userDashboard");
    return;
  }

  wireAdminLogout();

  editId = getIdFromQuery();
  const titleEl = document.getElementById("form-title");
  const subEl = document.getElementById("form-subtitle");
  const submitBtn = document.getElementById("submit-btn");

  if (editId) {
    if (titleEl) titleEl.textContent = "Edit book";
    if (subEl) subEl.textContent = "Update catalog metadata and copy counts.";
    if (submitBtn) submitBtn.textContent = "Save changes";
    try {
      const res = await booksService.getBookById(editId);
      const b = res?.data ?? res;
      setVal("title", b.title);
      setVal("author", b.author);
      setVal("isbn", b.isbn);
      setVal("publication_year", b.year);
      setVal("description", b.summary ?? b.description ?? "");
      setVal("cover_url", b.cover ?? b.cover_url ?? "");
      setVal("total_copies", b.total_copies ?? 1);
      setVal("available_copies", b.available_copies ?? b.total_copies ?? 1);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Could not load book.");
      window.location.href = hrefPage("adminBooks");
    }
  }

  document.getElementById("book-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title")?.value?.trim();
    const author = document.getElementById("author")?.value?.trim();
    if (!title || !author) {
      alert("Title and author are required.");
      return;
    }

    const yearRaw = document.getElementById("publication_year")?.value?.trim();
    const publication_year = yearRaw ? parseInt(yearRaw, 10) : null;

    const total = Math.max(1, parseInt(document.getElementById("total_copies")?.value || "1", 10) || 1);
    let available = Math.max(0, parseInt(document.getElementById("available_copies")?.value || "0", 10) || 0);
    if (available > total) available = total;

    const payload = {
      title,
      author,
      isbn: document.getElementById("isbn")?.value?.trim() || "",
      description: document.getElementById("description")?.value?.trim() || "",
      publication_year: Number.isFinite(publication_year) ? publication_year : null,
      cover_url: document.getElementById("cover_url")?.value?.trim() || "",
      total_copies: total,
      available_copies: available,
    };
    const slug = document.getElementById("category_slug")?.value?.trim();
    if (slug) payload.category_slug = slug;

    try {
      if (editId) {
        await booksService.updateBook(editId, payload);
        alert("Book updated.");
      } else {
        await booksService.addBook(payload);
        alert("Book created.");
      }
      window.location.href = hrefPage("adminBooks");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Save failed.");
    }
  });
});
