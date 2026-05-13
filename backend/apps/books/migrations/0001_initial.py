# Generated manually for ShelfSync

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255, unique=True)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name_plural": "categories",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Book",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("isbn", models.CharField(blank=True, max_length=32, null=True, unique=True)),
                ("title", models.CharField(db_index=True, max_length=512)),
                ("author", models.CharField(db_index=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("publication_year", models.PositiveIntegerField(blank=True, null=True)),
                ("cover_url", models.URLField(blank=True)),
                ("total_copies", models.PositiveIntegerField(default=1)),
                ("available_copies", models.PositiveIntegerField(default=1)),
                ("average_rating", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("reviews_count", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="books",
                        to="books.category",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
