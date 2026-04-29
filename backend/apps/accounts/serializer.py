from rest_framework import serializers
from django.contrib.auth import get_user_model, password_validation

from apps.accounts.models import User

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role']
        read_only_fields = ['id', 'role']

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_active', 'is_staff', 'date_joined', 'updated_at']
        read_only_fields = ['id', 'email', 'role', 'is_active', 'is_staff', 'date_joined', 'updated_at']

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'is_active', 'is_staff', 'date_joined', 'updated_at']
        read_only_fields = ['id', 'date_joined', 'updated_at']

    def validate(self, attrs):
        role = attrs.get('role', getattr(self.instance, 'role', None))

        if role == User.Role.ADMIN:
            attrs['is_staff'] = True

        if role == User.Role.USER:
            attrs['is_staff'] = False

        return attrs

class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'is_active', 'is_staff']
        read_only_fields = ['id']

    def validate_password(self, value):
            password_validation.validate_password(value)
            return value

    def validate(self, attrs):
        role = attrs.get('role', User.Role.USER)

        if role == User.Role.ADMIN:
            attrs['is_staff'] = True

        if role == User.Role.USER:
            attrs['is_staff'] = False

        return attrs

    def create(self, validated_data):
            return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')

        return value

    def validate_new_password(self, value):
        user = self.context['request'].user
        password_validation.validate_password(value, user)
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user