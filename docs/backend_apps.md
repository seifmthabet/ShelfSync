# Backend Apps - Full Responsibilities and Contracts

This file defines exactly how many apps to use, their names, ownership boundaries, and implementation responsibilities.

## Target app set

Implement 5 backend apps:
1. accounts
2. books
3. borrowing
4. reviews
5. dashboard

Optional helper app:
1. common

## apps/accounts

Owns:
1. User model and account lifecycle.
2. Authentication and authorization.
3. Role management.
4. Profile and preference data.

Endpoints owned:
1. register/login/refresh/logout
2. users/me read/update
3. users/me/change-password
4. users/me delete/deactivate
5. admin users list/detail/update/deactivate

Internal modules:
1. models.py
2. serializers.py
3. views.py
4. permissions.py
5. authentication.py
6. services.py

## apps/books

Owns:
1. Book metadata and inventory.
2. Category taxonomy.
3. Catalog discoverability fields.

Endpoints owned:
1. books list/detail
2. books create/update/delete (admin)
3. optional categories list

Responsibilities:
1. keep available_copies consistent with loan transitions
2. provide searchable/filterable list with pagination

## apps/borrowing

Owns:
1. BorrowRequest state machine.
2. Loan state machine.
3. Renewal and return policies.

Endpoints owned:
1. create borrow request
2. my borrow requests
3. admin borrow queue
4. approve/reject request
5. my loans
6. renew and return loan

Policy checks:
1. max active loans per user
2. overdue restrictions
3. duplicate pending request prevention
4. inventory checks

## apps/reviews

Owns:
1. Review content and ratings.
2. Moderation state transitions.
3. Book-level aggregates.

Endpoints owned:
1. submit/edit/delete review
2. list reviews for book
3. admin pending reviews queue
4. approve/reject review

Rules:
1. rating must be 1..5
2. optional single review per user/book
3. optional only-borrowers-can-review policy

## apps/dashboard

Owns:
1. Aggregated admin metrics.
2. Aggregated user dashboard summary.
3. Optional trend endpoints for charts.

Endpoints owned:
1. admin dashboard metrics
2. user dashboard summary

## apps/common (optional)

Use only when repeated patterns appear in 3+ apps.

Candidates:
1. base model mixins (timestamps, UUID)
2. domain enums/constants
3. common paginations
4. custom exception and error builders

## Dependency rules

1. books must not import from borrowing domain services.
2. borrowing can reference books and accounts models.
3. reviews can reference books and accounts models.
4. dashboard may query all domain models read-only.
5. avoid circular imports; move shared constants to common if needed.