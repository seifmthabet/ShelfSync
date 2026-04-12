import { apiClient } from "../core/apiClient.js";
import { Auth } from "../core/auth.js"

export const booksService = {
  getAllBooks : () => {
    return apiClient.get("/books/");
  },
  getBookById: (id) => {
    return apiClient.get(`/books/${id}/`);
  },
  addBook: async (payload) => {
    if (Auth.isAdmin()) {
      const data = await apiClient.post("/books/", payload, { authRequired: true });
      return data;
    }
  },
  updateBook: (id, payload) => {
    if (Auth.isAdmin()) {
      return apiClient.patch(`/books/${id}`, payload, { authRequired: true });
    }
  }, 
  deleteBook : () => {
    if (Auth.isAdmin()) {
      return apiClient.delete(`/books/${id}`, {}, { authRequired: true });
    }
  }
}