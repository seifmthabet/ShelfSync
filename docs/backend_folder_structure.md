# Backend Folder Structure (Recommended)

Use this structure to keep API code scalable and testable.

```text
backend/
  manage.py
  pyproject.toml
  .env
  config/
    __init__.py
    asgi.py
    wsgi.py
    urls.py
    settings/
      __init__.py
      base.py
      dev.py
      prod.py
  apps/
    accounts/
      __init__.py
      apps.py
      models.py
      serializers.py
      views.py
      urls.py
      permissions.py
      authentication.py
      services.py
      tests/
        test_auth.py
        test_profile.py
    books/
      __init__.py
      apps.py
      models.py
      serializers.py
      views.py
      urls.py
      filters.py
      services.py
      tests/
        test_books_api.py
    borrowing/
      __init__.py
      apps.py
      models.py
      serializers.py
      views.py
      urls.py
      services.py
      policies.py
      tests/
        test_borrow_requests.py
        test_loans.py
    reviews/
      __init__.py
      apps.py
      models.py
      serializers.py
      views.py
      urls.py
      services.py
      tests/
        test_reviews.py
    dashboard/
      __init__.py
      apps.py
      serializers.py
      views.py
      urls.py
      services.py
      tests/
        test_dashboard.py
  common/
    __init__.py
    constants.py
    exceptions.py
    pagination.py
    permissions.py
```

## URL include layout

config/urls.py should include:

1. /api/v1/auth/ -> apps.accounts.urls
2. /api/v1/books/ -> apps.books.urls
3. /api/v1/borrowing/ -> apps.borrowing.urls
4. /api/v1/reviews/ -> apps.reviews.urls
5. /api/v1/dashboard/ -> apps.dashboard.urls

Also include docs:

1. /api/schema/
2. /api/docs/

## Coding standards

1. Put business rules in services.py or policies.py.
2. Keep views thin.
3. Keep serializers for validation + transformation.
4. Add tests beside each app.
