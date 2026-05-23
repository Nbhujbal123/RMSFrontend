import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaStore,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaPlus,
  FaCheckCircle,
  FaCopy,
  FaExternalLinkAlt
} from "react-icons/fa";
import SuperAdminLayout from "./SuperAdminLayout";
import { API_BASE_URL, FRONTEND_URL } from "../../config/api";

const CreateRestaurant = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null); // holds { siteCode, customerLink, adminLink }
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.restaurantName.trim()) newErrors.restaurantName = "Restaurant name is required";
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ""))) newErrors.phone = "Enter a valid 10-digit phone";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/superadmin/login");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE_URL}/superadmin/create-restaurant`,
        {
          restaurantName: formData.restaurantName,
          restaurantEmail: formData.email,
          restaurantPhone: formData.phone,
          adminName: formData.ownerName,
          adminEmail: formData.email,
          adminMobile: formData.phone,
          adminPassword: "admin123"
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
      );

      const siteCode = res.data.restaurant.siteCode;
      setSuccess({
        siteCode,
        customerLink: `${FRONTEND_URL}?siteCode=${siteCode}`,
        adminLink: `${FRONTEND_URL}/admin?siteCode=${siteCode}`
      });
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/superadmin/login");
        return;
      }
      const msg =
        error.response?.data?.message ||
        (error.code === "ECONNABORTED" ? "Request timed out. The server may be starting up — please try again." : null) ||
        (error.message ? `Network error: ${error.message}` : "Failed to create restaurant. Please try again.");
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
  };

  if (success) {
    return (
      <SuperAdminLayout title="Create Restaurant" subtitle="Add a new restaurant to the platform">
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div className="sa-card">
            <div style={{ padding: "36px 28px", textAlign: "center" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  background: "rgba(34,197,94,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "32px",
                  color: "#22c55e"
                }}
              >
                <FaCheckCircle />
              </div>
              <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Restaurant Created!</h4>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "28px" }}>
                <strong>{formData.restaurantName}</strong> has been successfully added to the platform.
              </p>

              {/* Site Code */}
              <div
                style={{
                  background: "rgba(99,102,241,0.06)",
                  border: "1.5px solid rgba(99,102,241,0.15)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  marginBottom: "16px",
                  textAlign: "left"
                }}
              >
                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                  Site Code
                </p>
                <div className="d-flex align-items-center justify-content-between">
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#6366f1", letterSpacing: "0.1em" }}>
                    {success.siteCode}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ borderRadius: "8px", background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", padding: "6px 12px" }}
                    onClick={() => copyToClipboard(success.siteCode)}
                  >
                    <FaCopy className="me-1" /> Copy
                  </button>
                </div>
              </div>

              {/* Default Password */}
              <div
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1.5px solid rgba(245,158,11,0.15)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  marginBottom: "16px",
                  textAlign: "left"
                }}
              >
                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                  Default Admin Password
                </p>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#d97706", fontFamily: "monospace" }}>
                  admin123
                </span>
                <span style={{ fontSize: "12px", color: "#f59e0b", marginLeft: "8px" }}>⚠ Change after first login</span>
              </div>

              {/* Customer Link */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  marginBottom: "12px",
                  textAlign: "left"
                }}
              >
                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                  Customer Menu Link
                </p>
                <div className="d-flex align-items-center gap-2">
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", flex: 1, wordBreak: "break-all" }}>
                    {success.customerLink}
                  </p>
                  <button
                    className="btn btn-sm"
                    style={{ borderRadius: "8px", background: "#f1f5f9", color: "#475569", border: "none", padding: "5px 10px", flexShrink: 0 }}
                    onClick={() => copyToClipboard(success.customerLink)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Admin Link */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  marginBottom: "24px",
                  textAlign: "left"
                }}
              >
                <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
                  Admin Login Link
                </p>
                <div className="d-flex align-items-center gap-2">
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", flex: 1, wordBreak: "break-all" }}>
                    {success.adminLink}
                  </p>
                  <button
                    className="btn btn-sm"
                    style={{ borderRadius: "8px", background: "#f1f5f9", color: "#475569", border: "none", padding: "5px 10px", flexShrink: 0 }}
                    onClick={() => copyToClipboard(success.adminLink)}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div className="d-flex gap-3">
                <button
                  className="btn flex-fill"
                  style={{ borderRadius: "10px", background: "#f1f5f9", color: "#475569", fontWeight: 600, padding: "10px" }}
                  onClick={() => {
                    setSuccess(null);
                    setFormData({ restaurantName: "", ownerName: "", email: "", phone: "" });
                  }}
                >
                  <FaPlus className="me-2" /> Add Another
                </button>
                <button
                  className="btn btn-primary flex-fill"
                  style={{ borderRadius: "10px", fontWeight: 600, padding: "10px" }}
                  onClick={() => navigate("/superadmin/restaurants")}
                >
                  <FaExternalLinkAlt className="me-2" /> View All
                </button>
              </div>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Create Restaurant"
      subtitle="Add a new restaurant to the platform"
    >
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div className="sa-card">
          <div className="sa-card__header">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "18px"
                }}
              >
                <FaStore />
              </div>
              <div>
                <h6 className="sa-card__title">Restaurant Details</h6>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>Fill in the details to onboard a new restaurant</p>
              </div>
            </div>
          </div>

          <div className="sa-card__body">
            {errors.submit && (
              <div
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1.5px solid rgba(239,68,68,0.2)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "13.5px",
                  color: "#dc2626"
                }}
              >
                ⚠ {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-4">

                {/* Restaurant Name */}
                <div className="col-12 col-sm-6">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                    Restaurant Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text"
                      style={{ background: "#f8fafc", border: `1.5px solid ${errors.restaurantName ? "#ef4444" : "#e2e8f0"}`, borderRight: "none", color: "#94a3b8" }}
                    >
                      <FaStore />
                    </span>
                    <input
                      type="text"
                      name="restaurantName"
                      className="form-control"
                      placeholder="e.g. Spice Hub"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      style={{
                        border: `1.5px solid ${errors.restaurantName ? "#ef4444" : "#e2e8f0"}`,
                        borderLeft: "none",
                        fontSize: "13.5px",
                        borderRadius: "0 10px 10px 0"
                      }}
                    />
                  </div>
                  {errors.restaurantName && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>{errors.restaurantName}</p>
                  )}
                </div>

                {/* Owner Name */}
                <div className="col-12 col-sm-6">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                    Owner / Admin Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text"
                      style={{ background: "#f8fafc", border: `1.5px solid ${errors.ownerName ? "#ef4444" : "#e2e8f0"}`, borderRight: "none", color: "#94a3b8" }}
                    >
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      name="ownerName"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.ownerName}
                      onChange={handleChange}
                      style={{
                        border: `1.5px solid ${errors.ownerName ? "#ef4444" : "#e2e8f0"}`,
                        borderLeft: "none",
                        fontSize: "13.5px",
                        borderRadius: "0 10px 10px 0"
                      }}
                    />
                  </div>
                  {errors.ownerName && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>{errors.ownerName}</p>
                  )}
                </div>

                {/* Email */}
                <div className="col-12 col-sm-6">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                    Email Address <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text"
                      style={{ background: "#f8fafc", border: `1.5px solid ${errors.email ? "#ef4444" : "#e2e8f0"}`, borderRight: "none", color: "#94a3b8" }}
                    >
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="e.g. admin@spicehub.com"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        border: `1.5px solid ${errors.email ? "#ef4444" : "#e2e8f0"}`,
                        borderLeft: "none",
                        fontSize: "13.5px",
                        borderRadius: "0 10px 10px 0"
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="col-12 col-sm-6">
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                    Phone Number <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text"
                      style={{ background: "#f8fafc", border: `1.5px solid ${errors.phone ? "#ef4444" : "#e2e8f0"}`, borderRight: "none", color: "#94a3b8" }}
                    >
                      <FaPhone />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        border: `1.5px solid ${errors.phone ? "#ef4444" : "#e2e8f0"}`,
                        borderLeft: "none",
                        fontSize: "13.5px",
                        borderRadius: "0 10px 10px 0"
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}>{errors.phone}</p>
                  )}
                </div>

              </div>

              {/* Info Note */}
              <div
                style={{
                  background: "rgba(6,182,212,0.06)",
                  border: "1.5px solid rgba(6,182,212,0.15)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginTop: "24px",
                  fontSize: "12.5px",
                  color: "#0891b2"
                }}
              >
                ℹ A site code will be auto-generated. The default admin password is <strong>admin123</strong>. Share the links with the restaurant owner after creation.
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-100 mt-4"
                disabled={loading}
                style={{
                  borderRadius: "12px",
                  padding: "13px",
                  fontWeight: 700,
                  fontSize: "14.5px",
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
                  transition: "all 0.2s"
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Restaurant...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" /> Create Restaurant
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default CreateRestaurant;
