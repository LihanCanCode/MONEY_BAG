import { Outlet } from "react-router-dom"
import { AuthProvide } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

function App() {
 

  return (
    <>
    <AuthProvide>
     <Navbar/>
     <main className="main-content">
       <Outlet/>
     </main>
     <Footer/>
    </AuthProvide>

   
    </>
  )
}

export default App
