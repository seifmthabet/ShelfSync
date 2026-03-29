# System Architecture

## High-Level Design

ShelfSync is structured as two independent layers:

1. Frontend application in `frontend/`
2. Backend API service in `backend/`

The frontend communicates with the backend through HTTP JSON endpoints only.

```text
Client (frontend)
    |
    | HTTPS (JSON)
    v
REST API (Django + DRF)
    |
    v
SQLite
```

## Architecture Goals

- Clean separation between UI and business logic
- API versioning for safe evolution
- Stateless auth with JWT
- Role-based access for reader/admin features
- Scalable deployment with independent frontend/backend releases

## Backend Responsibilities

Suggested app boundaries:

- `apps/accounts`: registration, login, profile, role checks
- `apps/books`: catalog, search, inventory
- `apps/borrowing`: requests, approvals, active loans, renewals, returns
- `apps/reviews`: create/review/moderate ratings and comments
- `apps/common`: shared utilities, base models, constants

## Frontend Responsibilities

- Route-based navigation for all pages
- API client abstraction (auth header, token refresh, retries)
- State management (session/profile/catalog)
- Form validation and client UX feedback

## Request Lifecycle

1. User performs an action on a page.
2. Frontend sends request to `/api/v1/...`.
3. Backend authenticates and authorizes request.
4. Backend applies business rules and persists data.
5. Backend returns normalized JSON response.
6. Frontend renders result and updates UI state.

## Security and Cross-Origin

- JWT access + refresh tokens
- Role-based permission classes in API views
- CORS allowlist for frontend origin
- Rate limiting for auth-sensitive endpoints
- Input validation at serializer layer

## Deployment Model

- Frontend: static hosting or SPA hosting
- Backend: app server behind reverse proxy
- Database: managed PostgreSQL instance
- Media/static (if needed): object storage + CDN

## Current Repository Status

- Frontend and backend directories already exist.
- Backend code is currently a baseline Django project and still needs DRF modules and domain apps.
- API contracts are defined in the documentation and should drive implementation.