import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // convierte YYYY-MM-DD → MM/DD/YYYY
  const formatDateToMMDDYYYY = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${month}/${day}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let url = isSignIn
      ? "https://psychic-space-fiesta-r4wxqj65x57jcwjxq-3001.app.github.dev/api/login"
      : "https://psychic-space-fiesta-r4wxqj65x57jcwjxq-3001.app.github.dev/api/register";

    let body = isSignIn
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          name: `${formData.first_name} ${formData.last_name}`, // nombre completo
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
      sessionStorage.setItem("token", data.token);
      alert("✅ Login exitoso");
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
        <div className="col-md-6 bg-light d-flex flex-column justify-content-between align-items-center p-3 h-100">
          <div className="flex-grow-1 d-flex justify-content-center align-items-center w-100">
            <span className="display-6 text-muted">&lt;IMG&gt;</span>
          </div>
          <div className="d-flex w-100">
            <button
              className={`btn flex-fill ${isSignIn ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setIsSignIn(true)}
            >
              SIGN IN
            </button>
            <button
              className={`btn flex-fill ${!isSignIn ? "btn-primary" : "btn-outline-primary"}`}
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
              {isSignIn ? "Please enter your details" : "Register now to start your journey!"}
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
                    // value={formData.email}
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
                    // value={formData.password}
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
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
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

                <div className="mb-3">
                  <label className="form-label">Role (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="role"
                    value={formData.role}
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
