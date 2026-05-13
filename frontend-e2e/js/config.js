/**
 * Plain browser JavaScript only — no frameworks, no bundler, no ES modules.
 * Serve this folder over HTTP. Add your origin to Django `CORS_ALLOWED_ORIGINS`.
 */
window.ShelfSync = window.ShelfSync || {};

window.ShelfSync.API_BASE = "http://127.0.0.1:8000/api/v1/";

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
