/**
 * @fileoverview Main App Component - Root component that provides global context providers
 * and layout structure for the entire application
 */

import { Outlet } from "react-router-dom"
import { AuthProvide } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

/**
 * App Component
 * 
 * The root component that wraps the entire application with necessary context providers
 * and establishes the main layout structure. It provides:
 * - Authentication context for user management across the app
 * - Theme context for dark/light mode functionality
 * - Consistent navigation header and footer
 * - Outlet for rendering nested routes
 * 
 * @returns {JSX.Element} The main application structure with providers and layout
 */
function App() {
  return (
    <>
      {/* Authentication Provider - Manages user authentication state globally */}
      <AuthProvide>
        {/* Theme Provider - Manages dark/light mode state globally */}
        <ThemeProvider>
          {/* Navigation Bar - Fixed header across all pages */}
          <Navbar />
          
          {/* Main Content Area - Renders child routes with smooth theme transitions */}
          <main className="main-content bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <Outlet />
          </main>
          
          {/* Footer - Fixed footer across all pages */}
          <Footer />
        </ThemeProvider>
      </AuthProvide>
    </>
  )
}

export default App
