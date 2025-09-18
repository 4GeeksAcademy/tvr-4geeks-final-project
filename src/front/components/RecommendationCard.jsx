import React from "react";

const RecommendationCard = ({ place, tags }) => {
  return (
    <div className="card mb-3 shadow-sm">
      {/* Imagen */}
      <img
        src="https://via.placeholder.com/300x150"
        className="card-img-top"
        alt={place}
      />

      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="card-title mb-0">{place}</h6>
          <button className="btn btn-outline-primary btn-sm">
            <i className="bi bi-arrow-right"></i>
          </button>
        </div>

        {/* Tags */}
        <div>
          {tags &&
            tags.map((tag, idx) => (
              <span key={idx} className="badge bg-info me-1 text-dark">
                {tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
