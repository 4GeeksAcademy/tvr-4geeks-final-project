import { handleUnauthorized } from "../utils/auth";

export async function isVisited(poiId, token) {
  if (!token) throw new Error("Authentication token is required");
  console.log("Checking visited for POI ID:", poiId, "with token:", token);
  const url = `${baseUrl}/api/visited`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  const visitedList = Array.isArray(data) ? data : data.visited || [];
  return visitedList.some(
    (visit) => String(visit.poi_id ?? visit.id) === String(poiId)
  );
}

export async function addVisited(poiId, token) {
  if (!poiId) throw new Error("POI ID is required");
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/visited`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ poi_id: poiId }),
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function removeVisited(poiId, token) {
  if (!poiId) throw new Error("POI ID is required");
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/visited/${poiId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}
const baseUrl = import.meta.env.VITE_BACKEND_URL;

export async function getPoiImages(poiId) {
  if (!poiId) throw new Error("POI ID is required");
  const url = `${baseUrl}/api/pois/${poiId}/poiimages`;
  const response = await fetch(url);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function getPoiDetails(poiId) {
  if (!poiId) throw new Error("POI ID is required");
  const url = `${baseUrl}/api/pois/${poiId}`;
  const response = await fetch(url);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function getPoiTags(poiId) {
  if (!poiId) throw new Error("POI ID is required");
  const url = `${baseUrl}/api/pois/${poiId}/tags`;
  const response = await fetch(url);
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function isFavorite(poiId, token) {
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/favorites`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const data = await response.json();
  const favoritesList = Array.isArray(data) ? data : data.favorites || [];
  return favoritesList.some(
    (fav) => String(fav.poi_id ?? fav.id) === String(poiId)
  );
}

export async function addFavorite(poiId, token) {
  if (!poiId) throw new Error("POI ID is required");
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/favorites`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ poi_id: poiId }),
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function removeFavorite(poiId, token) {
  if (!poiId) throw new Error("POI ID is required");
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/favorites/${poiId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  handleUnauthorized(response);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}
