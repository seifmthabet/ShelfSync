from rest_framework import serializers

from apps.books.models import Book

from .models import BorrowRequest, Loan


def compute_risk_score(user) -> str:
    active = Loan.objects.filter(user=user, status=Loan.Status.ACTIVE).count()
    if active >= 5:
        return BorrowRequest.RiskScore.HIGH
    if active >= 3:
        return BorrowRequest.RiskScore.MEDIUM
    return BorrowRequest.RiskScore.LOW


class BorrowRequestCreateSerializer(serializers.ModelSerializer):
    book_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = BorrowRequest
        fields = ["book_id"]

    def validate_book_id(self, value):
        book = Book.objects.filter(pk=value, is_active=True).first()
        if not book:
            raise serializers.ValidationError("Invalid book.")
        if book.available_copies < 1:
            raise serializers.ValidationError("Book is out of stock.")
        return value

    def validate(self, attrs):
        book_id = attrs["book_id"]
        user = self.context["request"].user
        if BorrowRequest.objects.filter(
            user=user, book_id=book_id, status=BorrowRequest.Status.PENDING
        ).exists():
            raise serializers.ValidationError("You already have a pending request for this book.")
        if Loan.objects.filter(user=user, book_id=book_id, status=Loan.Status.ACTIVE).exists():
            raise serializers.ValidationError("You already have an active loan for this book.")
        return attrs

    def create(self, validated_data):
        book_id = validated_data.pop("book_id")
        user = self.context["request"].user
        risk = compute_risk_score(user)
        return BorrowRequest.objects.create(user=user, book_id=book_id, risk_score=risk)


class BorrowRequestSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)

    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "book_title",
            "book_author",
            "status",
            "risk_score",
            "requested_at",
            "processed_at",
        ]


class AdminBorrowRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    requested_date = serializers.DateTimeField(source="requested_at", read_only=True)
    user_loans_count = serializers.IntegerField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "user_name",
            "user_email",
            "book_title",
            "book_author",
            "status",
            "requested_date",
            "user_loans_count",
            "review_count",
            "risk_score",
        ]


class LoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_cover = serializers.URLField(source="book.cover_url", read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id",
            "book_title",
            "book_author",
            "book_cover",
            "borrowed_date",
            "due_date",
            "status",
        ]
