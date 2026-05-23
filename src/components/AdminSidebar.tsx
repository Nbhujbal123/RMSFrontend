import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaUtensils,
  FaChartLine,
  FaFileAlt,
  FaCreditCard,
  FaSignOutAlt,
} from "react-icons/fa";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, collapsed, isMobile, onToggle, onClose }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    window.location.href = "/admin";
  };

  const menuItems = [
    { path: "/admin/dashboard", icon: <FaTachometerAlt />, text: "Dashboard" },
    { path: "/admin/menu", icon: <FaUtensils />, text: "Menu Management" },
    { path: "/admin/analytics", icon: <FaChartLine />, text: "Sales Analytics" },
    { path: "/admin/reports", icon: <FaFileAlt />, text: "Reports" },
    { path: "/admin/billing", icon: <FaCreditCard />, text: "Billing & Payments" },
    { path: "/menu", icon: <FaUtensils />, text: "Customer Menu" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay active"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040,
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`admin-sidebar ${isMobile ? 'mobile' : 'desktop'} ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        style={{
          top: isMobile ? '56px' : '0px',
          height: isMobile ? 'calc(100vh - 56px)' : '100vh',
          zIndex: isMobile ? 1050 : 1030,
          width: isMobile ? '280px' : (collapsed ? '80px' : '256px'),
          transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: isMobile ? 'transform 0.3s ease' : 'width 0.3s ease',
          position: isMobile ? 'fixed' : 'fixed',
          left: isMobile ? 0 : 0,
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="sidebar-header" style={{ padding: '16px', display: 'none', justifyContent: 'flex-end'  }}>
            <button
              onClick={onClose}
              className="btn btn-link text-dark p-2"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '1.2rem',
                
              }}
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="sidebar-header" style={{ padding: collapsed ? '16px 8px' : '16px' }}>
            <button
              className="sidebar-toggle-btn"
              onClick={onToggle}
              style={{
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <FaBars />
            </button>

            {!collapsed && (
              <div className="sidebar-brand">
                <span className="brand-icon">🍽️</span>
                <span className="brand-text">Admin</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile Brand Header */}
        {isMobile && (
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="sidebar-brand">
              <span className="brand-icon" style={{ fontSize: '1.5rem' }}>🍽️</span>
              <span className="brand-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>Admin Panel</span>
            </div>
          </div>
        )}

        {/* Menu */}
        <ul className="sidebar-menu list-unstyled mt-3 px-2" style={{ padding: isMobile ? '16px 12px' : '16px 8px' }}>
          {menuItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '4px' }}>
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`sidebar-link d-flex align-items-center ${isActive(item.path) ? "active" : ""}`}
                style={{
                  padding: isMobile ? '14px 16px' : (collapsed ? '12px' : '12px 16px'),
                  borderRadius: '10px',
                  minHeight: '48px',
                  transition: 'all 0.2s ease',
                  gap: '12px',
                }}
              >
                <span className="sidebar-icon" style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>
                  {item.icon}
                </span>
                {!collapsed && !isMobile && (
                  <span className="sidebar-text" style={{ fontSize: '0.95rem' }}>{item.text}</span>
                )}
                {isMobile && (
                  <span className="sidebar-text" style={{ fontSize: '1rem' }}>{item.text}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div 
          className="sidebar-footer mt-auto p-3 border-top" 
          style={{ 
            borderColor: '#e2e8f0',
            padding: isMobile ? '16px' : '16px 12px'
          }}
        >
          <button
            onClick={handleLogout}
            className="logout-btn w-100 fw-semibold d-flex align-items-center justify-content-center"
            style={{
              minHeight: '48px',
              borderRadius: '10px',
              gap: '12px',
              padding: isMobile ? '14px 16px' : '12px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <FaSignOutAlt style={{ fontSize: '1.1rem' }} />
            {!collapsed && !isMobile && <span>Logout</span>}
            {isMobile && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
