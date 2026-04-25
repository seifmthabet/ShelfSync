# ShelfSync - Full Backend Product Spec

This document is the high-level product and backend scope definition for making the current frontend fully functional.

## Product goal

ShelfSync is a digital library platform with two roles:
1. User: discover books, borrow, review, manage profile and reading activity.
2. Admin: manage catalog, users, borrow requests, review moderation, and operational insights.

## Functional modules

1. Authentication and account lifecycle
2. Book catalog and discovery
3. Borrowing lifecycle (request -> approval -> active loan -> renew/return)
4. Reviews and moderation
5. Profile and preferences
6. Admin dashboards and moderation panels

## Frontend screens requiring backend data

Public and auth:
1. Landing
2. Login
3. Sign up

User:
1. Search books
2. Book details
3. Borrowed books
4. Reading history
5. Write review
6. My profile
7. User dashboard

Admin:
1. Admin dashboard
2. Manage books
3. Manage users
4. Borrow requests
5. Review moderation

## Required API versioning and base path

1. API prefix: /api/v1/
2. Frontend config must target this prefix.
3. Keep version in URL to allow future non-breaking upgrades.

## Non-functional requirements

1. Security: JWT auth, role-based access, refresh token rotation.
2. Reliability: transactional state transitions for approvals/returns.
3. Performance: pagination, indexed queries, filter/search support.
4. Observability: structured logging, health checks, error payload consistency.
5. Maintainability: clear app boundaries and test coverage for business rules.

## Release definition of done

Backend is considered production-ready for this frontend when:
1. All services in frontend/static/js/services are backed by working endpoints.
2. All protected pages pass auth checks and role checks reliably.
3. Borrow and review workflows enforce business rules server-side.
4. Admin pages no longer depend on mock data.
5. API docs are generated and accurate.
6. Automated tests cover critical user/admin flows.