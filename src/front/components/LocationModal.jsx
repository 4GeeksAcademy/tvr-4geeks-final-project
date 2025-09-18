import React, { useEffect, useState } from "react";

const LocationModal = ({ show, initialValue = "", onClose, onSave, loading }) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setValue(initialValue || "");
      setError("");
    }
  }, [show, initialValue]);

  if (!show) return null;

  const handleSave = () => {
    if (!value.trim()) {
      setError("Location is required");
      return;
    }
    onSave?.(value.trim(), setError);
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog">
      <div
        className="modal-backdrop fade show"
        onClick={loading ? undefined : onClose}
      />
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update location</h5>
            <button
              type="button"
              className="btn-close"
              onClick={loading ? undefined : onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p className="small text-muted">
              Provide a location that MapTiler can understand. Try using the
              format "City, Country".
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loading ? undefined : onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;