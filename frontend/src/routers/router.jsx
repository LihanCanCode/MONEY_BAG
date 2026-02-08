import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import EnhancedDashboard from "../pages/EnhancedDashboard";
import Transactions from "../pages/Transactions";


const router = createBrowserRouter([
    {
        // Home page renders standalone without App layout (has its own navbar)
        path: "/",
        element: <Home />
    },
    {
        // All other pages use the App layout with Navbar and Footer
        path: "/",
        element: <App />,
        children: [
            {
                path: "login",
                element: <Login />
            },
            {
                path: "register",
                element: <Register />
            },
            {
                path: "dashboard",
                element: <EnhancedDashboard />
            }
        ]
    },
]);


export default router;