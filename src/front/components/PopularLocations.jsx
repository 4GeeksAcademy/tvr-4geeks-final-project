import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const PopularLocations = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const placeholders = Array.from({ length: 8 }, (_, i) => ({
    id: `placeholder-${i}`,
    name: "Coming Soon",
    country: "—",
    image: "",
    isPlaceholder: true,
  }));

  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/popular-pois`
        );
        if (!response.ok) throw new Error("Failed to fetch POIs");
        const data = await response.json();

        const poisWithImages = (data.pois || []).map((poi) => ({
          ...poi,
          image: `${import.meta.env.VITE_BACKEND_URL}/api/poiimages/${poi.id}`,
          isPlaceholder: false,
        }));

        setCards(poisWithImages);
      } catch (error) {
        console.error("Error fetching popular POIs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPOIs();
  }, []);

  const displayCards = [...cards, ...placeholders].slice(0, 8);

  if (loading) {
    return (
      <div className="text-center py-5">
        <p>Loading popular destinations...</p>
      </div>
    );
  }

  return (
    <section className="py-5">
      <div className="container text-center mb-5">
        <h2 className="fw-bold">Destinations to Inspire Adventure</h2>
        <p className="text-muted lead">
          From timeless landmarks to hidden gems, discover the places that spark
          curiosity and invite you to write your own unforgettable story.
        </p>
      </div>

      <div className="container">
        <div className="row g-4">
          {displayCards.map((card, index) => (
            <div className="col-md-6 col-lg-3" key={card.id || index}>
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
                {/* Dark overlay */}
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

                  {!card.isPlaceholder && (
                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow"
                        style={{ width: "40px", height: "40px" }}
                        onClick={() => navigate(`/details/${card.id}`)}
                      >
                        <FontAwesomeIcon
                          icon={faLocationArrow}
                          className="text-primary"
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
