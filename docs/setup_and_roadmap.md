# Setup and Roadmap

This document closes the implementation gaps between current repository state and the target REST API architecture.

## Current Gaps

1. Backend is still baseline Django, not DRF API modules.
2. Frontend pages are mostly static and not connected to API responses.
3. Auth strategy (JWT + refresh) is designed but not yet implemented.
4. API schema/docs endpoint is not yet exposed.
5. Production deployment and environment conventions are not yet documented in one place.

## Backend Implementation Checklist

1. Add REST dependencies:
   - djangorestframework
   - djangorestframework-simplejwt
   - django-cors-headers
2. Create domain apps:
   - accounts
   - books
   - borrowing
   - reviews
3. Add `/api/v1/` router and module URL includes.
4. Implement serializers, permissions, and viewsets.
5. Add admin moderation actions for reviews and borrow requests.
6. Add tests for key flows:
   - login/register
   - borrow request approval path
   - review moderation path

## Frontend Integration Checklist

1. Add a shared API client with base URL from environment.
2. Add token storage and refresh flow.
3. Replace static placeholders in pages with API calls.
4. Add loading, empty, and error states on key screens.
5. Add route guards for admin-only screens.

## Environment Variables

### Backend

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_ACCESS_MINUTES`
- `JWT_REFRESH_DAYS`

### Frontend

- `VITE_API_BASE_URL` (or equivalent)

## Suggested Delivery Sequence

1. Auth module and JWT setup
2. Books list/details endpoints
3. Borrow request and loan lifecycle endpoints
4. Reviews create/list/moderation endpoints
5. Frontend wiring screen-by-screen
6. Final cleanup and remove obsolete static-only data assumptions

## Verification Matrix

1. User can sign up and log in from frontend.
2. User can browse books from API data.
3. User can submit borrow request.
4. Admin can approve/reject request.
5. User can submit review and admin can moderate it.
6. API docs are reachable and accurate.
