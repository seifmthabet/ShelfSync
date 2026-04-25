# Frontend to Backend Contract Matrix

This file maps each frontend service and page to required backend endpoints and expected response fields.

## Base URL contract

1. Frontend must use /api/v1 base path.
2. Current frontend should call http://localhost:8000/api/v1.

## Service-level contract

## usersService

Source: frontend/static/js/services/usersService.js

1. register
- POST /auth/register/
- body: name or fullName, email, password, role
- response: access, refresh, user

2. login
- POST /auth/login/
- body: email, password
- response: access, refresh, user

3. refresh
- POST /auth/token/refresh/
- body: refresh
- response: access

4. logout
- POST /auth/logout/
- body: refresh

5. getProfile
- GET /users/me/

6. updateProfile
- PATCH /users/me/

7. listAdminUsers and getAllUsers
- GET /admin/users/

8. adminDashboard
- GET /admin/dashboard/

## booksService

Source: frontend/static/js/services/booksService.js

1. getAllBooks
- GET /books/
- supports query params: search, category, availability, ordering, page

2. getBookById
- GET /books/{id}/

3. addBook (admin)
- POST /books/

4. updateBook (admin)
- PATCH /books/{id}/

5. deleteBook (admin)
- DELETE /books/{id}/

## borrowService

Source: frontend/static/js/services/borrowService.js

1. createBorrowRequest
- POST /borrow-requests/
- body: book_id

2. getBorrowRequest
- GET /borrow-requests/me/

3. approveBorrowRequest (admin)
- POST /borrow-requests/{id}/approve/

4. rejectBorrowRequest (admin)
- POST /borrow-requests/{id}/reject/

5. returnBorrowedItem
- POST /loans/{id}/return/

6. renewBorrowedItem
- POST /loans/{id}/renew/

7. getBorrowedItems
- GET /loans/me/

8. getAllBorrowRequests (admin)
- GET /admin/borrow-requests/

## reviewsService

Source: frontend/static/js/services/reviewsService.js

1. submitReview
- POST /reviews/

2. getReviewsForBook
- GET /books/{id}/reviews/

3. editReview
- PATCH /reviews/{id}/

4. approveReview (admin)
- POST /reviews/{id}/approve/

5. rejectReview (admin)
- POST /reviews/{id}/reject/

6. getPendingReviews (admin)
- GET /admin/reviews/pending/

## Page-level data needs

1. landingPage.js
- books list for new arrivals and top rated

2. searchBooks.js
- paginated/filterable books list with fields:
  - id, title, author, category, rating, cover, availability

3. bookDetails.js
- book detail fields:
  - id, title, author, cover, summary, category, year, rating, total_reviews, availability, rating_breakdown
- book reviews fields:
  - id, user_name, rating, content/comment, created_at, likes

4. borrowedBooks.js
- loans fields:
  - id, book_title, book_author, book_cover, borrowed_date, due_date, status

5. adminBorrowRequests.js
- request fields:
  - id, user_name, user_email, book_title, book_author, status, requested_date, user_loans_count, review_count, risk_score

6. adminReviewManagement.js
- review fields:
  - id, book_title, user_name, rating, comment, created_at, status

7. myProfile.js
- user profile fields:
  - id, name, email, role, date_joined
  - favorite_genres, reading_goal_per_year, email_notifications

## Contract notes

1. Keep trailing slashes for DRF consistency.
2. Keep response field names stable with frontend usage.
3. Add aliases only if migration period is needed.
