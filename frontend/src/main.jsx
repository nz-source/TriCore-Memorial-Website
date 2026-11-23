import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import './styles.css'

// Get the root HTML element
const rootElement = document.getElementById('root')

// Check if the root element exists
if (!rootElement) {
  throw new Error('Root element not found. Check your index.html file.')
}

// Render the React application
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
