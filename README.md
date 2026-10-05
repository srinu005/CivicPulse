# CivicPulse

A full-stack civic-tech platform for reporting and resolving local pollution issues.
Citizens report problems with a photo and exact location; verified government officers
(MDOs, MROs, and other designated authorities) manage and resolve them through a
dedicated dashboard. Every report and every status change is public record.

**Live demo:** https://civicpulse100.netlify.app/
**API:** https://civicpulse-backend-6wo2.onrender.com/

> The backend runs on a free hosting tier and sleeps after 15 minutes of inactivity.
> The first request after a gap can take 30-60 seconds to wake it up -- that's expected,
> not a bug.

---

## Features

- **Citizen reporting** -- submit a pollution report with category, severity,
  description, an optional photo, and a location pinned on a map
- **Public transparency** -- every report is visible on a live map and list, with no
  login required to browse
- **Community validation** -- logged-in users can upvote reports they also see
- **Role-restricted officer access** -- officer accounts can *only* be created by a
  Super Admin; there is no public officer sign-up, anywhere
- **Full audit trail** -- every status change (`pending -> in_progress -> resolved` /
  `rejected`) is permanently logged with who made it, when, and why
- **Officer dashboard** -- stat cards, category/resolution-trend charts, and a
  filterable report table with inline status updates
- **Email notifications** -- citizens are notified when their report's status changes
- **Officer provisioning UI** -- Super Admins create and manage officer accounts
  directly in the app, not through Django admin

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Leaflet (maps), Recharts (dashboard charts) |
| Backend | Django, Django REST Framework, SimpleJWT (auth) |
| Database | PostgreSQL ([Neon](https://neon.tech), free tier) |
| Testing | Django's test framework (backend), Vitest + React Testing Library (frontend) |
| Hosting | [Render](https://render.com) (backend, free tier), [Netlify](https://netlify.com) (frontend, free tier) |
| Infra | Docker Compose (local development) |

## Architecture

```
React SPA  --HTTPS-->  Django REST API  --SQL-->  PostgreSQL (Neon)
(Netlify)                (Render)
```

The frontend never talks to the database directly -- every read or write passes
through the Django REST API, which validates input, enforces role-based permissions
(citizen / officer / Super Admin), and is the only component with database credentials.

### Access control, in one sentence

Whether a user is an **officer** is determined entirely by whether an `OfficerProfile`
row exists for them -- there's no `role` field to spoof, and the only way that row gets
created is through a Super-Admin-only endpoint.

## Project structure

```
civicpulse/
├── render.yaml              # Render Blueprint (backend deploy config)
├── docker-compose.yml        # Local dev: Postgres + Django together
├── backend/
│   ├── core/                 # Django project settings, URL routing
│   ├── accounts/              # Auth, roles, officer provisioning
│   └── reports/                # Report model, API, email notifications
└── frontend/
    └── src/
        ├── api/client.js       # All backend calls, centralized
        ├── pages/                # One file per route
        ├── components/            # Shared UI (nav bar)
        └── theme.js                 # Shared design tokens (color, type)
```

## Running it locally

**Requirements:** Docker, Node.js 18+

```bash
# 1. Database + backend
docker compose up -d db
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Running the tests

```bash
# Backend -- 33 tests (auth, roles, report lifecycle, permissions, email)
cd backend
python manage.py test accounts reports

# Frontend -- 12 tests (API client, role-based UI rendering)
cd frontend
npm test

# Backend coverage report
pip install coverage
coverage run --source='accounts,reports' manage.py test accounts reports
coverage report -m
```

## Deployment

See [`render.yaml`](./render.yaml) for the backend Blueprint. The frontend deploys to
Netlify from the `frontend/` directory (`npm run build`, publish `frontend/dist`).
Full write-up of the deployment process, including the free-tier gotchas (no Shell
access, 30-day database expiry on Render's own Postgres, which is why this project
uses Neon instead), is in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## License

MIT -- free to use, modify, and learn from.

