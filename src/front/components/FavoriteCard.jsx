import React from "react";

const FavoriteCard = ({ place, description, tags }) => {
  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-body d-flex align-items-center">
        {/* Imagen circular */}
        <img
          src="https://via.placeholder.com/80"
          alt={place}
          className="rounded-circle me-3"
          style={{ width: "80px", height: "80px", objectFit: "cover" }}
        />

        {/* Contenido */}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title mb-0">{place}</h5>
            <button className="btn btn-outline-primary btn-sm">
              <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          {description && <p className="card-text mb-2">{description}</p>}

          {/* Tags */}
          <div>
            {tags &&
              tags.map((tag, idx) => (
                <span key={idx} className="badge bg-secondary me-1">
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoriteCard;
