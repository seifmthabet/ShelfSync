from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializer import RegisterSerializer, UserProfileSerializer
from .permissions import IsAdmin, IsOwnerOrAdmin

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self): # type: ignore
        return self.request.user

class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by('-date_joined')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    queryset = User.objects.all()
    lookup_field = 'id'