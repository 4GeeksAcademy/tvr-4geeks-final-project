import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";

const PAGE_SIZE = 12;

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export function SearchPage() {
  const [allPois, setAllPois] = useState([]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const nameParam = searchParams.get("name") || "";
  const countryParam = searchParams.get("country_id") || ""; // store ID in URL
  const cityParam = searchParams.get("city_name") || "";
  const pageParam = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const selectedTagsFromURL = searchParams.getAll("tag_name") || [];
  const tagsKey = selectedTagsFromURL.join(",");

  const [selectedCountry, setSelectedCountry] = useState(countryParam);
  const [selectedCity, setSelectedCity] = useState(cityParam);

  useEffect(() => {
    setSelectedCountry(countryParam);
    setSelectedCity(cityParam);
  }, [countryParam, cityParam]);

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

  const [debouncedName, setDebouncedName] = useState(nameParam);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedName(nameParam), 500);
    return () => clearTimeout(handler);
  }, [nameParam]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPOIs = async () => {
      try {
        setLoading(true);
        const parts = [];
        if (debouncedName)
          parts.push(`name=${encodeURIComponent(debouncedName)}`);
        if (countryParam) {
          const countryObj = countries.find((c) => c.id === countryParam);
          if (countryObj)
            parts.push(
              `country_name=${encodeURIComponent(countryObj.name)}`
            );
        }
        if (cityParam) parts.push(`city_name=${encodeURIComponent(cityParam)}`);
        if (selectedTagsFromURL.length === 1)
          parts.push(`tag_name=${encodeURIComponent(selectedTagsFromURL[0])}`);

        const qs = parts.length ? `?${parts.join("&")}` : "";
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/pois${qs}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch POIs");
        const data = await res.json();
        const poisWithImages = (data.pois || []).map((p) => ({
          ...p,
          images:
            Array.isArray(p.images) && p.images.length
              ? p.images
              : [
                `https://via.placeholder.com/640x420?text=No+Image`,
              ],
        }));
        setAllPois(poisWithImages);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching POIs:", err);
          setAllPois([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPOIs();
    return () => controller.abort();
  }, [debouncedName, countryParam, cityParam, tagsKey, countries]);

  const filteredPois = useMemo(() => {
    if (!selectedTagsFromURL?.length) return allPois;
    return allPois.filter((poi) =>
      selectedTagsFromURL.every((tag) => (poi.tags || []).includes(tag))
    );
  }, [allPois, tagsKey]);

  const totalPages = Math.max(1, Math.ceil(filteredPois.length / PAGE_SIZE));
  useEffect(() => {
    if (pageParam > totalPages) {
      const np = new URLSearchParams(searchParams.toString());
      np.set("page", "1");
      setSearchParams(np, { replace: true });
    }
  }, [pageParam, totalPages]);

  const paginatedPois = useMemo(() => {
    const start = (pageParam - 1) * PAGE_SIZE;
    return filteredPois.slice(start, start + PAGE_SIZE);
  }, [filteredPois, pageParam]);

  const setParam = (key, value) => {
    const np = new URLSearchParams(searchParams.toString());
    if (!value || (typeof value === "string" && value.trim() === ""))
      np.delete(key);
    else np.set(key, value);
    if (key !== "page") np.delete("page");
    setSearchParams(np, { replace: true });
  };

  const onCountryChange = (value) => {
    setSelectedCountry(value);
    setSelectedCity("");

    const np = new URLSearchParams(searchParams.toString());

    if (!value) {
      np.delete("country_id");
    } else {
      np.set("country_id", value);
    }

    np.delete("city_name");
    np.delete("page");
    setSearchParams(np);
  };


  const onCityChange = (value) => {
    setSelectedCity(value);
    const np = new URLSearchParams(searchParams.toString());
    if (!value) np.delete("city_name");
    else np.set("city_name", value);
    np.delete("page");
    setSearchParams(np);
  };

  const toggleTag = (tagName) => {
    const current = searchParams.getAll("tag_name");
    const np = new URLSearchParams(searchParams.toString());
    const has = current.includes(tagName);

    if (has) {
      const newTags = current.filter((t) => t !== tagName);
      np.delete("tag_name");
      newTags.forEach((t) => np.append("tag_name", t));
    } else {
      np.append("tag_name", tagName);
    }

    np.delete("page");
    setSearchParams(np, { replace: true });
  };

  const setPage = (newPage) => {
    const np = new URLSearchParams(searchParams.toString());
    if (!newPage || newPage <= 1) np.delete("page");
    else np.set("page", String(newPage));
    setSearchParams(np, { replace: true });
  };

  const displayedCities = useMemo(() => {
    if (!selectedCountry) return cities;
    return cities.filter((c) => c.country_id === selectedCountry);
  }, [cities, selectedCountry]);

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <aside className="col-md-3 bg-light p-3">
          <h5 className="mb-3 fw-bold">Filters</h5>

          <div className="mb-3">
            <label className="form-label">Country</label>
            <select
              className="form-select"
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">City</label>
            <select
              className="form-select"
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={displayedCities.length === 0}
            >
              <option value="">All Cities</option>
              {displayedCities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h6 className="mb-2">Tags</h6>

            <div className="d-md-none mb-2">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#tagsCollapse"
                aria-expanded="false"
                aria-controls="tagsCollapse"
              >
                Select Tags
              </button>
            </div>

            <div className="d-none d-md-flex flex-wrap gap-2 mb-2">
              {tags.map((t) => {
                const active = selectedTagsFromURL.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => toggleTag(t.name)}
                  >
                    {t.name} {active && "×"}
                  </button>
                );
              })}
            </div>

            <div className="collapse d-md-none" id="tagsCollapse">
              <div className="d-flex flex-wrap gap-2 mt-2">
                {tags.map((t) => {
                  const active = selectedTagsFromURL.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => toggleTag(t.name)}
                    >
                      {t.name} {active && "×"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>


        <main className="col-md-9 p-4">
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search locations by name..."
              value={nameParam}
              onChange={(e) => setParam("name", e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-5">Loading results...</div>
          ) : paginatedPois.length === 0 ? (
            <div className="text-center text-muted py-5">
              No results found.
            </div>
          ) : (
            <>
              <div className="row g-4">
                {paginatedPois.map((poi) => (
                  <div className="col-md-6 col-lg-4" key={poi.id}>
                    <div
                      className="card text-white h-100 border-0 shadow-sm position-relative"
                      style={{
                        backgroundImage: `url(${poi.images[0]})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        minHeight: "300px",
                        borderRadius: "1rem",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "transform 0.3s, filter 0.3s",
                      }}
                      onClick={() => navigate(`/details/${poi.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.filter = "brightness(0.7)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.filter = "brightness(1)";
                      }}
                    >
                      <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ background: "rgba(0,0,0,0.25)" }}
                      />

                      <div className="card-body position-relative d-flex flex-column h-100">
                        <h5
                          className="fw-bold px-2 py-1 rounded-4"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.49)",
                            display: "inline-block",
                            maxWidth: "90%",
                          }}
                        >
                          {poi.name}
                        </h5>

                        <div className="d-flex justify-content-between align-items-end mt-auto">
                          <div className="d-flex flex-wrap gap-1">
                            {poi.tags?.map((tagName, idx) => (
                              <span
                                key={idx}
                                className="badge bg-dark bg-opacity-75"
                              >
                                {tagName}
                              </span>
                            ))}
                          </div>

                          <button
                            className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow"
                            style={{ width: "40px", height: "40px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/details/${poi.id}`);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faLocationArrow}
                              className="text-primary"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pageParam <= 1}
                  onClick={() => setPage(pageParam - 1)}
                >
                  Previous
                </button>
                {getPageNumbers(pageParam, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === pageParam
                          ? "btn-primary"
                          : "btn-outline-secondary"
                        }`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pageParam >= totalPages}
                  onClick={() => setPage(pageParam + 1)}
                >
                  Next
                </button>
              </div>

              <div className="text-center text-muted mt-2">
                Showing{" "}
                {Math.min(
                  (pageParam - 1) * PAGE_SIZE + 1,
                  filteredPois.length
                )}
                –{Math.min(pageParam * PAGE_SIZE, filteredPois.length)} of{" "}
                {filteredPois.length} results
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default SearchPage;
