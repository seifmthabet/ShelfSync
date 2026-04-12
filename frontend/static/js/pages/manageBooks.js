import { booksService } from "../services/booksService.js";
import { domHelper } from "../utils/domHelper.js";

domHelper.ready(async () => {

  const tableBody = domHelper.query("tbody");
  const searchInput = domHelper.query(".header-search");

  const addBtn = domHelper.query(".btn-add");
  const filterBtn = domHelper.query(".btn-filter");
  const exportBtn = domHelper.query(".btn-export");

  const paginationBtns = domHelper.queryAll(".pagination button");
  const sidebarBtns = domHelper.queryAll(".sidebar-btn");

  let rows = [];

  try {
    const data = await booksService.getAllBooks();

    if (data && data.length) {
      renderBooks(data);
    }

  } catch (error) {
    console.error("Load failed:", error.message);
  }

  domHelper.on(searchInput, "input", (e) => {
    const value = e.target.value.toLowerCase();

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(value) ? "" : "none";
    });
  });

  domHelper.on(tableBody, "click", (e) => {


    if (e.target.textContent === "🗑️") {
      const row = e.target.closest("tr");
      row.remove();
      updateRows();
    }

    if (e.target.textContent === "✏️") {
      const row = e.target.closest("tr");

      const titleEl = row.querySelector("h4");
      const newTitle = prompt("Edit book title:", titleEl.textContent);

      if (newTitle) {
        titleEl.textContent = newTitle;
      }
    }

  });

  domHelper.on(addBtn, "click", () => {
    const title = prompt("Book Title:");
    const author = prompt("Author:");
    const isbn = prompt("ISBN:");

    if (!title || !author) return;

    const newRow = domHelper.create("tr");

    newRow.innerHTML = `
      <td class="book-cell">
        <div class="book-info">
          <div class="book-cover"></div>
          <div>
            <h4>${title}</h4>
            <p>ISBN: ${isbn || "N/A"}</p>
          </div>
        </div>
      </td>
      <td>${author}</td>
      <td><span class="badge">NEW</span></td>
      <td><span class="status available">● AVAILABLE</span></td>
      <td class="rating">★ 4.0</td>
      <td class="actions">
        <button>✏️</button>
        <button>🗑️</button>
      </td>
    `;

    domHelper.append(tableBody, newRow);
    updateRows();
  });

  paginationBtns.forEach(btn => {
    domHelper.on(btn, "click", () => {
      paginationBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      alert("Pagination is UI mock");
    });
  });

  domHelper.on(filterBtn, "click", () => {
    const onlyAvailable = confirm("Show only AVAILABLE books?");

    rows.forEach(row => {
      const status = row.querySelector(".status").textContent;

      if (onlyAvailable) {
        row.style.display = status.includes("AVAILABLE") ? "" : "none";
      } else {
        row.style.display = "";
      }
    });
  });

  domHelper.on(exportBtn, "click", () => {
    const data = [];

    rows.forEach(row => {
      const title = row.querySelector("h4").textContent;
      const author = row.children[1].textContent;

      data.push({ title, author });
    });

    console.log("Export Data:", data);
    alert("Check console for exported data");
  });

  sidebarBtns.forEach(btn => {
    domHelper.on(btn, "click", () => {
      sidebarBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  function updateRows() {
    rows = Array.from(domHelper.queryAll("tbody tr"));
  }

  function renderBooks(books) {
    tableBody.innerHTML = "";

    books.forEach(book => {
      const row = domHelper.create("tr");

      row.innerHTML = `
        <td class="book-cell">
          <div class="book-info">
            <div class="book-cover"></div>
            <div>
              <h4>${book.title}</h4>
              <p>ISBN: ${book.isbn || "N/A"}</p>
            </div>
          </div>
        </td>
        <td>${book.author}</td>
        <td><span class="badge">${book.category}</span></td>
        <td>
          <span class="status ${book.available ? "available" : "loaned"}">
            ● ${book.available ? "AVAILABLE" : "LOANED"}
          </span>
        </td>
        <td class="rating">★ ${book.rating || "0.0"}</td>
        <td class="actions">
          <button>✏️</button>
          <button>🗑️</button>
        </td>
      `;

      domHelper.append(tableBody, row);
    });

    updateRows();
  }

});