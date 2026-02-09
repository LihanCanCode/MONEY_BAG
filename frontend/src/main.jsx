/**
 * @fileoverview Application Entry Point
 * 
 * This is the main entry file for the React application. It sets up the root rendering,
 * configures React Router for client-side routing, and enables React's StrictMode for
 * development checks and warnings.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import router from './routers/router.jsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvide } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

/**
 * Initialize and render the React application
 * 
 * - StrictMode: Activates additional checks and warnings for development
 * - RouterProvider: Provides routing functionality to the entire application
 * - Renders into the 'root' div element in index.html
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvide>
      {/* Global theme provider ensures consistent dark/light state */}
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvide>
  </StrictMode>
)
