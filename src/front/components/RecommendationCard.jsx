import React, { useMemo } from "react";
import PoiImage from "./PoiImage";

const RecommendationCard = ({
  name,
  description,
  tags,
  image,
  onViewDetails,
}) => {
  const previewDescription = useMemo(() => {
    if (!description) return "";
    const limit = 80;
    return description.length > limit
      ? `${description.slice(0, limit)}...`
      : description;
  }, [description]);

  return (
      <div className="card mb-3 shadow-sm h-100 w-75">
      <PoiImage
        src={image}
        alt={name}
        width="100%"
        height="200px"
        className="card-img-top"
      />

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <h6 className="card-title mb-0">{name}</h6>
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
          <p className="card-text text-muted">{previewDescription}</p>
        )}

        <div className="d-flex flex-wrap gap-1">
          {Array.isArray(tags) && tags.length > 0 ? (
            tags.map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="badge bg-info text-dark">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-muted small">No tags available</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
