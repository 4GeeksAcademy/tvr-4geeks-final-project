import { useState } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import { registerUser } from "../apicalls/loginRegisterApicalls";

export default function RegisterForm({ setApiError, setIsSignIn }) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        user_name: "",
        email: "",
        password: "",
        confirm_password: "",
        date_of_birth: "",
        location: "",
        role: "",
    });
    const [passwordError, setPasswordError] = useState("");
    // Regex for password validation: at least 8 characters, 1 uppercase letter, 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const formatDateToMMDDYYYY = (isoDate) => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        return `${month}/${day}/${year}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        // Password validation
        if (!passwordRegex.test(formData.password)) {
            setPasswordError(
                "Password must be at least 8 characters long, contain at least 1 uppercase letter and 1 special character"
            );
            return;
        }
        // Confirm password validation
        if (formData.password !== formData.confirm_password) {
            setPasswordError("Password and Confirm Password do not match");
            return;
        }
        setPasswordError("");
        const body = {
            name: `${formData.first_name} ${formData.last_name}`,
            user_name: formData.user_name,
            email: formData.email,
            password: formData.password,
            birth_date: formatDateToMMDDYYYY(formData.date_of_birth),
            location: formData.location || null,
            role: formData.role || null,
        };
        const { ok, data } = await registerUser(body);
        if (!ok) {
            setApiError("❌ " + (data.message || "Request error"));
            return;
        }
        setFormData({
            first_name: "",
            last_name: "",
            user_name: "",
            email: "",
            password: "",
            confirm_password: "",
            date_of_birth: "",
            location: "",
            role: "",
        });
        setIsSignIn(true);
        setApiError("");
    };

    return (
        <form onSubmit={handleSubmit} className="flex-grow-1">
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$"
                        title="First name cannot contain numbers or special characters except spaces, hyphens, or apostrophes."
                        placeholder="John"
                    />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        pattern="^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$"
                        title="Last name cannot contain numbers or special characters except spaces, hyphens, or apostrophes."
                        placeholder="Doe"
                    />
                </div>
            </div>
            <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                    type="text"
                    className="form-control"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    maxLength={16}
                    pattern="^.{1,16}$"
                    title="Username cannot be longer than 16 characters."
                    placeholder="john_doe1"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                    title="Please enter a valid email address."
                    placeholder="john@email.com"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                    type="password"
                    className={`form-control ${passwordError ? "is-invalid" : ""}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    maxLength={16}
                    pattern="^.{1,16}$"
                    title="Password cannot be longer than 16 characters."
                    autoComplete="new-password"
                />
                {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                )}
            </div>
            <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                    type="password"
                    className={`form-control ${passwordError ? "is-invalid" : ""}`}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    title="Confirm password must match the password."
                    required
                    autoComplete="new-password"
                />
            </div>
            <div className="row">
                <div className="col-md-6 mb-3">
                <label className="form-label">Date of Birth</label>
                <input
                    type="date"
                    className="form-control"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    title="Required format: DD/MM/YYYY"
                />
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label">Location (optional)</label>
                <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Spain, Madrid"
                />
            </div>
            </div>
            <button className="btn btn-primary w-100" type="submit">
                Sign Up
            </button>
        </form>
    );
}
