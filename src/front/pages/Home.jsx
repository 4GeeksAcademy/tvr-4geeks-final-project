import React, { useEffect } from "react"
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { HomeJumbotron } from "../components/HomeJumbotron"
import { PopularLocations } from "../components/PopularLocations"

export const Home = () => {

	return (
		<div className="container-fluid p-0">
			<HomeJumbotron/>
			<PopularLocations/>
		</div>
	);
}; 