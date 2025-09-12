import { useNavigate } from "react-router-dom";

export const HomeJumbotron = () => {
  const navigate = useNavigate();
  return (
    <section
      className="position-relative overflow-hidden rounded-4 shadow-lg"
      style={{
        backgroundImage: `url("src/front/assets/img/Image-Woman-enjoying-a-Caribbean (1).jpg")`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "500px",
      }}
    >
      <div
        className="position-absolute top-0 start-0 h-100 d-flex flex-column justify-content-center px-5 text-white"
        style={{
          width: "50%",
          background: "linear-gradient(90deg, rgba(52, 100, 96, 0.7) 70%, rgba(49, 175, 169, 0) 100%)",
        }}
      >
        <img
          src=""
          alt="Logo"
          style={{ width: "140px", marginBottom: "20px" }}
        />
        <h1 className="fw-bold display-4 mb-3">
          Your journey begins here
        </h1>

        <p className="lead mb-4" style={{ maxWidth: "450px" }}>
          From breathtaking landmarks to hidden gems, explore the destinations 
          that spark adventure and create memories that last a lifetime.
        </p>
        <button className="btn btn-info btn-lg rounded-pill px-4 shadow w-50" onClick={() => navigate("/locations")}>
          Explore Destinations
        </button>
      </div>
    </section>
  );
};