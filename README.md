# ShelfSync

ShelfSync is a library management platform built as a separated frontend and backend system. The frontend provides the user interface, while the backend exposes a REST API for authentication, catalog browsing, borrowing, and review moderation.

## Overview

ShelfSync is designed to support two user roles:

- Readers, who can browse books, request borrows, and write reviews.
- Administrators, who can manage the catalog, approve requests, and moderate reviews.

The repository is organized as a monorepo with a Django backend and a static JavaScript frontend that will progressively consume the API.

## Project Structure

```text
ShelfSync/
├── backend/      # Django API service managed with uv
├── frontend/     # HTML, CSS, and JavaScript user interface
├── docs/         # Architecture, API, database, and roadmap docs
└── README.md
```

## Current Status

- The repository has been split into dedicated `backend/` and `frontend/` folders.
- The backend is on a baseline Django setup with API dependencies prepared.
- The frontend contains static pages and modular JavaScript utilities.
- Core API and database design decisions are documented in `docs/`.

## Backend Stack

- Django 6
- Django REST Framework
- SimpleJWT for token-based authentication
- django-cors-headers for cross-origin requests
- django-filter for filtering and ordering
- drf-spectacular for OpenAPI documentation
- PostgreSQL planned for production

## Frontend Stack

- Vanilla JavaScript with ES modules
- Static HTML pages for initial screens
- Modular structure for core logic, services, UI components, utilities, and pages

## Local Development

### Backend

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

Backend default URL: `http://127.0.0.1:8000`

### Frontend

The frontend is currently static. You can open the pages directly or serve the folder with a lightweight static server.

```bash
cd frontend
python -m http.server 5500
```

Frontend default URL: `http://127.0.0.1:5500`

## Environment Variables

Backend configuration is loaded from `backend/.env`.

Recommended values:

```env
SECRET_KEY=your-secret
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7
```

## Documentation

Use these docs as the source of truth for the implementation plan:

- [Project Overview](docs/project_overview.md)
- [System Architecture](docs/architecture.md)
- [REST API Design](docs/api-design.md)
- [Database Design](docs/database_design.md)
- [Backend Apps](docs/backend_apps.md)
- [Setup and Roadmap](docs/setup_and_roadmap.md)

## Backend App Boundaries

The backend is split into four required domain apps:

1. `accounts` - authentication, profiles, and role handling
2. `books` - catalog, search, and inventory
3. `borrowing` - borrow requests, approvals, loans, renewals, and returns
4. `reviews` - review creation and moderation

An optional `common` app can be introduced later if shared code grows.

## Roadmap

1. Complete backend domain models and serializers.
2. Implement JWT auth and account flows.
3. Build books, borrowing, and review API endpoints.
4. Connect frontend pages to the API.
5. Add automated tests and tighten validation.

## Notes

- `uv` is the package and environment manager for the backend.
- The frontend currently relies on static pages, but the architecture is prepared for API-driven rendering.
- The documentation under `docs/` should be updated as implementation progresses.
