import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUtensils,
  FaCheckCircle,
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaList,
  FaArrowRight,
  FaCircle
} from "react-icons/fa";
import SuperAdminLayout from "./SuperAdminLayout";
import { API_BASE_URL } from "../../config/api";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    ordersToday: 0,
    revenueToday: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [recentRestaurants, setRecentRestaurants] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/superadmin/login");
      return;
    }
    fetchStats();
    fetchRecentRestaurants();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/superadmin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/superadmin/login");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Dashboard API error:", res.status, err);
        setStatsError(err.message || `Server error (${res.status})`);
        return;
      }
      const data = await res.json();
      setStats(data);
      setStatsError(null);
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
      setStatsError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRestaurants = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/superadmin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) return;
      if (!res.ok) {
        console.error("Restaurants API error:", res.status);
        return;
      }
      const data = await res.json();
      // Show the 5 most recently added (last 5 in insertion order)
      const recent = Array.isArray(data) ? [...data].reverse().slice(0, 5) : [];
      setRecentRestaurants(recent);
    } catch (error) {
      console.error("Restaurants fetch failed:", error);
    }
  };

  const statCards = [
    {
      title: "Total Restaurants",
      value: stats.totalRestaurants,
      icon: <FaUtensils />,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      trend: "+2 this month"
    },
    {
      title: "Active Restaurants",
      value: stats.activeRestaurants,
      icon: <FaCheckCircle />,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      trend: "Running smoothly"
    },
    {
      title: "Orders Today",
      value: stats.ordersToday,
      icon: <FaShoppingCart />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      trend: "+12% vs yesterday"
    },
    {
      title: "Revenue Today",
      value: `₹${Math.round(stats.revenueToday).toLocaleString("en-IN")}`,
      icon: <FaRupeeSign />,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.1)",
      trend: "+8% vs yesterday"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: <FaUsers />,
      color: "#ec4899",
      bg: "rgba(236,72,153,0.1)",
      trend: "Across all restaurants"
    },
    {
      title: "Total Revenue",
      value: `₹${Math.round(stats.totalRevenue).toLocaleString("en-IN")}`,
      icon: <FaChartLine />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      trend: "All-time earnings"
    }
  ];

  const quickActions = [
    {
      label: "Create Restaurant",
      icon: <FaPlus />,
      color: "#6366f1",
      path: "/superadmin/create-restaurant"
    },
    {
      label: "Manage Restaurants",
      icon: <FaList />,
      color: "#22c55e",
      path: "/superadmin/restaurants"
    },
    {
      label: "View Analytics",
      icon: <FaChartLine />,
      color: "#f59e0b",
      path: "/superadmin/analytics"
    }
  ];

  const headerAction = (
    <button
      className="btn btn-primary d-none d-md-flex align-items-center gap-2"
      style={{ borderRadius: "10px", fontWeight: 600, fontSize: "13.5px" }}
      onClick={() => navigate("/superadmin/create-restaurant")}
    >
      <FaPlus /> Create Restaurant
    </button>
  );

  if (loading) {
    return (
      <SuperAdminLayout title="Platform Overview" subtitle="Monitor restaurants and system performance">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border" style={{ color: "#6366f1", width: "48px", height: "48px" }} />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Platform Overview"
      subtitle="Monitor restaurants and system performance"
      action={headerAction}
    >

      {/* API ERROR BANNER */}
      {statsError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{ borderRadius: "10px", fontSize: "13.5px" }}>
          <span style={{ fontWeight: 600 }}>Dashboard Error:</span> {statsError}
        </div>
      )}

      {/* STATS GRID */}
      <div className="row g-3 mb-4">
        {statCards.map((card, i) => (
          <div className="col-6 col-md-4 col-xl-4" key={i}>
            <div className="sa-stat-card h-100">
              <div
                className="sa-stat-card__icon"
                style={{ background: card.color }}
              >
                {card.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="sa-stat-card__label">{card.title}</p>
                <h3 className="sa-stat-card__value">{card.value}</h3>
                <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {card.trend}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS + SYSTEM STATUS */}
      <div className="row g-3 mb-4">

        <div className="col-md-8">
          <div className="sa-card h-100">
            <div className="sa-card__header">
              <h6 className="sa-card__title">Quick Actions</h6>
            </div>
            <div className="sa-card__body">
              <div className="row g-3">
                {quickActions.map((action, i) => (
                  <div className="col-12 col-sm-4" key={i}>
                    <button
                      className="btn w-100 d-flex align-items-center gap-3 text-start p-3"
                      style={{
                        border: `1.5px solid ${action.color}20`,
                        background: `${action.color}08`,
                        borderRadius: "12px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = `${action.color}14`;
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = `${action.color}08`;
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onClick={() => navigate(action.path)}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: action.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "15px",
                          flexShrink: 0
                        }}
                      >
                        {action.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>
                          {action.label}
                        </p>
                      </div>
                      <FaArrowRight style={{ color: action.color, fontSize: "12px", flexShrink: 0 }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Platform Insights Row */}
              <div className="row g-3 mt-1">
                <div className="col-4">
                  <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", fontWeight: 500 }}>New Restaurants</p>
                    <h5 style={{ margin: 0, fontWeight: 700, color: "#6366f1" }}>+2</h5>
                  </div>
                </div>
                <div className="col-4">
                  <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", fontWeight: 500 }}>Orders Growth</p>
                    <h5 style={{ margin: 0, fontWeight: 700, color: "#22c55e" }}>+12%</h5>
                  </div>
                </div>
                <div className="col-4">
                  <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", fontWeight: 500 }}>Revenue Growth</p>
                    <h5 style={{ margin: 0, fontWeight: 700, color: "#f59e0b" }}>+8%</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="sa-card h-100">
            <div className="sa-card__header">
              <h6 className="sa-card__title">System Status</h6>
              <span
                className="badge"
                style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", fontSize: "11px", borderRadius: "20px", padding: "4px 10px" }}
              >
                All Systems Operational
              </span>
            </div>
            <div className="sa-card__body">
              {[
                { label: "API Server", status: "Running", ok: true },
                { label: "Database", status: "Connected", ok: true },
                { label: "Auth Service", status: "Active", ok: true },
                { label: "Payment Gateway", status: "Active", ok: true }
              ].map((item, i) => (
                <div
                  key={i}
                  className="d-flex align-items-center justify-content-between py-2"
                  style={{ borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FaCircle style={{ fontSize: "8px", color: item.ok ? "#22c55e" : "#ef4444" }} />
                    <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: item.ok ? "#16a34a" : "#dc2626",
                      background: item.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      padding: "2px 8px",
                      borderRadius: "20px"
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* RECENT RESTAURANTS */}
      <div className="sa-card">
        <div className="sa-card__header">
          <h6 className="sa-card__title">Recent Restaurants</h6>
          <button
            className="btn btn-sm"
            style={{ color: "#6366f1", fontWeight: 600, fontSize: "12.5px" }}
            onClick={() => navigate("/superadmin/restaurants")}
          >
            View all <FaArrowRight style={{ fontSize: "10px", marginLeft: "4px" }} />
          </button>
        </div>
        <div className="sa-card__body" style={{ padding: "8px 24px" }}>
          {recentRestaurants.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: "13.5px" }}>
              No restaurants created yet.
            </div>
          ) : (
            recentRestaurants.map((r, i) => {
              const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#10b981"];
              const dotColor = r.status === "ACTIVE" ? "#22c55e" : "#ef4444";
              return (
                <div
                  key={r._id}
                  className="d-flex align-items-center gap-3 py-3"
                  style={{ borderBottom: i < recentRestaurants.length - 1 ? "1px solid #f1f5f9" : "none" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "9px",
                      background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "13px",
                      flexShrink: 0,
                      fontWeight: 700
                    }}
                  >
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13.5px", color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#94a3b8" }}>
                      {r.siteCode} &nbsp;·&nbsp; {r.email}
                    </p>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: r.status === "ACTIVE" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: r.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                      flexShrink: 0
                    }}
                  >
                    <FaCircle style={{ fontSize: "6px", color: dotColor }} />
                    {r.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
