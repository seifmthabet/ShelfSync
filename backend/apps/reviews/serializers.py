from rest_framework import serializers

from apps.books.models import Book
from apps.reviews.models import Review


class ReviewReadSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "user_name",
            "book_title",
            "rating",
            "headline",
            "comment",
            "status",
            "created_at",
        )


class BookReviewPublicSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    content = serializers.CharField(source="comment", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user_name", "rating", "content", "created_at", "likes", "status")


class ReviewWriteSerializer(serializers.ModelSerializer):
    book_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Review
        fields = ("book_id", "rating", "headline", "comment")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_book_id(self, value):
        if not Book.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("Book not found.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        book_id = attrs["book_id"]
        if Review.objects.filter(user=user, book_id=book_id).exists():
            raise serializers.ValidationError(
                {"book_id": "You already submitted a review for this book. Use edit instead."}
            )
        return attrs

    def create(self, validated_data):
        book_id = validated_data.pop("book_id")
        return Review.objects.create(
            user=self.context["request"].user,
            book_id=book_id,
            **validated_data,
        )


class ReviewUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("rating", "headline", "comment")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        inst = self.instance
        if (
            inst
            and request
            and getattr(request.user, "role", None) != "ADMIN"
            and inst.status != Review.Status.PENDING
        ):
            raise serializers.ValidationError("You can only edit pending reviews.")
        return attrs


class ReviewPendingAdminSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)
    comment = serializers.CharField(read_only=True)

    class Meta:
        model = Review
        fields = ("id", "book_title", "user_name", "rating", "comment", "created_at", "status")
