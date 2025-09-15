const mapApiKey = import.meta.env.VITE_MAPTILER_KEY
const baseUrl = "https://api.maptiler.com/maps"
// /satellite or /basic-v2
// ?key=mapApiKey
// #zoom(15)/lat/long
// exampleurl = https://api.maptiler.com/maps/basic-v2/?key=pCTdrayALSo66alXdPTh#16.04/36.841229/-2.463654
export function getMapUrl(lat, long, zoom=15, style="basic-v2") {
    return `${baseUrl}/${style}/?key=${mapApiKey}#${zoom}/${lat}/${long}`;
}

export function getStaticMapUrl(lat, long, zoom=15, style="basic-v2", w=800, h=500) {
  const lon = long; // tu función de geocoding devuelve [lon, lat]
  return `${baseUrl}/${style}/static/${lon},${lat},${zoom}/${w}x${h}.png?key=${mapApiKey}&markers=${lon},${lat}&language=en`;
}

export async function getCoordinatesByName(locationName) {
    if (!locationName) throw new Error("Location name is required");
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(locationName)}.json?key=${mapApiKey}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    const data = await response.json();
    if (!data.features || data.features.length === 0) {
        throw new Error("No results found");
    }
    return data.features[0].center; // [long, lat]
}
