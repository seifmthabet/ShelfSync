# Backend Apps

This document defines the backend app boundaries for ShelfSync. The current backend scope is small enough that four domain apps are sufficient, with one optional shared app for future cleanup.

## Required Apps

### `apps/accounts`

Responsibilities:

- User registration and login
- JWT access and refresh token flow
- Profile retrieval and updates
- Role management for `USER` and `ADMIN`
- Permission checks for protected endpoints
- Admin-facing user management if needed later

Typical data owned by this app:

- User profile fields
- Role and account status
- Authentication-related serializers and views

### `apps/books`

Responsibilities:

- Book catalog management
- Book search, filtering, and ordering
- Book detail endpoints
- Inventory tracking for total and available copies
- Book metadata such as ISBN, author, category, and cover image

Typical data owned by this app:

- Book model
- Category and search fields
- Cover image handling

### `apps/borrowing`

Responsibilities:

- Borrow request creation
- Admin approval and rejection flows
- Active loan management
- Renewals and returns
- Due date and loan status tracking

Typical data owned by this app:

- Borrow request model
- Loan model
- Borrow lifecycle status transitions

### `apps/reviews`

Responsibilities:

- Review creation and editing by the owner
- Review listing by book
- Rating validation
- Admin moderation of pending reviews
- Approve/reject review workflow

Typical data owned by this app:

- Review model
- Rating, headline, and content fields
- Moderation status

## Optional Future App

### `apps/common`

Use this only if shared code starts to grow.

Responsibilities:

- Shared base models
- Common constants and enums
- Reusable validators and helpers
- Shared response or error formatting utilities
- Generic mixins used across multiple apps

## Why This Split Works

- It keeps authentication separate from catalog and transaction logic.
- It keeps book data isolated from borrowing and moderation rules.
- It makes the API easier to maintain and test.
- It avoids creating too many apps before the business rules actually require them.

## Recommended Current Set

Use these now:

1. `apps/accounts`
2. `apps/books`
3. `apps/borrowing`
4. `apps/reviews`

Add `apps/common` later only if shared logic becomes repetitive.