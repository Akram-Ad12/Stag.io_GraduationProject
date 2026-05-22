# Stag.io

Stag.io is an internship management platform that connects three main actors:
- **Students** who apply for and follow internship progress
- **Companies** that review and accept internship requests
- **University Administration** that validates, tracks, and supervises internships

Built for the L3TI Workshop 2025-2026.

---

## Repository Introduction

This repository is organized by application layer to keep responsibilities clear between API/business logic and client interface.

### Back-end Folder (`Back-end/`)

The back-end contains the Django REST API and business logic of the platform:
- Authentication and role-based access (student/company/admin)
- Internship workflow management (pending, accepted, validated, rejected)
- Administration features (notifications, statistics, agreement handling)
- PostgreSQL integration, Docker setup, and automated migrations

In short, the `Back-end/` folder is the **core engine** of Stag.io.

### Front-end Folder (`Front-end/`)

The front-end is intended to contain the user interface of the platform:
- Student dashboard and profile pages
- Company dashboard and internship actions
- Administration dashboard (monitoring, analytics, notifications)
- API integration with the back-end services

In short, the `Front-end/` folder is the **presentation layer** of Stag.io.

---

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Backend   | Django 3.2 + Django REST Framework 3.12         |
| Frontend  | React, Vite, Tailwind CSS                       |
| Auth      | Simple JWT (access 30 min / refresh 7 days)     |
| Database  | PostgreSQL 13                                   |
| Docs      | drf-spectacular (Swagger UI)                    |
| Container | Docker & Docker Compose                         |
| Linting   | Flake8, ESLint                                  |

---

## Data Models

- **User** — base model (email login, roles: `student` / `company` / `admin`)
- **Student** — full_name, wilaya, github_link, portfolio_link, profile_image
- **Company** — name, description, wilaya, website, logo
- **Admin** — department, title

---

## API Endpoints

Base path: `/api/user/`

| Method | Endpoint                    | Description                     | Auth     |
| ------ | --------------------------- | ------------------------------- | -------- |
| POST   | `register/student/`         | Register a student              | None     |
| POST   | `register/company/`         | Register a company              | None     |
| POST   | `token/`                    | Obtain JWT access/refresh pair  | None     |
| POST   | `token/refresh/`            | Refresh an access token         | None     |
| GET    | `me/`                       | Get current user info           | JWT      |
| PATCH  | `me/`                       | Update current user             | JWT      |
| GET    | `me/student/`               | Get student profile             | JWT      |
| PATCH  | `me/student/`               | Update student profile          | JWT      |
| GET    | `me/company/`               | Get company profile             | JWT      |
| PATCH  | `me/company/`               | Update company profile          | JWT      |
| PATCH  | `me/upload-logo/`           | Upload company logo             | JWT      |
| PATCH  | `me/upload-profile-image/`  | Upload student profile image    | JWT      |
| DELETE | `<id>/delete/`              | Delete any user (admin only)    | JWT      |

Swagger docs available at `/api/docs/`.

---

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Run

**1. Back-end**
```bash
git clone https://github.com/abderrahmannemmour-code/PROJECT_LSN.git
cd PROJECT_LSN/Back-end
docker-compose up --build
```

The API server starts at **http://localhost:8000**.  
Migrations run automatically on startup.

**2. Front-end**
```bash
cd ../Front-end
npm install
npm run dev
```

The frontend client typically starts at **http://localhost:5173**.

### Useful Commands

```bash
# Create superuser
docker-compose run --rm stag_io sh -c "python manage.py createsuperuser"

# Run tests
docker-compose run --rm stag_io sh -c "python manage.py test"

# Lint
docker-compose run --rm stag_io sh -c "flake8"
```

### Environment Variables (docker-compose.yaml)

| Variable  | Value    |
| --------- | -------- |
| DB_HOST   | db       |
| DB_NAME   | devdb    |
| DB_USER   | devuser  |
| DB_PASS   | changeme |

---

## Project Structure

```
Back-end/
├── Docker-compose.yaml
├── Dockerfile
├── requirements.txt
└── stag_io/
    ├── manage.py
    ├── core/           # Custom user models, wait_for_db command
    ├── user/           # Registration, auth, profile API
    └── stag_io/        # Django settings & URL config

Front-end/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── api/            # API integration endpoints
    ├── components/     # Reusable React components
    ├── pages/          # View components organized by role
    └── context/        # React context (e.g., AuthContext)
```
