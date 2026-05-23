import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaStore,
  FaChartLine,
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
  CartesianGrid
} from "recharts";
import SuperAdminLayout from "./SuperAdminLayout";
import { API_BASE_URL } from "../../config/api";

const weeklyOrders = [
  { day: "Mon", orders: 40, revenue: 5200 },
  { day: "Tue", orders: 55, revenue: 7150 },
  { day: "Wed", orders: 70, revenue: 9100 },
  { day: "Thu", orders: 65, revenue: 8450 },
  { day: "Fri", orders: 95, revenue: 12350 },
  { day: "Sat", orders: 120, revenue: 15600 },
  { day: "Sun", orders: 110, revenue: 14300 }
];

const monthlyRevenue = [
  { month: "Jan", revenue: 82000 },
  { month: "Feb", revenue: 94000 },
  { month: "Mar", revenue: 108000 },
  { month: "Apr", revenue: 97000 },
  { month: "May", revenue: 125000 },
  { month: "Jun", revenue: 141000 },
  { month: "Jul", revenue: 138000 },
  { month: "Aug", revenue: 155000 },
  { month: "Sep", revenue: 148000 },
  { month: "Oct", revenue: 162000 },
  { month: "Nov", revenue: 178000 },
  { month: "Dec", revenue: 195000 }
];

const restaurantStatusData = [
  { name: "Active", value: 21, color: "#22c55e" },
  { name: "Inactive", value: 4, color: "#ef4444" }
];

const topRestaurants = [
  { name: "Spice Hub", orders: 320, revenue: 41600, growth: 14 },
  { name: "Biryani Palace", orders: 280, revenue: 36400, growth: 9 },
  { name: "The Food Court", orders: 245, revenue: 31850, growth: 22 },
  { name: "Tandoor Express", orders: 198, revenue: 25740, growth: -3 },
  { name: "Chai & Snacks", orders: 165, revenue: 21450, growth: 6 }
];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", fontSize: "12px", color: p.color }}>
          {p.name === "orders" ? "Orders: " : "Revenue: ₹"}{p.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
};

const CustomTooltipLine = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "12px", color: "#6366f1" }}>
        Revenue: ₹{payload[0]?.value?.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const SuperAdminAnalytics = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState({
    totalRestaurants: 25,
    activeRestaurants: 21,
    ordersToday: 310,
    revenueToday: 42500,
    totalCustomers: 1840,
    totalRevenue: 1950000
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/superadmin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch {
      // keep default values
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: "Total Restaurants",
      value: analytics.totalRestaurants,
      icon: <FaStore />,
      color: "#6366f1",
      change: "+2",
      positive: true
    },
    {
      title: "Active Restaurants",
      value: analytics.activeRestaurants,
      icon: <FaChartLine />,
      color: "#22c55e",
      change: "+1",
      positive: true
    },
    {
      title: "Orders Today",
      value: analytics.ordersToday,
      icon: <FaShoppingCart />,
      color: "#f59e0b",
      change: "+12%",
      positive: true
    },
    {
      title: "Revenue Today",
      value: `₹${Number(analytics.revenueToday).toLocaleString("en-IN")}`,
      icon: <FaRupeeSign />,
      color: "#06b6d4",
      change: "+8%",
      positive: true
    },
    {
      title: "Total Customers",
      value: analytics.totalCustomers ?? 1840,
      icon: <FaUsers />,
      color: "#ec4899",
      change: "+34",
      positive: true
    },
    {
      title: "Total Revenue",
      value: `₹${Number(analytics.totalRevenue ?? 1950000).toLocaleString("en-IN")}`,
      icon: <FaRupeeSign />,
      color: "#10b981",
      change: "+18%",
      positive: true
    }
  ];

  if (loading) {
    return (
      <SuperAdminLayout title="Platform Analytics" subtitle="Monitor orders, revenue and restaurant activity">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border" style={{ color: "#6366f1", width: "48px", height: "48px" }} />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Platform Analytics"
      subtitle="Monitor orders, revenue and restaurant activity"
    >

      {/* KPI CARDS */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card, i) => (
          <div className="col-6 col-md-4 col-xl-4" key={i}>
            <div className="sa-stat-card h-100">
              <div className="sa-stat-card__icon" style={{ background: card.color }}>
                {card.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="sa-stat-card__label">{card.title}</p>
                <h3 className="sa-stat-card__value">{card.value}</h3>
                <p style={{ fontSize: "11.5px", margin: "4px 0 0", display: "flex", alignItems: "center", gap: "3px" }}>
                  {card.positive
                    ? <FaArrowUp style={{ color: "#22c55e", fontSize: "9px" }} />
                    : <FaArrowDown style={{ color: "#ef4444", fontSize: "9px" }} />}
                  <span style={{ color: card.positive ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{card.change}</span>
                  <span style={{ color: "#94a3b8" }}>this week</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="row g-3 mb-3">

        {/* Weekly chart */}
        <div className="col-12 col-lg-8">
          <div className="sa-card h-100">
            <div className="sa-card__header">
              <h6 className="sa-card__title">Weekly Performance</h6>
              <div className="d-flex gap-2">
                {["orders", "revenue"].map(tab => (
                  <button
                    key={tab}
                    className="btn btn-sm"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      background: activeTab === tab ? "#6366f1" : "#f1f5f9",
                      color: activeTab === tab ? "white" : "#64748b",
                      border: "none",
                      textTransform: "capitalize"
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="sa-card__body">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={weeklyOrders} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar
                    dataKey={activeTab}
                    fill={activeTab === "orders" ? "#6366f1" : "#22c55e"}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Restaurant Status Pie */}
        <div className="col-12 col-lg-4">
          <div className="sa-card h-100">
            <div className="sa-card__header">
              <h6 className="sa-card__title">Restaurant Status</h6>
            </div>
            <div className="sa-card__body d-flex flex-column align-items-center justify-content-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={restaurantStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {restaurantStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="d-flex gap-4 mt-1">
                {restaurantStatusData.map((d, i) => (
                  <div key={i} className="d-flex align-items-center gap-2">
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: 500 }}>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHARTS ROW 2 */}
      <div className="row g-3 mb-3">

        {/* Monthly Revenue Line Chart */}
        <div className="col-12 col-lg-7">
          <div className="sa-card">
            <div className="sa-card__header">
              <h6 className="sa-card__title">Monthly Revenue (2024)</h6>
              <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>
                <FaArrowUp style={{ fontSize: "10px" }} /> +138% YoY
              </span>
            </div>
            <div className="sa-card__body">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyRevenue} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltipLine />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="col-12 col-lg-5">
          <div className="sa-card h-100">
            <div className="sa-card__header">
              <h6 className="sa-card__title">Top Restaurants</h6>
            </div>
            <div style={{ padding: "4px 0" }}>
              {topRestaurants.map((r, i) => (
                <div
                  key={i}
                  className="d-flex align-items-center gap-3"
                  style={{ padding: "11px 24px", borderBottom: i < topRestaurants.length - 1 ? "1px solid #f1f5f9" : "none" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"][i],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.name}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: "11.5px", color: "#64748b" }}>
                      {r.orders} orders · ₹{r.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: r.growth >= 0 ? "#16a34a" : "#dc2626",
                      background: r.growth >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      flexShrink: 0
                    }}
                  >
                    {r.growth >= 0 ? "+" : ""}{r.growth}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </SuperAdminLayout>
  );
};

export default SuperAdminAnalytics;
