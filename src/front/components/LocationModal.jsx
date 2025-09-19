import React, { useState, useEffect } from "react";

const LocationModal = ({ userLocation = "", onSave, loading }) => {
  const [value, setValue] = useState(userLocation);
  const [error, setError] = useState("");

  const validateLocation = (v) => {
    const value = (v || "").trim();
    if (!value) return "Location is required";
    if (value.length > 30) return "Location must be max 30 characters.";
    return "";
  };

  useEffect(() => {
    setValue(userLocation || "");
    setError("");
  }, [userLocation]);

  // Reset al cerrar el modal
  const handleReset = () => {
    setValue(userLocation || "");
    setError("");
  };

  useEffect(() => {
    const modalEl = document.getElementById("locationModal");
    if (!modalEl) return;
    const onHidden = () => handleReset();
    modalEl.addEventListener("hidden.bs.modal", onHidden);
    return () => modalEl.removeEventListener("hidden.bs.modal", onHidden);
  }, [userLocation]);

  const handleSave = (e) => {
    e?.preventDefault?.();
    const msg = validateLocation(value);
    if (msg) {
      setError(msg);
      return;
    }
    onSave?.(value.trim(), setError);
  };

  return (
    <div className="modal fade" id="locationModal" tabIndex="-1" aria-labelledby="locationModalLabel" aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="locationModalLabel">Update Location</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" disabled={loading} onClick={handleReset}></button>
          </div>
          <div className="modal-body">
            <p className="small text-muted">
              Provide a location that MapTiler can understand. Try using the format "City, Country".
            </p>
            <form noValidate onSubmit={handleSave}>
              <input
                type="text"
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Madrid, Spain"
                maxLength={30}
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby="location-error"
              />
              {error && (
                <div id="location-error" className="invalid-feedback">
                  {error}
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" disabled={loading} onClick={handleReset}>Cancel</button>
            <button type="submit" className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
