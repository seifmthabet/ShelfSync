# Database Design

## Storage Engine

- Primary database: PostgreSQL
- ORM: Django ORM
- ID strategy: UUID for public-facing entities

## Core Entities

### User

- `id` (UUID, PK)
- `name` (varchar)
- `email` (varchar, unique, indexed)
- `password` (hashed)
- `role` (`USER`, `ADMIN`)
- `is_active` (bool)
- `created_at`, `updated_at`

### Book

- `id` (UUID, PK)
- `isbn` (varchar, unique, nullable during migration)
- `title` (varchar, indexed)
- `author` (varchar, indexed)
- `category` (varchar, indexed)
- `description` (text)
- `published_year` (int)
- `cover_image` (string/file path)
- `total_copies` (int)
- `available_copies` (int)
- `created_at`, `updated_at`

Rules:

- `available_copies <= total_copies`
- `available_copies >= 0`

### BorrowRequest

- `id` (UUID, PK)
- `user_id` (FK -> User, indexed)
- `book_id` (FK -> Book, indexed)
- `status` (`PENDING`, `APPROVED`, `REJECTED`)
- `reviewed_by_id` (FK -> User, nullable)
- `review_note` (text, nullable)
- `created_at`, `updated_at`

Constraint suggestion:

- One active pending request per `(user_id, book_id)`

### Loan

- `id` (UUID, PK)
- `user_id` (FK -> User, indexed)
- `book_id` (FK -> Book, indexed)
- `borrow_request_id` (FK -> BorrowRequest, nullable)
- `status` (`ACTIVE`, `RETURNED`, `OVERDUE`)
- `issued_at`
- `due_date` (indexed)
- `returned_at` (nullable)
- `renewal_count` (int, default 0)
- `created_at`, `updated_at`

### Review

- `id` (UUID, PK)
- `user_id` (FK -> User, indexed)
- `book_id` (FK -> Book, indexed)
- `rating` (int, 1..5)
- `headline` (varchar)
- `content` (text)
- `status` (`PENDING`, `APPROVED`, `REJECTED`)
- `moderated_by_id` (FK -> User, nullable)
- `created_at`, `updated_at`

Constraint suggestion:

- One review per user per book (if business rules require)

## Relationship Summary

- User 1:N BorrowRequest
- User 1:N Loan
- User 1:N Review
- Book 1:N BorrowRequest
- Book 1:N Loan
- Book 1:N Review

## Indexing Plan

- User: `email`
- Book: `title`, `author`, `category`, `isbn`
- BorrowRequest: `(status, created_at)`
- Loan: `(user_id, status)`, `(due_date, status)`
- Review: `(book_id, status)`, `(user_id, book_id)`

## Audit and Soft Delete Strategy

- Keep `created_at` and `updated_at` on all tables.
- Optional future enhancement: add soft-delete fields (`deleted_at`) for books/reviews.

## Migration Strategy

1. Create initial models with required constraints.
2. Add indexes based on query patterns from API endpoints.
3. Add data migrations for any field normalization (for example, category cleanup).