from rest_framework import serializers

from .models import Review


class ReviewPublicSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    content = serializers.CharField(source="comment", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user_name", "rating", "content", "created_at", "likes", "status"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    book_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Review
        fields = ["book_id", "rating", "headline", "comment"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        book_id = attrs["book_id"]
        if Review.objects.filter(user=user, book_id=book_id).exists():
            raise serializers.ValidationError("You already submitted a review for this book.")
        return attrs

    def create(self, validated_data):
        book_id = validated_data.pop("book_id")
        from apps.books.models import Book

        book = Book.objects.get(pk=book_id)
        return Review.objects.create(book=book, user=self.context["request"].user, **validated_data)


class ReviewOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["rating", "headline", "comment"]


class AdminPendingReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "user_name",
            "book_title",
            "rating",
            "comment",
            "headline",
            "status",
            "created_at",
        ]
