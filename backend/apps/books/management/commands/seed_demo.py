from django.core.management.base import BaseCommand

from apps.books.models import Book, Category


class Command(BaseCommand):
    help = "Create demo categories and books for local development."

    def handle(self, *args, **options):
        classics, _ = Category.objects.get_or_create(
            slug="classic-literature",
            defaults={"name": "Classic Literature"},
        )
        dystopia, _ = Category.objects.get_or_create(
            slug="dystopian-fiction",
            defaults={"name": "Dystopian Fiction"},
        )

        samples = [
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "category": classics,
                "description": "A portrait of the Jazz Age and the American Dream.",
                "publication_year": 1925,
                "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
                "isbn": "9780743273565",
            },
            {
                "title": "1984",
                "author": "George Orwell",
                "category": dystopia,
                "description": "A dystopian social science fiction novel and cautionary tale.",
                "publication_year": 1949,
                "cover_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
                "isbn": "9780451524935",
            },
            {
                "title": "To Kill a Mockingbird",
                "author": "Harper Lee",
                "category": classics,
                "description": "A novel about racial injustice in the American South.",
                "publication_year": 1960,
                "cover_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                "isbn": "9780061120084",
            },
        ]

        for row in samples:
            isbn = row.get("isbn")
            if isbn and Book.objects.filter(isbn=isbn).exists():
                continue
            Book.objects.create(
                title=row["title"],
                author=row["author"],
                category=row["category"],
                description=row["description"],
                publication_year=row["publication_year"],
                cover_url=row["cover_url"],
                isbn=isbn,
                total_copies=3,
                available_copies=3,
            )

        self.stdout.write(self.style.SUCCESS("Demo catalog seeded."))
