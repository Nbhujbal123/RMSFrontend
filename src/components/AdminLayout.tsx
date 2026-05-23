import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaSignOutAlt, FaSun, FaMoon, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

// 🔑 Theme Logic: Helper function to get initial theme
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme === 'dark' ? 'dark' : 'light';
  }
  return 'light';
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  // 🔑 Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  // Detect window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔑 Theme Side Effect: Apply theme to body and localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleOverlayClick = () => {
    setShowProfileMenu(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔑 Theme toggle handler
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleProfileClick = () => {
    setShowProfileMenu(false);
    navigate('/admin/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Close sidebar on mobile
  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <div className="admin-layout">
        {/* 🔹 Navbar */}
        <nav 
          className="admin-navbar navbar navbar-expand-lg navbar-light" 
          style={{
            position: 'fixed',
            top: 0,
            zIndex: 1060,
            backgroundColor: '#ffffff',
            width: isMobile ? '100%' : (collapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)'),
            left: isMobile ? 0 : (collapsed ? '80px' : '256px'),
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div className="container-fluid d-flex align-items-center">
            {/* Hamburger Menu Button - Always visible on mobile, toggles sidebar */}
            <button
              className="btn btn-link text-dark border-0"
              type="button"
              onClick={handleSidebarToggle}
              aria-label={isMobile ? (isSidebarOpen ? 'Close menu' : 'Open menu') : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
              style={{
                fontSize: '1.2rem',
                padding: '10px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isMobile ? (isSidebarOpen ? <FaTimes /> : <FaBars />) : <FaBars />}
            </button>

            <div className="flex-grow-1 text-center">
              <h5 className="mb-0 fw-bold d-md-none" style={{ color: '#4F46E5' }}>Admin Dashboard</h5>
              {title && (
                <h5 className="mb-0 fw-bold d-none d-md-block" style={{ color: '#212529' }}>
                  {title}
                </h5>
              )}
            </div>

            {/* RIGHT – Theme + Profile */}
            <div className="d-flex align-items-center gap-2 ms-auto">

              {/* Theme Toggle - Hidden by default */}
              <button
                className="btn btn-link border-0"
                onClick={toggleTheme}
                style={{ display: "none" }}
              >
                {theme === 'light' ? <FaMoon /> : <FaSun className="text-warning" />}
              </button>

              {/* Profile Icon */}
              <div className="d-flex align-items-center position-relative profile-menu-container">
                <button
                  className="btn btn-link text-dark border-0 d-flex align-items-center gap-2"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    textDecoration: 'none',
                    padding: '10px 12px',
                    minHeight: '44px',
                    minWidth: '44px',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FaUserCircle size={24} color="#4F46E5" />
                  <span className="d-none d-md-inline fw-semibold" style={{ color: '#212529' }}>Admin</span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    className="position-absolute bg-white shadow-lg rounded-3 border-0"
                    style={{
                      top: '100%',
                      right: 0,
                      minWidth: '220px',
                      zIndex: 1050,
                      marginTop: '8px',
                      animation: 'fadeIn 0.2s ease',
                    }}
                  >
                    <div className="p-3 border-bottom" style={{ borderColor: '#e2e8f0' }}>
                      <div className="d-flex align-items-center gap-3">
                        <FaUserCircle size={40} color="#4F46E5" />
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: '1rem' }}>Administrator</div>
                          <small className="text-muted">admin@restom.com</small>
                        </div>
                      </div>
                    </div>

                    <div className="py-2" style={{ padding: '8px 0' }}>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-dark"
                        onClick={handleProfileClick}
                        style={{ 
                          cursor: 'pointer', 
                          width: '100%', 
                          border: 'none', 
                          background: 'transparent',
                          minHeight: '44px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaUser size={16} color="#4F46E5" />
                        <span>Profile Settings</span>
                      </button>
                    </div>

                    <div className="border-top" style={{ borderColor: '#e2e8f0' }}>
                      <button 
                        className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                        onClick={handleLogout}
                        style={{ 
                          cursor: 'pointer', 
                          width: '100%', 
                          border: 'none', 
                          background: 'transparent',
                          minHeight: '44px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaSignOutAlt size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 🔹 Sidebar */}
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          collapsed={collapsed} 
          isMobile={isMobile} 
          onToggle={handleSidebarToggle} 
          onClose={handleSidebarClose} 
        />

        {/* 🔹 Overlay for Mobile */}
        {isMobile && isSidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1040,
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={handleSidebarClose}
          />
        )}

        {/* 🔹 Main Content */}
        <main
          className="admin-main"
          style={{
            backgroundColor: '#f8f9fa',
            color: '#212529',
            minHeight: '100vh',
            marginTop: '56px',
            marginLeft: isMobile ? 0 : (collapsed ? '80px' : '256px'),
            transition: 'margin-left 0.3s ease',
            padding: isMobile ? '12px' : '20px',
          }}
        >
          {children}
        </main>
      </div>

      {/* CSS Animation for fadeIn */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 767px) {
          .admin-layout {
            overflow-x: hidden;
          }
        }
        
        /* Touch-friendly scrollbar */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Prevent horizontal scroll on mobile */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
};

export default AdminLayout;
