import React, { useEffect, useRef, useState } from "react";

export const MapComponent = ({ lat, long, zoom = 15 }) => {
  const ref = useRef(null);
  const [style, setStyle] = useState("basic");

  useEffect(() => {
    const sdk = window.maptilersdk;
    if (!sdk || !ref.current) return;

    sdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

    const map = new sdk.Map({
      container: ref.current,
      style: style === "satellite" ? sdk.MapStyle.SATELLITE : sdk.MapStyle.BASIC,
      center: [long, lat],
      zoom
    });

    new sdk.Marker().setLngLat([long, lat]).addTo(map);

    return () => map.remove();
  }, [lat, long, zoom, style]);

  return (
    <div className="w-100 h-100 position-relative">
      {/* Selector */}
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        className="form-select position-absolute m-2"
        style={{ width: "150px", zIndex: 2, top: 0, left: 0 }}
      >
        <option value="basic">Map</option>
        <option value="satellite">Satellite</option>
      </select>

      <div ref={ref} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
