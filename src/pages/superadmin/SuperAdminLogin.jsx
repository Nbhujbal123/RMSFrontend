import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";

const SuperAdminLogin = () => {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: credentials.email.trim(),
          password: credentials.password,
          siteCode: "SUPERADMIN"
        },
        { timeout: 30000 }
      );

      localStorage.setItem("token", res.data.token);
      navigate("/superadmin/dashboard");

    } catch (err) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server is taking too long to respond. If using the hosted server, it may be waking up — please wait 30 seconds and try again.");
      } else if (err.response) {
        setError(err.response.data?.message || "Login failed. Please check your credentials.");
      } else {
        setError("Cannot reach the server. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}
    >
      <div
        className="bg-white p-5 shadow-lg"
        style={{ width: "420px", borderRadius: "15px" }}
      >
        <div className="text-center mb-4">
          <FaUserShield size={45} color="#667eea" />
          <h3 className="mt-2 fw-bold">Super Admin</h3>
          <p className="text-muted" style={{ fontSize: "14px" }}>
            Login to manage restaurants
          </p>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 px-3 mb-3"
            style={{ fontSize: "13px", borderRadius: "8px" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="superadmin@restom.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <input
                type={showPwd ? "text" : "password"}
                className="form-control"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
            style={{
              background: "#667eea",
              color: "#fff",
              padding: "10px",
              fontWeight: "600",
              borderRadius: "8px",
              opacity: loading ? 0.75 : 1
            }}
          >
            {loading && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            )}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
