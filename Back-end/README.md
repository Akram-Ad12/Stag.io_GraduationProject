# ⚙️ Stag.io — Back-end REST API Engine

This directory contains the robust business logic, authentication framework, data modeling, and RESTful API layer for **Stag.io** — the Internship Management Platform. It is built using Django and Django REST Framework, with PostgreSQL as the relational database, running completely containerized in Docker.

---

## 🚀 Tech Stack Highlights

- **Django 3.2**: A high-level Python web framework that encourages rapid development and clean, pragmatic design.
- **Django REST Framework 3.12**: A powerful and flexible toolkit for building Web APIs.
- **Simple JWT**: A JSON Web Token authentication plugin for the Django REST Framework.
- **PostgreSQL 13**: Relational database engine suited for transactions, indices, and complex queries.
- **Docker & Docker Compose**: Keeps environment variables, dependencies, and services consistent across local development and production.
- **drf-spectacular**: OpenAPI 3 schema generator with interactive UI documentation (Swagger UI).
- **Flake8**: Strict pep8 coding conventions validator.

---

## 📂 Project Structure

Inside `stag_io/`, code is divided into modular Django applications, each representing a core feature domain of the platform:

```text
Back-end/
├── Docker-compose.yaml   # Defines PostgreSQL & Django services, networks, and volumes
├── Dockerfile            # Container configuration recipe based on Python-alpine
├── requirements.txt      # Main Python dependencies
├── requirements.dev.txt  # Development dependencies (such as linting tools)
└── stag_io/              # Root Django project
    ├── manage.py         # Django management utility
    ├── core/             # Base custom User model, migrations, and wait_for_db custom command
    ├── user/             # Account registration, JWT endpoints, and general user settings
    ├── student/          # Student-specific profiles, wilayas, and digital CV details
    ├── company/          # Company profile, branding, logo uploads, and business details
    ├── administration/   # Admin dashboards, system statistics, and user control features
    └── stag_io/          # Main settings, routing, WSGI, and ASGI configs
```

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have [Docker and Docker Compose](https://www.docker.com/) installed on your machine.

### 1. Build and Run the Containers
To boot up the PostgreSQL database and the Django REST API server in development mode:
```bash
docker-compose up --build
```
This command will:
1. Fetch and compile the database and server environments.
2. Wait for the PostgreSQL port to become ready.
3. Automatically execute all database migrations.
4. Launch the local development server at **http://localhost:8000**.

### 2. Access the Interactive API Docs
When the container is running, the interactive Swagger documentation is hosted at:
🔗 **[http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)**

You can use the Swagger UI to try out endpoints directly, authorize with JWT, and explore schemas.

---

## 🧪 Common Management Commands

Run these commands in your shell from the `Back-end` folder while the containers are built:

### Create an Admin Superuser
```bash
docker-compose run --rm stag_io sh -c "python manage.py createsuperuser"
```

### Run Python Unit & Integration Tests
```bash
docker-compose run --rm stag_io sh -c "python manage.py test"
```

### Run Flake8 Code Style Linter
```bash
docker-compose run --rm stag_io sh -c "flake8"
```

### Create New Database Migrations (after modifying models)
```bash
docker-compose run --rm stag_io sh -c "python manage.py makemigrations"
```

---

## 📊 Core Data Models

- **User**: The base authentication model using emails instead of usernames. Fields include `email`, `is_active`, `is_staff`, and role-types:
  - `is_student`
  - `is_company`
  - `is_admin`
- **Student**: Tied one-to-one with a student user. Fields: `full_name`, `wilaya`, `github_link`, `portfolio_link`, `profile_image`.
- **Company**: Tied one-to-one with a company user. Fields: `name`, `description`, `wilaya`, `website`, `logo`.
- **Admin**: Tied one-to-one with an administrator. Fields: `department`, `title`.
