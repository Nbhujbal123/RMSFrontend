import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingCart,
  FaClock,
  FaCheckCircle,
  FaRupeeSign,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaCheck,
  FaBox,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
  FaTimes,
  FaUtensils,
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api';

interface OrderItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user?: { name: string; email: string } | null;
  customer?: { name?: string; email?: string; phone?: string };
  items: OrderItem[];
  total: number;
  orderStatus: string;
  orderType?: string;
  tableNumber?: string;
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

const ChiefDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chiefName, setChiefName] = useState('Chief');
  const [restaurantCode, setRestaurantCode] = useState('');
  const ordersPerPage = 10;

  useEffect(() => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAuth = localStorage.getItem('adminAuthenticated');
    if (!isAuth || adminUser.role !== 'chief') {
      navigate('/admin');
      return;
    }
    setChiefName(adminUser.name || 'Chief');
    setRestaurantCode(adminUser.siteCode || '');
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE_URL}/chief/orders/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/chief/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o =>
              o._id === orderId
                ? { ...o, orderStatus: status, statusUpdatedAt: new Date().toISOString() }
                : o
            ),
            pendingOrders:
              status === 'COMPLETED'
                ? prev.pendingOrders - 1
                : prev.pendingOrders,
            completedToday:
              status === 'COMPLETED'
                ? prev.completedToday + 1
                : prev.completedToday,
          };
        });
      }
    } catch {
      // silent fail — UI already shows current state
    }
  };

  const calculateTotal = (items: OrderItem[]) =>
    items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING':    return { bg: '#F59E0B', label: 'Pending' };
      case 'PREPARING':  return { bg: '#3B82F6', label: 'Preparing' };
      case 'READY':      return { bg: '#10B981', label: 'Ready' };
      case 'COMPLETED':  return { bg: '#4F46E5', label: 'Completed' };
      case 'DELIVERED':  return { bg: '#8B5CF6', label: 'Delivered' };
      default:           return { bg: '#6B7280', label: status };
    }
  };

  const getStatusStep = (status: string) => {
    const steps: Record<string, number> = { PENDING: 1, PREPARING: 2, READY: 3, COMPLETED: 4 };
    return steps[status] || 0;
  };

  const renderProgress = (status: string) => {
    const currentStep = getStatusStep(status);
    const steps = [
      { step: 1, label: 'Pending',   color: '#F59E0B' },
      { step: 2, label: 'Preparing', color: '#3B82F6' },
      { step: 3, label: 'Ready',     color: '#10B981' },
      { step: 4, label: 'Done',      color: '#4F46E5' },
    ];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%' }}>
        <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '4px', background: '#e5e7eb', zIndex: 0 }} />
        <div style={{
          position: 'absolute', top: '12px', left: '10%',
          width: `${((currentStep - 1) / 3) * 80}%`,
          height: '4px', background: '#7C3AED', zIndex: 1, transition: 'width 0.3s ease',
        }} />
        {steps.map(s => (
          <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: currentStep >= s.step ? s.color : '#e5e7eb',
              color: currentStep >= s.step ? '#fff' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 'bold',
              boxShadow: currentStep === s.step ? `0 0 0 4px ${s.color}25` : 'none',
            }}>
              {currentStep > s.step ? <FaCheck style={{ fontSize: '9px' }} /> : s.step}
            </div>
            <span style={{ fontSize: '9px', marginTop: '4px', color: currentStep >= s.step ? s.color : '#9ca3af', fontWeight: currentStep === s.step ? '700' : '400' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const allOrders = stats?.recentOrders || [];
  const filtered = statusFilter === 'ALL' ? allOrders : allOrders.filter(o => o.orderStatus === statusFilter);
  const totalPages = Math.ceil(filtered.length / ordersPerPage);
  const pageOrders = filtered.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const PURPLE = '#7C3AED';
  const PURPLE_LIGHT = '#A78BFA';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-border" style={{ color: PURPLE, width: '3rem', height: '3rem' }} role="status" />
          <p style={{ color: PURPLE, marginTop: '16px', fontWeight: '600' }}>Loading Chief Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', display: 'flex', flexDirection: 'column' }}>

      {/* ─── Navbar ─── */}
      <nav style={{
        background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(124,58,237,0.3)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '700' }}>
            <FaUtensils style={{ marginRight: '8px' }} />Chief Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: '#fff', textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{chiefName}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{restaurantCode}</div>
          </div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <FaUserShield />
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
              color: '#fff', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem',
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ─── Sidebar ─── */}
        {sidebarOpen && (
          <aside style={{
            width: '240px', background: '#fff', borderRight: '1px solid #ede9fe',
            padding: '24px 16px', boxShadow: '2px 0 12px rgba(124,58,237,0.08)',
          }}>
            <p style={{ color: '#7c3aed', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>
              Navigation
            </p>
            {[
              { icon: <FaShoppingCart />, label: 'Recent Orders' },
              { icon: <FaCheckCircle />, label: 'Completed' },
              { icon: <FaClock />, label: 'Pending' },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                  borderRadius: '10px', cursor: 'pointer', color: '#374151', marginBottom: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; (e.currentTarget as HTMLElement).style.color = PURPLE; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon} {item.label}
              </div>
            ))}
            <hr style={{ borderColor: '#ede9fe', margin: '16px 0' }} />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', color: '#dc2626' }}
              onClick={handleLogout}
            >
              <FaSignOutAlt /> Logout
            </div>
          </aside>
        )}

        {/* ─── Main Content ─── */}
        <main style={{ flex: 1, padding: '28px 24px', overflowX: 'hidden' }}>

          {/* Page Title */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ color: PURPLE, fontWeight: '800', fontSize: '2rem', margin: 0 }}>
              Order Management
            </h1>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>
              Monitor and manage orders for <strong>{restaurantCode}</strong>
            </p>
            {error && (
              <div className="alert alert-warning mt-2" role="alert">{error}</div>
            )}
          </div>

          {/* ─── Stats Cards ─── */}
          <div className="row g-3 mb-4">
            {[
              {
                icon: <FaShoppingCart />,
                value: stats?.todayOrders ?? 0,
                label: "Today's Orders",
                gradient: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
                shadow: 'rgba(124,58,237,0.3)',
              },
              {
                icon: <FaRupeeSign />,
                value: `₹${Math.round(parseFloat(stats?.todayRevenue || '0'))}`,
                label: "Today's Revenue",
                gradient: 'linear-gradient(135deg, #10B981, #34D399)',
                shadow: 'rgba(16,185,129,0.3)',
              },
              {
                icon: <FaClock />,
                value: stats?.pendingOrders ?? 0,
                label: 'Pending Orders',
                gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                shadow: 'rgba(245,158,11,0.3)',
              },
              {
                icon: <FaCheckCircle />,
                value: stats?.completedToday ?? 0,
                label: 'Completed Today',
                gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                shadow: 'rgba(59,130,246,0.3)',
              },
            ].map((card, i) => (
              <div key={i} className="col-6 col-md-3">
                <div
                  style={{
                    background: card.gradient, borderRadius: '16px', color: '#fff',
                    padding: '20px', textAlign: 'center',
                    boxShadow: `0 4px 15px ${card.shadow}`,
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{card.value}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Recent Orders ─── */}
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(124,58,237,0.08)', overflow: 'hidden' }}>

            {/* Orders Header + Filters */}
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #ede9fe' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 style={{ color: PURPLE, fontWeight: '700', margin: 0 }}>
                  <FaShoppingCart style={{ marginRight: '8px' }} />Recent Orders
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                      style={{
                        padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem',
                        fontWeight: '600', border: `1.5px solid`,
                        cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: statusFilter === s ? getStatusStyle(s).bg : 'transparent',
                        borderColor: s === 'ALL' ? PURPLE : getStatusStyle(s).bg,
                        color: statusFilter === s ? '#fff' : (s === 'ALL' ? PURPLE : getStatusStyle(s).bg),
                      }}
                    >
                      {s === 'ALL' ? <><FaFilter style={{ marginRight: '4px' }} />All</> : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              {statusFilter !== 'ALL' && (
                <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: '10px 0 0' }}>
                  Showing {filtered.length} {statusFilter.toLowerCase()} orders
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    style={{ color: PURPLE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px' }}
                  >
                    Clear filter
                  </button>
                </p>
              )}
            </div>

            {/* Desktop Table */}
            <div className="d-none d-md-block" style={{ padding: '16px 24px' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr 2fr 1.5fr',
                background: '#f5f3ff', borderRadius: '10px', padding: '12px 16px',
                fontWeight: '700', color: '#4b5563', fontSize: '0.85rem', marginBottom: '8px',
              }}>
                <span>Order ID</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Progress</span>
                <span>Update Status</span>
              </div>

              {pageOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No orders found
                </div>
              )}

              {pageOrders.map(order => (
                <div
                  key={order._id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr 1fr 2fr 1.5fr',
                    alignItems: 'center', padding: '14px 16px', marginBottom: '8px',
                    borderRadius: '12px', border: '1px solid #ede9fe',
                    background: '#fff', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(124,58,237,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = PURPLE_LIGHT; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#ede9fe'; }}
                >
                  <div style={{ fontWeight: '700', color: PURPLE }}>#{order._id.slice(-6)}</div>

                  <div>
                    <div style={{ fontWeight: '600', color: '#212529' }}>
                      {order.user?.name || order.customer?.name || 'Guest'}
                    </div>
                    <small style={{ color: '#6b7280' }}>
                      {order.user?.email || order.customer?.email || 'N/A'}
                    </small>
                    {order.tableNumber && (
                      <div><small style={{ color: '#7C3AED' }}>Table {order.tableNumber}</small></div>
                    )}
                  </div>

                  <div>
                    {order.items.slice(0, 2).map(item => (
                      <div key={item.menuItemId} style={{ fontSize: '0.85rem', color: '#374151' }}>
                        {item.name} <span className="badge bg-light text-dark">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <small style={{ color: '#9ca3af' }}>+{order.items.length - 2} more</small>
                    )}
                  </div>

                  <div style={{ fontWeight: '700', color: '#10B981' }}>
                    ₹{(order.total || calculateTotal(order.items)).toFixed(2)}
                  </div>

                  <div>
                    <span
                      className="badge px-2 py-1 mb-1 d-block"
                      style={{
                        background: getStatusStyle(order.orderStatus).bg,
                        color: '#fff', fontSize: '11px', fontWeight: '600',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        maxWidth: 'fit-content',
                      }}
                    >
                      {order.orderStatus}
                    </span>
                    {order.statusUpdatedAt && (
                      <small style={{ color: '#9ca3af', fontSize: '10px' }}>
                        {new Date(order.statusUpdatedAt).toLocaleTimeString()}
                      </small>
                    )}
                    <div style={{ marginTop: '8px' }}>{renderProgress(order.orderStatus)}</div>
                  </div>

                  <div>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderColor: '#ede9fe', borderRadius: '8px', color: '#374151' }}
                      value={order.orderStatus}
                      onChange={e => updateOrderStatus(order._id, e.target.value)}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="READY">Ready</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="d-md-none" style={{ padding: '12px 16px' }}>
              {pageOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No orders found</div>
              )}
              {pageOrders.map(order => (
                <div
                  key={order._id}
                  style={{
                    borderLeft: `5px solid ${getStatusStyle(order.orderStatus).bg}`,
                    background: '#fff', borderRadius: '12px', padding: '16px',
                    marginBottom: '12px', boxShadow: '0 2px 8px rgba(124,58,237,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', color: PURPLE }}>#{order._id.slice(-6)}</span>
                    <span
                      className="badge"
                      style={{ background: getStatusStyle(order.orderStatus).bg, color: '#fff', fontSize: '10px' }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <div style={{ fontWeight: '600', color: '#212529' }}>
                    {order.user?.name || order.customer?.name || 'Guest'}
                  </div>
                  <small style={{ color: '#6b7280' }}>{order.user?.email || order.customer?.email || ''}</small>
                  <div style={{ margin: '10px 0' }}>
                    {order.items.map(item => (
                      <span key={item.menuItemId} style={{ fontSize: '0.85rem', color: '#374151', display: 'block' }}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '700', color: '#10B981' }}>
                      ₹{(order.total || calculateTotal(order.items)).toFixed(2)}
                    </span>
                    <small style={{ color: '#9ca3af' }}>{new Date(order.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div style={{ marginBottom: '10px' }}>{renderProgress(order.orderStatus)}</div>
                  <select
                    className="form-select form-select-sm"
                    value={order.orderStatus}
                    onChange={e => updateOrderStatus(order._id, e.target.value)}
                    style={{ borderColor: '#ede9fe' }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #ede9fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Showing {(currentPage - 1) * ordersPerPage + 1}–{Math.min(currentPage * ordersPerPage, filtered.length)} of {filtered.length} orders
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      border: `1.5px solid ${PURPLE}`, background: '#fff',
                      color: PURPLE, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '8px', border: 'none',
                        background: currentPage === i + 1 ? PURPLE : '#f5f3ff',
                        color: currentPage === i + 1 ? '#fff' : PURPLE,
                        cursor: 'pointer', fontWeight: '600',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      border: `1.5px solid ${PURPLE}`, background: '#fff',
                      color: PURPLE, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChiefDashboard;
