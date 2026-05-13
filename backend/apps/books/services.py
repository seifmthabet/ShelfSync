from decimal import Decimal

from django.db.models import Avg, Count

from apps.reviews.models import Review


def refresh_book_rating_stats(book_id) -> None:
    from apps.books.models import Book

    qs = Review.objects.filter(book_id=book_id, status=Review.Status.APPROVED)
    agg = qs.aggregate(avg=Avg("rating"), cnt=Count("id"))
    avg = agg["avg"]
    cnt = agg["cnt"] or 0
    Book.objects.filter(pk=book_id).update(
        average_rating=Decimal(str(round(float(avg), 2))) if avg is not None else Decimal("0.00"),
        reviews_count=cnt,
    )
