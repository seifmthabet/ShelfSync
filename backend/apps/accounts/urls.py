from django.urls import path
from rest_framework_simplejwt.views import (TokenBlacklistView, TokenRefreshView)
from .authentication import CustomTokenObtainPairView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    path('users/me/', views.MeView.as_view(), name="me"),
    path('users/', views.UserListView.as_view(), name="user-list"),
    path('users/<uuid:id>/', views.UserDetailView.as_view(), name="user-details")
]
