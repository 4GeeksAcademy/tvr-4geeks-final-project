import React, { useEffect, useState } from "react";
import { getPoiImages } from "../apicalls/detailsApicalls";

export const PoiImagesCarousel = ({ poiId }) => {
    const [images, setImages] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            setLoading(true);
            try {
                const res = await getPoiImages(poiId);
                setImages(res.images || []);
                setCurrent(0);
            } catch (err) {
                setImages([]);
            }
            setLoading(false);
        };

        if (poiId) fetchImages();
    }, [poiId]);

    const prevImage = () => {
        setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const nextImage = () => {
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    if (loading) return <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center">Loading images...</div>;
    if (!images.length) return <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center">
        No images available.
    </div>;

    return (
        <div className="position-relative w-100 h-100 d-flex justify-content-center align-items-center">
            <img
                src={images[current].url}
                alt={`Imagen ${current + 1}`}
                className="img-fluid rounded"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
                onClick={prevImage}
                className="btn btn-light p-0 m-1 position-absolute top-50 start-0 translate-middle-y"
                aria-label="Previous"
            >
                <span>&#9664;</span>
            </button>
            <button
                onClick={nextImage}
                className="btn btn-light p-0 m-1 position-absolute top-50 end-0 translate-middle-y"
                aria-label="Next"
            >
                <span>&#9654;</span>
            </button>
        </div>
    );
};