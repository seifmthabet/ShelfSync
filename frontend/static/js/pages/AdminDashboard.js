import { Auth } from "../core/auth.js";
import { usersService } from "../services/usersService.js";
import { hrefPage } from "../core/config.js";

const form = document.getElementById("my-form");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const input = document.getElementById("search-form");
    const bookName = input.value;

    const validPattern = /^(?!.* {2})[a-zA-Z0-9 ]+$/;
    if (bookName.length === 0) {
      alert("Error : the value is Empty");
    } else if (bookName.length <= 3 || !validPattern.test(bookName)) {
      alert("Error: Inavlid Book Name ");
    } else {
      console.log(bookName);
      input.value = "";
    }
  });
}

const addMemoBtn = document.getElementById("AddMemo");
if (addMemoBtn) {
  addMemoBtn.addEventListener("click", () => {
    const thirdNote = document.querySelector(".note-3");
    const thirdComment = document.querySelector(".comment-3");
    if (!thirdNote || !thirdComment) return;

    if (
      thirdNote.style.display !== "none" &&
      thirdNote.textContent.trim() !== ""
    ) {
      const confirmDelete = confirm(
        "The third memo will be deleted. Do you want to continue?"
      );
      if (!confirmDelete) {
        alert("Operation cancelled.");
        return;
      }
    }

    const memoText = prompt("Enter a new memo (maximum 12 words):");

    if (memoText && memoText.trim() !== "") {
      const wordCount = memoText.trim().split(/\s+/).length;
      if (wordCount > 12) {
        alert("The memo cannot exceed 12 words.");
        return;
      }

      thirdNote.textContent = `"${memoText}"`;
      thirdNote.style.display = "block";

      const now = new Date();
      thirdComment.textContent = now.toLocaleTimeString() + " — Current User";
      thirdComment.style.display = "block";

      alert("Memo added successfully.");
    } else {
      alert("The memo cannot be empty.");
    }
  });
}

async function loadDashboardMetrics() {
  if (!Auth.isAuthenticated() || !Auth.isAdmin()) {
    return;
  }
  try {
    const d = await usersService.adminDashboard();
    const catalog = document.querySelector(".catalog-size .content");
    const users = document.querySelector(".activ-users .content");
    const reviews = document.querySelector(".Reviews .content");
    const borrowed = document.querySelector(".sec-3 div:nth-child(1) .class-content");
    const retention = document.querySelector(".sec-3 div:nth-child(2) .class-content");
    const rating = document.querySelector(".sec-3 div:nth-child(3) .class-content");
    const storage = document.querySelector(".sec-3 div:nth-child(4) .class-content");

    if (catalog) catalog.textContent = Number(d.catalog_size || 0).toLocaleString();
    if (users) users.textContent = Number(d.active_users || 0).toLocaleString();
    if (reviews) reviews.textContent = Number(d.total_reviews || 0).toLocaleString();
    if (borrowed) borrowed.textContent = Number(d.borrowed_books || 0).toLocaleString();
    if (retention) retention.textContent = `${Number(d.retention_rate || 0).toFixed(1)}%`;
    if (rating) rating.textContent = Number(d.average_rating || 0).toFixed(1);
    if (storage) storage.textContent = `${Number(d.storage_utilization || 0).toFixed(1)}%`;
  } catch (e) {
    console.warn("Dashboard metrics unavailable:", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = hrefPage("login");
    return;
  }
  if (!Auth.isAdmin()) {
    window.location.href = hrefPage("userDashboard");
    return;
  }
  loadDashboardMetrics();
});
