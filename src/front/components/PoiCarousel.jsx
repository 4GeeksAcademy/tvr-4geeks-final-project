import React, { useEffect, useMemo, useState } from "react";
import PoiImage from "./PoiImage";
import { fetchPoisByCityName } from "../apicalls/profileApicalls";

const PoiCarousel = ({
  cityName = "",
  title = "Points of interest",
  onSelect,
  emptyMessage = "No points of interest found.",
}) => {
  const [pois, setPois] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch de POIs cuando cambia la ciudad
  useEffect(() => {
  if (!cityName) {
    setPois([]);
    setLoading(false);
    return;
  }

  const getPois = async () => {
    setLoading(true);
    try {
      const { ok, data } = await fetchPoisByCityName(cityName);
      if (ok && Array.isArray(data?.pois)) {
        setPois(data.pois); 
      } else {
        console.error("Error al obtener POIs:", data);
        setPois([]);
      }
    } catch (err) {
      console.error("Error al llamar a la API:", err);
      setPois([]);
    } finally {
      setLoading(false);
      setIndex(0);
    }
  };

  getPois();
}, [cityName]);


  // POI actual
  const current = useMemo(() => {
    if (!Array.isArray(pois) || pois.length === 0) return null;
    return pois[index] ?? pois[0];
  }, [pois, index]);

  // Navegación
  const handlePrev = () => {
    if (!pois.length) return;
    setIndex((prev) => (prev === 0 ? pois.length - 1 : prev - 1));
  };
  const handleNext = () => {
    if (!pois.length) return;
    setIndex((prev) => (prev === pois.length - 1 ? 0 : prev + 1));
  };

  // Descripción truncada
  const truncatedDescription = useMemo(() => {
    if (!current?.description) return "";
    const limit = 140;
    return current.description.length > limit
      ? `${current.description.slice(0, limit)}...`
      : current.description;
  }, [current]);

  return (
    <div className="card h-100 shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{title}</h5>
        <div className="btn-group" role="group">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handlePrev}
            disabled={pois.length <= 1}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleNext}
            disabled={pois.length <= 1}
          >
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>

      <div className="card-body d-flex flex-column">
        {loading ? (
          <p>Cargando POIs...</p>
        ) : current ? (
          <>
            <PoiImage
              src={current.images?.[0]}
              alt={current.name}
              width="100%"
              height="180px"
              className="mb-3 rounded"
            />
            <h6 className="mb-1">{current.name}</h6>
            {truncatedDescription && (
              <p className="text-muted small flex-grow-1">{truncatedDescription}</p>
            )}
            <div className="d-flex flex-wrap gap-1 mb-3">
              {Array.isArray(current.tags) && current.tags.length > 0 ? (
                current.tags.map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="badge bg-primary bg-opacity-75">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-muted small">No tags available</span>
              )}
            </div>
            {onSelect && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm align-self-start"
                onClick={() => onSelect(current)}
              >
                View details
              </button>
            )}
          </>
        ) : (
          <div className="text-muted text-center my-auto">{emptyMessage}</div>
        )}
      </div>

      {pois.length > 1 && !loading && (
        <div className="card-footer text-center small text-muted">
          {index + 1} / {pois.length}
        </div>
      )}
    </div>
  );
};

export default PoiCarousel;
