import React, { useEffect, useState } from "react";
import { getWeather } from "../externalApis/weatherApi";
import { WeatherDay } from "./WeatherDay";

function formatDate(date) {
    // date: objeto Date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export const WeatherCalendar = ({ lat, lon }) => {
    const [weatherData, setWeatherData] = useState({
        previous: [],
        current: null,
        next: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            try {
                const today = new Date();
                const prevDates = [
                    new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 2)),
                    new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 1))
                ];
                const prevDateStrs = prevDates.map(d =>formatDate(d));
                const prevPromises = prevDateStrs.map(date =>
                    getWeather(lat, lon, "history", 1, formatDate(new Date(date))).then(data => {
                        console.log(formatDate(new Date(date)));
                        return data;
                    })
                );
                const currentPromise = getWeather(lat, lon, "current");
                const nextDays = 4;
                const nextPromise = getWeather(lat, lon, "forecast", nextDays);

                const [prev1, prev2, current, next] = await Promise.all([
                    ...prevPromises,
                    currentPromise,
                    nextPromise
                ]);

                setWeatherData({
                    previous: [prev1, prev2],
                    current,
                    next: next.forecast.forecastday.slice(1)
                });
            } catch (err) {
                setWeatherData({ previous: [], current: null, next: [] });
            }
            setLoading(false);
        };
        fetchWeather();
    }, [lat, lon]);

    if (loading) return <div className="text-center">Loading...</div>;

    return (
        <div className="d-flex gap-3 align-items-evenly justify-content-evenly overflow-auto">
            {weatherData.previous.map((day, idx) => (
                <WeatherDay
                    key={`prev-${idx}`}
                    type="past"
                    date={day.forecast.forecastday[0].date}
                    data={day.forecast.forecastday[0].day}
                />
            ))}
            {weatherData.current && (
                <WeatherDay
                    type="current"
                    date={weatherData.current.location.localtime}
                    data={weatherData.current.current}
                />
            )}
            {weatherData.next.map((day, idx) => (
                <WeatherDay
                    key={`next-${idx}`}
                    type="future"
                    date={day.date}
                    data={day.day}
                />
            ))}
        </div>
    );
};