# 📚 ShelfSync – Project Overview & Screen Catalog

ShelfSync is an online library platform designed with a modern, minimal, and eye-friendly **“Antiquarian Modern”** aesthetic. It enables users to explore, borrow, and manage books while providing administrators with full control over the platform.

---

## 🧭 1. Public & Authentication

### 🌐 Landing Page
**Purpose:**  
Entry point for all visitors. Establishes branding and encourages exploration.

**Key Features:**
- Hero section with headline: *“Borrow Books Anytime, Anywhere”*
- Call-to-action: **Explore Catalog**
- Curated collections (e.g., Renaissance Philosophers, Modern Poetry)
- Newly archived books with ratings (horizontal scroll)
- Membership CTA: *“Join the Circle”* with email signup

---

### 📝 Sign Up
**Purpose:**  
Register new users and administrators.

**Key Features:**
- Role selection (User / Admin)
- Minimal form (Name, Email, Password)
- Clean and simple onboarding experience

---

### 🔐 Login
**Purpose:**  
Secure access for existing users.

**Key Features:**
- Single Sign-On (SSO)
- Biometric authentication support
- Consistent branding (“Digital Archivist” theme)

---

## 👤 2. Reader Experience (User Role)

### 📊 User Dashboard
**Purpose:**  
Personalized home for each user.

**Key Features:**
- Stats overview (Active Loans, Reviews, Credits)
- Currently reading section with progress tracking
- Personalized recommendations

---

### 🔎 Search & Browse
**Purpose:**  
Discover and explore books.

**Key Features:**
- Advanced filters (Category, Availability, Keywords)
- Grid layout with book covers and ratings

---

### 📖 Book Details
**Purpose:**  
Detailed view of a specific book.

**Key Features:**
- Large header with book metadata
- Rating breakdown (1–5 stars)
- Community reviews section
- “Write a Review” entry point

---

### 📚 Borrowed Books
**Purpose:**  
Manage active loans.

**Key Features:**
- Status indicators (Active, Due Soon)
- Actions: Renew Loan, Mark as Finished
- Waitlist tracking

---

### 🕒 Reading History
**Purpose:**  
Track user’s reading journey.

**Key Features:**
- Timeline view of completed books
- Statistics (Total Pages, Monthly Reading Pace)

---

### ✍️ Write Review
**Purpose:**  
Allow users to submit reviews.

**Key Features:**
- Interactive star rating system
- Headline + detailed critique fields
- Qualitative labels for ratings

---

### 👤 My Profile
**Purpose:**  
Manage personal account and settings.

**Key Features:**
- Personal info and interests
- Security settings (Password, 2FA)

---

## 🛠️ 3. Library Management (Admin Role)

### 📈 Admin Dashboard
**Purpose:**  
Monitor overall system activity.

**Key Features:**
- Stats (Catalog Size, Active Users, Contributions)
- Active loans tracking (Due / Overdue)
- Internal notes system

---

### 📚 Manage Books
**Purpose:**  
Control book inventory.

**Key Features:**
- Searchable books table
- Edit/Delete functionality
- Category performance insights

---

### 👥 Manage Users
**Purpose:**  
Control user accounts and roles.

**Key Features:**
- User directory with roles
- Account statistics and approvals

---

### ⭐ Manage Reviews
**Purpose:**  
Moderate user-generated content.

**Key Features:**
- Moderation queue
- Sentiment analysis (average ratings)

---

### 📩 Borrow Requests
**Purpose:**  
Handle borrowing approvals.

**Key Features:**
- Request cards with user & book info
- Approve / Deny actions
- Risk flagging system

---

## 🚀 Summary

ShelfSync provides:
- A **seamless reading experience** for users  
- A **powerful management system** for admins  
- A **clean, modern UI/UX design**  
- A **data-driven approach** to reading and library management  

---

## 🧭 4. Screen to API Mapping

To support frontend/backend separation, each screen should consume REST endpoints.

### Landing Page
- `GET /api/v1/books/?ordering=-created_at&page=1&page_size=8`
- `GET /api/v1/books/?ordering=-rating&page=1&page_size=8`

### Sign Up / Login
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`

### User Dashboard
- `GET /api/v1/users/me/`
- `GET /api/v1/loans/me/?status=ACTIVE`
- `GET /api/v1/reviews/me/`

### Library / Search
- `GET /api/v1/books/?search=&category=&available=true`

### Book Details
- `GET /api/v1/books/{id}/`
- `GET /api/v1/books/{id}/reviews/`
- `POST /api/v1/borrow-requests/`

### Write Review
- `POST /api/v1/reviews/`
- `PATCH /api/v1/reviews/{id}/`

### Admin Dashboard
- `GET /api/v1/admin/dashboard/`

### Admin Manage Books
- `GET /api/v1/books/`
- `POST /api/v1/books/`
- `PATCH /api/v1/books/{id}/`
- `DELETE /api/v1/books/{id}/`

### Admin Review Management
- `GET /api/v1/admin/reviews/pending/`
- `POST /api/v1/reviews/{id}/approve/`
- `POST /api/v1/reviews/{id}/reject/`

---

## ✅ Definition of Done (for the split)

Frontend/backend separation is considered complete when:

1. No page reads hardcoded local HTML data as source of truth.
2. All dynamic page data is fetched from `/api/v1/...`.
3. Backend no longer serves product HTML templates.
4. Auth, books, borrow, and reviews flows are fully API-driven.