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
    const [errors, setErrors] = useState({});
    // Regex for password validation: at least 8 characters, 1 uppercase letter, 1 special character
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    const validate = () => {
        const newErrors = {};
        // First Name
        if (!formData.first_name.trim()) {
            newErrors.first_name = "First name is required.";
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,30}$/.test(formData.first_name)) {
            newErrors.first_name = "First name can contain only letters, spaces, hyphens or apostrophes (max 30 characters).";
        }
        // Last Name
        if (!formData.last_name.trim()) {
            newErrors.last_name = "Last name is required.";
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]{1,30}$/.test(formData.last_name)) {
            newErrors.last_name = "Last name can contain only letters, spaces, hyphens or apostrophes (max 30 characters).";
        }
        // Username
        if (!formData.user_name.trim()) {
            newErrors.user_name = "Username is required.";
        } else if (!/^[A-Za-z0-9_]{4,16}$/.test(formData.user_name)) {
            newErrors.user_name = "Username must be 4-16 characters, only letters, numbers and underscore.";
        }
        // Email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email) || formData.email.length > 30) {
            newErrors.email = "Please enter a valid email (max. 30 characters).";
        }
        // Password
        if (!formData.password) {
            newErrors.password = "Password is required.";
        } else if (!passwordRegex.test(formData.password)) {
            newErrors.password = "Password must be at least 8 characters long, contain at least 1 uppercase letter and 1 special character.";
        } else if (formData.password.length < 8 || formData.password.length > 16) {
            newErrors.password = "Password must be between 8 and 16 characters.";
        }
        // Confirm Password
        if (!formData.confirm_password) {
            newErrors.confirm_password = "Confirm password is required.";
        } else if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = "Password and Confirm Password do not match.";
        }
        // Date of Birth
        if (!formData.date_of_birth) {
            newErrors.date_of_birth = "Date of birth is required.";
        }
        // Location (optional, but max length)
        if (formData.location && formData.location.length > 30) {
            newErrors.location = "Location must be max 30 characters.";
        }
        return newErrors;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setErrors({ ...errors, [e.target.name]: undefined });
    };

    const formatDateToMMDDYYYY = (isoDate) => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split("-");
        return `${month}/${day}/${year}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        const body = {
            name: `${formData.first_name} ${formData.last_name}`,
            user_name: formData.user_name,
            email: formData.email,
            password: formData.password,
            birth_date: formatDateToMMDDYYYY(formData.date_of_birth),
            location: formData.location || null,
            role: formData.role || null,
        };
        try {
            const { ok, data } = await registerUser(body);
            if (!ok) {
                setApiError("❌ " + (data && data.message ? data.message : "Request error"));
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
        } catch (err) {
            setApiError("❌ Request error");
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="flex-grow-1 justify-self-center align-self-center" style={{ minWidth: "300px", maxWidth: "600px" }}>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input
                        type="text"
                        className={`form-control${errors.first_name ? " is-invalid" : ""}`}
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        maxLength={30}
                        placeholder="John"
                    />
                    {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                        type="text"
                        className={`form-control${errors.last_name ? " is-invalid" : ""}`}
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        maxLength={30}
                        placeholder="Doe"
                    />
                    {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
                </div>
            </div>
            <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                    type="text"
                    className={`form-control${errors.user_name ? " is-invalid" : ""}`}
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                    maxLength={16}
                    placeholder="john_doe1"
                />
                {errors.user_name && <div className="invalid-feedback">{errors.user_name}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    className={`form-control${errors.email ? " is-invalid" : ""}`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    maxLength={30}
                    placeholder="john@email.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                    type="password"
                    className={`form-control${errors.password ? " is-invalid" : ""}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    maxLength={16}
                    autoComplete="new-password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                    type="password"
                    className={`form-control${errors.confirm_password ? " is-invalid" : ""}`}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    maxLength={16}
                    autoComplete="new-password"
                />
                {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
            </div>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input
                        type="date"
                        className={`form-control${errors.date_of_birth ? " is-invalid" : ""}`}
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        required
                    />
                    {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Location (optional)</label>
                    <input
                        type="text"
                        className={`form-control${errors.location ? " is-invalid" : ""}`}
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        maxLength={30}
                        placeholder="City, Country"
                    />
                    {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                </div>
            </div>
            <button className="btn btn-primary w-100" type="submit">
                Register
            </button>
        </form>
    );
}
