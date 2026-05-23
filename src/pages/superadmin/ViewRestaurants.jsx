import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCopy,
  FaPowerOff,
  FaSearch,
  FaBan,
  FaPlus,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaUserShield,
  FaUsers
} from "react-icons/fa";
import { toast } from "../../components/Toast";
import SuperAdminLayout from "./SuperAdminLayout";
import { API_BASE_URL, FRONTEND_URL } from "../../config/api";

const ViewRestaurants = () => {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurants(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantStatus = async (siteCode, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not logged in. Please login again.");
        navigate("/superadmin/login");
        return;
      }
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await axios.put(
        `${API_BASE_URL}/superadmin/restaurants/${siteCode.toUpperCase()}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRestaurants();
      toast.success(
        newStatus === "INACTIVE"
          ? "Restaurant has been deactivated."
          : "Restaurant has been activated."
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update restaurant status");
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && r.status === "ACTIVE") ||
      (statusFilter === "INACTIVE" && r.status !== "ACTIVE");
    return matchSearch && matchStatus;
  });

  const totalActive = restaurants.filter(r => r.status === "ACTIVE").length;
  const totalInactive = restaurants.filter(r => r.status !== "ACTIVE").length;

  const headerAction = (
    <button
      className="btn btn-primary d-none d-md-flex align-items-center gap-2"
      style={{ borderRadius: "10px", fontWeight: 600, fontSize: "13.5px" }}
      onClick={() => navigate("/superadmin/create-restaurant")}
    >
      <FaPlus /> Add Restaurant
    </button>
  );

  if (loading) {
    return (
      <SuperAdminLayout title="Manage Restaurants" subtitle="All restaurants on your platform">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border" style={{ color: "#6366f1", width: "48px", height: "48px" }} />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Manage Restaurants"
      subtitle={`${restaurants.length} restaurants on platform`}
      action={headerAction}
    >

      {/* SUMMARY CARDS */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total", value: restaurants.length, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
          { label: "Active", value: totalActive, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
          { label: "Inactive", value: totalInactive, color: "#ef4444", bg: "rgba(239,68,68,0.08)" }
        ].map((s, i) => (
          <div className="col-4" key={i}>
            <div
              style={{
                background: s.bg,
                border: `1.5px solid ${s.color}20`,
                borderRadius: "14px",
                padding: "16px 18px",
                textAlign: "center"
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <h3 style={{ margin: 0, fontWeight: 800, color: s.color, fontSize: "28px" }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER */}
      <div className="sa-card mb-3">
        <div className="sa-card__body" style={{ padding: "14px 20px" }}>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-sm-7 col-md-8">
              <div className="input-group" style={{ borderRadius: "10px", overflow: "hidden" }}>
                <span className="input-group-text" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRight: "none", color: "#94a3b8" }}>
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search restaurant by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "1.5px solid #e2e8f0", borderLeft: "none", fontSize: "13.5px" }}
                />
              </div>
            </div>
            <div className="col-12 col-sm-5 col-md-4">
              <div className="d-flex gap-2">
                {["ALL", "ACTIVE", "INACTIVE"].map(f => (
                  <button
                    key={f}
                    className="btn btn-sm flex-1"
                    style={{
                      flex: 1,
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "7px 8px",
                      background: statusFilter === f ? "#6366f1" : "#f1f5f9",
                      color: statusFilter === f ? "white" : "#64748b",
                      border: "none",
                      whiteSpace: "nowrap"
                    }}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredRestaurants.length === 0 && (
        <div className="sa-card">
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
            <h5 style={{ color: "#0f172a", marginBottom: "8px" }}>No restaurants found</h5>
            <p style={{ color: "#64748b", fontSize: "13.5px" }}>
              {search ? `No results for "${search}"` : "Add your first restaurant to get started."}
            </p>
            <button
              className="btn btn-primary mt-2"
              style={{ borderRadius: "10px", fontWeight: 600 }}
              onClick={() => navigate("/superadmin/create-restaurant")}
            >
              <FaPlus className="me-2" /> Create Restaurant
            </button>
          </div>
        </div>
      )}

      {/* TABLE — desktop */}
      {filteredRestaurants.length > 0 && (
        <>
          <div className="sa-card d-none d-md-block">
            <div style={{ overflowX: "auto" }}>
              <table className="table align-middle mb-0" style={{ fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748b", borderBottom: "1.5px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Restaurant
                    </th>
                    <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748b", borderBottom: "1.5px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Site Code
                    </th>
                    <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748b", borderBottom: "1.5px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Email
                    </th>
                    <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748b", borderBottom: "1.5px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Status
                    </th>
                    <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748b", borderBottom: "1.5px solid #e2e8f0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map((restaurant, i) => (
                    <tr
                      key={restaurant._id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              background: `linear-gradient(135deg, ${["#6366f1","#22c55e","#f59e0b","#ec4899","#06b6d4"][i % 5]}, ${["#8b5cf6","#16a34a","#d97706","#db2777","#0891b2"][i % 5]})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "14px",
                              flexShrink: 0
                            }}
                          >
                            <FaBuilding />
                          </div>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{restaurant.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>
                          {restaurant.siteCode}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#475569" }}>{restaurant.email}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: restaurant.status === "ACTIVE" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: restaurant.status === "ACTIVE" ? "#16a34a" : "#dc2626"
                          }}
                        >
                          {restaurant.status === "ACTIVE"
                            ? <FaCheckCircle style={{ fontSize: "10px" }} />
                            : <FaTimesCircle style={{ fontSize: "10px" }} />}
                          {restaurant.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1"
                            title="Copy Customer Link"
                            style={{ borderRadius: "8px", background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "none", padding: "5px 10px", fontSize: "12px", fontWeight: 600 }}
                            onClick={() => {
                              navigator.clipboard.writeText(`${FRONTEND_URL}?siteCode=${restaurant.siteCode}`);
                              toast.success("Customer link copied!");
                            }}
                          >
                            <FaUsers style={{ fontSize: "11px" }} /> Customer
                          </button>
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1"
                            title="Copy Admin Link"
                            style={{ borderRadius: "8px", background: "rgba(16,185,129,0.08)", color: "#059669", border: "none", padding: "5px 10px", fontSize: "12px", fontWeight: 600 }}
                            onClick={() => {
                              navigator.clipboard.writeText(`${FRONTEND_URL}/admin?siteCode=${restaurant.siteCode}`);
                              toast.success("Admin link copied!");
                            }}
                          >
                            <FaUserShield style={{ fontSize: "11px" }} /> Admin
                          </button>
                          {restaurant.status === "ACTIVE" ? (
                            <button
                              className="btn btn-sm"
                              title="Deactivate"
                              style={{ borderRadius: "8px", background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "none", padding: "6px 10px" }}
                              onClick={() => {
                                if (window.confirm(`Deactivate "${restaurant.name}"?`)) {
                                  toggleRestaurantStatus(restaurant.siteCode, restaurant.status);
                                }
                              }}
                            >
                              <FaBan />
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm"
                              title="Activate"
                              style={{ borderRadius: "8px", background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "none", padding: "6px 10px" }}
                              onClick={() => toggleRestaurantStatus(restaurant.siteCode, restaurant.status)}
                            >
                              <FaPowerOff />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARDS — mobile */}
          <div className="d-md-none">
            {filteredRestaurants.map((restaurant, i) => (
              <div
                key={restaurant._id}
                className="sa-card mb-3"
              >
                <div style={{ padding: "16px 18px" }}>
                  {/* Card Header */}
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: `linear-gradient(135deg, ${["#6366f1","#22c55e","#f59e0b","#ec4899","#06b6d4"][i % 5]}, ${["#8b5cf6","#16a34a","#d97706","#db2777","#0891b2"][i % 5]})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "16px",
                          flexShrink: 0
                        }}
                      >
                        <FaBuilding />
                      </div>
                      <div>
                        <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>
                          {restaurant.name}
                        </h6>
                        <span style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "1px 7px", borderRadius: "5px", fontSize: "11px", fontWeight: 700 }}>
                          {restaurant.siteCode}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        background: restaurant.status === "ACTIVE" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: restaurant.status === "ACTIVE" ? "#16a34a" : "#dc2626"
                      }}
                    >
                      {restaurant.status === "ACTIVE"
                        ? <FaCheckCircle style={{ fontSize: "9px" }} />
                        : <FaTimesCircle style={{ fontSize: "9px" }} />}
                      {restaurant.status}
                    </span>
                  </div>
                  {/* Email */}
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#64748b" }}>
                    📧 {restaurant.email}
                  </p>
                  {/* Actions */}
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-sm flex-fill"
                      style={{ borderRadius: "8px", background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "none", fontWeight: 600, fontSize: "12px", padding: "8px 6px" }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${FRONTEND_URL}?siteCode=${restaurant.siteCode}`);
                        toast.success("Customer link copied!");
                      }}
                    >
                      <FaUsers className="me-1" style={{ fontSize: "11px" }} /> Customer
                    </button>
                    <button
                      className="btn btn-sm flex-fill"
                      style={{ borderRadius: "8px", background: "rgba(16,185,129,0.08)", color: "#059669", border: "none", fontWeight: 600, fontSize: "12px", padding: "8px 6px" }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${FRONTEND_URL}/admin?siteCode=${restaurant.siteCode}`);
                        toast.success("Admin link copied!");
                      }}
                    >
                      <FaUserShield className="me-1" style={{ fontSize: "11px" }} /> Admin
                    </button>
                    {restaurant.status === "ACTIVE" ? (
                      <button
                        className="btn btn-sm flex-fill"
                        style={{ borderRadius: "8px", background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "none", fontWeight: 600, fontSize: "12.5px", padding: "8px" }}
                        onClick={() => {
                          if (window.confirm(`Deactivate "${restaurant.name}"?`)) {
                            toggleRestaurantStatus(restaurant.siteCode, restaurant.status);
                          }
                        }}
                      >
                        <FaBan className="me-1" /> Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm flex-fill"
                        style={{ borderRadius: "8px", background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "none", fontWeight: 600, fontSize: "12.5px", padding: "8px" }}
                        onClick={() => toggleRestaurantStatus(restaurant.siteCode, restaurant.status)}
                      >
                        <FaPowerOff className="me-1" /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </SuperAdminLayout>
  );
};

export default ViewRestaurants;
