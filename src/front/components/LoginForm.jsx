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
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!formData.credential.trim()) {
            newErrors.credential = "Username or email is required.";
        }
        if (!formData.passwordlogin) {
            newErrors.passwordlogin = "Password is required.";
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

            // store token and notify listeners
            localStorage.setItem("token", data.access_token);
            window.dispatchEvent(new Event("loginChange"));

            // show success modal (dynamic import) with fallback to alert
            try {
                const SwalModule = await import('sweetalert2');
                try { await import('sweetalert2/dist/sweetalert2.min.css'); } catch (e) { /* ignore css errors */ }
                const Swal = SwalModule.default || SwalModule;
                await Swal.fire({
                    icon: 'success',
                    title: 'Login successful',
                    text: 'Welcome!',
                    confirmButtonColor: '#006d77',
                });
            } catch (e) {
                try { window.alert('Login successful — Welcome back!'); } catch (err) { /* noop */ }
            }

            navigate("/myProfile");
        } catch (err) {
            setApiError("❌ Request error");
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="justify-self-center align-self-center" style={{ minWidth: "300px", maxWidth: "600px" }}>
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
                <div className="input-group">
                    <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control${errors.passwordlogin ? " is-invalid" : ""}`}
                        name="passwordlogin"
                        onChange={handleChange}
                        required
                        minLength={8}
                        maxLength={16}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 2l20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zm-8 4a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
                            </svg>
                        )}
                    </button>
                </div>
                {errors.passwordlogin && <div className="invalid-feedback d-block">{errors.passwordlogin}</div>}
            </div>
            <button className="btn btn-primary w-100 mt-2" type="submit">
                Log In
            </button>
        </form>
    );
}