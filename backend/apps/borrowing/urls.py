from django.urls import path

from .views import (
    AdminBorrowRequestListView,
    ApproveBorrowRequestView,
    BorrowRequestCreateView,
    MyBorrowRequestsView,
    MyLoansView,
    RejectBorrowRequestView,
    RenewLoanView,
    ReturnLoanView,
)

urlpatterns = [
    path("borrow-requests/", BorrowRequestCreateView.as_view()),
    path("borrow-requests/me/", MyBorrowRequestsView.as_view()),
    path("admin/borrow-requests/", AdminBorrowRequestListView.as_view()),
    path("borrow-requests/<uuid:pk>/approve/", ApproveBorrowRequestView.as_view()),
    path("borrow-requests/<uuid:pk>/reject/", RejectBorrowRequestView.as_view()),
    path("loans/me/", MyLoansView.as_view()),
    path("loans/<uuid:pk>/renew/", RenewLoanView.as_view()),
    path("loans/<uuid:pk>/return/", ReturnLoanView.as_view()),
]
