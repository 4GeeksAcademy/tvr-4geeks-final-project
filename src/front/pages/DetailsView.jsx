import React, { useEffect, useState, useMemo } from "react";
import { PoiImagesCarousel } from "../components/PoiImagesCarousel";
import { WeatherCalendar } from "../components/WeatherCalendar";
import { MapComponent } from "../components/MapComponent";
import { getPoiDetails, getPoiTags, isFavorite, addFavorite, removeFavorite, isVisited, addVisited, removeVisited } from "../apicalls/detailsApicalls";
import { useParams, useNavigate } from "react-router-dom";

export const DetailsView = () => {
    const { Id } = useParams();
    const navigate = useNavigate();
    const [poi, setPoi] = useState(null);
    const [tags, setTags] = useState([]);
    const [city, setCity] = useState(null);
    const [country, setCountry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isVisit, setIsVisit] = useState(false);
    const [loadingDots, setLoadingDots] = useState(3);
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const poiRes = await getPoiDetails(Id);
                setPoi(poiRes.poi);
                const tagsRes = await getPoiTags(Id);
                setTags(tagsRes.tags || []);
                // Obtener ciudad y país si hay city_id
                if (poiRes.poi && poiRes.poi.city_id) {
                    const cityRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cities/${poiRes.poi.city_id}`);
                    if (cityRes.ok) {
                        const cityData = await cityRes.json();
                        setCity(cityData.city);
                        if (cityData.city && cityData.city.country_id) {
                            const countryRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/countries/${cityData.city.country_id}`);
                            if (countryRes.ok) {
                                const countryData = await countryRes.json();
                                setCountry(countryData.country || null);
                            } else {
                                setCountry(null);
                            }
                        } else {
                            setCountry(null);
                        }
                    } else {
                        setCity(null);
                        setCountry(null);
                    }
                } else {
                    setCity(null);
                    setCountry(null);
                }
            } catch (err) {
                setPoi(null);
                setTags([]);
                setCity(null);
                setCountry(null);
            }
            setLoading(false);
        };
        if (Id) fetchDetails();
    }, [Id]);
    // Memo para mostrar ciudad y país
    const cityCountryText = useMemo(() => {
        const cityName = city?.name;
        const countryName = country?.name;
        if (!cityName && !countryName) return null;
        return `${cityName || ''}${cityName && countryName ? ', ' : ''}${countryName || ''}`;
    }, [city, country]);

    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setLoadingDots(prev => (prev === 3 ? 1 : prev + 1));
        }, 350);
        return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Token:", token);
        setIsLoggedIn(!!token);
        if (token && Id) {
            isFavorite(Id, token)
                .then(fav => setIsFav(fav))
                .catch(() => setIsFav(false));
            isVisited(Id, token)
                .then(visited => setIsVisit(visited))
                .catch(() => setIsVisit(false));
        } else {
            setIsFav(false);
            setIsVisit(false);
        }
    }, [Id]);
    const handleVisited = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            if (isVisit) {
                await removeVisited(Id, token);
                setIsVisit(false);
            } else {
                await addVisited(Id, token);
                setIsVisit(true);
            }
        } catch (err) {
            alert("Error:" + err.message);
        }
    };

    const handleFavorite = async () => {
        const token = localStorage.getItem("token");
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
            alert("Error:" + err.message);
        }
    };

    if (loading) return <div className="text-center justify-content-center align-items-center container-fluid d-flex flex-grow-1">
        <h1>{`Loading${'.'.repeat(loadingDots)}`}</h1>
    </div>;
    if (!poi) return <div className="text-center justify-content-center align-items-center container-fluid d-flex flex-grow-1">
        <h1>POI not found</h1>
    </div>;

    return (
        <div className="container-fluid d-flex flex-column flex-lg-row p-0 flex-grow-1 detailsview-responsive">
            {/* Left column */}
            <div className="d-flex flex-column px-4 pt-4 left-col-responsive">
                <div className="d-flex flex-grow-1 flex-column w-100 h-75 poi-carousel-container" style={{ maxHeight: "550px" }}>
                    <PoiImagesCarousel poiId={Id} />
                </div>
                <div className="flex-shrink-1 overflow-auto p-3 bg-white border-top">
                    <h2 className="h5">Description</h2>
                    <p>{poi.description}</p>
                </div>
            </div>
            {/* Right column */}
            <div className="d-flex flex-column bg-light border-start pe-4 right-col-responsive">
                <div className=" d-flex flex-column justify-content-between p-3">
                    <h1 className="h4 mb-1 align-self-center">{poi.name}</h1>
                    {cityCountryText && (
                        <div className="mb-3 align-self-center text-muted" style={{ fontSize: '1.1rem' }}>{cityCountryText}</div>
                    )}
                    <div className="mb-3">
                        <WeatherCalendar lat={poi.latitude} lon={poi.longitude} />
                    </div>
                    {isLoggedIn ? (
                        <div className="d-flex gap-2">
                            <button
                                onClick={handleFavorite}
                                className={`btn flex-fill ${isFav ? "btn-remove-fav" : "btn-add-fav"}`}
                            >
                                {isFav ? "Remove from favorites" : "Add to favorites"}
                            </button>
                            <button
                                onClick={handleVisited}
                                className={`btn flex-fill ${isVisit ? "btn-remove-visit" : "btn-add-visit"}`}
                            >
                                {isVisit ? "Remove from visited" : "Mark as visited"}
                            </button>
                        </div>
                    ) : (
                        <div className="d-flex gap-2 justify-content-center">
                            <button
                                onClick={() => navigate('/login-register')}
                                className="btn btn-info btn-md rounded-pill px-3 py-2 shadow w-100"
                                style={{ maxWidth: '300px' }}
                            >
                                Log in to add favorites and visited
                            </button>
                        </div>
                    )}
                </div>
                {/* Map */}
                <div className="map-responsive p-3">
                    <MapComponent lat={poi.latitude} long={poi.longitude} />
                </div>
                {/* Tags */}
                <div className="p-3 d-flex flex-wrap align-items-end gap-2 mb-5">
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => navigate(`/locations?tag_name=${encodeURIComponent(tag.name)}`)}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>
            {/* Responsive columns CSS */}
            <style>{`
            /* Outline style for action buttons */
            .btn-add-fav {
                color: #E6A800 !important;
                border: 2px solid #E6A800 !important;
                background: transparent !important;
                transition: background 0.2s, color 0.2s;
            }
            .btn-add-fav:hover, .btn-add-fav:focus {
                background: #E6A800 !important;
                color: #222 !important;
            }
            .btn-remove-fav {
                color: #FF595E !important;
                border: 2px solid #FF595E !important;
                background: transparent !important;
                transition: background 0.2s, color 0.2s;
            }
            .btn-remove-fav:hover, .btn-remove-fav:focus {
                background: #FF595E !important;
                color: #fff !important;
            }
            .btn-add-visit {
                color: #079CB4 !important;
                border: 2px solid #079CB4 !important;
                background: transparent !important;
                transition: background 0.2s, color 0.2s;
            }
            .btn-add-visit:hover, .btn-add-visit:focus {
                background: #079CB4 !important;
                color: #fff !important;
            }
            .btn-remove-visit {
                color: #005B7F !important;
                border: 2px solid #005B7F !important;
                background: transparent !important;
                transition: background 0.2s, color 0.2s;
            }
            .btn-remove-visit:hover, .btn-remove-visit:focus {
                background: #005B7F !important;
                color: #fff !important;
            }
            @media (max-width: 991.98px) {
                .detailsview-responsive {
                    flex-direction: column !important;
                }
                .left-col-responsive, .right-col-responsive {
                    width: 100% !important;
                }
                .right-col-responsive {
                    border-left: none !important;
                    border-top: 1px solid #dee2e6 !important;
                    padding-left: 1rem !important;
                }
                .map-responsive {
                    height: 250px !important;
                    min-height: 180px !important;
                    max-height: 350px !important;
                }
                .map-responsive > * {
                    height: 100% !important;
                    min-height: 180px !important;
                }
                /* Limit carousel height and prevent overlap */
                .poi-carousel-container {
                    max-height: 550px !important;
                    overflow: hidden !important;
                }
                .poi-carousel-container > * {
                    height: auto !important;
                    max-height: 550px !important;
                }
            }
            /* Login button uses jumbotron styles */
            @media (min-width: 992px) {
                .detailsview-responsive {
                    flex-direction: row !important;
                }
                .left-col-responsive {
                    width: 65% !important;
                }
                .right-col-responsive {
                    width: 35% !important;
                    border-left: 1px solid #dee2e6 !important;
                    border-top: none !important;
                    padding-left: 0 !important;
                }
                .map-responsive {
                    height: 300px !important;
                    min-height: 200px !important;
                }
                .map-responsive > * {
                    height: 100% !important;
                    min-height: 200px !important;
                }
            }
            `}</style>
        </div>
    );
};