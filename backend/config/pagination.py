from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    """Allow clients to pass ?page_size= (capped) while keeping a sensible default."""

    page_size_query_param = "page_size"
    max_page_size = 50
