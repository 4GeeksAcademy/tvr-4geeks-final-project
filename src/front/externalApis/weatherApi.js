const weatherApiKey = import.meta.env.VITE_WEATHERAPI_KEY;
const baseUrl = "https://api.weatherapi.com/v1";

//(current or forecast or history) .json
// ?key=weatherApiKey
// &q=lat,long
// if forecast: &days=n
// if history: &dt=yyyy-MM-dd
// exampleurl = http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${lat},${long}

export async function getWeather(lat, long, type = "current", days = 1, date = "") {
    if (!lat || !long) throw new Error("Latitude and Longitude are required");
    let url = `${baseUrl}/${type}.json?key=${weatherApiKey}&q=${lat},${long}`;
    if (type === "forecast") {
        url += `&days=${days}`;
    } else if (type === "history") {
        url += `&dt=${date}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }
    console.log(response)
    return await response.json();
}

