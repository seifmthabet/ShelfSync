# Backend Implementation Checklists

Use this as an execution checklist while building the API.

## Accounts checklist

1. User model fields finalized.
2. Register endpoint returns tokens + user payload.
3. Login endpoint returns tokens + user payload.
4. Refresh endpoint rotates access token.
5. Logout endpoint blacklists refresh token.
6. users/me GET and PATCH implemented.
7. change-password endpoint implemented.
8. admin users list/detail endpoints implemented.
9. Role-based permissions tested.

## Books checklist

1. Book and Category models created.
2. Migrations generated and applied.
3. Book serializer includes frontend-required fields.
4. List endpoint supports filter/search/order/page.
5. Detail endpoint implemented.
6. Admin CRUD endpoints implemented.
7. Inventory constraints validated server-side.
8. Tests for list/detail/filter/order and admin CRUD.

## Borrowing checklist

1. BorrowRequest and Loan models created.
2. createBorrowRequest endpoint implemented.
3. my borrow requests endpoint implemented.
4. admin borrow queue endpoint implemented.
5. approve/reject endpoints implemented with transactions.
6. loans/me endpoint implemented.
7. renew endpoint implemented with policy checks.
8. return endpoint implemented with inventory increment.
9. All workflow tests passing.

## Reviews checklist

1. Review model created.
2. submit review endpoint implemented.
3. edit and delete review endpoints implemented.
4. list reviews for book endpoint implemented.
5. admin pending reviews endpoint implemented.
6. approve/reject moderation endpoints implemented.
7. Book rating aggregates updated after moderation actions.
8. Owner/admin permission tests passing.

## Dashboard checklist

1. admin dashboard metrics endpoint implemented.
2. user dashboard summary endpoint implemented.
3. Queries optimized with indexes/annotations.
4. Metrics validation tests passing.

## Integration checklist

1. Frontend config points to /api/v1.
2. All service paths verified against backend routes.
3. CORS configured for Live Server origin.
4. JWT flow works from login page.
5. Borrow and review flows validated from UI.
6. Admin pages show real API data.
7. OpenAPI docs generated and accessible.

## Reliability checklist

1. Global exception handler configured.
2. Consistent error payload shape.
3. Logging for auth and moderation actions.
4. DB transaction usage in state transitions.
5. Idempotency checks for approve/reject actions.

## Go-live checklist

1. Production env vars configured.
2. DEBUG false and secure settings enabled.
3. Static/media strategy configured.
4. Database backup policy in place.
5. Basic monitoring and alerts configured.
