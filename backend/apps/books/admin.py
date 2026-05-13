from django.contrib import admin

from .models import Book, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "available_copies", "total_copies", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("title", "author", "isbn")
