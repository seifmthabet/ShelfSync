from django.urls import path

from apps.reviews import views

urlpatterns = [
    path("admin/reviews/pending/", views.AdminPendingReviewsView.as_view(), name="admin-reviews-pending"),
    path("reviews/<uuid:pk>/approve/", views.ReviewApproveView.as_view(), name="review-approve"),
    path("reviews/<uuid:pk>/reject/", views.ReviewRejectView.as_view(), name="review-reject"),
    path("reviews/<uuid:pk>/", views.ReviewDetailView.as_view(), name="review-detail"),
    path("reviews/", views.ReviewCreateView.as_view(), name="reviews"),
]
