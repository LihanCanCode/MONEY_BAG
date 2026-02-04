import { Outlet } from "react-router-dom"
import { AuthProvide } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

function App() {


  return (
    <>
      <AuthProvide>
        <ThemeProvider>
          <Navbar />
          <main className="main-content bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <Outlet />
          </main>
          <Footer />
        </ThemeProvider>
      </AuthProvide>


    </>
  )
}

export default App
