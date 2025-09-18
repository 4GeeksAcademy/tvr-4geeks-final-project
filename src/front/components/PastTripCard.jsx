import React from "react";
import PoiImage from "./PoiImage";

const PastTripCard = ({
  name,
  countryName,
  countryImage,
  cityName,
  onViewDetails,
}) => {
  return (
    <div className="card mb-2 shadow-sm">
      <div className="card-body py-2 px-3 d-flex align-items-center">
        <PoiImage
          src={countryImage}
          alt={countryName}
          width="48px"
          height="48px"
          rounded
          className="me-3 flex-shrink-0"
          placeholderText={countryName?.slice(0, 2) || "NA"}
        />
        <div className="flex-grow-1">
          <h6 className="card-title mb-0">{name}</h6>
          <small className="text-muted">
            {[cityName, countryName].filter(Boolean).join(", ")}
          </small>
        </div>
        {onViewDetails && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary ms-2"
            onClick={onViewDetails}
          >
            <i className="bi bi-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default PastTripCard;
