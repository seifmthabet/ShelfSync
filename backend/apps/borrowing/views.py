from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.reviews.models import Review

from .models import BorrowRequest, Loan
from .serializers import (
    AdminBorrowRequestSerializer,
    BorrowRequestCreateSerializer,
    BorrowRequestSerializer,
    LoanSerializer,
)


class BorrowRequestCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BorrowRequestCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Input serializer only exposes book_id; return the saved row so clients get id/status.
        out = BorrowRequestSerializer(serializer.instance)
        data = out.data
        return Response(
            data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(data),
        )


class MyBorrowRequestsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BorrowRequestSerializer

    def get_queryset(self):
        return (
            BorrowRequest.objects.filter(user=self.request.user)
            .select_related("book", "user")
            .order_by("-requested_at")
        )


class AdminBorrowRequestListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminBorrowRequestSerializer
    filterset_fields = ["status"]
    ordering_fields = ["requested_at", "risk_score"]
    ordering = ["-requested_at"]

    def get_queryset(self):
        return (
            BorrowRequest.objects.select_related("book", "user")
            .annotate(
                user_loans_count=Count(
                    "user__loans",
                    filter=Q(user__loans__status=Loan.Status.ACTIVE),
                    distinct=True,
                )
            )
            .annotate(
                review_count=Count(
                    "user__reviews",
                    filter=Q(user__reviews__status=Review.Status.APPROVED),
                    distinct=True,
                )
            )
            .order_by("-requested_at")
        )


class ApproveBorrowRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            br = BorrowRequest.objects.select_related("book", "user").get(pk=pk)
        except BorrowRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if br.status != BorrowRequest.Status.PENDING:
            return Response({"detail": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        book = br.book
        if book.available_copies < 1:
            return Response({"detail": "No copies available."}, status=status.HTTP_400_BAD_REQUEST)

        due = timezone.now() + timedelta(days=30)
        loan = Loan.objects.create(
            user=br.user,
            book=book,
            borrow_request=br,
            due_date=due,
        )

        book.available_copies -= 1
        book.save(update_fields=["available_copies", "updated_at"])

        br.status = BorrowRequest.Status.APPROVED
        br.processed_at = timezone.now()
        br.processed_by = request.user
        br.save(update_fields=["status", "processed_at", "processed_by"])

        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)


class RejectBorrowRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            br = BorrowRequest.objects.get(pk=pk)
        except BorrowRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if br.status != BorrowRequest.Status.PENDING:
            return Response({"detail": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "")
        br.status = BorrowRequest.Status.REJECTED
        br.processed_at = timezone.now()
        br.processed_by = request.user
        br.rejection_reason = reason or ""
        br.save(
            update_fields=[
                "status",
                "processed_at",
                "processed_by",
                "rejection_reason",
            ]
        )
        return Response({"detail": "Rejected."}, status=status.HTTP_200_OK)


class MyLoansView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LoanSerializer

    def get_queryset(self):
        return (
            Loan.objects.filter(user=self.request.user)
            .select_related("book")
            .order_by("-borrowed_date")
        )


class RenewLoanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            loan = Loan.objects.select_related("book").get(pk=pk, user=request.user)
        except Loan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if loan.status != Loan.Status.ACTIVE:
            return Response({"detail": "Loan is not active."}, status=status.HTTP_400_BAD_REQUEST)

        if loan.renew_count >= loan.max_renewals:
            return Response({"detail": "Max renewals reached."}, status=status.HTTP_400_BAD_REQUEST)

        loan.due_date = loan.due_date + timedelta(days=14)
        loan.renew_count += 1
        loan.save(update_fields=["due_date", "renew_count", "updated_at"])
        return Response(LoanSerializer(loan).data)


class ReturnLoanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            loan = Loan.objects.select_related("book").get(pk=pk, user=request.user)
        except Loan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if loan.status != Loan.Status.ACTIVE:
            return Response({"detail": "Loan is not active."}, status=status.HTTP_400_BAD_REQUEST)

        book = loan.book
        book.available_copies = min(book.total_copies, book.available_copies + 1)
        book.save(update_fields=["available_copies", "updated_at"])

        loan.status = Loan.Status.RETURNED
        loan.returned_date = timezone.now()
        loan.save(update_fields=["status", "returned_date", "updated_at"])

        return Response({"detail": "Returned."}, status=status.HTTP_200_OK)
