import React from "react";

function formatDate(date) {
    // date: objeto Date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export const WeatherDay = ({ type, date, data }) => {
    if (type === "past" || type === "future") {
        return (
            <div className="text-center px-2" style={{ minWidth: "130px" }}> 
                <div className="small">{formatDate(new Date(date))}</div>
                <img src={data.condition.icon.replace("//", "https://")} alt={data.condition.text} className="mb-2" />
                <div>
                    <span className="text-primary fw-bold">{data.mintemp_c}°C</span> / 
                    <span className="text-danger fw-bold"> {data.maxtemp_c}°C</span>
                </div>
                <div>
                    <span>{data.maxwind_kph} km/h</span>
                </div>
            </div>
        );
    } else if (type === "current") {
        return (
            <div className="text-center px-2 fw-bold" style={{ minWidth: "150px" }}>
                <div className="small">Now</div>
                <img src={data.condition.icon.replace("//", "https://")} alt={data.condition.text} className="mb-2" />
                <div>{data.temp_c}°C</div>
                <div>
                    <span>{data.wind_kph} km/h {data.wind_dir}</span>
                </div>
            </div>
        );
    }
};