from django.urls import path

from .views import AdminPendingReviewListView

urlpatterns = [
    path("pending/", AdminPendingReviewListView.as_view()),
]
