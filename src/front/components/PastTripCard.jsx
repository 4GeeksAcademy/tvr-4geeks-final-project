import React from "react";

const PastTripCard = ({ place, date }) => {
  return (
    <div className="card mb-2 shadow-sm">
      <div className="card-body py-2 px-3">
        <h6 className="card-title mb-1">{place}</h6>
        <small className="text-muted">{date}</small>
      </div>
    </div>
  );
};

export default PastTripCard;
