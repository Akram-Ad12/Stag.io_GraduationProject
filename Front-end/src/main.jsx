// src/main.jsx
// ⚠️ DON'T TOUCH THIS FILE — Vite creates it automatically
// It just mounts your React app into the HTML page

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('Mounting App...');
console.log('Initializing application root...');
createRoot(document.getElementById('root')).render(
  <App />
)
