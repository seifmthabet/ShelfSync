/**
 * API base URL resolution (production-friendly):
 * 1) <meta name="api-base-url" content="https://api.example.com/api/v1/">
 * 2) window.__SHELFSYNC_API_BASE__
 * 3) Same-origin /api/v1/ when not on localhost file preview
 * 4) Dev default http://127.0.0.1:8000/api/v1/
 */
function readMetaApiBase() {
  if (typeof document === "undefined") return "";
  const el = document.querySelector('meta[name="api-base-url"]');
  const v = el?.getAttribute("content")?.trim();
  if (!v) return "";
  return v.endsWith("/") ? v : `${v}/`;
}

function defaultApiBase() {
  if (typeof window === "undefined") return "http://127.0.0.1:8000/api/v1/";
  if (window.__SHELFSYNC_API_BASE__) {
    const b = String(window.__SHELFSYNC_API_BASE__).trim();
    return b.endsWith("/") ? b : `${b}/`;
  }
  const { protocol, hostname, port } = window.location;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}//${hostname}${port ? `:${port}` : ""}/api/v1/`;
  }
  return "http://127.0.0.1:8000/api/v1/";
}

export const config = {
  get apiBaseUrl() {
    return readMetaApiBase() || defaultApiBase();
  },
  requestTimeoute: 15000,
  get requestTimeout() {
    return this.requestTimeoute;
  },
  tokenRefreshPath: "auth/token/refresh/",
};

export function isInPagesFolder() {
  return typeof window !== "undefined" && /\/pages\//.test(window.location.pathname);
}

/** Resolve a site page URL whether we are in /frontend/ or /frontend/pages/ */
export function hrefPage(name) {
  const inPages = isInPagesFolder();
  const p = (n) => (inPages ? n : `pages/${n}`);
  const map = {
    home: inPages ? "../index.html" : "./index.html",
    login: p("loginPage.html"),
    signup: p("signUp.html"),
    userDashboard: p("userDashboard.html"),
    adminDashboard: p("adminDashboard.html"),
    adminBooks: p("adminBookMangement.html"),
    adminReviews: p("adminReviewManagement.html"),
    adminBorrow: p("adminBorrowRequests.html"),
    adminUsers: p("adminManageUsers.html"),
    searchBooks: p("searchBooks.html"),
    bookDetails: p("bookDetails.html"),
    writeReview: p("writeReview.html"),
    myProfile: p("myProfile.html"),
    borrowedBooks: p("borrowedBooks.html"),
    readingHistory: p("readingHistory.html"),
    about: p("about.html"),
    howItWorks: p("how-it-works.html"),
  };
  return map[name] ?? "#";
}

/** Same paths as hrefPage but exposed for legacy imports (uses getters). */
export const ROUTES = {
  get home() {
    return hrefPage("home");
  },
  get login() {
    return hrefPage("login");
  },
  get signup() {
    return hrefPage("signup");
  },
  get userDashboard() {
    return hrefPage("userDashboard");
  },
  get adminDashboard() {
    return hrefPage("adminDashboard");
  },
};
