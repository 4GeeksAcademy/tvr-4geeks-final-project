import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PastTripCard from "../components/PastTripCard";
import FavoriteCard from "../components/FavoriteCard";
import RecommendationCard from "../components/RecommendationCard";
import UserModal from "../components/UserModal";
import { fetchMyProfile } from "../apicalls/profileApicalls";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      const token = sessionStorage.getItem("token");
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

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    window.dispatchEvent(new Event("loginChange"));
    navigate("/login-register");
  };

  const firstName = useMemo(() => {
    if (!profile?.name) return "Explorer";
    const [first = "Explorer"] = profile.name.split(" ");
    return first || "Explorer";
  }, [profile?.name]);

  const favorites = profile?.favorites || [];
  const visited = profile?.visited || [];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-lg-row">
      {/* Sidebar */}
      <div
        className="d-flex flex-column p-3 bg-light"
        style={{ width: "250px", minHeight: "100vh" }}
      >
        {/* User Info */}
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <strong>{profile?.name}</strong>
            <br />
            {profile?.user_name && <small>@{profile.user_name}</small>}
            {profile?.location && (
              <div className="text-muted small">{profile.location}</div>
            )}
          </div>
          <i
            className="bi bi-pencil-square"
            role="button"
            data-bs-toggle="modal"
            data-bs-target="#userModal"
          ></i>
        </div>

        {/* Past Trips */}
        <div className="flex-grow-1">
          <h6>Visited Places</h6>
          {visited.length > 0 ? (
            visited.map((poiId) => (
              <PastTripCard
                key={poiId}
                place={`POI ${poiId}`}
              />
            ))
          ) : (
            <p className="text-muted small">You haven't marked any visits yet.</p>
          )}
        </div>

        {/* Logout */}
        <button className="btn btn-outline-danger mt-auto" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h1>Hello, {firstName}!</h1>
        <p className="text-muted">
          Here is a snapshot of your activity and saved locations.
        </p>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Contact</h5>
                <p className="card-text mb-1">
                  <strong>Email:</strong> {profile?.email}
                </p>
                {profile?.location && (
                  <p className="card-text mb-0">
                    <strong>Location:</strong> {profile.location}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Favorites</h5>
                <p className="display-6 mb-0">{favorites.length}</p>
                <small className="text-muted">Saved points of interest</small>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">Visited</h5>
                <p className="display-6 mb-0">{visited.length}</p>
                <small className="text-muted">Places you've explored</small>
              </div>
            </div>
          </div>
        </div>

        {/* Space for maps */}
        <div
          className="my-4"
          style={{ height: "200px", background: "#f0f0f0" }}
        >
          Maps go here
        </div>

        {/* Favorites & Recommendations */}
        <div className="row">
          <div className="col-12 col-lg-8 mb-4 mb-lg-0">
            <h3>Your Favorites</h3>
            {favorites.length > 0 ? (
              favorites.map((poiId) => (
                <FavoriteCard
                  key={poiId}
                  place={`POI ${poiId}`}
                  description={`Saved point of interest with ID ${poiId}.`}
                />
              ))
            ) : (
              <div className="alert alert-info mb-0" role="alert">
                You haven't added any favorites yet. Start exploring to save
                places you love!
              </div>
            )}
          </div>
          <div className="col-12 col-lg-4">
            <h3>Suggestions</h3>
            {favorites.length > 0 ? (
              <RecommendationCard
                place="More recommendations coming soon"
                tags={["personalized", "beta"]}
              />
            ) : (
              <div className="alert alert-secondary mb-0" role="alert">
                Save your first favorite to receive personalized suggestions.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <UserModal user={profile} />
    </div>
  );
};

export default MyProfile;