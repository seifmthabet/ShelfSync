# ShelfSync Backend Architecture

## Context diagram

1. Browser frontend sends JSON requests to DRF API.
2. DRF API validates auth and permissions.
3. Domain services enforce business rules.
4. PostgreSQL stores canonical state.
5. Redis is optional for cache and async queue.

## Logical architecture

1. Presentation layer: DRF views/viewsets, routers, serializers.
2. Domain layer: services and policy modules per app.
3. Persistence layer: Django models/repositories (ORM queries).
4. Infrastructure layer: auth, caching, logging, async tasks.

## App boundaries

1. accounts
- User model and auth endpoints
- profile/preferences/password/account operations
- role and permission utilities

2. books
- catalog model and CRUD
- search/filter/order endpoints
- availability and inventory consistency

3. borrowing
- borrow request and approval workflow
- loan lifecycle and renew/return actions
- borrow policy checks (limits, overdue, duplicates)

4. reviews
- review submission and update
- moderation queue and decision actions
- aggregate stats for each book

5. dashboard
- admin metrics and user dashboard summary endpoints

## Data flow for critical operations

Borrow request creation:
1. User submits book_id.
2. API checks auth, role, account status.
3. Policy checks copies, active loan limits, pending duplicate.
4. BorrowRequest created with pending status.
5. Response returns request data and computed risk_score.

Approve request:
1. Admin action on pending request.
2. Transaction: lock book row, verify available_copies > 0.
3. Create Loan and decrement available_copies atomically.
4. Update request status and processor metadata.

Return loan:
1. Verify loan belongs to user or admin override.
2. Transaction: mark returned and increment available_copies.
3. Recompute status metrics as needed.

## Security architecture

1. JWT (access + refresh) with rotation and blacklist.
2. Custom permission classes: IsAdmin, IsOwnerOrAdmin, IsReviewerOwner.
3. CORS allowlist restricted to frontend origins.
4. Rate limiting for login/register and moderation actions.
5. Input validation in serializers and domain policy checks.

## API response conventions

Use consistent payloads:
1. Success list: count/next/previous/results
2. Success object: id and canonical fields
3. Error object:
   - code
   - detail
   - field_errors (optional)

## Deployment architecture

Development:
1. Django + runserver
2. SQLite or PostgreSQL local

Production:
1. Gunicorn/uvicorn behind Nginx
2. PostgreSQL managed instance
3. Redis for cache and optional Celery
4. Static/media storage strategy

## Cross-cutting concerns

1. Observability: request logging, error logging, health endpoint.
2. Testing: unit tests for policies, API tests for endpoints.
3. Migrations: strict migration review for schema safety.
4. Backward compatibility: preserve /api/v1 contracts.