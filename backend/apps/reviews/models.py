import uuid

from django.conf import settings
from django.db import models

from apps.books.models import Book


class Review(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    headline = models.CharField(max_length=255)
    comment = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="moderated_reviews",
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    moderation_note = models.TextField(blank=True)
    likes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["book", "status", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "book"], name="unique_review_per_user_book")
        ]

    def __str__(self) -> str:
        return f"{self.headline} ({self.book.title})"
