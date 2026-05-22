// src/components/ProtectedRoute.jsx
// This component PROTECTS pages from non-logged-in users.
//
// How it works:
//   1. App is loading → show loading screen
//   2. User is NOT logged in → redirect to /login
//   3. User IS logged in → show the page
//
// Usage in App.jsx:
//   <ProtectedRoute>
//     <StudentDashboard />
//   </ProtectedRoute>
//
// ⚠️ IMPORTANT FOR TESTING:
// While backend is not running, comment out lines marked with "// UNCOMMENT LATER"
// and uncomment the line marked "// TESTING ONLY"
// Don't forget to put it back when backend is ready!

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, isLoggedIn } = useAuth();

  // Show loading while checking auth on app start
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0e0818",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(200,160,255,0.4)",
        fontFamily: "DM Sans, sans-serif",
        fontSize: "14px",
        letterSpacing: "0.1em",
      }}>
        Loading...
      </div>
    );
  }

  // UNCOMMENT LATER (when backend is running):
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // TESTING ONLY — comment out the line above and uncomment this
  // to bypass login and see dashboards directly:
  // (nothing — just fall through to return children)

  return children;
}
