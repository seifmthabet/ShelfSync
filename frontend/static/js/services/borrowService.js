import { apiClient } from "../core/apiClient.js";
import { Auth } from "../core/auth.js"

export const borrowService = {
  createBorrowRequest: async (payload) => {
    if (Auth.isAuthenticated()) {
      const data = await apiClient.post("borrow-requests/", payload, { authRequired: true });
      return data;
    }
  },
  getBorrowRequest: () => {
    return apiClient.get("borrow-requests/me/");
  },
  approveBorrowRequest: (id) => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.post(`borrow-requests/${id}/approve/`, {}, { authRequired: true });
    }
  },
  rejectBorrowRequest: (id, body = {}) => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.post(`borrow-requests/${id}/reject/`, body, { authRequired: true });
    }
  },
  returnBorrowedItem: (id) => {
    if (Auth.isAuthenticated()) {
      return apiClient.post(`loans/${id}/return/`, {}, { authRequired: true });
    }
  },
  renewBorrowedItem: (id) => {
    if (Auth.isAuthenticated()) {
      return apiClient.post(`loans/${id}/renew/`, {}, { authRequired: true });
    }
  },
  getBorrowedItems: () => {
    if (Auth.isAuthenticated()) {
      return apiClient.get("loans/me/", {}, { authRequired: true });
    }
  },

  getLoanHistory: () => {
    if (Auth.isAuthenticated()) {
      return apiClient.get("loans/history/", {}, { authRequired: true });
    }
  },
  getAllBorrowRequests: () => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.get("admin/borrow-requests/", {}, { authRequired: true });
    }
  }
}
