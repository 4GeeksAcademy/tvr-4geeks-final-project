import React from "react";

const PoiImage = ({
  src,
  alt,
  width,
  height,
  rounded = false,
  className = "",
  placeholderText = "Example",
}) => {
  const styles = {
    width,
    height,
    objectFit: "cover",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${rounded ? "rounded" : ""} ${className}`.trim()}
        style={styles}
      />
    );
  }

  return (
    <div
      className={`${rounded ? "rounded" : ""} ${className}`.trim()}
      style={{
        ...styles,
        backgroundColor: "#e0e0e0",
        color: "#6c757d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {placeholderText}
    </div>
  );
};

export default PoiImage;