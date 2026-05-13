import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.books.models import Book


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
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="borrow_requests")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    risk_score = models.CharField(
        max_length=10,
        choices=RiskScore.choices,
        default=RiskScore.LOW,
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
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

    def __str__(self) -> str:
        return f"{self.user.email} → {self.book.title} ({self.status})"


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
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")
    borrow_request = models.ForeignKey(
        BorrowRequest,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="loans",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    borrowed_date = models.DateTimeField(default=timezone.now)
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

    def clean(self):
        if self.status == self.Status.RETURNED and not self.returned_date:
            raise ValidationError("Returned loans must have a returned date.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Loan {self.book.title} → {self.user.email}"
