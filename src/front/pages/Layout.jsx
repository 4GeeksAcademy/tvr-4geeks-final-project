import { Outlet } from "react-router-dom/dist"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    return (
        <ScrollToTop>
            <div className="d-flex flex-column min-vh-100 w-100">
                <Navbar />
                <main className="flex-grow-1 d-flex flex-column">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </ScrollToTop>
    )
}