export const HomeJumbotron = () => {
  return (
    <div
      className="bg-body-tertiary position-relative w-75 mx-auto"
      style={{
        backgroundImage: `url("src/front/assets/img/Image-Woman-enjoying-a-Caribbean (1).jpg")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "75% 25%",
        minHeight: "450px",
      }}
    >
      {/* Left overlay */}
      <div
        className="position-absolute top-0 start-0 h-100 text-white d-flex flex-column align-items-start justify-content-center px-5"
        style={{ 
          width: "50%", 
          backgroundColor: "rgba(0, 0, 0, 0.55)"
        }}
      >
        {/* Logo */}
        <img 
          src="" 
          alt="Logo" 
          style={{ width: "120px", marginBottom: "20px" }}
        />

        {/* Text */}
        <h1 className="fw-bold display-4 mb-3">
          Discover the Caribbean
        </h1>

        <p className="lead mb-4" style={{ maxWidth: "400px" }}>
          Unforgettable destinations, crystal-clear waters, and vibrant culture — your dream journey starts here.
        </p>
      </div>

      {/* Right overlay */}
      <div
        className="position-absolute top-0 end-0 h-100"
        style={{ width: "50%" }}
      ></div>
    </div>
  );
};
