/**
 * @fileoverview Main App Component - Root component that provides global context providers
 * and layout structure for the entire application
 */

import { Outlet } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

/**
 * App Component
 * 
 * The root component that wraps the main layout structure and relies on global
 * context providers supplied in main.jsx. It provides:
 * - Consistent navigation header and footer
 * - Outlet for rendering nested routes
 * 
 * @returns {JSX.Element} The main application structure with providers and layout
 */
function App() {
  return (
    <>
      {/* Navigation Bar - Fixed header across all pages */}
      <Navbar />

      {/* Main Content Area - Renders child routes with smooth theme transitions */}
      <main className="main-content bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300 flex justify-center w-full">
        <Outlet />
      </main>

      {/* Footer - Fixed footer across all pages */}
      <Footer />
    </>
  )
}

export default App
