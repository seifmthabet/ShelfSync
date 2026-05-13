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

export const ReviewsService = {
  submitReview: async (payload) => {
    requireAuth();
    return apiClient.post("reviews/", payload, { authRequired: true });
  },
  getReviewsForBook: (bookId) => {
    return apiClient.get(`books/${bookId}/reviews/`, {}, { authRequired: false });
  },
  editReview: (reviewId, payload) => {
    requireAuth();
    return apiClient.patch(`reviews/${reviewId}/`, payload, { authRequired: true });
  },
  approveReview: (reviewId) => {
    requireAdmin();
    return apiClient.post(`reviews/${reviewId}/approve/`, {}, { authRequired: true });
  },
  rejectReview: (reviewId) => {
    requireAdmin();
    return apiClient.post(`reviews/${reviewId}/reject/`, {}, { authRequired: true });
  },
  getPendingReviews: () => {
    requireAdmin();
    return apiClient.get("admin/reviews/pending/", {}, { authRequired: true });
  },
};
