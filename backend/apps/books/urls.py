from django.urls import path

from .views import BookDetailView, BookListCreateView, BookReviewListView

urlpatterns = [
    path("", BookListCreateView.as_view()),
    path("<uuid:pk>/reviews/", BookReviewListView.as_view()),
    path("<uuid:pk>/", BookDetailView.as_view()),
]
