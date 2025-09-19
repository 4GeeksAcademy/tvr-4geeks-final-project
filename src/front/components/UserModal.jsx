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

  useEffect(() => {
    // Actualiza el formData si cambia el user prop
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      user_name: user?.user_name || "",
      password: "",
      location: user?.location || "",
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You need to log in again.");
      setLoading(false);
      return;
    }

    // Solo enviamos los campos que hayan cambiado o que tengan valor
    const payload = {};
    if (formData.email && formData.email !== user?.email) payload.email = formData.email;
    if (formData.user_name && formData.user_name !== user?.user_name) payload.user_name = formData.user_name;
    if (formData.password) payload.password = formData.password;
    if (formData.location && formData.location !== user?.location) payload.location = formData.location;

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
            ></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form>
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
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
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
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
              disabled={loading}
            >
              Close
            </button>
            <button
              type="button"
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