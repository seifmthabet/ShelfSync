# Database Design - Production Schema

This schema supports all current frontend workflows.

## Engine and conventions

1. Database: PostgreSQL.
2. Primary keys: UUID.
3. Time fields: timezone-aware UTC.
4. Soft delete for mutable domain objects where useful.

## accounts_user

Required fields:
1. id UUID PK
2. name varchar(255)
3. email unique indexed
4. password hash
5. role enum USER/ADMIN
6. is_active bool
7. is_staff bool
8. date_joined datetime
9. updated_at datetime

Optional profile fields:
1. avatar_url text
2. favorite_genres jsonb
3. reading_goal_per_year int
4. email_notifications bool

## books_category

1. id UUID PK
2. name unique indexed
3. slug unique indexed
4. created_at, updated_at

## books_book

1. id UUID PK
2. isbn unique nullable
3. title indexed
4. author indexed
5. category FK books_category nullable
6. description text
7. publication_year int nullable
8. cover_url text nullable
9. total_copies int default 1
10. available_copies int default 1
11. average_rating decimal(3,2) cached
12. reviews_count int cached
13. is_active bool
14. created_at, updated_at

Constraints:
1. available_copies >= 0
2. available_copies <= total_copies

## borrowing_borrowrequest

1. id UUID PK
2. user FK accounts_user
3. book FK books_book
4. status enum pending/approved/rejected/cancelled
5. risk_score enum low/medium/high
6. requested_at datetime
7. processed_at datetime nullable
8. processed_by FK accounts_user nullable
9. rejection_reason text nullable

Indexes:
1. (status, requested_at desc)
2. (user_id, status)
3. (book_id, status)

Unique rule:
1. one pending request per user/book.

## borrowing_loan

1. id UUID PK
2. user FK accounts_user
3. book FK books_book
4. borrow_request FK borrowing_borrowrequest nullable
5. status enum active/returned/overdue
6. borrowed_date datetime
7. due_date datetime
8. returned_date datetime nullable
9. renew_count int default 0
10. max_renewals int default 2
11. created_at, updated_at

Indexes:
1. (user_id, status)
2. (due_date, status)
3. (book_id, status)

Business constraints:
1. returned_date required when status=returned.
2. renew_count <= max_renewals.

## reviews_review

1. id UUID PK
2. user FK accounts_user
3. book FK books_book
4. rating int 1..5
5. headline varchar(255)
6. comment text
7. status enum pending/approved/rejected
8. created_at, updated_at
9. moderated_by FK accounts_user nullable
10. moderated_at datetime nullable
11. moderation_note text nullable

Indexes:
1. (book_id, status, created_at desc)
2. (user_id, created_at desc)

Unique rule:
1. unique (user_id, book_id) if product wants one review per book per user.

## Derived metrics (dashboard)

Computed from domain tables:
1. catalog_size -> count of active books
2. active_users -> count of active users with recent activity
3. total_reviews -> reviews count
4. borrowed_books -> active loans count
5. retention_rate -> cohort/rolling metric
6. average_rating -> mean approved rating

## Data lifecycle

1. Book delete should be soft delete while historical loans/reviews exist.
2. User delete should deactivate account and preserve audit references.
3. Moderation decisions must keep audit fields (moderated_by/at).

## Migration plan

1. Create tables with minimal required fields.
2. Add constraints and indexes.
3. Add caching fields for book aggregates.
4. Backfill aggregates with data migration.