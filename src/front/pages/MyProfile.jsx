import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PastTripCard from "../components/PastTripCard";
import FavoriteCard from "../components/FavoriteCard";
import RecommendationCard from "../components/RecommendationCard";
import UserModal from "../components/UserModal";
import LocationModal from "../components/LocationModal";
import PoiCarousel from "../components/PoiCarousel";
import { MapComponent } from "../components/MapComponent";
import {
  fetchAllPois,
  fetchCity,
  fetchCountries,
  fetchMyProfile,
  fetchPoi,
  fetchPoisByCityName,
  updateMyProfile,
} from "../apicalls/profileApicalls";
import { getCoordinatesByName } from "../externalApis/mapApi";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoritePois, setFavoritePois] = useState([]);
  const [visitedPois, setVisitedPois] = useState([]);
  const [suggestedPoi, setSuggestedPoi] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const countriesCacheRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You need to log in to access your profile.");
        setLoading(false);
        return;
      }
      try {
        const { ok, data } = await fetchMyProfile(token);
        if (!ok) {
          setError(data?.message || "Unable to load your profile information.");
          return;
        }
        setProfile(data.user);
      } catch (err) {
        setError("An unexpected error occurred while loading your profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const favoriteIds = useMemo(() => profile?.favorites || [], [profile]);
  const visitedIds = useMemo(() => profile?.visited || [], [profile]);
  const cityName = useMemo(() => {
    const location = profile?.location;
    if (!location) return "";
    const [cityPart] = location.split(",");
    return (cityPart || location).trim();
  }, [profile?.location]);
  const firstName = useMemo(() => {
    if (!profile?.name) return "Explorer";
    const [first = "Explorer"] = profile.name.split(" ");
    return first || "Explorer";
  }, [profile?.name]);

  const handleLogout = () => {
    // ask for confirmation before logging out
    const doLogout = () => {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("loginChange"));
      navigate("/login-register");
    };

    (async () => {
      try {
        const SwalModule = await import('sweetalert2');
        const Swal = SwalModule.default || SwalModule;
        await Swal.fire({
          title: 'Are you sure?',
          text: 'You will be logged out of your account.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, log me out',
        }).then((result) => {
          if (result.isConfirmed) doLogout();
        });
      } catch (err) {
        // fallback
        const ok = window.confirm('Are you sure you want to log out?');
        if (ok) doLogout();
      }
    })();
  };

  const renderSectionSpinner = (height = "200px") => (
    <div
      className="d-flex justify-content-center align-items-center w-100"
      style={{ height }}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Favorites
  const loadFavoritePois = useCallback(async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      setFavoritePois([]);
      return;
    }
    try {
      const uniqueIds = [...new Set(ids)];
      const responses = await Promise.all(
        uniqueIds.map(async (id) => {
          const { ok, data } = await fetchPoi(id);
          if (!ok || !data?.poi) return null;
          return data.poi;
        })
      );
      const poiMap = new Map();
      responses.forEach((poi) => poi && poiMap.set(poi.id, poi));
      setFavoritePois(ids.map((id) => poiMap.get(id)).filter(Boolean));
    } catch (err) {
      setFavoritePois([]);
    }
  }, []);

  // Visited
  const loadVisitedPois = useCallback(async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      setVisitedPois([]);
      return;
    }
    try {
      const uniqueIds = [...new Set(ids)];
      const responses = await Promise.all(
        uniqueIds.map(async (id) => {
          const { ok, data } = await fetchPoi(id);
          if (!ok || !data?.poi) return null;
          return data.poi;
        })
      );
      const poiMap = new Map();
      responses.forEach((poi) => poi && poiMap.set(poi.id, poi));
      const orderedPois = ids.map((id) => poiMap.get(id)).filter(Boolean);

      // Cities
      const uniqueCityIds = [
        ...new Set(orderedPois.map((poi) => poi.city_id).filter(Boolean)),
      ];
      const cityResponses = await Promise.all(
        uniqueCityIds.map(async (id) => {
          const { ok, data } = await fetchCity(id);
          if (!ok || !data?.city) return null;
          return data.city;
        })
      );
      const cityMap = new Map();
      cityResponses.forEach((city) => city && cityMap.set(city.id, city));

      // Countries
      let countriesMap = countriesCacheRef.current;
      if (!countriesMap) {
        countriesMap = new Map();
        try {
          const { ok, data } = await fetchCountries();
          if (ok && Array.isArray(data?.countries)) {
            data.countries.forEach((c) => countriesMap.set(c.id, c));
          }
        } catch { }
        countriesCacheRef.current = countriesMap;
      }

      const visitedWithGeo = orderedPois.map((poi) => {
        const city = poi.city_id ? cityMap.get(poi.city_id) : null;
        const country = city && city.country_id ? countriesMap.get(city.country_id) : null;
        return { ...poi, city, country };
      });

      setVisitedPois(visitedWithGeo);
    } catch {
      setVisitedPois([]);
    }
  }, []);

  // Recommendation
  const loadSuggestion = useCallback(
    async (favoriteList = [], visitedList = []) => {
      try {
        const { ok, data } = await fetchAllPois();
        if (!ok || !Array.isArray(data?.pois)) {
          setSuggestedPoi(null);
          return;
        }
        const excluded = new Set([...favoriteList, ...visitedList].map(String));
        const available = data.pois.filter((poi) => !excluded.has(String(poi.id)));
        if (!available.length) {
          setSuggestedPoi(null);
          return;
        }
        setSuggestedPoi(available[Math.floor(Math.random() * available.length)]);
      } catch {
        setSuggestedPoi(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!profile) return;
    loadFavoritePois(favoriteIds);
    loadVisitedPois(visitedIds);
    loadSuggestion(favoriteIds, visitedIds);
  }, [profile, favoriteIds, visitedIds, loadFavoritePois, loadVisitedPois, loadSuggestion]);

  //  Location
  useEffect(() => {
    if (!profile?.location) {
      setLocationCoords(null);
      setLocationError("");
      setLocationLoading(false);
      return;
    }

    let isMounted = true;
    const loadLocation = async () => {
      setLocationLoading(true);
      setLocationError("");
      try {
        const [lng, lat] = await getCoordinatesByName(profile.location);
        if (isMounted) setLocationCoords({ lat, lng });
      } catch {
        if (isMounted) {
          setLocationCoords(null);
          setLocationError("Unable to determine your location. Please update it.");
        }
      } finally {
        if (isMounted) setLocationLoading(false);
      }
    };
    loadLocation();
    return () => { isMounted = false; };
  }, [profile?.location]);

  const handleLocationSave = async (value, reportError) => {
    const token = localStorage.getItem("token");
    if (!token) {
      reportError?.("You need to log in again to update your location.");
      return;
    }

    setUpdatingLocation(true);
    try {
      const { ok, data } = await updateMyProfile(token, { location: value });
      if (!ok) {
        reportError?.(data?.message || "Unable to update location.");
        return;
      }
      setProfile((prev) => data?.user || { ...prev, location: value });
    } catch {
      reportError?.("Unexpected error while updating location.");
    } finally {
      setUpdatingLocation(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "85vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );

  return (
    <div className="d-flex flex-column flex-md-row flex-nowrap w-100">
      {/* Sidebar */}
      <div className="d-flex flex-column p-3 bg-light w-100 w-md-auto flex-shrink-0 sidebar-responsive">
        <style>{`
        @media (max-width: 767.98px) {
          .sidebar-responsive {
            width: 100% !important;
            min-height: unset !important;
          }
        }
        @media (min-width: 768px) {
          .sidebar-responsive {
            width: 250px !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
        <div className="mb-4 d-flex justify-content-between align-items-center" style={{ maxWidth: "200px" }}>
          <div>
            <strong>{profile?.name}</strong>
            <br />
            {profile?.user_name && <small>@{profile.user_name}</small>}
            {profile?.location && <div className="text-muted small">{profile.location}</div>}
          </div>
          <i className="bi bi-pencil-square" role="button" data-bs-toggle="modal" data-bs-target="#userModal"></i>
        </div>
        <button className="btn btn-outline-danger mt-auto mb-4" style={{ maxWidth: "200px" }} onClick={handleLogout}>
          Logout
        </button>
        <div className="flex-grow-1">
          <h6>Visited Places</h6>
          {visitedPois.length > 0 ? (
            visitedPois.map((poi) => (
              <PastTripCard
                key={poi.id}
                name={poi.name}
                cityName={poi.city?.name}
                countryName={poi.country?.name}
                countryImage={poi.country?.img}
                onViewDetails={() => navigate(`/details/${poi.id}`)}
              />
            ))
          ) : (
            <p className="text-muted small">You haven't marked any visits yet.</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4" style={{ minWidth: "320px" }}>
        <h1>Hello, {firstName}!</h1>
        <p className="text-muted">Here is a snapshot of your activity and saved locations.</p>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Contact</h5>
                <p className="card-text mb-1"><strong>Email:</strong> {profile?.email}</p>
                {profile?.location && <p className="card-text mb-0"><strong>Location:</strong> {profile.location}</p>}
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Favorites</h5>
                <p className="display-6 mb-0">{favoriteIds.length}</p>
                <small className="text-muted">Saved points of interest</small>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Visited</h5>
                <p className="display-6 mb-0">{visitedIds.length}</p>
                <small className="text-muted">Places you've explored</small>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 align-items-stretch my-4">
          <div className="col-12 col-lg-4">
            <PoiCarousel
              cityName={cityName}
              title={profile?.location ? `POIs in ${cityName}` : "Near me"}
              onSelect={(poi) => navigate(`/details/${poi.id}`)}
            />
          </div>
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">My location</h5>
                  {profile?.location && <small className="text-muted">{profile.location}</small>}
                </div>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#locationModal"
                >
                  Update location
                </button>
              </div>
              <div className="card-body p-0" style={{ height: "320px" }}>
                {locationLoading ? (
                  renderSectionSpinner("320px")
                ) : locationCoords ? (
                  <MapComponent lat={locationCoords.lat} long={locationCoords.lng} zoom={12} />
                ) : (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-muted fw-semibold">
                    Location needed
                  </div>
                )}
              </div>
              {locationError && <div className="card-footer text-danger small">{locationError}</div>}
            </div>
          </div>
        </div>

        {/* Favorites & Recommendations */}
        <div className="row">
          <div className="col-12 col-lg-8 mb-4 mb-lg-0">
            <h3>My Favorites</h3>
            {favoritePois.length > 0 ? (
              favoritePois.map((poi) => (
                <FavoriteCard
                  key={poi.id}
                  name={poi.name}
                  description={poi.description}
                  tags={poi.tags}
                  image={poi.images?.[0]}
                  onViewDetails={() => navigate(`/details/${poi.id}`)}
                />
              ))
            ) : (
              <div className="alert alert-info mb-0">No favorites yet.</div>
            )}
          </div>
          <div className="col-12 col-lg-4 d-flex flex-column align-items-stretch">
            <h3>Recommendation</h3>
            {suggestedPoi ? (
              <div>
                <RecommendationCard
                  name={suggestedPoi.name}
                  description={suggestedPoi.description}
                  tags={suggestedPoi.tags}
                  image={suggestedPoi.images?.[0]}
                  onViewDetails={() => navigate(`/details/${suggestedPoi.id}`)}
                />
              </div>
            ) : (
              <div className="alert alert-secondary mb-0">
                Save your first favorite or visit a location to receive suggestions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserModal user={profile} onUpdate={setProfile} />
      <LocationModal
        userLocation={profile?.location || ""}
        onSave={handleLocationSave}
        loading={updatingLocation}
      />
    </div>
  );
};

export default MyProfile;