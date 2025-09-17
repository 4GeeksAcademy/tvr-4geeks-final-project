import { useState } from "react";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LoginForm({ setApiError }) {
    const [formData, setFormData] = useState({
        emaillogin: "",
        passwordlogin: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const url = `${BACKEND_URL}/api/login`;
        const body = {
            email: formData.emaillogin,
            password: formData.passwordlogin,
        };
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await resp.json();
        console.log("Login response data:", data);
        if (!resp.ok) {
            setApiError("❌ " + (data.message || "Request error"));
            return;
        }
        sessionStorage.setItem("token", data.access_token);
        window.dispatchEvent(new Event("loginChange"));
        navigate("/dashboard");
    };

    return (
        <form onSubmit={handleSubmit} className="flex-grow-1">
            <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                    type="text"
                    className="form-control"
                    name="emaillogin"
                    onChange={handleChange}
                    required
                    autoComplete="off"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                    type="password"
                    className="form-control"
                    name="passwordlogin"
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                />
            </div>
            <button className="btn btn-primary w-100" type="submit">
                Enter
            </button>
        </form>
    );
}
