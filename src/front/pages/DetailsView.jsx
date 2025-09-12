import React, { useEffect, useState, useContext } from "react";
import { PoiImagesCarousel } from "../components/PoiImagesCarousel";
import { WeatherCalendar } from "../components/WeatherCalendar";
import { MapComponent } from "../components/MapComponent";
import { getPoiDetails, getPoiTags } from "../apicalls/detailsApicalls";
//import { AuthContext } from "../context/AuthContext"; // Adjust if your context is different

export const DetailsView = ({ poiId = "31987581-46ce-4692-978a-06f103cce434" }) => {
    const [poi, setPoi] = useState(null);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    //const { isLoggedIn, token } = useContext(AuthContext);
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const poiRes = await getPoiDetails(poiId);
                console.log(poiRes);
                setPoi(poiRes.poi);
                const tagsRes = await getPoiTags(poiId);
                setTags(tagsRes.tags || []);
                // If you have a function to check favorites, use it here
                // Example: const fav = await isFavorite(token, poiId); setIsFav(fav);
            } catch (err) {
                setPoi(null);
                setTags([]);
            }
            setLoading(false);
        };
        if (poiId) fetchDetails();
    }, [poiId /*, token*/]);

    const handleFavorite = async () => {
        if (!isLoggedIn) return;
        try {
            if (isFav) {
                // Remove from favorites
                // await removeFavorite(poiId, token);
                setIsFav(false);
            } else {
                // Add to favorites
                // await addFavorite(poiId, token);
                setIsFav(true);
            }
        } catch (err) {}
    };

    if (loading) return <div className="text-center my-5">Loading...</div>;
    if (!poi) return <div className="text-center my-5">POI not found</div>;

    return (
        <div className="container-fluid">
            <div className="row vh-100">
                {/* Left column */}
                <div className="col-lg-8 col-md-7 col-12 d-flex flex-column h-100">
                    <div className="flex-grow-1" style={{ minHeight: 0 }}>
                        <div className="h-65">
                            <PoiImagesCarousel poiId={poiId} />
                        </div>
                    </div>
                    <div className="flex-shrink-1 overflow-auto p-3 bg-white border-top">
                        <h2 className="h5">Description</h2>
                        <p>{poi.description}</p>
                    </div>
                </div>
                {/* Right column */}
                <div className="col-lg-4 col-md-5 col-12 d-flex flex-column h-100 bg-light border-start">
                    {/* Info, weather and favorites */}
                    <div className="flex-grow-1 d-flex flex-column justify-content-between p-3">
                        <h1 className="h4 mb-3">{poi.name}</h1>
                        <div className="mb-3">
                            <WeatherCalendar lat={poi.latitude} lon={poi.longitude} />
                        </div>
                        {/*isLoggedIn &&*/ (
                            <button
                                onClick={handleFavorite}
                                className={`btn ${isFav ? "btn-danger" : "btn-primary"} w-100`}
                            >
                                {isFav ? "Remove from favorites" : "Add to favorites"}
                            </button>
                        )}
                    </div>
                    {/* Map */}
                    <div className="flex-grow-1 p-3">
                        <MapComponent lat={poi.latitude} long={poi.longitude} />
                    </div>
                    {/* Tags */}
                    <div className="flex-grow-1 p-3 d-flex flex-wrap align-items-end gap-2">
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