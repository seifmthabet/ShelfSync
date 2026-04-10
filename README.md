# ShelfSync

ShelfSync is an online library platform with a separated architecture:

- Frontend: standalone web client in `frontend/`
- Backend: Django service in `backend/`, moving to REST API-first design

## Project Structure

```text
ShelfSync/
├── backend/      # Django backend service
├── frontend/     # UI pages and static assets
├── docs/         # Architecture, API, data model, and roadmap docs
└── README.md
```

## Current Status

- Repository has been split into `frontend/` and `backend/` folders.
- Backend is currently a baseline Django setup.
- Frontend currently contains static pages and assets.
- REST API design is documented and ready for implementation.

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
uv sync
python manage.py migrate
python manage.py runserver
```

Backend default URL: `http://127.0.0.1:8000`

### Frontend

Current frontend is static HTML/CSS/JS. Open pages directly or serve them with any static server.

Example:

```bash
cd frontend
python -m http.server 5500
```

Frontend default URL (example): `http://127.0.0.1:5500`

## Documentation Index

- `docs/project_overview.md`: Product scope and screen catalog
- `docs/architecture.md`: System architecture and deployment boundaries
- `docs/api-design.md`: REST API conventions and endpoints
- `docs/database_design.md`: Core entities and relational model
- `docs/setup_and_roadmap.md`: Implementation order and missing work

## Next Milestone

Implement API modules in backend:

1. Auth and users
2. Books catalog
3. Borrow flow
4. Reviews and moderation

Then connect frontend pages to API endpoints and remove static-only data paths.
