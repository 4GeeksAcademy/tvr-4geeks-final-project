
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(!!sessionStorage.getItem("token"));
    checkLogin();
    window.addEventListener("storage", checkLogin);
    window.addEventListener("loginChange", checkLogin);
    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("loginChange", checkLogin);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand fw-bold fs-4 d-flex align-items-center">
          <img
            src=""
            alt="Logo"
            style={{ height: "40px", marginRight: "10px" }}
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-lg-center">
            <li className="nav-item">
              <Link to="/" className="nav-link fw-semibold">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/locations" className="nav-link fw-semibold">
                Locations
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link fw-semibold">
                About Us
              </Link>
            </li>
            <li className="nav-item ms-lg-3">
              {isLoggedIn ? (
                <Link
                  to="/myProfile"
                  className="nav-link fw-semibold"
                >
                  My Profile
                </Link>
              ) : (
                <Link
                  to="/login-register"
                  className="btn btn-primary fw-semibold rounded-pill px-4 shadow-sm"
                >
                  Sign Up
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};