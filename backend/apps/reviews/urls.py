from django.urls import path

from .views import (
    ApproveReviewView,
    RejectReviewView,
    ReviewCreateView,
    ReviewDetailView,
)

urlpatterns = [
    path("", ReviewCreateView.as_view()),
    path("<uuid:pk>/", ReviewDetailView.as_view()),
    path("<uuid:pk>/approve/", ApproveReviewView.as_view()),
    path("<uuid:pk>/reject/", RejectReviewView.as_view()),
]
