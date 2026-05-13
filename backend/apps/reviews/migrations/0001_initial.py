# Generated manually for ShelfSync

import uuid

import django.db.models.deletion
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
            name="Review",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("rating", models.PositiveSmallIntegerField()),
                ("headline", models.CharField(max_length=255)),
                ("comment", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("moderated_at", models.DateTimeField(blank=True, null=True)),
                ("moderation_note", models.TextField(blank=True)),
                ("likes", models.PositiveIntegerField(default=0)),
                (
                    "book",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="books.book"),
                ),
                (
                    "moderated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="moderated_reviews",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reviews",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["book", "status", "created_at"], name="reviews_rev_book_stat_cr_idx"),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["user", "created_at"], name="reviews_rev_user_cr_idx"),
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.UniqueConstraint(fields=("user", "book"), name="unique_review_per_user_book"),
        ),
    ]
