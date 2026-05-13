from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.books.models import Book, Category


class Command(BaseCommand):
    help = "Seed a small catalog if the database is empty."

    def handle(self, *args, **options):
        if Book.objects.exists():
            self.stdout.write(self.style.WARNING("Books already exist; skipping seed."))
            return

        classics, _ = Category.objects.get_or_create(
            name="Classic Literature",
            defaults={"slug": slugify("Classic Literature")},
        )
        fiction, _ = Category.objects.get_or_create(
            name="Modern Fiction",
            defaults={"slug": slugify("Modern Fiction")},
        )

        samples = [
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "category": classics,
                "publication_year": 1925,
                "description": "A portrait of the Jazz Age in all of its decadence and excess.",
                "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
                "isbn": "9780743273565",
            },
            {
                "title": "1984",
                "author": "George Orwell",
                "category": classics,
                "publication_year": 1949,
                "description": "A dystopian social science fiction novel and cautionary tale.",
                "cover_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80",
                "isbn": "9780451524935",
            },
            {
                "title": "Pride and Prejudice",
                "author": "Jane Austen",
                "category": classics,
                "publication_year": 1813,
                "description": "A romantic novel of manners written with irony and wit.",
                "cover_url": "https://images.unsplash.com/photo-1506880013663-4d29d6e9308d?w=600&q=80",
                "isbn": "9780141439518",
            },
            {
                "title": "The Midnight Library",
                "author": "Matt Haig",
                "category": fiction,
                "publication_year": 2020,
                "description": "Between life and death there is a library, and within that library, the shelves go on forever.",
                "cover_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
                "isbn": "9780525559474",
            },
        ]

        for row in samples:
            Book.objects.create(
                title=row["title"],
                author=row["author"],
                category=row["category"],
                publication_year=row["publication_year"],
                description=row["description"],
                cover_url=row["cover_url"],
                isbn=row["isbn"],
                total_copies=3,
                available_copies=3,
            )

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(samples)} books."))
