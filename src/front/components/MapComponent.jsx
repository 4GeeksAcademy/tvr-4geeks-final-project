import React, { useEffect, useRef } from "react";
// CDN o paquete; ejemplo con CDN UMD:
import "https://cdn.maptiler.com/maptiler-sdk-js/v1.0.0/maptiler-sdk.css";

export const MapComponent = ({ lat, long, zoom = 15, style = "basic-v2" }) => {
  const ref = useRef(null);

  useEffect(() => {
    (async () => {
      const sdk = await import("https://cdn.maptiler.com/maptiler-sdk-js/v1.0.0/maptiler-sdk.umd.js");
      sdk.maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

      const map = new sdk.maptilersdk.Map({
        container: ref.current,
        style: sdk.maptilersdk.MapStyle[style.toUpperCase().replace("-", "_")] || style,
        center: [long, lat], // orden [lon, lat]
        zoom
      });

      new sdk.maptilersdk.Marker().setLngLat([long, lat]).addTo(map);
    })();
  }, [lat, long, zoom, style]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};
