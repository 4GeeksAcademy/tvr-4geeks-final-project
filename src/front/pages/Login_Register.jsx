import { useState, useEffect } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { fetchPoiImages } from "../apicalls/loginRegisterApicalls";

export default function Login_Register() {
  const [isSignIn, setIsSignIn] = useState(true);
  // If URL contains ?tab=register default to register view
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'register') setIsSignIn(false);
    } catch (e) {
      // ignore
    }
  }, []);
  const [randomImage, setRandomImage] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loadingDots, setLoadingDots] = useState(3);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const { ok, data } = await fetchPoiImages();
        if (ok && data.images?.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.images.length);
          setRandomImage(data.images[randomIndex].url);
        }
      } catch (err) {
        console.error("❌ Error loading images:", err);
      }
    };
    loadImages();
  }, []);

  // Prevent horizontal scroll while on this page (fix for wide image/layout)
  useEffect(() => {
    const prev = document.body.style.overflowX;
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = prev; };
  }, []);

  useEffect(() => {
    if (randomImage) return;
    const interval = setInterval(() => {
      setLoadingDots(prev => (prev === 3 ? 1 : prev + 1));
    }, 350);
    return () => clearInterval(interval);
  }, [randomImage]);

  return (
    <div className="container-fluid vw-100 flex-grow-1 d-flex flex-column p-0" style={{ overflowX: 'hidden' }}>
      <div className="row g-0 flex-grow-1 h-100 w-100">
        {/* Image column */}
        <div className="col-12 col-md-6 d-flex flex-column justify-content-between align-items-center p-0" style={{ maxWidth: "100%", minWidth: 0 }}>
          <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100">
            {randomImage ? (
              <img
                src={randomImage}
                alt="Random image"
                className="w-100 h-100 object-fit-cover"
                style={{ maxHeight: "81.1vh", minHeight: "325px" }}
              />
            ) : (
              <span className="display-6 text-muted p-5">{`Loading${'.'.repeat(loadingDots)}`}</span>
            )}
          </div>
          {/* navigation buttons removed; image now fills the column */}
        </div>

        {/* Form column */}
        <div className="col-12 col-md-6 bg-white p-5 d-flex flex-column justify-content-center align-items-center">
          <style>{`
        /* form toggle link styling (color + weight kept; layout handled by utilities) */
        .form-toggle-link {
          color: #006d77; /* slightly darker for readability */
          font-weight: 600;
          text-decoration: none;
          background: transparent;
        }
        .form-toggle-link:hover {
          color: #004f54; /* darker on hover */
          text-decoration: underline;
        }
        /* primary action buttons in this view use the provided palette color */
        .bg-white .btn-primary {
          background-color: #3dcabcb0;
          border-color: #83c5be;
          color: #023232; /* dark text for contrast */
        }
        .bg-white .btn-primary:hover {
          background-color: #006d77; /* accent on hover */
          border-color: #006d77;
          color: #ffffff;
        }
        .bg-white .btn-primary:active,
        .bg-white .btn-primary:focus {
          box-shadow: 0 6px 20px rgba(131,197,190,0.14);
        }
      `}</style>
          <div className="text-center justify-items-center align-items-center mb-2">
            <h3>{isSignIn ? "Welcome!" : "Register Now!"}</h3>
            <p className="text-muted">
              {isSignIn
                ? "Please enter your details"
                : "Register now to start your journey!"}
            </p>
            {apiError && (
              <div className="alert alert-danger py-2 px-3 mt-3 mx-auto text-center" style={{ maxWidth: "300px" }} role="alert">
                {apiError || "Error with request, please try again."}
              </div>
            )}
          </div>

          {isSignIn ? (
            <>
              <LoginForm setApiError={setApiError} />
              <div className="text-center mt-3">
                <small className="text-muted">Don't have an account? <button className="btn btn-link form-toggle-link align-baseline p-0" onClick={() => { setIsSignIn(false); setApiError(""); window.history.replaceState({}, '', '/login-register?tab=register'); }}>Register</button></small>
              </div>
            </>
          ) : (
            <>
              <RegisterForm setApiError={setApiError} setIsSignIn={setIsSignIn} />
              <div className="text-center mt-3">
                <small className="text-muted">Already have an account? <button className="btn btn-link form-toggle-link align-baseline p-0" onClick={() => { setIsSignIn(true); setApiError(""); window.history.replaceState({}, '', '/login-register'); }}>Log in</button></small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}