# 🎨 Stag.io — Front-end Client Application

This directory contains the interactive presentation layer of **Stag.io** — the Internship Management Platform. It is built as a single-page application (SPA) using React, styled with Tailwind CSS v4, powered by React Router v7, and bundled using Vite.

---

## 🚀 Tech Stack Highlights

- **Vite 8.0**: Advanced bundler providing near-instant hot module replacement (HMR) and highly optimized production builds.
- **React 19.2**: High-performance, component-based user interface rendering.
- **React Router v7**: Declarative routing, supporting protected routes and layout hierarchies.
- **Tailwind CSS v4 + Styled Components**: Rapid, modern, responsive styling with clean CSS-in-JS overrides.
- **Axios**: Promised-based client with custom interceptors to automatically fetch, persist, and inject JWT access tokens.
- **Recharts 3.8**: Analytical interactive graphs and visualizations.
- **Lucide React**: Modern, scalable SVG stroke icons.

---

## 📂 Project Layout

Inside `src/`, code is organized by structural responsibility:

```text
src/
├── api/             # Base configurations and HTTP clients (Axios instance)
├── assets/          # Static elements such as brand icons and illustrations
├── components/      # Shared components (NavBar, Cards, Footer, Loaders)
├── context/         # AuthContext providing login/logout state to the whole app
├── pages/           # Pages grouped by role and routing accessibility
│   ├── admin/       # AdminDashboard.jsx, AdminNotificationsPage.jsx
│   ├── company/     # CompanyDashboard.jsx, CompanyNotificationsPage.jsx, CompanyProfilePage.jsx
│   ├── student/     # StudentDashboard.jsx, ProfilePage.jsx, EditProfilePage.jsx, DigitalCVPage.jsx
│   ├── LandingPage.jsx  # Public landing page with features list
│   ├── LoginPage.jsx    # Role-aware login form
│   ├── RegisterPage.jsx # Multi-step student / company registration wizard
│   └── Unauthorized.jsx # Page shown when access to a route is denied
├── App.jsx          # Route definitions, guards, and layout wrapping
├── main.jsx         # App mounting and CSS imports
└── index.css        # Main stylesheet, tailwind directives, and root theme variables
```

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have [Node.js (v18 or higher)](https://nodejs.org/) installed.

### 1. Install Dependencies
Navigate to this directory and install the package requirements:
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
The application will boot on **http://localhost:5173**. 
It will automatically try to query the backend API services at **http://localhost:8000/api/**.

### 3. Production Build
Create an optimized production-ready bundle of the static assets:
```bash
npm run build
```
The output files will be compiled into the `dist/` directory, ready to be served by any static host or web server.

### 4. Running Code Quality Tools
```bash
# Run ESLint validation
npm run lint
```

---

## 🔒 Authentication & Route Security

The application routes are structured with nested validation layers inside [App.jsx](file:///c:/Users/DELL/Desktop/PROJECT_LSN/PROJECT_LSN/Front-end/src/App.jsx):
1. **Public Routes**: Accessible by anyone (e.g., `/`, `/login`, `/register`).
2. **Private Routes**: Require a valid JWT token (`AuthContext`).
3. **Role-Based Guards**: Restrict pages to specific users (`student`, `company`, or `admin`). Trying to access forbidden areas redirect the user to `/unauthorized`.
