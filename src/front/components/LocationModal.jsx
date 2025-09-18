import React, { useState, useEffect } from "react";

const LocationModal = ({ userLocation = "", onSave, loading }) => {
  const [value, setValue] = useState(userLocation);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(userLocation || "");
    setError("");
  }, [userLocation]);

  const handleSave = () => {
    if (!value.trim()) {
      setError("Location is required");
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
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" disabled={loading}></button>
          </div>
          <div className="modal-body">
            <p className="small text-muted">
              Provide a location that MapTiler can understand. Try using the format "City, Country".
            </p>
            <input
              type="text"
              className="form-control"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Madrid, Spain"
              disabled={loading}
            />
            {error && <div className="text-danger small mt-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" disabled={loading}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
