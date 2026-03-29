# API Design (REST)

## Base and Versioning

- Base prefix: `/api/v1/`
- Content type: `application/json`
- Time format: ISO 8601 UTC

## Authentication

- JWT Bearer token for protected endpoints
- Refresh token endpoint to rotate access tokens

### Auth Endpoints

- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `POST /api/v1/auth/logout/`

Example register request:

```json
{
  "name": "John Reader",
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

Example login response:

```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "user": {
    "id": "uuid",
    "name": "John Reader",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

## Response Conventions

Success envelope:

```json
{
  "data": {},
  "meta": {}
}
```

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input.",
    "details": {
      "field": ["This field is required."]
    }
  }
}
```

## Pagination, Filtering, Sorting

- Pagination: `page`, `page_size`
- Common filter: `search`
- Sorting: `ordering` (example: `-created_at`)

## Books

- `GET /api/v1/books/`
- `GET /api/v1/books/{id}/`
- `POST /api/v1/books/` (admin)
- `PATCH /api/v1/books/{id}/` (admin)
- `DELETE /api/v1/books/{id}/` (admin)

Recommended query params:

- `search`
- `category`
- `available=true|false`
- `ordering=title|-published_year`

## Borrowing and Loans

- `POST /api/v1/borrow-requests/`
- `GET /api/v1/borrow-requests/me/`
- `POST /api/v1/borrow-requests/{id}/approve/` (admin)
- `POST /api/v1/borrow-requests/{id}/reject/` (admin)
- `GET /api/v1/loans/me/`
- `POST /api/v1/loans/{id}/renew/`
- `POST /api/v1/loans/{id}/return/`

## Reviews

- `POST /api/v1/reviews/`
- `GET /api/v1/books/{id}/reviews/`
- `PATCH /api/v1/reviews/{id}/` (owner)
- `POST /api/v1/reviews/{id}/approve/` (admin)
- `POST /api/v1/reviews/{id}/reject/` (admin)

## User Profile

- `GET /api/v1/users/me/`
- `PATCH /api/v1/users/me/`

## Admin APIs

- `GET /api/v1/admin/dashboard/`
- `GET /api/v1/admin/users/`
- `GET /api/v1/admin/borrow-requests/`
- `GET /api/v1/admin/reviews/pending/`

## Suggested Status Codes

- `200 OK` read/update success
- `201 Created` resource created
- `204 No Content` successful delete
- `400 Bad Request` validation failure
- `401 Unauthorized` missing/invalid auth
- `403 Forbidden` role or permission denied
- `404 Not Found` resource does not exist
- `409 Conflict` duplicate or state conflict

## OpenAPI

Expose generated OpenAPI schema and interactive docs after implementation:

- `/api/schema/`
- `/api/docs/`