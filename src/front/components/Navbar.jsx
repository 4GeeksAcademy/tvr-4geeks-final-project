import { NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logoNav from "../assets/img/logo-nav.png";
export const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleNavItemClick = () => {
    try {
      const navbarCollapse = document.getElementById('navbarNav');
      const toggler = document.getElementById('navbarToggler');
      if (navbarCollapse && toggler && navbarCollapse.classList.contains('show')) {
        toggler.click();
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkLogin();

    window.addEventListener("storage", checkLogin);
    window.addEventListener("loginChange", checkLogin);


    const handleBeforeUnload = () => {
      localStorage.setItem("isReloading", "true");
    };


    const handleLoad = () => {
      const reloading = localStorage.getItem("isReloading");
      if (reloading) {

        localStorage.removeItem("isReloading");
      } else {

        localStorage.removeItem("token");
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("loginChange", checkLogin);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
      <div className="container">
        {/* Logo */}
        <NavLink to="/" className="navbar-brand fw-bold fs-4 d-flex align-items-center">
          <img
            src={logoNav}
            alt="Logo"
            style={{ height: "80px", marginRight: "10px" }}
          />
        </NavLink>

        <button
          className="navbar-toggler"
          id="navbarToggler"
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
              <NavLink to="/" onClick={handleNavItemClick} className={({ isActive }) => "nav-link fw-semibold" + (isActive ? " active-nav" : "")}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/locations" onClick={handleNavItemClick} className={({ isActive }) => "nav-link fw-semibold" + (isActive ? " active-nav" : "")}>
                Locations
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" onClick={handleNavItemClick} className={({ isActive }) => "nav-link fw-semibold" + (isActive ? " active-nav" : "")}>
                About Us
              </NavLink>
            </li>
            <li className="nav-item ms-lg-3">
              {isLoggedIn ? (
                <NavLink to="/myProfile" onClick={handleNavItemClick} className={({ isActive }) => "nav-link fw-semibold" + (isActive ? " active-nav" : "")}>
                  My Profile
                </NavLink>
              ) : (
                <NavLink
                  to="/login-register"
                  onClick={handleNavItemClick}
                  className={({ isActive }) => "btn fw-semibold rounded-pill px-4 shadow-sm" + (isActive ? " active-nav-btn" : "")}
                  style={{ backgroundColor: '#006d77', color: '#ffffff', border: 'none' }}
                >
                  Log In
                </NavLink>
              )}
            </li>
          </ul>
        </div>
      </div>
      <style>{`
        .navbar { position: relative; transition: box-shadow 0.2s ease; }
        /* subtle decorative thin line at the bottom of the navbar */
        .navbar::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          background: rgba(0,109,119,0.06);
        }
        .navbar .nav-link {
          color: #006d77 !important;
          transition: transform 0.15s, opacity 0.15s;
        }
        /* active indicator: subtle rounded rectangle with gentle relief */
        .navbar .active-nav {
          background: rgba(0,109,119,0.06);
          border-radius: 8px;
          padding: 6px 10px;
          box-shadow: 0 1px 2px rgba(2,48,49,0.05) inset, 0 2px 6px rgba(2,48,49,0.03);
          color: #006d77 !important;
        }
        /* make btn have the same hover lift as nav links */
        .navbar .btn {
          transition: transform 0.15s, opacity 0.15s;
        }
        .navbar .btn:hover { transform: translateY(-3px); opacity: 1 !important; }
        /* active state for sign up when on that page */
        .navbar .active-nav-btn {
          box-shadow: 0 2px 8px rgba(0,109,119,0.12);
          transform: translateY(-2px);
        }
        /* keep link font-size as defined by Bootstrap but apply slight lift on hover */
        .navbar .nav-link:hover {
          transform: translateY(-3px);
          opacity: 1 !important;
          text-decoration: none;
        }
        /* for small screens center the items visually */
        @media (max-width: 767px) {
          .navbar .container { padding-left: 1rem; padding-right: 1rem; }
        }
      `}</style>
    </nav>
  );
};
