from django.db.models import Avg, Count
from rest_framework import serializers

from apps.reviews.models import Review

from .models import Book, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class BookListSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    rating = serializers.DecimalField(
        source="average_rating",
        max_digits=3,
        decimal_places=2,
        coerce_to_string=False,
        read_only=True,
    )
    cover = serializers.URLField(source="cover_url", read_only=True)
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "category",
            "rating",
            "cover",
            "availability",
            "isbn",
            "created_at",
        ]
        read_only_fields = fields

    def get_availability(self, obj: Book) -> str:
        return "In Stock" if obj.available_copies > 0 else "Out of Stock"


class BookDetailSerializer(BookListSerializer):
    summary = serializers.CharField(source="description", read_only=True)
    year = serializers.IntegerField(source="publication_year", read_only=True)
    total_reviews = serializers.IntegerField(source="reviews_count", read_only=True)
    rating_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = BookListSerializer.Meta.fields + [
            "summary",
            "year",
            "total_reviews",
            "total_copies",
            "available_copies",
            "rating_breakdown",
        ]
        read_only_fields = fields

    def get_rating_breakdown(self, obj: Book) -> dict[str, int]:
        reviews = obj.reviews.filter(status=Review.Status.APPROVED)
        breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        total = reviews.count()
        if total == 0:
            return {str(k): 0 for k in breakdown}

        counts = reviews.values("rating").annotate(c=Count("id"))
        for row in counts:
            r = int(row["rating"])
            if r in breakdown:
                breakdown[r] = row["c"]
        return {
            str(k): int(round(100 * breakdown[k] / total))
            for k in sorted(breakdown.keys(), reverse=True)
        }


class BookWriteSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Book
        fields = [
            "isbn",
            "title",
            "author",
            "category",
            "description",
            "publication_year",
            "cover_url",
            "total_copies",
            "available_copies",
            "is_active",
        ]

    def validate(self, attrs):
        total = attrs.get("total_copies", getattr(self.instance, "total_copies", 1))
        available = attrs.get("available_copies", getattr(self.instance, "available_copies", 1))
        if available > total:
            raise serializers.ValidationError("Available copies cannot exceed total copies.")
        return attrs


def refresh_book_review_stats(book: Book) -> None:
    agg = book.reviews.filter(status=Review.Status.APPROVED).aggregate(
        avg=Avg("rating"), cnt=Count("id")
    )
    book.average_rating = round(float(agg["avg"] or 0), 2)
    book.reviews_count = int(agg["cnt"] or 0)
    book.save(update_fields=["average_rating", "reviews_count", "updated_at"])
