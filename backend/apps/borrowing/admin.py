from django.contrib import admin

from apps.borrowing.models import BorrowRequest, Loan


@admin.register(BorrowRequest)
class BorrowRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "book", "status", "risk_score", "requested_at")
    list_filter = ("status", "risk_score")


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "book", "status", "borrowed_date", "due_date")
    list_filter = ("status",)
