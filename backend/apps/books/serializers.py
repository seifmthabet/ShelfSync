from decimal import Decimal

from django.db.models import Count, Q
from rest_framework import serializers

from apps.accounts.models import User
from apps.books.models import Book, Category
from apps.reviews.models import Review


class BookListSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    rating = serializers.DecimalField(
        max_digits=3, decimal_places=2, source="average_rating", coerce_to_string=False
    )
    cover = serializers.URLField(source="cover_url", allow_blank=True, required=False)
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "author",
            "category",
            "rating",
            "cover",
            "availability",
            "isbn",
        )

    @staticmethod
    def _availability_label(book: Book) -> str:
        if not book.is_active:
            return "Out of Stock"
        if book.available_copies > 0:
            return "In Stock"
        return "Out of Stock"

    def get_availability(self, obj: Book) -> str:
        return self._availability_label(obj)


class BookDetailSerializer(BookListSerializer):
    summary = serializers.CharField(source="description", read_only=True)
    year = serializers.IntegerField(source="publication_year", read_only=True)
    total_reviews = serializers.IntegerField(source="reviews_count", read_only=True)
    rating_breakdown = serializers.SerializerMethodField()
    cover = serializers.URLField(source="cover_url", allow_blank=True, required=False)

    class Meta:
        model = Book
        fields = (
            "id",
            "title",
            "author",
            "category",
            "rating",
            "cover",
            "availability",
            "isbn",
            "summary",
            "year",
            "total_reviews",
            "rating_breakdown",
            "total_copies",
            "available_copies",
        )

    def get_availability(self, obj: Book) -> str:
        if not obj.is_active:
            return "Off Shelf"
        if obj.available_copies > 0:
            return "On Shelf"
        return "Out of Stock"

    def get_rating_breakdown(self, obj: Book) -> dict[str, int]:
        breakdown = {str(i): 0 for i in range(1, 6)}
        rows = (
            Review.objects.filter(book=obj, status=Review.Status.APPROVED)
            .values("rating")
            .annotate(c=Count("id"))
        )
        for row in rows:
            breakdown[str(row["rating"])] = row["c"]
        total = sum(breakdown.values()) or 1
        return {k: int(round(v * 100 / total)) for k, v in breakdown.items()}


class BookWriteSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Book
        fields = (
            "title",
            "author",
            "isbn",
            "description",
            "publication_year",
            "cover_url",
            "total_copies",
            "available_copies",
            "category_slug",
        )

    def create(self, validated_data):
        slug = validated_data.pop("category_slug", None)
        category = None
        if slug:
            category = Category.objects.filter(slug=slug).first()
        book = Book.objects.create(category=category, **validated_data)
        if book.available_copies > book.total_copies:
            book.available_copies = book.total_copies
            book.save(update_fields=["available_copies"])
        return book

    def update(self, instance, validated_data):
        slug = validated_data.pop("category_slug", serializers.empty)
        if slug is not serializers.empty and slug is not None:
            instance.category = Category.objects.filter(slug=slug).first()
        elif slug is None:
            instance.category = None
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if instance.available_copies > instance.total_copies:
            instance.available_copies = instance.total_copies
            instance.save(update_fields=["available_copies"])
        return instance
