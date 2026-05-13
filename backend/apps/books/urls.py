from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.books.views import BookReviewListView, BookViewSet, CategoryListView

router = DefaultRouter()
router.register("books", BookViewSet, basename="book")

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("books/<uuid:book_id>/reviews/", BookReviewListView.as_view(), name="book-reviews"),
] + router.urls
