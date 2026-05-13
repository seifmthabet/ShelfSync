from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.books.models import Book
from apps.borrowing.models import BorrowRequest, Loan
from apps.borrowing.serializers import (
    BorrowRequestAdminSerializer,
    BorrowRequestCreateSerializer,
    BorrowRequestMineSerializer,
    LoanHistorySerializer,
    LoanMineSerializer,
)


class BorrowRequestCreateView(generics.CreateAPIView):
    serializer_class = BorrowRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class BorrowRequestListMineView(generics.ListAPIView):
    serializer_class = BorrowRequestMineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            BorrowRequest.objects.filter(user=self.request.user)
            .select_related("book")
            .order_by("-requested_at")
        )


class AdminBorrowRequestListView(generics.ListAPIView):
    serializer_class = BorrowRequestAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = BorrowRequest.objects.select_related("user", "book").order_by("-requested_at")
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st.lower())
        risk = self.request.query_params.get("risk_score")
        if risk:
            qs = qs.filter(risk_score=risk.lower())
        ordering = self.request.query_params.get("ordering", "-requested_at")
        o = ordering.lstrip("-")
        if o in ("requested_at", "risk_score"):
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-requested_at")
        return qs


class BorrowRequestApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        br = get_object_or_404(
            BorrowRequest.objects.select_for_update().select_related("book"),
            pk=pk,
        )
        if br.status != BorrowRequest.Status.PENDING:
            return Response(
                {"detail": "Request is not pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        book = Book.objects.select_for_update().get(pk=br.book_id)
        if book.available_copies < 1:
            return Response(
                {"detail": "No copies available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        book.available_copies -= 1
        book.save(update_fields=["available_copies"])
        loan = Loan.objects.create(
            user=br.user,
            book=book,
            borrow_request=br,
            borrowed_date=now,
            due_date=now + timedelta(days=30),
            status=Loan.Status.ACTIVE,
        )
        br.status = BorrowRequest.Status.APPROVED
        br.processed_at = now
        br.processed_by = request.user
        br.save(update_fields=["status", "processed_at", "processed_by"])
        return Response(LoanMineSerializer(loan).data, status=status.HTTP_200_OK)


class BorrowRequestRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        br = get_object_or_404(BorrowRequest, pk=pk)
        if br.status != BorrowRequest.Status.PENDING:
            return Response(
                {"detail": "Request is not pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("rejection_reason", "")
        now = timezone.now()
        br.status = BorrowRequest.Status.REJECTED
        br.processed_at = now
        br.processed_by = request.user
        br.rejection_reason = reason
        br.save(update_fields=["status", "processed_at", "processed_by", "rejection_reason"])
        return Response(BorrowRequestMineSerializer(br).data, status=status.HTTP_200_OK)


class LoanListMineView(generics.ListAPIView):
    serializer_class = LoanMineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Loan.objects.filter(user=self.request.user)
            .exclude(status=Loan.Status.RETURNED)
            .select_related("book")
            .order_by("due_date")
        )


class LoanHistoryListView(generics.ListAPIView):
    serializer_class = LoanHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Loan.objects.filter(user=self.request.user, status=Loan.Status.RETURNED)
            .select_related("book")
            .order_by("-returned_date")
        )


class LoanRenewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        loan = get_object_or_404(Loan, pk=pk, user=request.user)
        if loan.status != Loan.Status.ACTIVE:
            return Response({"detail": "Loan is not active."}, status=status.HTTP_400_BAD_REQUEST)
        if loan.renew_count >= loan.max_renewals:
            return Response({"detail": "Max renewals reached."}, status=status.HTTP_400_BAD_REQUEST)
        loan.due_date = loan.due_date + timedelta(days=14)
        loan.renew_count += 1
        loan.save(update_fields=["due_date", "renew_count", "updated_at"])
        return Response(LoanMineSerializer(loan).data, status=status.HTTP_200_OK)


class LoanReturnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        loan = get_object_or_404(
            Loan.objects.select_for_update().select_related("book"),
            pk=pk,
            user=request.user,
        )
        if loan.status == Loan.Status.RETURNED:
            return Response({"detail": "Already returned."}, status=status.HTTP_400_BAD_REQUEST)
        book = Book.objects.select_for_update().get(pk=loan.book_id)
        now = timezone.now()
        loan.status = Loan.Status.RETURNED
        loan.returned_date = now
        loan.save(update_fields=["status", "returned_date", "updated_at"])
        book.available_copies = min(book.total_copies, book.available_copies + 1)
        book.save(update_fields=["available_copies"])
        return Response(LoanMineSerializer(loan).data, status=status.HTTP_200_OK)
