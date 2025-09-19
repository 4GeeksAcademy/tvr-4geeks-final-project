import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../apicalls/loginRegisterApicalls";

export default function LoginForm({ setApiError }) {
    const [formData, setFormData] = useState({
        credential: "",
        passwordlogin: "",
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        const newErrors = {};
        if (!formData.credential.trim()) {
            newErrors.credential = "Username or email is required.";
        } else if (formData.credential.length < 4 || formData.credential.length > 30) {
            newErrors.credential = "Username or email must be between 4 and 30 characters.";
        }
        if (!formData.passwordlogin) {
            newErrors.passwordlogin = "Password is required.";
        } else if (formData.passwordlogin.length < 8 || formData.passwordlogin.length > 16) {
            newErrors.passwordlogin = "Password must be between 8 and 16 characters.";
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

    const request = {
        credential: formData.credential,
        password: formData.passwordlogin
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        try {
            const { ok, data } = await loginUser(request);
            if (!ok) {
                setApiError("❌ " + (data && data.message ? data.message : "Request error"));
                return;
            }
            localStorage.setItem("token", data.access_token);
            window.dispatchEvent(new Event("loginChange"));
            navigate("/myProfile");
        } catch (err) {
            setApiError("❌ Request error");
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="flex-grow-1 justify-self-center align-self-center" style={{ minWidth: "300px", maxWidth: "600px" }}>
            <div className="mb-3">
                <label className="form-label">Email or username</label>
                <input
                    type="text"
                    className={`form-control${errors.credential ? " is-invalid" : ""}`}
                    name="credential"
                    onChange={handleChange}
                    required
                    maxLength={30}
                    autoComplete="off"
                />
                {errors.credential && <div className="invalid-feedback">{errors.credential}</div>}
            </div>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                    type="password"
                    className={`form-control${errors.passwordlogin ? " is-invalid" : ""}`}
                    name="passwordlogin"
                    onChange={handleChange}
                    required
                    minLength={8}
                    maxLength={16}
                    autoComplete="off"
                />
                {errors.passwordlogin && <div className="invalid-feedback">{errors.passwordlogin}</div>}
            </div>
            <button className="btn btn-primary w-100" type="submit">
                Log In
            </button>
        </form>
    );
}