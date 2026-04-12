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
    readingHistory: [],
    filtered: [],
    totalBooks: 0,
    totalPages: 0,
    avgRating: 0,
    readingMonth: 0,
    sortFilter: "date-completed",
};

const ui = {
    timelineContainer: domHelper.query("#timelineContainer"),
    emptyState: domHelper.query("#emptyState"),
    sortFilter: domHelper.query("#sortFilter"),
    applySortBtn: domHelper.query("#applySortFilter"),
    totalBooks: domHelper.query("#totalBooks"),
    totalPages: domHelper.query("#totalPages"),
    avgRating: domHelper.query("#avgRating"),
    readingMonth: domHelper.query("#readingMonth"),
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = "loginPage.html";
        return;
    }
    await loadReadingHistory();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    ui.applySortBtn?.addEventListener("click", () => {
        state.sortFilter = ui.sortFilter?.value || "date-completed";
        filterAndRender();
    });
}

// Load reading history
async function loadReadingHistory() {
    try {
        // Mock data since we don't have a specific completed books endpoint yet
        // In production, this would come from API endpoint: GET /api/v1/reading-history/
        const mockData = [
            {
                id: 1,
                book_title: "The Great Gatsby",
                book_author: "F. Scott Fitzgerald",
                book_cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
                pages: 180,
                rating: 5,
                completed_date: "2026-04-01",
                time_to_read: 12,
            },
            {
                id: 2,
                book_title: "To Kill a Mockingbird",
                book_author: "Harper Lee",
                book_cover: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&q=80",
                pages: 281,
                rating: 4.5,
                completed_date: "2026-03-15",
                time_to_read: 18,
            },
            {
                id: 3,
                book_title: "1984",
                book_author: "George Orwell",
                book_cover: "https://images.unsplash.com/photo-1543002588-d83cedcb3b02?w=400&q=80",
                pages: 328,
                rating: 4,
                completed_date: "2026-03-01",
                time_to_read: 22,
            },
        ];

        state.readingHistory = mockData;
        calculateStatistics();
        filterAndRender();
    } catch (error) {
        console.error("Error loading reading history:", error);
        showEmptyState();
    }
}

// Calculate statistics
function calculateStatistics() {
    const books = state.readingHistory;
    
    state.totalBooks = books.length;
    state.totalPages = books.reduce((sum, book) => sum + (book.pages || 0), 0);
    state.avgRating = books.length > 0 
        ? (books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length).toFixed(1)
        : 0;

    // Count books completed this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    state.readingMonth = books.filter(book => {
        const date = new Date(book.completed_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    updateStatistics();
}

// Update statistics UI
function updateStatistics() {
    if (ui.totalBooks) ui.totalBooks.textContent = state.totalBooks;
    if (ui.totalPages) ui.totalPages.textContent = state.totalPages;
    if (ui.avgRating) ui.avgRating.textContent = state.avgRating;
    if (ui.readingMonth) ui.readingMonth.textContent = state.readingMonth;
}

// Filter and render
function filterAndRender() {
    let filtered = [...state.readingHistory];
    
    // Sort
    filtered = sortBooks(filtered, state.sortFilter);
    state.filtered = filtered;

    if (filtered.length === 0) {
        showEmptyState();
    } else {
        renderTimeline(filtered);
    }
}

// Sort books
function sortBooks(books, sortBy) {
    const sorted = [...books];
    
    switch (sortBy) {
        case "date-completed":
            sorted.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
            break;
        case "title":
            sorted.sort((a, b) => a.book_title?.localeCompare(b.book_title) || 0);
            break;
        case "rating":
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case "pages":
            sorted.sort((a, b) => (b.pages || 0) - (a.pages || 0));
            break;
    }
    return sorted;
}

// Render timeline
function renderTimeline(books) {
    ui.timelineContainer.innerHTML = books.map(book => createTimelineItem(book)).join("");
    ui.emptyState.style.display = "none";
}

// Create timeline item
function createTimelineItem(book) {
    const cover = book.book_cover || "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80";
    const stars = buildStars(book.rating || 5);

    return `
        <div class="timeline-item">
            <div class="timeline-book-cover">
                <img src="${cover}" alt="${book.book_title}">
            </div>
            <div class="timeline-info">
                <h3 class="timeline-title">${book.book_title || "Untitled"}</h3>
                <p class="timeline-author">${book.book_author || "Unknown"}</p>
                <div class="timeline-meta">
                    <span>${book.pages || 0} pages</span>
                    <span>${book.time_to_read || 0} days to read</span>
                </div>
            </div>
            <div class="timeline-stats">
                <div class="timeline-rating">${stars}</div>
                <div class="timeline-pages">${book.rating || 0}/5 rating</div>
                <div class="timeline-pages" style="font-size: 11px; margin-top: 4px;">
                    ${formatDate(book.completed_date)}
                </div>
            </div>
        </div>
    `;
}

// Build stars
function buildStars(rating) {
    const full = Math.round(Math.max(0, Math.min(5, rating)));
    const empty = 5 - full;
    return `${"★".repeat(full)}${empty > 0 ? `${"☆".repeat(empty)}` : ""}`;
}

// Show empty state
function showEmptyState() {
    ui.timelineContainer.innerHTML = "";
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
