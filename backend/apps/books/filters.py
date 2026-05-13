import django_filters
from django.db.models import Q

from apps.books.models import Book


class BookFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    availability = django_filters.CharFilter(method="filter_availability")

    class Meta:
        model = Book
        fields = ["category", "availability"]

    def filter_category(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(category__slug__iexact=value) | Q(category__name__iexact=value)
        )

    def filter_availability(self, queryset, name, value):
        v = (value or "").lower()
        if v == "in_stock":
            return queryset.filter(is_active=True, available_copies__gt=0)
        if v == "out_of_stock":
            return queryset.filter(is_active=True, available_copies=0)
        return queryset
