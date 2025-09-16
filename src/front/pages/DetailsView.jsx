import React, { useEffect, useState, useContext } from "react";
import { PoiImagesCarousel } from "../components/PoiImagesCarousel";
import { WeatherCalendar } from "../components/WeatherCalendar";
import { MapComponent } from "../components/MapComponent";
import { getPoiDetails, getPoiTags, isFavorite, addFavorite, removeFavorite } from "../apicalls/detailsApicalls";
import { useParams } from "react-router-dom";

export const DetailsView = () => {
    const { Id} = useParams();
    const [poi, setPoi] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const poiRes = await getPoiDetails(Id);
                setPoi(poiRes.poi);
                const tagsRes = await getPoiTags(Id);
                setTags(tagsRes.tags || []);
            } catch (err) {
                setPoi(null);
                setTags([]);
            }
            setLoading(false);
        };
        if (Id) fetchDetails();
    }, [Id]);

    // Chequea si el usuario está logeado y si el POI es favorito
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        setIsLoggedIn(!!token);
        if (token && Id) {
            isFavorite(token, Id)
                .then(fav => setIsFav(fav))
                .catch(() => setIsFav(false));
        } else {
            setIsFav(false);
        }
    }, [Id]);

    const handleFavorite = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        try {
            if (isFav) {
                await removeFavorite(Id, token);
                setIsFav(false);
            } else {
                await addFavorite(Id, token);
                setIsFav(true);
            }
        } catch (err) {
            alert("Error updating favorite status");
        }
    };

    if (loading) return <div className="text-center my-5">Loading...</div>;
    if (!poi) return <div className="text-center my-5">POI not found</div>;

    return (
        <div className="container-fluid">
            <div className="row vh-100">
                {/* Left column */}
                <div className="col-lg-7 col-md-7 col-12 d-flex flex-column h-100">
                    <div className="h-75">
                        <PoiImagesCarousel poiId={Id} />
                    </div>
                    <div className="flex-shrink-1 overflow-auto p-3 bg-white border-top">
                        <h2 className="h5">Description</h2>
                        <p>{poi.description}</p>
                    </div>
                </div>
                {/* Right column */}
                <div className="col-lg-5 col-md-5 col-12 d-flex flex-column h-100 bg-light border-start pe-4">
                    {/* Info, weather and favorites */}
                    <div className=" d-flex flex-column justify-content-between p-3">
                        <h1 className="h4 mb-3 align-self-center">{poi.name}</h1>
                        <div className="mb-3">
                            <WeatherCalendar lat={poi.latitude} lon={poi.longitude} />
                        </div>
                        {isLoggedIn && (
                            <button
                                onClick={handleFavorite}
                                className={`btn ${isFav ? "btn-danger" : "btn-primary"} w-100`}
                            >
                                {isFav ? "Remove from favorites" : "Add to favorites"}
                            </button>
                        )}
                    </div>
                    {/* Map */}
                    <div className="h-50 p-3">
                        <MapComponent lat={poi.latitude} long={poi.longitude} />
                    </div>
                    {/* Tags */}
                    <div className="p-3 d-flex flex-wrap align-items-end gap-2">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                className="btn btn-outline-secondary btn-sm"
                                disabled
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};