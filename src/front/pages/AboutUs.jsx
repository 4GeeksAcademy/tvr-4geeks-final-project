import React from "react";
import logo from "../assets/img/logo.png";

export function AboutUs() {
    return (
        <div className="container py-5 flex-grow-1">
            <div className="text-center mb-5">
                <img
                    src={logo}
                    alt="Logo"
                    className="mb-4"
                    style={{ width: "140px" }}
                />
                <h1 className="h3 fw-bold">About Our Travel App</h1>
                <p className="text-muted mx-auto" style={{ maxWidth: 700 }}>
                    We are a platform designed to help you discover and plan unforgettable experiences around the world.
                    Our goal is to combine weather data, geographic exploration, and personalization to optimize your trips.
                </p>
            </div>

            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm" style={{background: "linear-gradient(to top, #72E1D1, #EDF6F9)"}}>
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title">Our Mission</h5>
                            <p className="card-text small text-muted mb-0">
                                To facilitate smart exploration of destinations through reliable data, personalized recommendations, and visual tools
                                that inspire safe and memorable adventures.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm" style={{background: "linear-gradient(to top, #72E1D1, #EDF6F9)"}}>
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title">Our Vision</h5>
                            <p className="card-text small text-muted mb-0">
                                To become the go-to app for travelers seeking to combine planning, cultural discovery, and sustainability in a single digital experience.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm" style={{background: "linear-gradient(to top, #72E1D1, #EDF6F9)"}}>
                        <div className="card-body d-flex flex-column">
                            <h5 className="card-title">Our Values</h5>
                            <p className="card-text small text-muted mb-0">
                                Transparency, usability, continuous innovation, user focus, and a passion for connecting people with unique places.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="h5 fw-bold mb-3 text-center">The Team</h2>
            <div className="row g-4 mb-5">
                {[
                    {
                        name: "Tito González",
                        linkedin: "https://www.linkedin.com/in/tito-julio-gonzalez-padial-7b7292330",
                        github: "https://github.com/tgp034",
                        despcription: "Full Stack Developer skilled in creating web applications from front-end to back-end."
                    },
                    {
                        name: "Vicente Vetrano",
                        linkedin: "https://www.linkedin.com/in/vicente-vetrano-a21381266",
                        github: "https://github.com/VicenteVD",
                        despcription: "Crafting High-Impact, Optimized Web Experiences"
                    },
                    {
                        name: "Raphael Kunstmann",
                        linkedin: "https://www.linkedin.com/in/raphael-kunstmann-98707b278",
                        github: "https://github.com/ThatRapho",
                        despcription: "Full Stack Developer delivering user-friendly interfaces backed by solid server-side logic."
                    }
                ].map((dev, i) => (
                    <div className="col-md-4" key={dev.name}>
                        <div className="card h-100 shadow-sm" style={{
                            border: "2px solid rgba(8, 163, 177, 0.4)", 
                            borderRadius: "15px" 
                        }}>
                            <div className="card-body d-flex flex-column text-center">
                                <div className="rounded-circle bg-light mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 90, height: 90, fontSize: 34 }}>
                                    {dev.name.split(' ')[0][0]}{dev.name.split(' ')[1][0]}
                                </div>
                                <h6 className="fw-bold mb-1">{dev.name}</h6>
                                <p className="text-muted small mb-2">Full Stack Developer</p>
                                <p className="small flex-grow-1 text-muted">
                                    {dev.despcription}
                                </p>
                                <div className="d-flex justify-content-center gap-2">
                                    {dev.linkedin && (
                                        <a href={dev.linkedin} className="btn btn-outline-primary btn-sm" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                                    )}
                                    {dev.github && (
                                        <a href={dev.github} className="btn btn-outline-dark btn-sm" target="_blank" rel="noopener noreferrer">GitHub</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="h5 fw-bold mb-4 text-center">Key Technologies</h2>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-2">
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">MapTiler API</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">OpenWeather API</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">React</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">Vite</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">JavaScript</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">Bootstrap</span>
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-2">
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">Python</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">Flask</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">SQLAlchemy</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">PostgreSQL</span>
                <span className="badge text-center d-flex align-items-center bg-secondary bg-opacity-75 p-2 fs-6">SQL</span>
            </div>
        </div>
    );
}

export default AboutUs;
