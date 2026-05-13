from rest_framework import filters, permissions, viewsets
from rest_framework.generics import ListAPIView

from apps.accounts.permissions import IsAdmin
from apps.books.filters import BookFilter
from apps.books.models import Book
from apps.books.serializers import BookDetailSerializer, BookListSerializer, BookWriteSerializer
from apps.reviews.models import Review
from apps.reviews.serializers import BookReviewPublicSerializer
from django_filters.rest_framework import DjangoFilterBackend


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BookFilter
    search_fields = ["title", "author", "isbn"]
    ordering_fields = ["title", "created_at", "average_rating"]
    ordering = ["-created_at"]
    lookup_field = "pk"

    def get_queryset(self):
        if self.action in ("list", "retrieve"):
            return Book.objects.filter(is_active=True)
        return Book.objects.all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        if self.action in ("create", "update", "partial_update"):
            return BookWriteSerializer
        return BookListSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.AllowAny()]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class BookReviewListView(ListAPIView):
    serializer_class = BookReviewPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        book_id = self.kwargs["book_id"]
        return (
            Review.objects.filter(book_id=book_id, status=Review.Status.APPROVED)
            .select_related("user")
            .order_by("-created_at")
        )
