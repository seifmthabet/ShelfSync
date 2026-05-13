from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.books.models import Book, Category

User = get_user_model()


class BooksAPITests(APITestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Fiction", slug="fiction")
        self.book = Book.objects.create(
            title="Test Book",
            author="Test Author",
            category=self.cat,
            total_copies=2,
            available_copies=2,
        )

    def test_list_books_public(self):
        url = reverse("book-list")
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(r.data.get("results", r.data)), 1)
