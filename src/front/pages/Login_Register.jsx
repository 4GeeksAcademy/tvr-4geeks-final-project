import { useState, useEffect } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { fetchPoiImages } from "../apicalls/loginRegisterApicalls";

export default function Login_Register() {
  const [isSignIn, setIsSignIn] = useState(true);
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

  useEffect(() => {
    if (randomImage) return;
    const interval = setInterval(() => {
      setLoadingDots(prev => (prev === 3 ? 1 : prev + 1));
    }, 350);
    return () => clearInterval(interval);
  }, [randomImage]);

  return (
    <div className="container-fluid vw-100 flex-grow-1 d-flex flex-column">
      <div className="row flex-grow-1 h-100 w-100">
        {/* Image column */}
        <div className="d-flex flex-column w-50 justify-content-between align-items-center p-0">
          <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100">
            {randomImage ? (
              <img
                src={randomImage}
                alt="Random image"
                className="w-100 h-100 object-fit-cover"
              />
            ) : (
              <span className="display-6 text-muted p-5">{`Loading${'.'.repeat(loadingDots)}`}</span>
            )}
          </div>
          <div className="d-flex w-100 ">
            <button
              className={`flex-fill fw-bold py-2 ${isSignIn ? "bg-primary text-white" : "bg-white text-primary"}`}
              style={{ border: "none", borderRadius: 0, outline: "none" }}
              onClick={() => setIsSignIn(true)}
            >
              Log in
            </button>
            <button
              className={`flex-fill fw-bold py-2 ${!isSignIn ? "bg-primary text-white" : "bg-white text-primary"}`}
              style={{ border: "none", borderRadius: 0, outline: "none" }}
              onClick={() => setIsSignIn(false)}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form column */}
        <div className="w-50 bg-white p-5 h-100 d-flex flex-column justify-content-center">
          <div className="text-center mb-4">
            <h3>{isSignIn ? "Welcome back!" : "Register Now!"}</h3>
            <p className="text-muted">
              {isSignIn
                ? "Please enter your details"
                : "Register now to start your journey!"}
            </p>
            {apiError && (
              <div className="alert alert-danger py-2 px-3 mt-3" role="alert">
                {apiError}
              </div>
            )}
          </div>

          {isSignIn ? (
            <LoginForm setApiError={setApiError} />
          ) : (
            <RegisterForm setApiError={setApiError} setIsSignIn={setIsSignIn} />
          )}
        </div>
      </div>
    </div>
  );
}
