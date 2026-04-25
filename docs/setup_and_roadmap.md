# Setup and Roadmap - Full Build Plan

This is the implementation playbook to make the current frontend fully functional with Django REST Framework.

## Phase 0 - Foundation

1. Confirm Python version and virtual environment.
2. Install dependencies:
   - djangorestframework
   - djangorestframework-simplejwt
   - django-filter
   - django-cors-headers
   - drf-spectacular
   - psycopg2-binary
3. Configure settings modules and env files.
4. Switch DB to PostgreSQL for non-trivial testing.

## Phase 1 - Auth stabilization

1. Finalize custom user model fields and serializer alignment.
2. Implement/register/login/refresh/logout.
3. Implement users/me read-update.
4. Add users/me change-password.
5. Add admin users list/detail endpoints.
6. Add tests for auth lifecycle.

## Phase 2 - Catalog (books)

1. Create books models and migrations.
2. Build serializers and viewsets with pagination/filter/search/order.
3. Add admin CRUD permissions.
4. Ensure output field names match frontend usage.
5. Add tests for list/detail/filter/order and admin CRUD.

## Phase 3 - Borrowing workflow

1. Add BorrowRequest and Loan models.
2. Implement request creation with policy validations.
3. Implement approve/reject actions with transactions.
4. Implement loans/me, renew, return.
5. Add admin borrow queue endpoint.
6. Add tests for all state transitions.

## Phase 4 - Reviews workflow

1. Add Review model with moderation status.
2. Implement submit/edit/delete user actions.
3. Implement books/{id}/reviews list endpoint.
4. Implement admin pending list and approve/reject actions.
5. Recalculate book aggregates after moderation decisions.
6. Add tests for ownership and moderation rules.

## Phase 5 - Dashboard endpoints

1. Implement admin dashboard metrics endpoint.
2. Implement user dashboard summary endpoint.
3. Add date-range query support if needed.
4. Add performance tests for aggregation queries.

## Phase 6 - Integration and hardening

1. Align frontend config base URL to /api/v1.
2. Fix frontend service typos and mismatched paths.
3. Verify all screens consume real API data.
4. Add consistent error handling and user feedback.
5. Add API schema and Swagger docs.

## Environment variables (required)

1. SECRET_KEY
2. DEBUG
3. ALLOWED_HOSTS
4. DATABASE_URL
5. CORS_ALLOWED_ORIGINS
6. CSRF_TRUSTED_ORIGINS
7. ACCESS_TOKEN_LIFETIME_MINUTES
8. REFRESH_TOKEN_LIFETIME_DAYS

## CI/CD checklist

1. lint + format
2. unit tests + API tests
3. migration check
4. schema generation check
5. deploy to staging
6. smoke tests against frontend flows

## Acceptance criteria

1. Login/signup works from frontend pages.
2. Search/list/book details are real API data.
3. Borrow request end-to-end works.
4. Loan renew/return works.
5. Review submit and admin moderation works.
6. Admin dashboard shows live metrics.
7. No page depends on local mock objects.
