import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

export const PopularLocations = () => {
  const cards = [
    {
      name: "Place 1, Country 1",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 2, Country 2",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 3, Country 3",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 4, Country 4",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 5, Country 5",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 6, Country 6",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 7, Country 7",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
    {
      name: "Place 8, Country 8",
      image: "src/front/assets/img/Chongqing.jpeg",
    },
  ];

  return (
    <section className="py-5">
      <div className="container text-center mb-5">
        <h2 className="fw-bold">Destinations to Inspire Adventure</h2>
        <p className="text-muted lead">
          From timeless landmarks to hidden gems, discover the places that spark curiosity 
          and invite you to write your own unforgettable story.
        </p>
      </div>

      <div className="container">
        <div className="row g-4">
          {cards.map((card, index) => (
            <div className="col-md-6 col-lg-3" key={index}>
              <div
                className="card text-white h-100 border-0 shadow-sm position-relative"
                style={{
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "300px",
                  borderRadius: "1rem",
                  overflow: "hidden",
                }}
              >
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                ></div>

                <div className="card-body position-relative d-flex flex-column justify-content-between h-100">
                  <h5
                    className="fw-bold px-2 py-1 rounded-4"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.49)",
                      display: "inline-block",
                      maxWidth: "90%",
                    }}
                  >
                    {card.name}
                  </h5>

                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow"
                      style={{ width: "40px", height: "40px" }}
                    >
                      <FontAwesomeIcon icon={faLocationArrow} className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
