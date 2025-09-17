import { useState, useEffect } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { fetchPoiImages } from "../apicalls/loginRegisterApicalls";

export default function Login_Register() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [randomImage, setRandomImage] = useState(null);
  const [apiError, setApiError] = useState("");

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

  return (
    <div className="container-fluid vw-100 h-100">
      <div className="row h-100">
        {/* Image column */}
        <div className="col-md-6 d-flex flex-column justify-content-between align-items-center h-100 p-0">
          <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100">
            {randomImage ? (
              <img
                src={randomImage}
                alt="Random image"
                className="w-100 h-100 object-fit-cover"
              />
            ) : (
              <span className="display-6 text-muted">Loading...</span>
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
        <div className="col-md-6 bg-white p-5 h-100 d-flex flex-column justify-content-center">
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
