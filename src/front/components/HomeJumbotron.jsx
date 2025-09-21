import { useNavigate } from "react-router-dom";
import jumbotronImage from "../assets/img/woman.jpg";
import logo from "../assets/img/logo.png";
export const HomeJumbotron = () => {
  const navigate = useNavigate();
  return (
    <section
      className="position-relative overflow-hidden shadow-lg"
      style={{
        backgroundImage: `url(${jumbotronImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "500px",
      }}
    >
      <div className="jumbotron-overlay d-flex flex-column justify-content-center text-white">
        <img
          src={logo}
          alt="Logo"
          className="mb-4"
          style={{ width: "140px" }}
        />
        <h1 className="fw-bold display-4 mb-3">
          Your journey begins here
        </h1>
        <p className="lead mb-4 mx-0 mx-md-0" style={{ maxWidth: "450px" }}>
          From breathtaking landmarks to hidden gems, explore the destinations
          that spark adventure and create memories that last a lifetime.
        </p>
        <button className="btn btn-info btn-lg rounded-pill px-3 py-2 shadow w-50" onClick={() => navigate("/locations")}>
          Explore Destinations
        </button>
      </div>
      <style>{`
        .jumbotron-overlay {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          /* keep overlay taking a portion of the left side but avoid content glued to the edge on very wide screens */
          width: 70%;
          max-width: 1300px;
          padding-left: clamp(5rem, 10%, 25rem);
          padding-right: clamp(1rem, 3vw, 4rem);
          background: linear-gradient(90deg, rgba(0,109,119,0.85) 15%, rgba(0,109,119,0.65) 45%, rgba(49,175,169,0.45) 75%, rgba(0,109,119,0) 100%);
        }
        @media (max-width: 450px) {
          .jumbotron-overlay {
            width: 70% !important;
            min-width: 180px;
            padding-left: 1rem !important;
            padding-right: 2rem !important;
            align-items: center !important;
            text-align: center !important;
            background: linear-gradient(90deg, rgba(0,109,119,0.85) 20%, rgba(0,109,119,0.65) 50%, rgba(49,175,169,0.35) 90%, rgba(0,109,119,0.1) 95%, rgba(0,109,119,0) 100%) !important;
          }
          .jumbotron-overlay h1 {
            font-size: 2rem !important;
          }
          .jumbotron-overlay p.lead {
            font-size: 1rem !important;
            max-width: 100% !important;
          }
          .jumbotron-overlay button {
            width: 100% !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
    </section>
  );
};