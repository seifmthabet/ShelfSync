from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import generics, permissions

from apps.accounts.permissions import IsAdmin
from apps.reviews.models import Review
from apps.reviews.serializers import ReviewPublicSerializer

from .models import Book
from .serializers import BookDetailSerializer, BookListSerializer, BookWriteSerializer


class BookFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    availability = filters.CharFilter(method="filter_availability")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Book
        fields = ["category", "availability", "search"]

    def filter_availability(self, queryset, name, value):
        if not value:
            return queryset
        v = value.lower().replace(" ", "_")
        if v in ("in_stock", "instock"):
            return queryset.filter(available_copies__gt=0)
        if v in ("out_of_stock", "outofstock"):
            return queryset.filter(available_copies=0)
        return queryset

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(Q(title__icontains=value) | Q(author__icontains=value))


class BookListCreateView(generics.ListCreateAPIView):
    filterset_class = BookFilter
    search_fields = ["title", "author"]
    ordering_fields = ["title", "created_at", "average_rating"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Book.objects.select_related("category").all()
        if not (self.request.user and self.request.user.is_authenticated and getattr(self.request.user, "role", None) == "ADMIN"):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookWriteSerializer
        return BookListSerializer


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "pk"

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        qs = Book.objects.select_related("category").all()
        if self.request.method == "GET":
            if not (
                self.request.user
                and self.request.user.is_authenticated
                and getattr(self.request.user, "role", None) == "ADMIN"
            ):
                qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return BookWriteSerializer
        return BookDetailSerializer


class BookReviewListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReviewPublicSerializer

    def get_queryset(self):
        return (
            Review.objects.filter(book_id=self.kwargs["pk"], status=Review.Status.APPROVED)
            .select_related("user")
            .order_by("-created_at")
        )
