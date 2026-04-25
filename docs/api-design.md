# API Design - Complete Endpoint Contract

Base URL:
1. /api/v1/

Auth mechanism:
1. Bearer JWT access token
2. Refresh token rotation with blacklist

## Global conventions

1. Content-Type: application/json
2. Date format: ISO8601 UTC
3. Pagination: DRF page-number for list endpoints
4. Ordering query param: ordering
5. Search query param: search

Error response shape:
```json
{
  "code": "validation_error",
  "detail": "Validation failed.",
  "field_errors": {
    "email": ["This field is required."]
  }
}
```

## Auth and account endpoints

1. POST /auth/register/
Request:
```json
{
  "name": "John Reader",
  "email": "john@example.com",
  "password": "Shelf1234",
  "role": "USER"
}
```
Response:
```json
{
  "access": "...",
  "refresh": "...",
  "user": {
    "id": "uuid",
    "name": "John Reader",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

2. POST /auth/login/
3. POST /auth/token/refresh/
4. POST /auth/logout/
5. GET /users/me/
6. PATCH /users/me/
7. POST /users/me/change-password/
8. DELETE /users/me/

Admin user management:
1. GET /admin/users/
2. GET /admin/users/{id}/
3. PATCH /admin/users/{id}/
4. DELETE /admin/users/{id}/

## Books endpoints

1. GET /books/
Query params:
1. search
2. category
3. availability (in_stock|out_of_stock)
4. ordering (title, -created_at, -average_rating)
5. page
6. page_size

List item response shape:
```json
{
  "id": "uuid",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "category": "Classic Literature",
  "rating": 4.8,
  "cover": "https://...",
  "availability": "In Stock",
  "isbn": "978..."
}
```

2. GET /books/{id}/
3. POST /books/ (admin)
4. PATCH /books/{id}/ (admin)
5. DELETE /books/{id}/ (admin)

## Borrowing endpoints

1. POST /borrow-requests/
Request:
```json
{
  "book_id": "uuid"
}
```

2. GET /borrow-requests/me/
3. GET /admin/borrow-requests/
Query params:
1. status
2. ordering
3. risk_score
4. page

Admin borrow queue item shape:
```json
{
  "id": "uuid",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "book_title": "1984",
  "book_author": "George Orwell",
  "status": "pending",
  "requested_date": "2026-04-25T12:00:00Z",
  "user_loans_count": 2,
  "review_count": 5,
  "risk_score": "low"
}
```

4. POST /borrow-requests/{id}/approve/
5. POST /borrow-requests/{id}/reject/
6. GET /loans/me/
7. POST /loans/{id}/renew/
8. POST /loans/{id}/return/

Loan item shape used by frontend:
```json
{
  "id": "uuid",
  "book_title": "1984",
  "book_author": "George Orwell",
  "book_cover": "https://...",
  "borrowed_date": "2026-04-01T00:00:00Z",
  "due_date": "2026-05-01T00:00:00Z",
  "status": "active"
}
```

## Reviews endpoints

1. POST /reviews/
Request:
```json
{
  "book_id": "uuid",
  "rating": 5,
  "headline": "Excellent",
  "comment": "Loved the writing and characters."
}
```

2. GET /books/{id}/reviews/
3. PATCH /reviews/{id}/
4. DELETE /reviews/{id}/
5. GET /admin/reviews/pending/
6. POST /reviews/{id}/approve/
7. POST /reviews/{id}/reject/

Book review item shape:
```json
{
  "id": "uuid",
  "user_name": "Alice",
  "rating": 4,
  "content": "Great read",
  "created_at": "2026-04-25T12:00:00Z",
  "likes": 0,
  "status": "approved"
}
```

## Dashboard endpoints

1. GET /admin/dashboard/
Response:
```json
{
  "catalog_size": 12345,
  "active_users": 3456,
  "total_reviews": 8123,
  "borrowed_books": 1021,
  "retention_rate": 92.5,
  "average_rating": 4.6,
  "storage_utilization": 68.0
}
```

2. GET /users/me/dashboard/

## OpenAPI docs

1. GET /api/schema/
2. GET /api/docs/