import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaShoppingCart,
  FaClock,
  FaCheckCircle,
  FaRupeeSign,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
  FaTimes,
  FaUtensils,
  FaFilter,
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

const PURPLE      = '#7C3AED';
const PURPLE_LIGHT = '#A78BFA';

/* ── helpers ─────────────────────────────────────────── */
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PENDING':   return { bg: '#F59E0B' };
    case 'PREPARING': return { bg: '#3B82F6' };
    case 'READY':     return { bg: '#10B981' };
    case 'COMPLETED': return { bg: '#4F46E5' };
    case 'DELIVERED': return { bg: '#8B5CF6' };
    default:          return { bg: '#6B7280' };
  }
};

const getStatusStep = (status: string) =>
  ({ PENDING: 1, PREPARING: 2, READY: 3, COMPLETED: 4 } as Record<string, number>)[status] || 0;

const calcTotal = (items: OrderItem[]) =>
  items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

/* ── progress bar ────────────────────────────────────── */
const ProgressBar: React.FC<{ status: string }> = ({ status }) => {
  const currentStep = getStatusStep(status);
  const steps = [
    { step: 1, label: 'Pending',   color: '#F59E0B' },
    { step: 2, label: 'Preparing', color: '#3B82F6' },
    { step: 3, label: 'Ready',     color: '#10B981' },
    { step: 4, label: 'Done',      color: '#4F46E5' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', width: '100%', paddingTop: '2px' }}>
      {/* track */}
      <div style={{ position: 'absolute', top: '13px', left: '10%', right: '10%', height: '3px', background: '#e5e7eb', zIndex: 0 }} />
      {/* fill */}
      <div style={{
        position: 'absolute', top: '13px', left: '10%',
        width: `${((currentStep - 1) / 3) * 80}%`,
        height: '3px', background: PURPLE, zIndex: 1, transition: 'width 0.3s ease',
      }} />
      {steps.map(s => (
        <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', flex: 1 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: currentStep >= s.step ? s.color : '#e5e7eb',
            color: currentStep >= s.step ? '#fff' : '#9ca3af',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 'bold',
            boxShadow: currentStep === s.step ? `0 0 0 3px ${s.color}30` : 'none',
            transition: 'all 0.3s',
          }}>
            {currentStep > s.step ? <FaCheck style={{ fontSize: '9px' }} /> : s.step}
          </div>
          <span style={{
            fontSize: '9px', marginTop: '3px', textAlign: 'center',
            color: currentStep >= s.step ? s.color : '#9ca3af',
            fontWeight: currentStep === s.step ? '700' : '400',
            lineHeight: 1.1,
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const ChiefDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [chiefName, setChiefName]     = useState('Chief');
  const [restaurantCode, setRestaurantCode] = useState('');
  const ordersPerPage = 8;
  const drawerRef = useRef<HTMLDivElement>(null);

  /* auth guard */
  useEffect(() => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAuth    = localStorage.getItem('adminAuthenticated');
    if (!isAuth || adminUser.role !== 'chief') { navigate('/admin'); return; }
    setChiefName(adminUser.name || 'Chief');
    setRestaurantCode(adminUser.siteCode || '');
  }, [navigate]);

  /* fetch orders */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${API_BASE_URL}/chief/orders/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
        else setError('Failed to load dashboard data');
      } catch { setError('Error connecting to server'); }
      finally { setLoading(false); }
    })();
  }, []);

  /* close drawer on outside tap */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  /* lock body scroll when drawer open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = () => {
    ['token', 'adminUser', 'adminAuthenticated'].forEach(k => localStorage.removeItem(k));
    navigate('/admin');
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/chief/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            recentOrders: prev.recentOrders.map(o =>
              o._id === orderId ? { ...o, orderStatus: status, statusUpdatedAt: new Date().toISOString() } : o
            ),
            pendingOrders:   status === 'COMPLETED' ? Math.max(0, prev.pendingOrders - 1) : prev.pendingOrders,
            completedToday:  status === 'COMPLETED' ? prev.completedToday + 1 : prev.completedToday,
          };
        });
      }
    } catch { /* silent */ }
  };

  /* derived */
  const allOrders  = stats?.recentOrders || [];
  const filtered   = statusFilter === 'ALL' ? allOrders : allOrders.filter(o => o.orderStatus === statusFilter);
  const totalPages = Math.ceil(filtered.length / ordersPerPage);
  const pageOrders = filtered.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  /* ── loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ff' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner-border" style={{ color: PURPLE, width: '3rem', height: '3rem' }} role="status" />
        <p style={{ color: PURPLE, marginTop: '16px', fontWeight: '600', fontSize: '1rem' }}>Loading Chief Dashboard…</p>
      </div>
    </div>
  );

  /* ── render ── */
  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav style={{
        background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
        height: '60px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(124,58,237,0.35)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        flexShrink: 0,
      }}>
        {/* left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button
            onClick={() => setDrawerOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: '6px', flexShrink: 0 }}
          >
            {drawerOpen ? <FaTimes /> : <FaBars />}
          </button>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <FaUtensils style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Chief Dashboard</span>
          </span>
        </div>

        {/* right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* name + code — hidden on xs */}
          <div className="d-none d-sm-block" style={{ color: '#fff', textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{chiefName}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{restaurantCode}</div>
          </div>
          {/* avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <FaUserShield style={{ fontSize: '14px' }} />
          </div>
          {/* logout — icon only on xs, text on sm+ */}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#fff', borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              fontWeight: '600', fontSize: '0.82rem', flexShrink: 0,
            }}
          >
            <FaSignOutAlt />
            <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* ══════════════════ DRAWER (overlay on all sizes) ══════════════════ */}
      {drawerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
        }}>
          <aside
            ref={drawerRef}
            style={{
              width: '260px',
              maxWidth: '80vw',
              background: '#fff',
              height: '100%',
              padding: '24px 16px',
              boxShadow: '4px 0 24px rgba(124,58,237,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              animation: 'slideIn 0.22s ease',
            }}
          >
            {/* drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: '800', color: PURPLE, fontSize: '1rem' }}>{chiefName}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>{restaurantCode}</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: '#f5f3ff', border: 'none', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: PURPLE }}
              >
                <FaTimes />
              </button>
            </div>

            <p style={{ color: PURPLE, fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>
              Filter Orders
            </p>

            {/* filter shortcuts in drawer */}
            {[
              { label: 'All Orders',  filter: 'ALL',       icon: <FaShoppingCart />, color: PURPLE },
              { label: 'Pending',     filter: 'PENDING',   icon: <FaClock />,        color: '#F59E0B' },
              { label: 'Preparing',   filter: 'PREPARING', icon: <FaUtensils />,     color: '#3B82F6' },
              { label: 'Ready',       filter: 'READY',     icon: <FaCheck />,        color: '#10B981' },
              { label: 'Completed',   filter: 'COMPLETED', icon: <FaCheckCircle />,  color: '#4F46E5' },
            ].map(item => (
              <button
                key={item.filter}
                onClick={() => { setStatusFilter(item.filter); setCurrentPage(1); setDrawerOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 12px', borderRadius: '10px',
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  marginBottom: '4px', border: 'none',
                  background: statusFilter === item.filter ? '#f5f3ff' : 'transparent',
                  color: statusFilter === item.filter ? item.color : '#374151',
                  fontWeight: statusFilter === item.filter ? '700' : '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ color: item.color, width: '16px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {statusFilter === item.filter && (
                  <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'block' }} />
                )}
              </button>
            ))}

            <div style={{ flex: 1 }} />
            <hr style={{ borderColor: '#ede9fe', margin: '16px 0' }} />
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 12px', borderRadius: '10px', border: 'none',
                background: '#fff5f5', color: '#dc2626', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.9rem', width: '100%',
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </aside>
          {/* click-outside area */}
          <div style={{ flex: 1 }} onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* ══════════════════ MAIN ══════════════════ */}
      <main style={{ flex: 1, padding: '20px 12px', overflowX: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Page title */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ color: PURPLE, fontWeight: '800', fontSize: 'clamp(1.3rem, 5vw, 2rem)', margin: 0 }}>
              Order Management
            </h1>
            <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '0.88rem' }}>
              Restaurant: <strong style={{ color: PURPLE }}>{restaurantCode}</strong>
            </p>
            {error && <div className="alert alert-warning mt-2 py-2" role="alert" style={{ fontSize: '0.88rem' }}>{error}</div>}
          </div>

          {/* ── Stats grid ── */}
          <div className="row g-2 g-sm-3 mb-4">
            {[
              { icon: <FaShoppingCart />, value: stats?.todayOrders ?? 0,   label: "Today's Orders", gradient: `linear-gradient(135deg,${PURPLE},${PURPLE_LIGHT})`, shadow: 'rgba(124,58,237,0.3)' },
              { icon: <FaRupeeSign />,    value: `₹${Math.round(parseFloat(stats?.todayRevenue || '0'))}`, label: "Revenue Today", gradient: 'linear-gradient(135deg,#10B981,#34D399)', shadow: 'rgba(16,185,129,0.3)' },
              { icon: <FaClock />,        value: stats?.pendingOrders ?? 0,  label: 'Pending',       gradient: 'linear-gradient(135deg,#F59E0B,#FBBF24)', shadow: 'rgba(245,158,11,0.3)' },
              { icon: <FaCheckCircle />,  value: stats?.completedToday ?? 0, label: 'Completed',     gradient: 'linear-gradient(135deg,#3B82F6,#60A5FA)', shadow: 'rgba(59,130,246,0.3)' },
            ].map((card, i) => (
              <div key={i} className="col-6 col-md-3">
                <div style={{
                  background: card.gradient, borderRadius: '14px', color: '#fff',
                  padding: '16px 12px', textAlign: 'center',
                  boxShadow: `0 4px 14px ${card.shadow}`,
                  transition: 'transform 0.25s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{card.icon}</div>
                  <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.75rem)', fontWeight: '800', lineHeight: 1 }}>{card.value}</div>
                  <div style={{ fontSize: '0.76rem', opacity: 0.9, marginTop: '4px' }}>{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Orders panel ── */}
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(124,58,237,0.09)', overflow: 'hidden' }}>

            {/* Panel header */}
            <div style={{ padding: '16px', borderBottom: '2px solid #ede9fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h5 style={{ color: PURPLE, fontWeight: '700', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <FaShoppingCart /> Recent Orders
                  <span style={{
                    background: '#f5f3ff', color: PURPLE, borderRadius: '12px',
                    padding: '1px 9px', fontSize: '0.78rem', fontWeight: '700',
                  }}>
                    {filtered.length}
                  </span>
                </h5>
                <button
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: '#f5f3ff', border: `1.5px solid ${PURPLE}`,
                    color: PURPLE, borderRadius: '8px', padding: '5px 12px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem',
                  }}
                >
                  <FaFilter /> Filter
                </button>
              </div>

              {/* horizontal-scroll filter chips */}
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              } as React.CSSProperties}>
                {(['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'DELIVERED'] as const).map(s => {
                  const active = statusFilter === s;
                  const col = s === 'ALL' ? PURPLE : getStatusStyle(s).bg;
                  return (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                      style={{
                        padding: '5px 13px', borderRadius: '20px', fontSize: '0.78rem',
                        fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0,
                        border: `1.5px solid ${col}`,
                        background: active ? col : 'transparent',
                        color: active ? '#fff' : col,
                        cursor: 'pointer', transition: 'all 0.18s',
                      }}
                    >
                      {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  );
                })}
              </div>

              {statusFilter !== 'ALL' && (
                <p style={{ color: '#16a34a', fontSize: '0.82rem', margin: '8px 0 0' }}>
                  {filtered.length} {statusFilter.toLowerCase()} orders
                  <button onClick={() => setStatusFilter('ALL')}
                    style={{ color: PURPLE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px', fontSize: '0.82rem' }}>
                    Clear
                  </button>
                </p>
              )}
            </div>

            {/* ── Desktop table ── */}
            <div className="d-none d-lg-block" style={{ padding: '0 16px 12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '90px 1.4fr 2fr 90px 1.8fr 130px',
                background: '#f5f3ff', borderRadius: '10px',
                padding: '10px 14px', fontWeight: '700',
                color: '#6b21a8', fontSize: '0.78rem',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginTop: '12px', marginBottom: '6px',
              }}>
                <span>Order ID</span>
                <span>Customer</span>
                <span>Items</span>
                <span>Total</span>
                <span>Progress</span>
                <span>Status</span>
              </div>

              {pageOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <FaShoppingCart style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>No orders found</p>
                </div>
              )}

              {pageOrders.map(order => (
                <div
                  key={order._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1.4fr 2fr 90px 1.8fr 130px',
                    alignItems: 'center', padding: '12px 14px', marginBottom: '6px',
                    borderRadius: '10px', border: '1px solid #ede9fe',
                    background: '#fff', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 12px rgba(124,58,237,0.13)'; el.style.borderColor = PURPLE_LIGHT; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.borderColor = '#ede9fe'; }}
                >
                  <div style={{ fontWeight: '700', color: PURPLE, fontSize: '0.88rem' }}>#{order._id.slice(-6)}</div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#212529', fontSize: '0.88rem' }}>
                      {order.user?.name || order.customer?.name || 'Guest'}
                    </div>
                    <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType || ''}
                    </small>
                  </div>
                  <div>
                    {order.items.slice(0, 2).map(item => (
                      <div key={item.menuItemId} style={{ fontSize: '0.82rem', color: '#374151' }}>
                        {item.name} <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && <small style={{ color: '#9ca3af' }}>+{order.items.length - 2} more</small>}
                  </div>
                  <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.9rem' }}>
                    ₹{(order.total || calcTotal(order.items)).toFixed(0)}
                  </div>
                  <div>
                    <span className="badge mb-1" style={{
                      background: getStatusStyle(order.orderStatus).bg, color: '#fff',
                      fontSize: '10px', fontWeight: '600', letterSpacing: '0.4px',
                    }}>
                      {order.orderStatus}
                    </span>
                    <div style={{ marginTop: '6px' }}><ProgressBar status={order.orderStatus} /></div>
                  </div>
                  <div>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderColor: '#ede9fe', borderRadius: '8px', fontSize: '0.82rem' }}
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

            {/* ── Tablet (md-lg) — condensed table ── */}
            <div className="d-none d-md-block d-lg-none" style={{ padding: '8px 12px 12px' }}>
              {pageOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No orders found</div>
              )}
              {pageOrders.map(order => (
                <div
                  key={order._id}
                  style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 80px 120px',
                    alignItems: 'center', gap: '8px',
                    padding: '12px', marginBottom: '6px', marginTop: '6px',
                    borderRadius: '10px', border: '1px solid #ede9fe', background: '#fff',
                  }}
                >
                  <div style={{ fontWeight: '700', color: PURPLE, fontSize: '0.85rem' }}>#{order._id.slice(-6)}</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{order.user?.name || order.customer?.name || 'Guest'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {order.items.slice(0, 1).map(i => i.name).join(', ')}
                      {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.88rem' }}>
                    ₹{(order.total || calcTotal(order.items)).toFixed(0)}
                  </div>
                  <select
                    className="form-select form-select-sm"
                    style={{ borderColor: '#ede9fe', fontSize: '0.8rem', borderRadius: '8px' }}
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
              ))}
            </div>

            {/* ── Mobile cards ── */}
            <div className="d-md-none" style={{ padding: '10px 10px 4px' }}>
              {pageOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <FaShoppingCart style={{ fontSize: '1.8rem', opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No orders found</p>
                </div>
              )}
              {pageOrders.map(order => (
                <div
                  key={order._id}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    marginBottom: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.07)',
                    border: '1px solid #ede9fe',
                  }}
                >
                  {/* card top bar */}
                  <div style={{
                    background: getStatusStyle(order.orderStatus).bg,
                    padding: '6px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.8rem' }}>
                      #{order._id.slice(-6)}
                    </span>
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* card body */}
                  <div style={{ padding: '12px 14px' }}>
                    {/* customer + amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#212529', fontSize: '0.95rem' }}>
                          {order.user?.name || order.customer?.name || 'Guest'}
                        </div>
                        {order.tableNumber && (
                          <div style={{ fontSize: '0.75rem', color: PURPLE, marginTop: '2px' }}>Table {order.tableNumber}</div>
                        )}
                      </div>
                      <div style={{ fontWeight: '800', color: '#10B981', fontSize: '1rem' }}>
                        ₹{(order.total || calcTotal(order.items)).toFixed(0)}
                      </div>
                    </div>

                    {/* items */}
                    <div style={{
                      background: '#f9f7ff', borderRadius: '8px', padding: '8px 10px',
                      marginBottom: '10px',
                    }}>
                      {order.items.map((item, idx) => (
                        <div
                          key={item.menuItemId}
                          style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '0.83rem', color: '#374151',
                            paddingBottom: idx < order.items.length - 1 ? '4px' : 0,
                            borderBottom: idx < order.items.length - 1 ? '1px dashed #e9d5ff' : 'none',
                            marginBottom: idx < order.items.length - 1 ? '4px' : 0,
                          }}
                        >
                          <span>{item.name}</span>
                          <span style={{ color: PURPLE, fontWeight: '600' }}>×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* progress */}
                    <div style={{ marginBottom: '10px' }}>
                      <ProgressBar status={order.orderStatus} />
                    </div>

                    {/* date + status selector */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <small style={{ color: '#9ca3af', fontSize: '0.72rem', flexShrink: 0 }}>
                        {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </small>
                      <select
                        className="form-select form-select-sm"
                        value={order.orderStatus}
                        onChange={e => updateOrderStatus(order._id, e.target.value)}
                        style={{
                          flex: 1, borderColor: '#ede9fe', borderRadius: '8px',
                          fontSize: '0.82rem', fontWeight: '600', color: '#374151',
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid #ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                  {(currentPage - 1) * ordersPerPage + 1}–{Math.min(currentPage * ordersPerPage, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      border: `1.5px solid ${PURPLE}`, background: '#fff', color: PURPLE,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.45 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <FaChevronLeft style={{ fontSize: '11px' }} />
                  </button>

                  {/* show max 5 page buttons on mobile */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                            background: currentPage === p ? PURPLE : '#f5f3ff',
                            color: currentPage === p ? '#fff' : PURPLE,
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem',
                          }}
                        >
                          {p}
                        </button>
                      )
                    )
                  }

                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      border: `1.5px solid ${PURPLE}`, background: '#fff', color: PURPLE,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.45 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <FaChevronRight style={{ fontSize: '11px' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* slide-in animation */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        /* hide scrollbar on filter chips */
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ChiefDashboard;
