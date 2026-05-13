# Generated manually for ShelfSync

import uuid

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("books", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BorrowRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("cancelled", "Cancelled"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "risk_score",
                    models.CharField(
                        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
                        default="low",
                        max_length=10,
                    ),
                ),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                (
                    "book",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="borrow_requests", to="books.book"),
                ),
                (
                    "processed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="processed_borrow_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="borrow_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-requested_at"],
            },
        ),
        migrations.CreateModel(
            name="Loan",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Active"),
                            ("returned", "Returned"),
                            ("overdue", "Overdue"),
                        ],
                        db_index=True,
                        default="active",
                        max_length=20,
                    ),
                ),
                ("borrowed_date", models.DateTimeField(default=django.utils.timezone.now)),
                ("due_date", models.DateTimeField()),
                ("returned_date", models.DateTimeField(blank=True, null=True)),
                ("renew_count", models.PositiveIntegerField(default=0)),
                ("max_renewals", models.PositiveIntegerField(default=2)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "book",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="loans", to="books.book"),
                ),
                (
                    "borrow_request",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="loans",
                        to="borrowing.borrowrequest",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="loans",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-borrowed_date"],
            },
        ),
        migrations.AddIndex(
            model_name="borrowrequest",
            index=models.Index(fields=["status", "requested_at"], name="borrowing_br_stat_req_idx"),
        ),
        migrations.AddIndex(
            model_name="borrowrequest",
            index=models.Index(fields=["user", "status"], name="borrowing_b_user_status_idx"),
        ),
        migrations.AddIndex(
            model_name="borrowrequest",
            index=models.Index(fields=["book", "status"], name="borrowing_b_book_status_idx"),
        ),
        migrations.AddIndex(
            model_name="loan",
            index=models.Index(fields=["user", "status"], name="borrowing_l_user_status_idx"),
        ),
        migrations.AddIndex(
            model_name="loan",
            index=models.Index(fields=["due_date", "status"], name="borrowing_l_due_status_idx"),
        ),
        migrations.AddIndex(
            model_name="loan",
            index=models.Index(fields=["book", "status"], name="borrowing_l_book_status_idx"),
        ),
    ]
