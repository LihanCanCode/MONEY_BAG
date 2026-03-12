/**
 * @fileoverview Application Router Configuration
 *
 * Defines all client-side routes using React Router v6's createBrowserRouter.
 * The routing structure is organized into two groups:
 *
 *  1. **Standalone pages** — Rendered WITHOUT the shared App layout (Navbar/Footer).
 *     Currently only the Home (landing) page uses its own built-in navigation.
 *
 *  2. **App-wrapped pages** — Rendered INSIDE the App layout component which provides
 *     the persistent Navbar, Footer, and global toast notifications.
 *     Includes Login, Register, and the EnhancedDashboard (main user area).
 *
 * @module routers/router
 */

// ── React Router ─────────────────────────────────────────────────────────────
import { createBrowserRouter } from "react-router-dom";

// ── Layout Component ─────────────────────────────────────────────────────────
import App from "../App";

// ── Page Components ──────────────────────────────────────────────────────────
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import EnhancedDashboard from "../pages/EnhancedDashboard";
import Transactions from "../pages/Transactions";

/**
 * Application route definitions
 *
 * Routes are matched top-down. The first "/" route renders the Home page
 * standalone. The second "/" route group uses the App layout wrapper and
 * defines nested child routes for authentication and dashboard pages.
 */
const router = createBrowserRouter([
    {
        // Home / Landing page — renders standalone without the App layout
        // (it has its own built-in navbar and hero section)
        path: "/",
        element: <Home />
    },
    {
        // All authenticated pages share the App layout (Navbar + Footer)
        path: "/",
        element: <App />,
        children: [
            {
                // Login page — email/password and Google OAuth sign-in
                path: "login",
                element: <Login />
            },
            {
                // Registration page — new account creation
                path: "register",
                element: <Register />
            },
            {
                // Enhanced Dashboard — tabbed shell containing all financial modules
                path: "dashboard",
                element: <EnhancedDashboard />
            }
        ]
    },
]);

/* Export the router instance for use in main.jsx's RouterProvider */
export default router;