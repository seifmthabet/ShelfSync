from django.urls import path

from apps.borrowing import views

urlpatterns = [
    path("borrow-requests/me/", views.BorrowRequestListMineView.as_view(), name="borrow-requests-me"),
    path(
        "borrow-requests/<uuid:pk>/approve/",
        views.BorrowRequestApproveView.as_view(),
        name="borrow-request-approve",
    ),
    path(
        "borrow-requests/<uuid:pk>/reject/",
        views.BorrowRequestRejectView.as_view(),
        name="borrow-request-reject",
    ),
    path("borrow-requests/", views.BorrowRequestCreateView.as_view(), name="borrow-requests"),
    path("admin/borrow-requests/", views.AdminBorrowRequestListView.as_view(), name="admin-borrow-requests"),
    path("loans/history/", views.LoanHistoryListView.as_view(), name="loans-history"),
    path("loans/me/", views.LoanListMineView.as_view(), name="loans-me"),
    path("loans/<uuid:pk>/renew/", views.LoanRenewView.as_view(), name="loan-renew"),
    path("loans/<uuid:pk>/return/", views.LoanReturnView.as_view(), name="loan-return"),
]
