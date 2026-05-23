import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingCart,
  FaClock,
  FaCheckCircle,
  FaUtensils,
  FaRupeeSign,
  FaChevronLeft,
  FaChevronRight,
  FaPlusCircle,
  FaBookOpen,
  FaChartBar,
  FaFilter,
  FaCheck,
  FaBox,
  FaCog,
} from 'react-icons/fa';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';
import { API_BASE_URL } from '../../config/api';

interface Order {
  _id: string;
  user?: {
    name: string;
    email: string;
  } | null;
  items: Array<{
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  orderStatus: string;
  createdAt: string;
  statusUpdatedAt?: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: string;
  pendingOrders: number;
  completedToday: number;
  recentOrders: Order[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const ordersPerPage = 10;

  const calculateTotal = (items: Order['items']) => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) navigate('/admin');
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      console.log('Fetching dashboard statistics');
      try {
        const siteCode = localStorage.getItem('siteCode') || ''
        const response = await fetch(`${API_BASE_URL}/orders/stats`, {
          headers: {
            'x-site-code': siteCode
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard stats:', data);
          setStats(data);
        } else {
          console.error('Failed to fetch stats');
          setError('Failed to load statistics');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const localOrders = stats?.recentOrders || [];
  
  // Filter orders by status
  const filteredOrders = statusFilter === 'ALL' 
    ? localOrders 
    : localOrders.filter(order => order.orderStatus === statusFilter);
  
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const updateOrderStatus = async (orderId: string, status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED') => {
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-site-code': siteCode
        },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Order status updated:', data)
        // Update local state immediately
        setStats(prev => {
          if (!prev) return prev
          const updatedOrders = prev.recentOrders.map(o => 
            o._id === orderId ? { ...o, orderStatus: status, statusUpdatedAt: new Date().toISOString() } : o
          )
          return {
            ...prev,
            recentOrders: updatedOrders,
            // Update pending/completed counts
            pendingOrders: status === 'COMPLETED' 
              ? prev.pendingOrders - 1 
              : (prev.recentOrders.find(o => o._id === orderId)?.orderStatus === 'PENDING' ? prev.pendingOrders - 1 : prev.pendingOrders),
            completedToday: status === 'COMPLETED' 
              ? prev.completedToday + 1 
              : prev.completedToday
          }
        })
      } else {
        console.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#F59E0B', color: '#fff', icon: <FaClock /> };
      case 'PREPARING':
        return { bg: '#3B82F6', color: '#fff', icon: <FaCog className="fa-spin" /> };
      case 'READY':
        return { bg: '#10B981', color: '#fff', icon: <FaBox /> };
      case 'COMPLETED':
        return { bg: '#4F46E5', color: '#fff', icon: <FaCheck /> };
      default:
        return { bg: '#6B7280', color: '#fff', icon: null };
    }
  };

  const getStatusStep = (status: string): number => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  const renderProgressIndicator = (status: string) => {
    const currentStep = getStatusStep(status);
    const steps = [
      { step: 1, label: 'Pending', color: '#F59E0B' },
      { step: 2, label: 'Preparing', color: '#3B82F6' },
      { step: 3, label: 'Ready', color: '#10B981' },
      { step: 4, label: 'Completed', color: '#4F46E5' },
    ];

    return (
      <div className="d-flex align-items-center justify-content-between w-100" style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '10%',
          right: '10%',
          height: '4px',
          backgroundColor: '#e5e7eb',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '10%',
          width: `${((currentStep - 1) / 3) * 80}%`,
          height: '4px',
          backgroundColor: '#4F46E5',
          zIndex: 1,
          transition: 'width 0.3s ease'
        }} />
        {steps.map((s) => (
          <div key={s.step} className="d-flex flex-column align-items-center" style={{ zIndex: 2, position: 'relative' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentStep >= s.step ? s.color : '#e5e7eb',
                color: currentStep >= s.step ? '#fff' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: currentStep === s.step ? `0 0 0 4px ${s.color}20` : 'none',
              }}
            >
              {currentStep > s.step ? <FaCheck style={{ fontSize: '10px' }} /> : s.step}
            </div>
            <span className="mt-1 small" style={{ 
              color: currentStep >= s.step ? s.color : '#9ca3af',
              fontWeight: currentStep === s.step ? '600' : '400',
              fontSize: '10px'
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div 
          className="container-fluid py-4 d-flex justify-content-center align-items-center" 
          style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#212529' }}>
        {/* Header */}
        <div className="mb-4">
          <h1 
            className="display-6 fw-bold" 
            style={{ color: '#4F46E5', margin: '20px 0px', marginTop: '50px', fontSize: '2.5rem'}}
          >
            Admin Dashboard
          </h1>
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-5">
          {/* Today's Orders */}
          <div className="col-6 col-md-3">
            <div
              className="card border-0 h-100 text-center"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)';
              }}
            >
              <div className="card-body">
                <div className="fs-1 mb-3">
                  <FaShoppingCart />
                </div>
                <h3 className="fw-bold mb-1">{stats?.todayOrders || 0}</h3>
                <p className="mb-0 opacity-75">Today's Orders</p>
              </div>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="col-6 col-md-3">
            <div
              className="card border-0 h-100 text-center"
              style={{
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
              }}
            >
              <div className="card-body d-flex flex-column justify-content-center">
                <div className="fs-1 mb-2">
                  <FaRupeeSign />
                </div>
                <h3 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>₹{Math.round(parseFloat(stats?.todayRevenue || '0'))}</h3>
                <p className="mb-0 opacity-75">Today's Revenue</p>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="col-6 col-md-3">
            <div
              className="card border-0 h-100 text-center"
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.3)';
              }}
            >
              <div className="card-body">
                <div className="fs-1 mb-3">
                  <FaClock />
                </div>
                <h3 className="fw-bold mb-1">{stats?.pendingOrders || 0}</h3>
                <p className="mb-0 opacity-75">Pending Orders</p>
              </div>
            </div>
          </div>

          {/* Completed Orders Today */}
          <div className="col-6 col-md-3">
            <div
              className="card border-0 h-100 text-center"
              style={{
                background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
                color: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.3)';
              }}
            >
              <div className="card-body">
                <div className="fs-1 mb-3">
                  <FaCheckCircle />
                </div>
                <h3 className="fw-bold mb-1">{stats?.completedToday || 0}</h3>
                <p className="mb-0 opacity-75">Completed Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row g-3 mb-5">
          <div className="col-12">
            <h5 className="fw-semibold mb-3" style={{ color: '#4F46E5' }}>Quick Actions</h5>
          </div>
          <div className="col-6 col-md-4">
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#4338CA';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
              }}
              onClick={() => {
                const siteCode = localStorage.getItem('siteCode') || ''
                navigate(`/menu?siteCode=${siteCode}`)
              }}
            >
              <FaPlusCircle /> New Order
            </button>
          </div>
          <div className="col-6 col-md-4">
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              style={{
                backgroundColor: '#10B981',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#059669';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#10B981';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
              }}
              onClick={() => navigate('/admin/menu')}
            >
              <FaBookOpen /> View Menu
            </button>
          </div>
          <div className="col-6 col-md-4">
            <button
              className="btn w-100 d-flex align-items-center justify-content-center gap-2 py-3"
              style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#D97706';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#F59E0B';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
              }}
              onClick={() => navigate('/admin/reports')}
            >
              <FaChartBar /> Reports
            </button>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div
          className="card border-0 shadow-sm p-3"
          style={{
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            color: '#212529'
          }}>
          <div
            className="d-flex justify-content-between align-items-center mb-3 flex-wrap"
            style={{ borderBottom: '2px solid #dee2e6', gap: '10px' }}
          >
            <h5 className="fw-semibold d-flex align-items-center mb-0">
              <FaUtensils className="me-2" style={{ color: '#4F46E5' }} /> Recent Orders
            </h5>
            
            {/* Status Filter Buttons */}
            <div className="d-flex gap-2 flex-wrap">
              <button
                className={`btn btn-sm ${statusFilter === 'ALL' ? '' : 'btn-outline'}`}
                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                style={{
                  backgroundColor: statusFilter === 'ALL' ? '#4F46E5' : 'transparent',
                  color: statusFilter === 'ALL' ? '#fff' : '#4F46E5',
                  borderColor: '#4F46E5',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaFilter className="me-1" /> All
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
                style={{
                  backgroundColor: statusFilter === 'PENDING' ? '#F59E0B' : 'transparent',
                  color: statusFilter === 'PENDING' ? '#fff' : '#F59E0B',
                  borderColor: '#F59E0B',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaClock className="me-1" /> Pending
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { setStatusFilter('PREPARING'); setCurrentPage(1); }}
                style={{
                  backgroundColor: statusFilter === 'PREPARING' ? '#3B82F6' : 'transparent',
                  color: statusFilter === 'PREPARING' ? '#fff' : '#3B82F6',
                  borderColor: '#3B82F6',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaCog className="me-1" /> Preparing
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { setStatusFilter('READY'); setCurrentPage(1); }}
                style={{
                  backgroundColor: statusFilter === 'READY' ? '#10B981' : 'transparent',
                  color: statusFilter === 'READY' ? '#fff' : '#10B981',
                  borderColor: '#10B981',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaBox className="me-1" /> Ready
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(1); }}
                style={{
                  backgroundColor: statusFilter === 'COMPLETED' ? '#4F46E5' : 'transparent',
                  color: statusFilter === 'COMPLETED' ? '#fff' : '#4F46E5',
                  borderColor: '#4F46E5',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaCheck className="me-1" /> Completed
              </button>
            </div>
          </div>

          {/* Active filter indicator */}
          {statusFilter !== 'ALL' && (
            <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <small style={{ color: '#16a34a' }}>
                <FaFilter className="me-1" />
                Showing {filteredOrders.length} {statusFilter.toLowerCase()} orders
                <button 
                  className="btn btn-sm-link ms-2" 
                  onClick={() => setStatusFilter('ALL')}
                  style={{ color: '#4F46E5', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Clear filter
                </button>
              </small>
            </div>
          )}

          {/* Order Cards (Desktop View) */}
          <div className="d-none d-md-block">
            {/* Table Header */}
            <div 
              className="d-flex align-items-center justify-content-between p-3 mb-2 rounded fw-bold" 
              style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
            >
              <div className="col-md-2">Order ID</div>
              <div className="col-md-2">Customer</div>
              <div className="col-md-2">Items</div>
              <div className="col-md-1">Total</div>
              <div className="col-md-3">Status & Progress</div>
              <div className="col-md-2">Actions</div>
            </div>
            {currentOrders.map(order => (
              <div
                key={order._id}
                className="d-flex align-items-center justify-content-between p-3 mb-2 rounded"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.15)';
                  e.currentTarget.style.borderColor = '#4F46E5';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div className="col-md-2 fw-bold" style={{ color: '#4F46E5' }}>
                  #{order._id.slice(-6)}
                </div>

                <div className="col-md-2">
                  <div className="fw-semibold" style={{ color: '#212529' }}>
                    {order.user?.name || 'Unknown'}
                  </div>
                  <small style={{ color: '#64748b' }}>{order.user?.email || 'N/A'}</small>
                </div>

                <div className="col-md-2">
                  {order.items.slice(0, 2).map(item => (
                    <div key={item.menuItemId} className="small" style={{ color: '#212529' }}>
                      {item.name} <span className="badge bg-light text-dark">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <small className="text-muted">+{order.items.length - 2} more items</small>
                  )}
                </div>

                <div
                  className="col-md-1 fw-bold"
                  style={{
                    color: '#10B981',
                  }}
                >
                  ₹{(order.total || calculateTotal(order.items)).toFixed(2)}
                </div>

                <div className="col-md-3">
                  {(() => {
                    const statusStyle = getStatusBadgeClass(order.orderStatus);
                    return (
                      <div className="d-flex flex-column gap-1">
                        <span 
                          className="badge px-3 py-2"
                          style={{ 
                            backgroundColor: statusStyle.bg, 
                            color: statusStyle.color,
                            fontWeight: '600',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {statusStyle.icon && <span className="me-1">{statusStyle.icon}</span>}
                          {order.orderStatus}
                        </span>
                        {order.statusUpdatedAt && (
                          <small className="text-muted" style={{ fontSize: '10px' }}>
                            Updated: {new Date(order.statusUpdatedAt).toLocaleTimeString()}
                          </small>
                        )}
                        <div className="mt-1">
                          {renderProgressIndicator(order.orderStatus)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm shadow-sm"
                    style={{ 
                      borderRadius: '8px', 
                      backgroundColor: '#f8f9fa', 
                      color: '#212529',
                      borderColor: '#e2e8f0'
                    }}
                    value={order.orderStatus}
                    onChange={e =>
                      updateOrderStatus(order._id, e.target.value as 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED')
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile View (Responsive) */}
          <div className="d-md-none">
            {currentOrders.map(order => (
              <div
                key={order._id}
                className="p-3 mb-3 rounded shadow-sm"
                style={{
                    borderLeft: `5px solid ${getStatusBadgeClass(order.orderStatus).bg}`,
                    backgroundColor: '#ffffff',
                    color: '#212529'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="fw-bold" style={{ color: '#4F46E5' }}>
                    #{order._id.slice(-6)}
                  </div>
                  {(() => {
                    const statusStyle = getStatusBadgeClass(order.orderStatus);
                    return (
                      <span 
                        className="badge px-2 py-1"
                        style={{ 
                          backgroundColor: statusStyle.bg, 
                          color: statusStyle.color,
                          fontWeight: '600',
                          fontSize: '10px'
                        }}
                      >
                        {statusStyle.icon && <span className="me-1">{statusStyle.icon}</span>}
                        {order.orderStatus}
                      </span>
                    );
                  })()}
                </div>
                <div className="fw-bold mb-1" style={{ color: '#212529' }}>
                  {order.user?.name || 'Unknown'}
                </div>
                <small style={{ color: '#64748b' }}>{order.user?.email || 'N/A'}</small>
                <div className="mt-2">
                  {order.items.map(item => (
                    <div key={item.menuItemId} className="d-flex align-items-center small" style={{ color: '#212529' }}>
                      <span className="me-2">{item.name}</span>
                      <span className="badge bg-light text-dark me-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="fw-bold" style={{ color: '#10B981' }}>
                    ₹{(order.total || calculateTotal(order.items)).toFixed(2)}
                  </span>
                  {order.statusUpdatedAt && (
                    <small className="text-muted">
                      Updated: {new Date(order.statusUpdatedAt).toLocaleTimeString()}
                    </small>
                  )}
                </div>
                <div className="mt-2">
                  {renderProgressIndicator(order.orderStatus)}
                </div>
                <select
                  className="form-select form-select-sm mt-2"
                  value={order.orderStatus}
                  onChange={e =>
                    updateOrderStatus(order._id, e.target.value as 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED')
                  }
                  style={{ backgroundColor: '#f8f9fa', color: '#212529' }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4 px-3">
              <span className="text-muted small">
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </span>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ color: '#4F46E5' }}
                    >
                      <FaChevronLeft />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(i + 1)}
                        style={currentPage === i + 1 ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5', color: 'white' } : { color: '#4F46E5' }}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ color: '#4F46E5' }}
                    >
                      <FaChevronRight />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
