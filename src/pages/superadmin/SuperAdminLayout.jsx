import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCrown,
  FaHome,
  FaPlus,
  FaList,
  FaChartLine,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserShield
} from "react-icons/fa";
import "./SuperAdminLayout.css";

const navItems = [
  { path: "/superadmin/dashboard", icon: <FaHome />, label: "Dashboard" },
  { path: "/superadmin/create-restaurant", icon: <FaPlus />, label: "Create Restaurant" },
  { path: "/superadmin/restaurants", icon: <FaList />, label: "Manage Restaurants" },
  { path: "/superadmin/analytics", icon: <FaChartLine />, label: "Analytics" }
];

const SuperAdminLayout = ({ children, title, subtitle, action }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/superadmin/login");
  };

  const isActive = (path) => location.pathname === path;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="sa-layout">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sa-overlay" onClick={closeSidebar} />
      )}

      {/* SIDEBAR */}
      <aside className={`sa-sidebar${sidebarOpen ? " sa-sidebar--open" : ""}`}>

        {/* Brand */}
        <div className="sa-sidebar__brand">
          <div className="sa-sidebar__brand-icon">
            <FaCrown />
          </div>
          <div className="sa-sidebar__brand-text">
            <h5 className="sa-sidebar__brand-title">Super Admin</h5>
            <p className="sa-sidebar__brand-sub">Platform Manager</p>
          </div>
          <button className="sa-sidebar__close-btn" onClick={closeSidebar}>
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sa-sidebar__nav">
          <p className="sa-nav-section-label">Menu</p>
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sa-nav-item${isActive(item.path) ? " sa-nav-item--active" : ""}`}
              onClick={() => { navigate(item.path); closeSidebar(); }}
            >
              <span className="sa-nav-item__icon">{item.icon}</span>
              <span className="sa-nav-item__label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="sa-sidebar__footer">
          <button className="sa-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* MAIN */}
      <div className="sa-main">

        {/* Topbar */}
        <header className="sa-topbar">
          <button className="sa-topbar__toggle" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="sa-topbar__info">
            <h4 className="sa-topbar__title">{title}</h4>
            {subtitle && <p className="sa-topbar__subtitle">{subtitle}</p>}
          </div>
          <div className="sa-topbar__right">
            {action && action}
            <div className="sa-topbar__avatar">
              <FaUserShield />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="sa-content">
          {children}
        </main>

      </div>
    </div>
  );
};

export default SuperAdminLayout;
