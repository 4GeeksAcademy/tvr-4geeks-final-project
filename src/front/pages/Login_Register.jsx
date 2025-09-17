import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Login_Register() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    location: "",
    role: "",
  });

  const [randomImage, setRandomImage] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // Regex para validar contraseña: 8+ caracteres, 1 mayúscula, 1 carácter especial
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/poiimages`
        );
        const data = await res.json();

        if (data.images?.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.images.length);
          setRandomImage(data.images[randomIndex].url);
        }
      } catch (err) {
        console.error("❌ Error cargando imágenes:", err);
      }
    };

    fetchImages();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatDateToMMDDYYYY = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${month}/${day}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignIn) {
      // Validación de contraseña
      if (!passwordRegex.test(formData.password)) {
        setPasswordError(
          "La contraseña debe tener mínimo 8 caracteres, al menos 1 mayúscula y 1 carácter especial"
        );
        return;
      }

      // Validación de confirm_password
      if (formData.password !== formData.confirm_password) {
        setPasswordError("Las contraseñas no coinciden");
        return;
      }

      // Si todo bien, limpia el error
      setPasswordError("");
    }

    let url = isSignIn
      ? `${BACKEND_URL}/api/login`
      : `${BACKEND_URL}/api/register`;

    let body = isSignIn
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          name: `${formData.first_name} ${formData.last_name}`,
          user_name: formData.user_name,
          email: formData.email,
          password: formData.password,
          birth_date: formatDateToMMDDYYYY(formData.date_of_birth),
          location: formData.location || null,
          role: formData.role || null,
        };

    console.log("📤 Body que envío:", body);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error("❌ Error de API:", data);
      alert("❌ " + (data.msg || "Error en la solicitud"));
      return;
    }

    if (isSignIn) {
      sessionStorage.setItem("token", data.access_token);
      window.dispatchEvent(new Event("loginChange"));
      navigate("/dashboard");
    } else {
      alert("✅ Registro exitoso, ahora inicia sesión");
      setIsSignIn(true);
    }
  };

  return (
    <div className="container-fluid vh-100 vw-100">
      <div className="row h-100">
        {/* Columna imagen */}
        <div className="col-md-6 bg-light d-flex flex-column justify-content-between align-items-center h-100">
          <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100 border-rounded">
            {randomImage ? (
              <img
                src={randomImage}
                alt="Imagen aleatoria"
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span className="display-6 text-muted">Cargando...</span>
            )}
          </div>
          <div className="d-flex w-100">
            <button
              className={`btn flex-fill ${
                isSignIn ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setIsSignIn(true)}
            >
              SIGN IN
            </button>
            <button
              className={`btn flex-fill ${
                !isSignIn ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setIsSignIn(false)}
            >
              SIGN UP
            </button>
          </div>
        </div>

        {/* Columna formulario */}
        <div className="col-md-6 bg-white p-5 h-100 d-flex flex-column justify-content-center">
          <div className="text-center mb-4">
            <h3>{isSignIn ? "Welcome back!" : "Register Now!"}</h3>
            <p className="text-muted">
              {isSignIn
                ? "Please enter your details"
                : "Register now to start your journey!"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-grow-1">
            {isSignIn ? (
              <>
                {/* LOGIN */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"                    
                    className="form-control"
                    name="password"
                    onChange={handleChange}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit">
                  Enter
                </button>
              </>
            ) : (
              <>
                {/* REGISTER */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${
                      passwordError ? "is-invalid" : ""
                    }`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className={`form-control ${
                      passwordError ? "is-invalid" : ""
                    }`}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Location (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <button className="btn btn-primary w-100" type="submit">
                  Sign Up
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
