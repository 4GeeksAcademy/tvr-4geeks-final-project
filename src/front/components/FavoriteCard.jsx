import React, { useMemo } from "react";
import PoiImage from "./PoiImage";

const FavoriteCard = ({ name, description, tags, image, onViewDetails }) => {
  const previewDescription = useMemo(() => {
    if (!description) return "";
    const limit = 140;
    return description.length > limit
      ? `${description.slice(0, limit)}...`
      : description;
  }, [description]);

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-body d-flex align-items-center">
         <PoiImage
          src={image}
          alt={name}
          rounded
          width="80px"
          height="80px"
          className="me-3 flex-shrink-0"
        />

        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">{name}</h5>
            {onViewDetails && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={onViewDetails}
              >
                <i className="bi bi-arrow-right"></i>
              </button>
            )}
          </div>
          {previewDescription && (
            <p className="card-text mb-2 text-muted">{previewDescription}</p>
          )}

          <div className="d-flex flex-wrap gap-1">
            {Array.isArray(tags) && tags.length > 0 ? (
              tags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="badge bg-secondary bg-opacity-75"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-muted small">No tags available</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteCard;
