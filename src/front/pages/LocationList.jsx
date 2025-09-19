import React, { useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { LocationListBanner } from "../components/LocationListBanner.jsx";
import { SearchPage } from "../components/SearchPage.jsx";

export const LocationList = () => {

	return (
		<div className="container-fluid" style={{ minHeight: "85vh"}}>
			<LocationListBanner/>
			<SearchPage/>
		</div>
	);
}; 