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
  FaUserPlus,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaEnvelope,
  FaPhone,
  FaStore,
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

interface Chief {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  siteCode: string;
  createdAt?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const ordersPerPage = 10;

  // Chiefs list
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [chiefsLoading, setChiefsLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  // Create Chief modal state
  const [showChiefModal, setShowChiefModal] = useState(false);
  const [chiefForm, setChiefForm] = useState({
    name: '', email: '', mobile: '', password: '', siteCode: ''
  });
  const [chiefFormError, setChiefFormError] = useState('');
  const [chiefLoading, setChiefLoading] = useState(false);
  const [showChiefPassword, setShowChiefPassword] = useState(false);

  const calculateTotal = (items: Order['items']) => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (!isAuthenticated || adminUser.role === 'chief') navigate('/admin');
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

  const fetchChiefs = async () => {
    setChiefsLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/admin/chiefs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChiefs(data.chiefs || []);
      }
    } catch {
      // silently fail — chiefs table will just stay empty
    } finally {
      setChiefsLoading(false);
    }
  };

  useEffect(() => {
    fetchChiefs();
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

  const openChiefModal = () => {
    const siteCode = localStorage.getItem('siteCode') || '';
    setChiefForm({ name: '', email: '', mobile: '', password: '', siteCode });
    setChiefFormError('');
    setShowChiefModal(true);
  };

  const handleCreateChief = async (e: React.FormEvent) => {
    e.preventDefault();
    setChiefFormError('');
    setChiefLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/admin/create-chief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(chiefForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowChiefModal(false);
        setSuccessBanner(`Chief "${data.chief.name}" created successfully for ${data.chief.restaurantName || chiefForm.siteCode}!`);
        setTimeout(() => setSuccessBanner(''), 5000);
        fetchChiefs();
      } else {
        setChiefFormError(data.message || 'Failed to create chief');
      }
    } catch {
      setChiefFormError('Cannot reach server. Please try again.');
    } finally {
      setChiefLoading(false);
    }
  };

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
            style={{ color: '#4F46E5', margin: '20px 0px', marginTop: '0px', fontSize: '2.5rem'}}
          >
            Admin Dashboard
          </h1>
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}
          {successBanner && (
            <div
              className="d-flex align-items-center gap-2 px-4 py-3 rounded-3"
              style={{
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                border: '1px solid #86efac',
                color: '#15803d',
                fontWeight: '600',
                fontSize: '0.95rem',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              ✅ {successBanner}
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
          <div className="col-12 d-flex justify-content-between align-items-center">
            <h5 className="fw-semibold mb-0" style={{ color: '#4F46E5' }}>Quick Actions</h5>
            <button
              className="btn d-flex align-items-center gap-2 px-4 py-2"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '600',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.35)';
              }}
              onClick={openChiefModal}
            >
              <FaUserPlus /> Create Chief
            </button>
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

        {/* ── Chiefs Table ── */}
        <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Table Header */}
          <div
            className="d-flex flex-wrap align-items-center justify-content-between px-4 py-3 gap-2"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
          >
            <div className="d-flex align-items-center gap-3">
              <FaUserShield style={{ color: '#fff', fontSize: '1.3rem' }} />
              <div>
                <h5 className="mb-0 fw-bold" style={{ color: '#fff' }}>Chiefs</h5>
                <small style={{ color: 'rgba(255,255,255,0.8)' }}>Manage your restaurant's chiefs</small>
              </div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '2px 12px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                {chiefs.length} Total
              </span>
            </div>
            <button
              className="btn d-flex align-items-center gap-2"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}
              onClick={openChiefModal}
            >
              <FaUserPlus /> Add Chief
            </button>
          </div>

          {/* Desktop Table */}
          <div className="d-none d-md-block">
            {chiefsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm" style={{ color: '#7C3AED' }} role="status" />
                <span className="ms-2 text-muted small">Loading chiefs…</span>
              </div>
            ) : chiefs.length === 0 ? (
              <div className="text-center py-5">
                <FaUserShield style={{ fontSize: '2.5rem', color: '#d8b4fe', marginBottom: '12px' }} />
                <p className="text-muted mb-1">No chiefs created yet</p>
                <small className="text-muted">Click "Add Chief" to create one</small>
              </div>
            ) : (
              <table className="table table-hover mb-0">
                <thead style={{ background: '#f5f3ff' }}>
                  <tr>
                    <th className="px-4 py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>#</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Name</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Email</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Mobile</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Restaurant ID</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Joined</th>
                    <th className="py-3" style={{ color: '#6b21a8', fontWeight: '700', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {chiefs.map((chief, idx) => (
                    <tr key={chief._id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                      <td className="px-4 py-3 text-muted">{idx + 1}</td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0,
                          }}>
                            {chief.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-semibold" style={{ color: '#374151' }}>{chief.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="d-flex align-items-center gap-1" style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                          <FaEnvelope style={{ color: '#A78BFA', fontSize: '0.75rem' }} />{chief.email}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="d-flex align-items-center gap-1" style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                          <FaPhone style={{ color: '#A78BFA', fontSize: '0.75rem' }} />{chief.mobile}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          style={{
                            background: '#f5f3ff', color: '#7C3AED',
                            borderRadius: '8px', padding: '3px 10px',
                            fontFamily: 'monospace', fontWeight: '700', fontSize: '0.85rem',
                          }}
                        >
                          {chief.siteCode}
                        </span>
                      </td>
                      <td className="py-3" style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        {chief.createdAt ? new Date(chief.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3">
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                            color: '#fff', borderRadius: '20px', padding: '3px 12px',
                            fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}
                        >
                          Chief
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none p-3">
            {chiefsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" style={{ color: '#7C3AED' }} role="status" />
              </div>
            ) : chiefs.length === 0 ? (
              <div className="text-center py-4">
                <FaUserShield style={{ fontSize: '2rem', color: '#d8b4fe' }} />
                <p className="text-muted mt-2 mb-0 small">No chiefs yet. Click "Add Chief" above.</p>
              </div>
            ) : (
              chiefs.map((chief, idx) => (
                <div
                  key={chief._id}
                  className="p-3 mb-3 rounded-3"
                  style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: '700',
                    }}>
                      {chief.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-bold" style={{ color: '#374151' }}>{chief.name}</div>
                      <span style={{
                        background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff',
                        borderRadius: '12px', padding: '1px 9px', fontSize: '0.72rem', fontWeight: '700',
                      }}>
                        Chief #{idx + 1}
                      </span>
                    </div>
                    <span style={{
                      background: '#fff', color: '#7C3AED', borderRadius: '8px',
                      padding: '2px 8px', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem',
                      border: '1px solid #e9d5ff',
                    }}>
                      {chief.siteCode}
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-1">
                    <small className="d-flex align-items-center gap-2" style={{ color: '#6b7280' }}>
                      <FaEnvelope style={{ color: '#A78BFA', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chief.email}</span>
                    </small>
                    <small className="d-flex align-items-center gap-2" style={{ color: '#6b7280' }}>
                      <FaPhone style={{ color: '#A78BFA', flexShrink: 0 }} />{chief.mobile}
                    </small>
                    {chief.createdAt && (
                      <small className="d-flex align-items-center gap-2" style={{ color: '#9ca3af' }}>
                        <FaStore style={{ color: '#A78BFA', flexShrink: 0 }} />
                        Joined {new Date(chief.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </small>
                    )}
                  </div>
                </div>
              ))
            )}
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
      {/* ── Create Chief Modal (responsive) ── */}
      {showChiefModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1050,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '12px',
            overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowChiefModal(false); }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 24px 64px rgba(124,58,237,0.3)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 24px)',
              margin: 'auto',
            }}
          >
            {/* Sticky Header */}
            <div style={{
              background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexShrink: 0,
            }}>
              <div>
                <h4 style={{ color: '#fff', margin: 0, fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUserPlus /> Create Chief
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: '0.83rem' }}>
                  Create a chief account for a restaurant
                </p>
              </div>
              <button
                onClick={() => setShowChiefModal(false)}
                aria-label="Close"
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: '34px', height: '34px', cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', flexShrink: 0, marginLeft: '8px',
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {chiefFormError && (
                <div style={{
                  background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
                  borderRadius: '10px', marginBottom: '16px', fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  ⚠️ {chiefFormError}
                </div>
              )}

              <form onSubmit={handleCreateChief} noValidate>
                {/* Row: Name + Email */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                      Chief Name <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name"
                      value={chiefForm.name}
                      onChange={e => setChiefForm(p => ({ ...p, name: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                        borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                      Email <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="chief@email.com"
                      value={chiefForm.email}
                      onChange={e => setChiefForm(p => ({ ...p, email: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                        borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                    />
                  </div>
                </div>

                {/* Row: Mobile + Restaurant */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                      Mobile Number <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={chiefForm.mobile}
                      maxLength={15}
                      onChange={e => setChiefForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))}
                      style={{
                        width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                        borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                      Restaurant ID <span style={{ color: '#7C3AED' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RESTO001"
                      value={chiefForm.siteCode}
                      onChange={e => setChiefForm(p => ({ ...p, siteCode: e.target.value.toUpperCase() }))}
                      style={{
                        width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb',
                        borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                        fontFamily: 'monospace', fontWeight: '700', color: '#7C3AED',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                    />
                    <small style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '3px', display: 'block' }}>
                      Pre-filled from your restaurant
                    </small>
                  </div>
                </div>

                {/* Password full-width */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '0.85rem' }}>
                    Password <span style={{ color: '#7C3AED' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showChiefPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={chiefForm.password}
                      onChange={e => setChiefForm(p => ({ ...p, password: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 44px 10px 12px', border: '2px solid #e5e7eb',
                        borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
                      onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowChiefPassword(p => !p)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px',
                      }}
                    >
                      {showChiefPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChiefModal(false)}
                    style={{
                      flex: 1, padding: '11px 16px', border: '2px solid #e5e7eb',
                      borderRadius: '10px', background: '#fff', color: '#374151',
                      fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={chiefLoading}
                    style={{
                      flex: 2, padding: '11px 16px',
                      background: chiefLoading ? '#c4b5fd' : 'linear-gradient(135deg, #7C3AED, #A78BFA)',
                      color: '#fff', border: 'none', borderRadius: '10px',
                      fontWeight: '700', cursor: chiefLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem', boxShadow: chiefLoading ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {chiefLoading
                      ? <span><span className="spinner-border spinner-border-sm me-2" role="status" />Creating…</span>
                      : '✓ Create Chief'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
