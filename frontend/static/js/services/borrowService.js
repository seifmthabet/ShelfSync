import { apiClient } from "../core/apiClient.js";
import { Auth } from "../core/auth.js";

function requireAuth() {
  if (!Auth.isAuthenticated()) {
    throw new Error("You must be signed in.");
  }
}

function requireAdmin() {
  requireAuth();
  if (!Auth.isAdmin()) {
    throw new Error("Administrator access required.");
  }
}

export const borrowService = {
  createBorrowRequest: async (payload) => {
    requireAuth();
    return apiClient.post("borrow-requests/", payload, { authRequired: true });
  },
  getBorrowRequest: () => {
    requireAuth();
    return apiClient.get("borrow-requests/me/", {}, { authRequired: true });
  },
  approveBorrowRequest: (id) => {
    requireAdmin();
    return apiClient.post(`borrow-requests/${id}/approve/`, {}, { authRequired: true });
  },
  rejectBorrowRequest: (id, body = {}) => {
    requireAdmin();
    return apiClient.post(`borrow-requests/${id}/reject/`, body, { authRequired: true });
  },
  returnBorrowedItem: (id) => {
    requireAuth();
    return apiClient.post(`loans/${id}/return/`, {}, { authRequired: true });
  },
  renewBorrowedItem: (id) => {
    requireAuth();
    return apiClient.post(`loans/${id}/renew/`, {}, { authRequired: true });
  },
  getBorrowedItems: () => {
    requireAuth();
    return apiClient.get("loans/me/", {}, { authRequired: true });
  },
  getLoanHistory: () => {
    requireAuth();
    return apiClient.get("loans/history/", {}, { authRequired: true });
  },
  getAllBorrowRequests: () => {
    requireAdmin();
    return apiClient.get("admin/borrow-requests/", {}, { authRequired: true });
  },
};
