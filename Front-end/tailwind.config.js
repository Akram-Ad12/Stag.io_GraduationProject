/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-container": "#E0E7FF",
        "on-primary-container": "#312E81",
        secondary: "#9333EA",
        "secondary-container": "#F3E8FF",
        "on-secondary-fixed-variant": "#581C87",
        "secondary-fixed": "#F3E8FF",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "outline-variant": "#E2E8F0",
        "surface-container-low": "#F1F5F9",
        "surface-container-high": "#E2E8F0",
        "surface-container-highest": "#CBD5E1",
        "surface-container-lowest": "#FFFFFF",
      }
    },
  },
  plugins: [],
}
