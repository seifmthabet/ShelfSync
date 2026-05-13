import { apiClient } from "../core/apiClient.js";
import { Auth } from "../core/auth.js"

export const ReviewsService = {
  submitReview: async (payload) => {
    if (Auth.isAuthenticated()) {
      const data = await apiClient.post("reviews/", payload, { authRequired: true });
      return data;
    }
  },
  getReviewsForBook: (bookId) => {
    return apiClient.get(`books/${bookId}/reviews/`);
  },
  editReview: (reviewId, payload) => {
    if (Auth.isAuthenticated()) {
      return apiClient.patch(`reviews/${reviewId}/`, payload, { authRequired: true });
    }
  },
  approveReview: (reviewId) => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.post(`reviews/${reviewId}/approve/`, {}, { authRequired: true });
    }
  },
  rejectReview: (reviewId) => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.post(`reviews/${reviewId}/reject/`, {}, { authRequired: true });
    }
  },
  getPendingReviews: () => {
    if (Auth.isAuthenticated() && Auth.isAdmin()) {
      return apiClient.get("admin/reviews/pending/", {}, { authRequired: true });
    }
  }
}
