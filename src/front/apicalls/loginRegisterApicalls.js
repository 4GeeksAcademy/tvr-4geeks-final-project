const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const loginUser = async (request) => {
    const url = `${BACKEND_URL}/api/login`;
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });
    const data = await resp.json();
    return { ok: resp.ok, data };
};

export const registerUser = async (userData) => {
    const url = `${BACKEND_URL}/api/register`;
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    const data = await resp.json();
    return { ok: resp.ok, data };
};

export const fetchPoiImages = async () => {
    const url = `${BACKEND_URL}/api/poiimages`;
    const resp = await fetch(url);
    const data = await resp.json();
    return { ok: resp.ok, data };
};