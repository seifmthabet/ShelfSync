from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "user", "rating", "status", "created_at")
    list_filter = ("status", "rating")
    search_fields = ("headline", "comment", "book__title")
