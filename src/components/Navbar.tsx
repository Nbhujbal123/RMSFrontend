import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaShoppingCart, FaUtensils, FaUser } from 'react-icons/fa'
import { useCart } from '../context/CartContext'

const Navbar: React.FC = () => {
  const { getTotalItems, cartAnimation, tableNumber } = useCart()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <Link className="navbar-brand" to="/admin/dashboard">
            <FaUtensils className="me-2" />
            Restaurant Admin
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><Link className="nav-link" to="/admin/dashboard">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/admin/menu">Menu Management</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/admin/analytics">Analytics</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/admin/reports">Reports</Link></li>
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <style>{`
        .customer-navbar {
          background: #fff;
          box-shadow: 0 2px 16px rgba(0,0,0,.08);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 0;
        }
        .customer-navbar .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          padding: 0 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .nav-cart-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(90deg, #FF6A00, #FF9900);
          color: #fff !important;
          border-radius: 10px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          position: relative;
          transition: box-shadow .2s, transform .2s;
          border: none;
        }
        .nav-cart-btn:hover {
          box-shadow: 0 4px 16px rgba(255,106,0,.4);
          transform: translateY(-1px);
          color: #fff;
        }
        .nav-cart-btn.cart-bounce {
          animation: cartPop .3s ease;
        }
        @keyframes cartPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .nav-profile-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff8f0;
          border: 2px solid #FF9900;
          color: #FF6A00;
          text-decoration: none;
          transition: all .2s;
          flex-shrink: 0;
        }
        .nav-profile-btn:hover {
          background: linear-gradient(135deg, #FF6A00, #FF9900);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(255,106,0,.35);
        }
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #fff;
          color: #FF6A00;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FF6A00;
          line-height: 1;
        }
        .table-badge {
          background: linear-gradient(135deg, #FF6A00, #FF9900);
          color: #fff;
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(255,106,0,.3);
        }
      `}</style>

      <nav className="customer-navbar">
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <img
              src="/assets/images/Logo.png"
              alt="Logo"
              style={{ width: '160px', height: '56px', objectFit: 'contain' }}
            />
          </Link>

          {/* Table badge — center */}
          {tableNumber && (
            <div className="table-badge d-none d-sm-flex">
              🍽 Table {tableNumber}
            </div>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* mobile table badge */}
            {tableNumber && (
              <span className="table-badge d-flex d-sm-none" style={{ fontSize: '11px', padding: '4px 10px' }}>
                🍽 {tableNumber}
              </span>
            )}

            <Link to="/profile" className="nav-profile-btn" title="My Profile">
              <FaUser size={16} />
            </Link>

            <Link to="/cart" className={`nav-cart-btn ${cartAnimation ? 'cart-bounce' : ''}`}>
              <FaShoppingCart size={18} />
              <span className="d-none d-sm-inline">Cart</span>
              {getTotalItems() > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar
