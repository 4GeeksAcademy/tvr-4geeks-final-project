import { useNavigate } from "react-router-dom";
import jumbotronImage from "../assets/img/woman.jpg";
export const LocationListBanner = () => {
  const navigate = useNavigate();

  return (
    <section
      className="position-relative overflow-hidden rounded-4 shadow-lg d-flex justify-content-center align-items-center text-white text-center"
      style={{
        backgroundImage: `url(${jumbotronImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "250px",
      }}
    >
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)",
        }}
      ></div>

      <div className="position-relative px-4">
        <h1 className="fw-bold display-4 mb-3">ALL LOCATIONS</h1>
        <p className="lead mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
          Check out all countries, cities and points of interest!
        </p>
      </div>
    </section>
  );
};
