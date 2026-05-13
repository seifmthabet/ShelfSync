from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializer import UserProfileSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["name"] = user.name
        token["email"] = user.email
        token["role"] = user.role

        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request: Request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != status.HTTP_200_OK:
            return response
        identifier = request.data.get("email") or request.data.get("username")
        if not identifier:
            return response
        try:
            user = User.objects.get(email__iexact=identifier)
            response.data["user"] = UserProfileSerializer(user).data
        except User.DoesNotExist:
            pass
        return response
