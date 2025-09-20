import { handleUnauthorized } from "../utils/auth";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const parseJson = async (resp) => {
  try {
    return await resp.json();
  } catch (error) {
    return null;
  }
};

export const fetchMyProfile = async (token) => {
  const url = `${BACKEND_URL}/api/myProfile`;

  const resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // If unauthorized, clear token and notify app
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const updateMyProfile = async (token, payload) => {
  const url = `${BACKEND_URL}/api/myProfile`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const fetchPoi = async (poiId) => {
  const resp = await fetch(`${BACKEND_URL}/api/pois/${poiId}`);
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const fetchCity = async (cityId) => {
  const resp = await fetch(`${BACKEND_URL}/api/cities/${cityId}`);
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const fetchCountries = async () => {
  const resp = await fetch(`${BACKEND_URL}/api/countries`);
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const fetchPoisByCityName = async (cityName) => {
  const url = new URL(`${BACKEND_URL}/api/pois`);
  if (cityName) {
    url.searchParams.set("city_name", cityName);
  }
  const resp = await fetch(url);
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};

export const fetchAllPois = async () => {
  const resp = await fetch(`${BACKEND_URL}/api/pois`);
  handleUnauthorized(resp);
  return { ok: resp.ok, data: await parseJson(resp) };
};
