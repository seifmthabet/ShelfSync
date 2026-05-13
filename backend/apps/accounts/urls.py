from django.urls import path
from rest_framework_simplejwt.views import (TokenBlacklistView, TokenRefreshView)
from .authentication import CustomTokenObtainPairView
from . import views

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    
    path('users/me/', views.MeView.as_view(), name="me"),
    path('users/me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('users/me/deactivate/', views.DeactivateMeView.as_view(), name='deactivate-me'),

    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', views.UserListView.as_view(), name="user-list"),
    path('admin/users/<uuid:id>/', views.UserDetailView.as_view(), name="user-details"),
]
