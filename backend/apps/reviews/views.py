from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.books.serializers import refresh_book_review_stats

from .models import Review
from .serializers import (
    AdminPendingReviewSerializer,
    ReviewCreateSerializer,
    ReviewOwnerSerializer,
    ReviewPublicSerializer,
)


class IsOwnerOrAdminForReview(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: Review):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, "role", None) == "ADMIN":
            return True
        return obj.user_id == request.user.id


class ReviewCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewCreateSerializer


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminForReview]
    serializer_class = ReviewOwnerSerializer
    queryset = Review.objects.all()
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ReviewPublicSerializer
        return ReviewOwnerSerializer

    def perform_update(self, serializer):
        serializer.save()
        review = serializer.instance
        if review.status == Review.Status.APPROVED:
            refresh_book_review_stats(review.book)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        book = review.book
        was_approved = review.status == Review.Status.APPROVED
        self.perform_destroy(review)
        if was_approved:
            refresh_book_review_stats(book)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApproveReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        review.status = Review.Status.APPROVED
        review.moderated_by = request.user
        review.moderated_at = timezone.now()
        review.save(update_fields=["status", "moderated_by", "moderated_at", "updated_at"])
        refresh_book_review_stats(review.book)
        return Response(ReviewPublicSerializer(review).data)


class RejectReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        was_approved = review.status == Review.Status.APPROVED
        review.status = Review.Status.REJECTED
        review.moderated_by = request.user
        review.moderated_at = timezone.now()
        review.moderation_note = request.data.get("note", "")
        review.save(
            update_fields=[
                "status",
                "moderated_by",
                "moderated_at",
                "moderation_note",
                "updated_at",
            ]
        )
        if was_approved:
            refresh_book_review_stats(review.book)
        return Response({"detail": "Rejected."})


class AdminPendingReviewListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminPendingReviewSerializer
    queryset = Review.objects.filter(status=Review.Status.PENDING).select_related("user", "book")
