import uuid

from django.conf import settings
from django.db import models


class BorrowRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    class RiskScore(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="borrow_requests",
    )
    book = models.ForeignKey(
        "books.Book",
        on_delete=models.CASCADE,
        related_name="borrow_requests",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    risk_score = models.CharField(
        max_length=16,
        choices=RiskScore.choices,
        default=RiskScore.LOW,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_borrow_requests",
    )
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["status", "-requested_at"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["book", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book"],
                condition=models.Q(status="pending"),
                name="unique_pending_borrow_per_user_book",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} -> {self.book.title} ({self.status})"


class Loan(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        RETURNED = "returned", "Returned"
        OVERDUE = "overdue", "Overdue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loans",
    )
    book = models.ForeignKey(
        "books.Book",
        on_delete=models.CASCADE,
        related_name="loans",
    )
    borrow_request = models.ForeignKey(
        BorrowRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loans",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    borrowed_date = models.DateTimeField()
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    renew_count = models.PositiveIntegerField(default=0)
    max_renewals = models.PositiveIntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-borrowed_date"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["due_date", "status"]),
            models.Index(fields=["book", "status"]),
        ]

    def __str__(self) -> str:
        return f"Loan {self.book.title} ({self.status})"
