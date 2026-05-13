from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.books.models import Book
from apps.borrowing.models import Loan
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
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):  # type: ignore
        return self.request.user


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


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user


class DeactivateMeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(
            {"detail": "Account deactivated successfully."},
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        catalog_size = Book.objects.filter(is_active=True).count()
        active_users = User.objects.filter(is_active=True).count()
        total_reviews = Review.objects.filter(status=Review.Status.APPROVED).count()
        borrowed_books = Loan.objects.filter(status=Loan.Status.ACTIVE).count()
        avg = Review.objects.filter(status=Review.Status.APPROVED).aggregate(Avg("rating"))[
            "rating__avg"
        ]

        retention_rate = 92.5
        storage_utilization = min(99.0, 45.0 + catalog_size * 0.02)

        return Response(
            {
                "catalog_size": catalog_size,
                "active_users": active_users,
                "total_reviews": total_reviews,
                "borrowed_books": borrowed_books,
                "retention_rate": round(retention_rate, 1),
                "average_rating": round(float(avg), 1) if avg else 0.0,
                "storage_utilization": round(storage_utilization, 1),
            }
        )
