from rest_framework import serializers

from apps.accounts.models import User
from apps.books.models import Book
from apps.borrowing.models import BorrowRequest, Loan
from apps.reviews.models import Review


def compute_risk_score(user: User) -> str:
    active_loans = Loan.objects.filter(user=user, status=Loan.Status.ACTIVE).count()
    if active_loans >= 5:
        return BorrowRequest.RiskScore.HIGH
    if active_loans >= 3:
        return BorrowRequest.RiskScore.MEDIUM
    return BorrowRequest.RiskScore.LOW


class BorrowRequestCreateSerializer(serializers.ModelSerializer):
    book_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = BorrowRequest
        fields = ("book_id",)

    def validate_book_id(self, value):
        book = Book.objects.filter(pk=value, is_active=True).first()
        if not book:
            raise serializers.ValidationError("Book not found.")
        if book.available_copies < 1:
            raise serializers.ValidationError("No copies available to borrow.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        book_id = attrs["book_id"]
        if BorrowRequest.objects.filter(
            user=user, book_id=book_id, status=BorrowRequest.Status.PENDING
        ).exists():
            raise serializers.ValidationError(
                {"book_id": "You already have a pending request for this book."}
            )
        if Loan.objects.filter(user=user, book_id=book_id, status=Loan.Status.ACTIVE).exists():
            raise serializers.ValidationError(
                {"book_id": "You already have an active loan for this book."}
            )
        return attrs

    def create(self, validated_data):
        book_id = validated_data.pop("book_id")
        user = self.context["request"].user
        return BorrowRequest.objects.create(
            user=user,
            book_id=book_id,
            risk_score=compute_risk_score(user),
        )


class BorrowRequestMineSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)

    class Meta:
        model = BorrowRequest
        fields = (
            "id",
            "book_title",
            "book_author",
            "status",
            "risk_score",
            "requested_at",
            "processed_at",
            "rejection_reason",
        )


class BorrowRequestAdminSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    requested_date = serializers.DateTimeField(source="requested_at", read_only=True)
    user_loans_count = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = BorrowRequest
        fields = (
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
        )

    def get_user_loans_count(self, obj: BorrowRequest) -> int:
        return Loan.objects.filter(user=obj.user, status=Loan.Status.ACTIVE).count()

    def get_review_count(self, obj: BorrowRequest) -> int:
        return Review.objects.filter(user=obj.user).count()


class LoanMineSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_cover = serializers.URLField(source="book.cover_url", read_only=True)
    borrowed_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Loan
        fields = (
            "id",
            "book_title",
            "book_author",
            "book_cover",
            "borrowed_date",
            "due_date",
            "status",
        )


class LoanHistorySerializer(serializers.ModelSerializer):
    """Returned loans for reading history UI."""

    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_cover = serializers.URLField(source="book.cover_url", read_only=True)
    completed_date = serializers.DateTimeField(source="returned_date", read_only=True)
    pages = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    time_to_read = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = (
            "id",
            "book_title",
            "book_author",
            "book_cover",
            "pages",
            "rating",
            "completed_date",
            "time_to_read",
        )

    def get_pages(self, obj: Loan) -> int:
        return 0

    def get_rating(self, obj: Loan) -> float:
        from apps.reviews.models import Review

        rev = (
            Review.objects.filter(
                user=obj.user,
                book=obj.book,
                status=Review.Status.APPROVED,
            )
            .order_by("-created_at")
            .first()
        )
        if rev:
            return float(rev.rating)
        return float(obj.book.average_rating or 0)

    def get_time_to_read(self, obj: Loan) -> int:
        if obj.borrowed_date and obj.returned_date:
            return max(0, (obj.returned_date - obj.borrowed_date).days)
        return 0
