import { apiClient } from "../core/apiClient.js";
import { Auth } from "../core/auth.js";

function requireAdmin() {
  if (!Auth.isAuthenticated()) {
    throw new Error("You must be signed in.");
  }
  if (!Auth.isAdmin()) {
    throw new Error("Administrator access required.");
  }
}

export const booksService = {
  getAllBooks: (query = {}) => {
    return apiClient.get("books/", query, { authRequired: false });
  },
  getBookById: (id) => {
    return apiClient.get(`books/${id}/`, {}, { authRequired: false });
  },
  addBook: async (payload) => {
    requireAdmin();
    return apiClient.post("books/", payload, { authRequired: true });
  },
  updateBook: (id, payload) => {
    requireAdmin();
    return apiClient.patch(`books/${id}/`, payload, { authRequired: true });
  },
  deleteBook: (id) => {
    requireAdmin();
    return apiClient.delete(`books/${id}/`, {}, { authRequired: true });
  },
};
