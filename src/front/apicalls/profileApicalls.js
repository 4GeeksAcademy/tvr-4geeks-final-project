const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const fetchMyProfile = async (token) => {
  const url = `${BACKEND_URL}/api/myProfile`;

  const resp = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await resp.json();
  } catch (error) {
    data = null;
  }

  return { ok: resp.ok, data };
};