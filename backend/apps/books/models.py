import uuid

from django.core.exceptions import ValidationError
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Book(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=32, blank=True, null=True, unique=True)
    title = models.CharField(max_length=512, db_index=True)
    author = models.CharField(max_length=255, db_index=True)
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="books",
    )
    description = models.TextField(blank=True)
    publication_year = models.PositiveIntegerField(null=True, blank=True)
    cover_url = models.URLField(blank=True)
    total_copies = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    reviews_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["author"]),
        ]

    def __str__(self) -> str:
        return self.title

    def clean(self):
        if self.available_copies > self.total_copies:
            raise ValidationError("Available copies cannot exceed total copies.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
