import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../apicalls/loginRegisterApicalls";

export default function LoginForm({ setApiError }) {
    const [formData, setFormData] = useState({
        credential: "",
        passwordlogin: "",
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const request = {
        credential: formData.credential,
        password: formData.passwordlogin
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        try {
            const { ok, data } = await loginUser(request);
            if (!ok) {
                setApiError("❌ " + (data && data.message ? data.message : "Request error"));
                return;
            }
            sessionStorage.setItem("token", data.access_token);
            window.dispatchEvent(new Event("loginChange"));
            navigate("/myProfile");
        } catch (err) {
            setApiError("❌ Request error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-grow-1 justify-self-center align-self-center" style={{ minWidth: "300px", maxWidth: "600px" }}>
            <div className="mb-3">
                <label className="form-label">Email or useranme</label>
                <input
                    type="text"
                    className="form-control"
                    name="credential"
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
