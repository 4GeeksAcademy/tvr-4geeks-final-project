export async function isVisited(poiId, token) {
  if (!token) throw new Error("Authentication token is required");
  const url = `${baseUrl}/api/visited`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const visited = await response.json();
  return visited.some((visit) => String(visit.poi_id) === String(poiId));
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
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function getPoiDetails(poiId) {
  if (!poiId) throw new Error("POI ID is required");
  const url = `${baseUrl}/api/pois/${poiId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}

export async function getPoiTags(poiId) {
  if (!poiId) throw new Error("POI ID is required");
  const url = `${baseUrl}/api/pois/${poiId}/tags`;
  const response = await fetch(url);
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
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const favorites = await response.json();
  return favorites.some((fav) => String(fav.poi_id) === String(poiId));
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
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return await response.json();
}
