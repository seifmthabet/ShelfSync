from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.books.services import refresh_book_rating_stats
from apps.reviews.models import Review
from apps.reviews.serializers import (
    ReviewPendingAdminSerializer,
    ReviewReadSerializer,
    ReviewUpdateSerializer,
    ReviewWriteSerializer,
)


class IsReviewOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, "role", None) == "ADMIN":
            return True
        return obj.user_id == request.user.id


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsReviewOwnerOrAdmin]
    queryset = Review.objects.select_related("user", "book")
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ReviewReadSerializer
        return ReviewUpdateSerializer

    def perform_destroy(self, instance):
        book_id = instance.book_id
        instance.delete()
        refresh_book_rating_stats(book_id)


class AdminPendingReviewsView(generics.ListAPIView):
    serializer_class = ReviewPendingAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return (
            Review.objects.filter(status=Review.Status.PENDING)
            .select_related("user", "book")
            .order_by("created_at")
        )


class ReviewApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        if review.status != Review.Status.PENDING:
            return Response({"detail": "Review is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        review.status = Review.Status.APPROVED
        review.moderated_by = request.user
        review.moderated_at = now
        review.save(update_fields=["status", "moderated_by", "moderated_at", "updated_at"])
        refresh_book_rating_stats(review.book_id)
        return Response(ReviewPendingAdminSerializer(review).data, status=status.HTTP_200_OK)


class ReviewRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        if review.status != Review.Status.PENDING:
            return Response({"detail": "Review is not pending."}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        review.status = Review.Status.REJECTED
        review.moderated_by = request.user
        review.moderated_at = now
        review.moderation_note = request.data.get("moderation_note", "")
        review.save(
            update_fields=[
                "status",
                "moderated_by",
                "moderated_at",
                "moderation_note",
                "updated_at",
            ]
        )
        refresh_book_rating_stats(review.book_id)
        return Response(ReviewPendingAdminSerializer(review).data, status=status.HTTP_200_OK)
