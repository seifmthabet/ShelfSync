from django.contrib.auth import get_user_model
from django.db.models import Avg, Sum
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.borrowing.models import Loan
from apps.books.models import Book
from apps.reviews.models import Review

from .permissions import IsAdmin
from .serializer import (
    AdminCreateUserSerializer,
    AdminUserSerializer,
    ChangePasswordSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):  # type: ignore[override]
        return self.request.user

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class UserListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by("-date_joined")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminCreateUserSerializer
        return AdminUserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    lookup_field = "id"


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return self._change(request)

    def patch(self, request, *args, **kwargs):
        return self._change(request)

    def _change(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        catalog_size = Book.objects.filter(is_active=True).count()
        active_users = User.objects.filter(is_active=True, role=User.Role.USER).count()
        total_reviews = Review.objects.count()
        borrowed_books = Loan.objects.filter(status=Loan.Status.ACTIVE).count()
        total_user_count = max(User.objects.filter(is_active=True).count(), 1)
        users_with_loans = (
            User.objects.filter(loans__isnull=False).distinct().count()
        )
        retention_rate = round(min(99.9, (users_with_loans / total_user_count) * 100), 1)
        avg = Review.objects.filter(status=Review.Status.APPROVED).aggregate(
            m=Avg("rating")
        )["m"]
        average_rating = round(float(avg), 1) if avg is not None else 0.0
        total_copy_sum = (
            Book.objects.filter(is_active=True).aggregate(t=Sum("total_copies"))["t"] or 1
        )
        available_sum = (
            Book.objects.filter(is_active=True).aggregate(t=Sum("available_copies"))["t"] or 0
        )
        lent = max(0, total_copy_sum - available_sum)
        storage_utilization = round(min(100.0, (lent / total_copy_sum) * 100), 1)

        return Response(
            {
                "catalog_size": catalog_size,
                "active_users": active_users,
                "total_reviews": total_reviews,
                "borrowed_books": borrowed_books,
                "retention_rate": retention_rate,
                "average_rating": average_rating,
                "storage_utilization": storage_utilization,
            }
        )


class UserMeDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        week_end = now + timedelta(days=7)
        active_loans = Loan.objects.filter(user=user, status=Loan.Status.ACTIVE).count()
        reviews_written = Review.objects.filter(user=user).count()
        due_this_week = Loan.objects.filter(
            user=user,
            status=Loan.Status.ACTIVE,
            due_date__lte=week_end,
            due_date__gte=now,
        ).count()

        return Response(
            {
                "active_loans": active_loans,
                "reviews_written": reviews_written,
                "due_this_week": due_this_week,
            }
        )
