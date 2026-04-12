import { borrowService } from "../services/borrowService.js";
import { domHelper } from "../utils/domHelper.js";
import { Auth } from "../core/auth.js";

// Navigation
const homeButton = document.getElementById("navbar__brand");
homeButton.addEventListener("click", () => {
    window.location.href = "../index.html";
});

const profileButton = document.getElementById("btn-nav");
profileButton.addEventListener("click", () => {
    window.location.href = "myProfile.html";
});

const state = {
    borrowedBooks: [],
    filtered: [],
    currentPage: 1,
    pageSize: 10,
    statusFilter: "",
    sortFilter: "due-date",
};

const ui = {
    container: domHelper.query("#borrowedBooksContainer"),
    emptyState: domHelper.query("#emptyState"),
    statusFilter: domHelper.query("#statusFilter"),
    sortFilter: domHelper.query("#sortFilter"),
    applyFiltersBtn: domHelper.query("#applyFilters"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = "loginPage.html";
        return;
    }
    await loadBorrowedBooks();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    ui.applyFiltersBtn?.addEventListener("click", () => {
        state.statusFilter = ui.statusFilter?.value || "";
        state.sortFilter = ui.sortFilter?.value || "due-date";
        state.currentPage = 1;
        filterAndRender();
    });
}

// Load borrowed books
async function loadBorrowedBooks() {
    try {
        const data = await borrowService.getBorrowedItems();
        state.borrowedBooks = data?.data || [];
        filterAndRender();
    } catch (error) {
        console.error("Error loading borrowed books:", error);
        showEmptyState();
    }
}

// Filter and render
function filterAndRender() {
    // Filter by status
    let filtered = state.borrowedBooks.filter(book => {
        if (!state.statusFilter) return true;
        return book.status?.toLowerCase() === state.statusFilter.toLowerCase();
    });

    // Sort
    filtered = sortBooks(filtered, state.sortFilter);
    state.filtered = filtered;

    if (filtered.length === 0) {
        showEmptyState();
    } else {
        renderBooks(filtered);
    }
}

// Sort books
function sortBooks(books, sortBy) {
    const sorted = [...books];
    
    switch (sortBy) {
        case "due-date":
            sorted.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            break;
        case "title":
            sorted.sort((a, b) => a.book_title?.localeCompare(b.book_title) || 0);
            break;
        case "date-borrowed":
            sorted.sort((a, b) => new Date(b.borrowed_date) - new Date(a.borrowed_date));
            break;
    }
    return sorted;
}

// Render books
function renderBooks(books) {
    ui.container.innerHTML = books.map(book => createBookCard(book)).join("");
    ui.emptyState.style.display = "none";
}

// Create book card
function createBookCard(book) {
    const dueDate = new Date(book.due_date);
    const today = new Date();
    const isOverdue = dueDate < today;
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    let statusClass = "status-badge--active";
    let statusText = "Active";

    if (isOverdue) {
        statusClass = "status-badge--overdue";
        statusText = "Overdue";
    } else if (daysLeft <= 3) {
        statusClass = "status-badge--due-soon";
        statusText = "Due Soon";
    }

    const cover = book.book_cover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";

    return `
        <article class="borrowed-book-card">
            <div class="book-cover-thumb">
                <img src="${cover}" alt="${book.book_title || "Book"}">
            </div>
            <h3 class="book-title-sm">${book.book_title || "Untitled"}</h3>
            <p class="book-author-sm">${book.book_author || "Unknown Author"}</p>
            <span class="status-badge ${statusClass}">${statusText}</span>
            <div class="due-date">Due: ${formatDate(book.due_date)}</div>
            <div class="card-actions">
                <button class="btn btn-primary" data-id="${book.id}" onclick="renewBook('${book.id}')">Renew</button>
                <button class="btn btn-ghost" data-id="${book.id}" onclick="returnBook('${book.id}')">Return</button>
            </div>
        </article>
    `;
}

// Renew book
async function renewBook(loanId) {
    try {
        const result = await borrowService.renewBorrowedItem(loanId);
        if (result) {
            alert("Book renewed successfully!");
            await loadBorrowedBooks();
        }
    } catch (error) {
        console.error("Error renewing book:", error);
        alert("Failed to renew book");
    }
}

// Return book
async function returnBook(loanId) {
    try {
        const result = await borrowService.returnBorrowedItem(loanId);
        if (result) {
            alert("Book returned successfully!");
            await loadBorrowedBooks();
        }
    } catch (error) {
        console.error("Error returning book:", error);
        alert("Failed to return book");
    }
}

// Show empty state
function showEmptyState() {
    ui.container.innerHTML = "";
    ui.emptyState.style.display = "block";
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
    });
}
