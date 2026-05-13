/**
 * Plain browser JavaScript only — no frameworks, no bundler, no ES modules.
 *
 * API_BASE is chosen automatically when possible:
 * - Same host as Django (port 8000, or URL under /app/…) → "/api/v1/" (same origin, no CORS).
 * - Otherwise (e.g. Live Server) → "http://127.0.0.1:8000/api/v1/".
 * Override after load if needed: window.ShelfSync.API_BASE = "https://your-api.example.com/api/v1/";
 */
window.ShelfSync = window.ShelfSync || {};

(function () {
  var loc = typeof location !== "undefined" ? location : null;
  if (
    loc &&
    loc.protocol !== "file:" &&
    (loc.port === "8000" ||
      loc.pathname === "/app" ||
      (loc.pathname && loc.pathname.indexOf("/app/") === 0))
  ) {
    window.ShelfSync.API_BASE = "/api/v1/";
  } else {
    window.ShelfSync.API_BASE = "http://127.0.0.1:8000/api/v1/";
  }
})();

window.ShelfSync.ROUTES = {
  home: "index.html",
  login: "login.html",
  register: "register.html",
  userDashboard: "user-dashboard.html",
  userBooks: "user-books.html",
  userBook: "user-book.html",
  userBorrows: "user-borrows.html",
  userLoans: "user-loans.html",
  userProfile: "user-profile.html",
  userReview: "user-review.html",
  adminDashboard: "admin-dashboard.html",
  adminUsers: "admin-users.html",
  adminBooks: "admin-books.html",
  adminBorrows: "admin-borrows.html",
  adminReviews: "admin-reviews.html",
};
