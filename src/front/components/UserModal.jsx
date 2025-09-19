import React, { useState, useEffect } from "react";
import { updateMyProfile } from "../apicalls/profileApicalls";

const UserModal = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    user_name: user?.user_name || "",
    password: "",
    location: user?.location || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ email: "", user_name: "", password: "", location: "" });

  useEffect(() => {
    // Actualiza el formData si cambia el user prop
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      user_name: user?.user_name || "",
      password: "",
      location: user?.location || "",
    });
    setErrors({ email: "", user_name: "", password: "", location: "" });
    setError("");
  }, [user]);

  // Reset al cerrar el modal
  const handleReset = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      user_name: user?.user_name || "",
      password: "",
      location: user?.location || "",
    });
    setErrors({ email: "", user_name: "", password: "", location: "" });
    setError("");
  };

  useEffect(() => {
    const modalEl = document.getElementById("userModal");
    if (!modalEl) return;
    const onHidden = () => handleReset();
    modalEl.addEventListener("hidden.bs.modal", onHidden);
    return () => modalEl.removeEventListener("hidden.bs.modal", onHidden);
  }, [user]);

  // Validators
  // Match RegisterForm rules exactly
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const validateEmail = (v, required = false) => {
    const value = (v || "").trim();
    if (!value) return required ? "Email is required." : "";
    if (!emailRegex.test(value) || value.length > 30) return "Please enter a valid email (max. 30 characters).";
    return "";
  };

  const usernameRegex = /^[A-Za-z0-9_]{4,16}$/;
  const validateUsername = (v) => {
    const value = (v || "").trim();
    if (!value) return ""; // optional unless changed on save
    if (!usernameRegex.test(value)) return "Username must be 4-16 characters, only letters, numbers and underscore.";
    return "";
  };

  const validatePassword = (v) => {
    const value = v || "";
    if (!value) return ""; // optional
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(value)) return "Password must be at least 8 characters long, contain at least 1 uppercase letter and 1 special character.";
    if (value.length < 8 || value.length > 16) return "Password must be between 8 and 16 characters.";
    return "";
  };

  const validateLocation = (v, required = false) => {
    const value = (v || "").trim();
    if (!value) return required ? "Location is required." : "";
    if (value.length > 30) return "Location must be max 30 characters.";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Inline validation (non-blocking): only validate if field has content or differs from original
    let msg = "";
    if (name === "email") msg = validateEmail(value, false);
    if (name === "user_name") {
      const trimmed = (value || "").trim();
      // Si el usuario borra el username (cambio a vacío), marcamos error inmediato
      if (trimmed === "" && trimmed !== (user?.user_name || "")) {
        msg = "Username is required.";
      } else {
        msg = validateUsername(value);
      }
    }
    if (name === "password") msg = validatePassword(value);
    if (name === "location") {
      const trimmed = (value || "").trim();
      // No permitir enviar location vacía si fue modificada a vacío
      if (trimmed === "" && trimmed !== (user?.location || "")) {
        msg = "Location cannot be empty.";
      } else {
        msg = validateLocation(value, false);
      }
    }
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You need to log in again.");
      setLoading(false);
      return;
    }

    // Determinar cambios
    const emailTrim = (formData.email || "").trim();
    const usernameTrim = (formData.user_name || "").trim();
    const locationTrim = (formData.location || "").trim();
    const passwordVal = formData.password || "";

    const changedEmail = emailTrim !== (user?.email || "");
    const changedUsername = usernameTrim !== (user?.user_name || "");
    const changedPassword = !!passwordVal;
    const changedLocation = locationTrim !== (user?.location || "");

    if (!changedEmail && !changedUsername && !changedPassword && !changedLocation) {
      setError("No changes to save.");
      setLoading(false);
      return;
    }

    // Validar solo campos cambiados
    const newErrors = { email: "", user_name: "", password: "", location: "" };
    if (changedEmail) newErrors.email = validateEmail(emailTrim, true);
    if (changedUsername) newErrors.user_name = usernameTrim ? (validateUsername(usernameTrim) || "") : "Username is required.";
    if (changedPassword) newErrors.password = validatePassword(passwordVal) || "";
    if (changedLocation) {
      if (!locationTrim) {
        // Se modificó a vacío: bloquear envío
        newErrors.location = "Location cannot be empty.";
      } else {
        newErrors.location = validateLocation(locationTrim, false) || "";
      }
    }

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some((m) => m);
    if (hasErrors) {
      setError("Please fix the highlighted fields.");
      setLoading(false);
      return;
    }

    // Construir payload solo con cambios válidos
    const payload = {};
    if (changedEmail) payload.email = emailTrim;
    if (changedUsername) payload.user_name = usernameTrim;
    if (changedPassword) payload.password = passwordVal; // si está vacío no entra porque changedPassword depende de !!passwordVal
    if (changedLocation && locationTrim) payload.location = locationTrim; // nunca se envía location vacía

    if (Object.keys(payload).length === 0) {
      setError("No changes to save.");
      setLoading(false);
      return;
    }

    try {
      const { ok, data } = await updateMyProfile(token, payload);
      if (!ok) {
        setError(data?.message || "Unable to update profile.");
        setLoading(false);
        return;
      }
      // Llamamos a la función de callback para actualizar el user en MyProfile
      onUpdate?.(data.user);
      // Cerramos el modal usando Bootstrap
      const modalEl = document.getElementById("userModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="userModal"
      tabIndex="-1"
      aria-labelledby="userModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="userModalLabel">
              Edit User Info
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={handleReset}
            ></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form noValidate onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  disabled
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  maxLength={30}
                  aria-invalid={!!errors.email}
                  aria-describedby="user-email-error"
                />
                {errors.email && (
                  <div id="user-email-error" className="invalid-feedback">
                    {errors.email}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className={`form-control ${errors.user_name ? "is-invalid" : ""}`}
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  maxLength={16}
                  aria-invalid={!!errors.user_name}
                  aria-describedby="user-username-error"
                />
                {errors.user_name && (
                  <div id="user-username-error" className="invalid-feedback">
                    {errors.user_name}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  maxLength={16}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  aria-describedby="user-password-error user-password-help"
                />
                <div id="user-password-help" className="form-text">
                  Leave blank to keep your current password.
                </div>
                {errors.password && (
                  <div id="user-password-error" className="invalid-feedback">
                    {errors.password}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className={`form-control ${errors.location ? "is-invalid" : ""}`}
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  maxLength={30}
                  aria-invalid={!!errors.location}
                  aria-describedby="user-location-error"
                />
                {errors.location && (
                  <div id="user-location-error" className="invalid-feedback">
                    {errors.location}
                  </div>
                )}
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
              disabled={loading}
              onClick={handleReset}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;