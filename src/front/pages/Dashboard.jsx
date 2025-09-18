import React from "react";
import PastTripCard from "../components/PastTripCard";
import FavoriteCard from "../components/FavoriteCard";
import RecommendationCard from "../components/RecommendationCard";
import UserModal from "../components/UserModal";

const Dashboard = () => {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="d-flex flex-column p-3 bg-light"
        style={{ width: "250px", height: "100vh" }}
      >
        {/* User Info */}
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <strong>John Doe</strong>
            <br />
            <small>@johndoe</small>
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
          <h6>Past Trips</h6>
          <PastTripCard place="Paris" date="2024-05-12" />
          <PastTripCard place="Rome" date="2024-06-01" />
        </div>

        {/* Logout */}
        <button className="btn btn-outline-danger mt-auto">Logout</button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h1>Hello, John!</h1>

        {/* Space for maps */}
        <div
          className="my-4"
          style={{ height: "200px", background: "#f0f0f0" }}
        >
          Maps go here
        </div>

        {/* Favorites & Recommendations */}
        <div className="row">
          <div className="col-8">
            <h3>Your Favorites</h3>
            <FavoriteCard
              place="New York"
              description="The city that never sleeps"
              tags={["urban", "nightlife"]}
            />
          </div>
          <div className="col-4">
            <h3>Suggestions</h3>
            <RecommendationCard
              place="Tokyo"
              tags={["tech", "culture"]}
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      <UserModal />
    </div>
  );
};

export default Dashboard;
