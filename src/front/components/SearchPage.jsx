import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

export const SearchPage = () => {
  const [pois, setPois] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [tags, setTags] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [countriesRes, citiesRes, tagsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/countries`),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cities`),
          fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tags`),
        ]);

        const countriesData = await countriesRes.json();
        const citiesData = await citiesRes.json();
        const tagsData = await tagsRes.json();

        setCountries(countriesData.countries || []);
        setCities(citiesData.cities || []);
        setTags(tagsData.tags || []);
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };

    fetchFilters();
  }, []);

  const fetchPOIs = async () => {
    try {
      setLoading(true);
      let query = [];
      if (searchTerm) query.push(`name=${encodeURIComponent(searchTerm)}`);
      if (selectedCountry) query.push(`country_name=${encodeURIComponent(selectedCountry)}`);
      if (selectedCity) query.push(`city_name=${encodeURIComponent(selectedCity)}`);
      if (selectedTags.length > 0) {
        selectedTags.forEach((tag) => query.push(`tag_name=${encodeURIComponent(tag)}`));
      }

      const qs = query.length > 0 ? `?${query.join("&")}` : "";
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pois${qs}`);
      const data = await res.json();

      const poisWithImages = (data.pois || []).map((poi) => ({
        ...poi,
        image: `${import.meta.env.VITE_BACKEND_URL}/api/poiimages/${poi.id}`,
      }));

      setPois(poisWithImages);
    } catch (err) {
      console.error("Error fetching POIs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs();
  }, [searchTerm, selectedCountry, selectedCity, selectedTags]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 bg-light p-3">
          <h5>Filters</h5>
          <div className="mb-3">
            <label>Country</label>
            <select
              className="form-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map((c, i) => (
                <option key={i} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label>City</label>
            <select
              className="form-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map((c, i) => (
                <option key={i} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h6>Tags</h6>
            <div className="d-flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className={`badge rounded-pill ${
                    selectedTags.includes(t.name) ? "bg-primary" : "bg-secondary"
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleTag(t.name)}
                >
                  {t.name} {selectedTags.includes(t.name) && "×"}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-9 p-4">

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search locations by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading results...</p>
          ) : pois.length === 0 ? (
            <p>No results found.</p>
          ) : (
            <div className="row g-4">
              {pois.map((poi) => (
                <div className="col-md-6 col-lg-4" key={poi.id}>
                  <div
                    className="card text-white h-100 border-0 shadow-sm position-relative"
                    style={{
                      backgroundImage: `url(${poi.image})`,
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
                        {poi.name}
                      </h5>

                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow"
                          style={{ width: "40px", height: "40px" }}
                          onClick={() => navigate(`/details/${poi.id}`)}
                        >
                          <FontAwesomeIcon icon={faLocationArrow} className="text-primary" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
