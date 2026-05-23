import React, { useState, useEffect } from 'react'
import {
  FaUser, FaSignOutAlt, FaArrowLeft, FaUtensils, FaList,
  FaHistory, FaFileInvoice, FaBox, FaPhone, FaEnvelope,
  FaCheckCircle, FaHourglassHalf, FaMotorcycle, FaFire
} from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api'

interface OrderItem {
  menuItemId: number
  name: string
  price: number
  quantity: number
}

interface Order {
  _id: string
  items: OrderItem[]
  total: number
  orderStatus: string
  isBilled: boolean
  isPaid?: boolean
  createdAt: string
}

interface BillItem {
  productId: number
  name: string
  price: number
  quantity: number
}

interface Bill {
  _id: string
  items: BillItem[]
  totalAmount: number
  status: string
  createdAt: string
  orderIds?: string[]
  customerId?: { _id: string; name: string; email: string }
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

/* ─── helpers ─────────────────────────────────────────────────── */

const getStatusStep = (status: string): number => {
  switch (status) {
    case 'PENDING':   return 1
    case 'PREPARING': return 2
    case 'READY':     return 3
    case 'COMPLETED': return 4
    case 'DELIVERED': return 4
    default:          return 0
  }
}

const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pending',   color: '#d97706', bg: '#fef3c7', icon: <FaHourglassHalf /> },
  PREPARING: { label: 'Preparing', color: '#2563eb', bg: '#dbeafe', icon: <FaFire /> },
  READY:     { label: 'Ready',     color: '#059669', bg: '#d1fae5', icon: <FaCheckCircle /> },
  COMPLETED: { label: 'Completed', color: '#7c3aed', bg: '#ede9fe', icon: <FaCheckCircle /> },
  DELIVERED: { label: 'Delivered', color: '#059669', bg: '#d1fae5', icon: <FaMotorcycle /> },
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

/* ─── sub-components ──────────────────────────────────────────── */

const ProgressBar: React.FC<{ status: string }> = ({ status }) => {
  const currentStep = getStatusStep(status)
  const steps = [
    { step: 1, label: 'Placed' },
    { step: 2, label: 'Preparing' },
    { step: 3, label: 'Ready' },
    { step: 4, label: 'Done' },
  ]
  const pct = Math.max(0, ((currentStep - 1) / 3) * 100)

  return (
    <div className="mt-3">
      <div style={{ position: 'relative', height: '4px', background: '#e5e7eb', borderRadius: '4px', margin: '0 10px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg,#FF6A00,#FF9900)',
          borderRadius: '4px', transition: 'width .4s ease'
        }} />
      </div>
      <div className="d-flex justify-content-between mt-1 px-1">
        {steps.map(s => (
          <div key={s.step} className="d-flex flex-column align-items-center" style={{ width: '25%' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: currentStep >= s.step ? 'linear-gradient(135deg,#FF6A00,#FF9900)' : '#e5e7eb',
              color: currentStep >= s.step ? '#fff' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, margin: '0 auto 2px',
              boxShadow: currentStep >= s.step ? '0 2px 6px rgba(255,106,0,.35)' : 'none'
            }}>
              {currentStep > s.step ? '✓' : s.step}
            </div>
            <span style={{
              fontSize: '9px',
              color: currentStep >= s.step ? '#FF6A00' : '#9ca3af',
              fontWeight: currentStep === s.step ? 700 : 400,
              textAlign: 'center'
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const OrderCard: React.FC<{ order: Order; isPaid: boolean }> = ({ order, isPaid }) => {
  const meta = statusMeta[order.orderStatus] ?? { label: order.orderStatus, color: '#6b7280', bg: '#f3f4f6', icon: null }
  const isActive = !['COMPLETED', 'DELIVERED'].includes(order.orderStatus)
  const enjoyed = (order.orderStatus === 'COMPLETED' || order.orderStatus === 'DELIVERED') && order.isBilled && !isPaid

  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: '1px solid #f0f0f0',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
      overflow: 'hidden', marginBottom: '12px'
    }}>
      {/* card header */}
      <div style={{
        background: 'linear-gradient(135deg,#fff8f0,#fff3e0)',
        padding: '12px 16px',
        borderBottom: '1px solid #fde8cc',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, letterSpacing: '.5px' }}>ORDER</span>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>
            #{order._id.slice(-8).toUpperCase()}
          </div>
        </div>
        <span style={{
          background: meta.bg, color: meta.color,
          padding: '4px 12px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* card body */}
      <div style={{ padding: '12px 16px' }}>
        {/* items */}
        <div style={{ marginBottom: '10px' }}>
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '13px', color: '#374151', lineHeight: '1.8'
            }}>
              <span><span style={{ color: '#FF6A00', fontWeight: 700 }}>{item.quantity}×</span> {item.name}</span>
              <span style={{ color: '#6b7280' }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              +{order.items.length - 3} more items
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: '#f3f4f6', margin: '10px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(order.createdAt)}</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#059669' }}>₹{Math.round(order.total)}</span>
        </div>

        {/* progress / enjoy */}
        {enjoyed && (
          <div style={{
            marginTop: '10px', padding: '10px', borderRadius: '10px',
            background: '#d1fae5', textAlign: 'center',
            fontSize: '13px', fontWeight: 700, color: '#065f46'
          }}>
            🍽️ Enjoy your food!
          </div>
        )}
        {isActive && <ProgressBar status={order.orderStatus} />}
      </div>
    </div>
  )
}

const BillCard: React.FC<{ bill: Bill }> = ({ bill }) => {
  const paid = bill.status === 'PAID'
  return (
    <div style={{
      background: '#fff', borderRadius: '16px',
      border: '1px solid #f0f0f0',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
      overflow: 'hidden', marginBottom: '12px'
    }}>
      <div style={{
        background: paid ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fffbeb,#fef3c7)',
        padding: '12px 16px', borderBottom: `1px solid ${paid ? '#bbf7d0' : '#fde68a'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, letterSpacing: '.5px' }}>BILL</span>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937' }}>
            #{bill._id.slice(-8).toUpperCase()}
          </div>
        </div>
        <span style={{
          background: paid ? '#059669' : '#d97706',
          color: '#fff', padding: '4px 12px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          {paid ? <><FaCheckCircle /> Paid</> : <><FaHourglassHalf /> Unpaid</>}
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ marginBottom: '10px' }}>
          {bill.items.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '13px', color: '#374151', lineHeight: '1.8'
            }}>
              <span><span style={{ color: '#FF6A00', fontWeight: 700 }}>{item.quantity}×</span> {item.name}</span>
              <span style={{ color: '#6b7280' }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          {bill.items.length > 3 && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              +{bill.items.length - 3} more items
            </div>
          )}
        </div>
        <div style={{ height: '1px', background: '#f3f4f6', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(bill.createdAt)}</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#059669' }}>₹{Math.round(bill.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── main component ──────────────────────────────────────────── */

const Profile: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingBills, setLoadingBills] = useState(false)
  const [activeTab, setActiveTab] = useState<'orders' | 'bills'>('orders')

  const handleLogout = () => { logout(); navigate('/') }

  useEffect(() => {
    if (user?.id) {
      fetchOrders()
    } else if (user?.email) {
      fetchOrdersByEmail()
    } else {
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        try {
          const userInfo = JSON.parse(storedUserInfo)
          if (userInfo.email) {
            fetchOrdersByEmail(userInfo.email)
            fetchBills(userInfo.email, userInfo.name)
          } else if (userInfo.name) {
            fetchAllOrdersForGuest()
            fetchBills('', userInfo.name)
          }
        } catch { fetchAllOrdersForGuest() }
      }
    }
    if (user?.email || user?.name) fetchBills()
  }, [user?.id, user?.email, user?.name])

  const fetchOrders = async () => {
    if (!user?.id) return
    setLoadingOrders(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const res = await fetch(`${API_BASE_URL}/orders/user/${user.id}`, { headers: { 'x-site-code': siteCode } })
      if (res.ok) setOrders(await res.json())
    } catch { /* silent */ } finally { setLoadingOrders(false) }
  }

  const fetchOrdersByEmail = async (email?: string) => {
    const e = email || user?.email
    if (!e) return
    setLoadingOrders(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const res = await fetch(`${API_BASE_URL}/orders/email/${e}`, { headers: { 'x-site-code': siteCode } })
      if (res.ok) setOrders(await res.json())
    } catch { /* silent */ } finally { setLoadingOrders(false) }
  }

  const fetchAllOrdersForGuest = async () => {
    setLoadingOrders(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const res = await fetch(`${API_BASE_URL}/orders`, { headers: { 'x-site-code': siteCode } })
      if (res.ok) {
        const all = await res.json()
        const info = localStorage.getItem('userInfo')
        if (info) {
          const { name } = JSON.parse(info)
          if (name) {
            setOrders(all.filter((o: any) => o.customer?.name?.toLowerCase() === name.toLowerCase()))
            return
          }
        }
        setOrders([])
      }
    } catch { /* silent */ } finally { setLoadingOrders(false) }
  }

  const fetchBills = async (email?: string, name?: string) => {
    const emailToUse = email || user?.email || ''
    const nameToUse  = name  || user?.name  || ''
    if (!emailToUse && !nameToUse) return
    setLoadingBills(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const res = await fetch(`${API_BASE_URL}/bills/all-with-info`, { headers: { 'x-site-code': siteCode } })
      if (res.ok) {
        const all: any[] = await res.json()
        const uEmail = emailToUse.toLowerCase()
        const uName  = nameToUse.toLowerCase()
        setBills(all.filter(b => {
          if (b.customerId?.email?.toLowerCase() === uEmail) return true
          if (b.customerEmail?.toLowerCase() === uEmail) return true
          if (b.customerName?.toLowerCase() === uName) return true
          return false
        }))
      }
    } catch { /* silent */ } finally { setLoadingBills(false) }
  }

  const isOrderPaid = (orderId: string) =>
    bills.some(b => b.status === 'PAID' && (b as any).orderIds?.some((id: any) => String(id) === orderId))

  const visibleOrders = orders.filter(o => !o.isPaid && !isOrderPaid(o._id))
  const totalSpent = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0)

  /* ── render ── */
  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>

      {/* ── hero header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6A00 0%, #FF9900 60%, #ffb347 100%)',
        padding: '0 0 60px',
        position: 'relative'
      }}>
        {/* back button */}
        <div style={{ padding: '16px 20px 0' }}>
          <Link to="/menu" style={{
            background: 'rgba(255,255,255,.25)', color: '#fff',
            border: 'none', borderRadius: '50%',
            width: '38px', height: '38px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', backdropFilter: 'blur(4px)'
          }}>
            <FaArrowLeft size={14} />
          </Link>
        </div>

        {/* avatar + name */}
        <div style={{ textAlign: 'center', padding: '20px 20px 0' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(255,255,255,.3)',
            border: '3px solid rgba(255,255,255,.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '28px', fontWeight: 800, color: '#fff',
            backdropFilter: 'blur(4px)', boxShadow: '0 4px 20px rgba(0,0,0,.15)'
          }}>
            {user?.name ? getInitials(user.name) : <FaUser size={32} />}
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: '4px', fontSize: '22px' }}>
            {user?.name ?? 'Guest'}
          </h2>
          {user?.email && (
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FaEnvelope size={11} /> {user.email}
            </div>
          )}
          {user?.phone && (
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <FaPhone size={11} /> {user.phone}
            </div>
          )}
        </div>

        {/* logout */}
        {user && (
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,.4)',
              borderRadius: '20px', padding: '6px 20px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </div>

      {/* ── stats strip (overlapping header) ── */}
      <div style={{ padding: '0 16px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#fff', borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,.10)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          overflow: 'hidden'
        }}>
          {[
            { value: orders.length, label: 'Orders', color: '#FF6A00' },
            { value: bills.length,  label: 'Bills',  color: '#7c3aed' },
            { value: `₹${Math.round(totalSpent)}`, label: 'Spent', color: '#059669' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '16px 8px', textAlign: 'center',
              borderRight: i < 2 ? '1px solid #f3f4f6' : 'none'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── content area ── */}
      <div style={{ padding: '20px 16px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Activity section */}
        {(user || localStorage.getItem('userInfo')) && (
          <div style={{ marginBottom: '24px' }}>
            <h6 style={{ fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
              <FaHistory style={{ color: '#FF6A00' }} /> My Activity
            </h6>

            {/* Tab bar */}
            <div style={{
              background: '#fff', borderRadius: '14px', padding: '5px',
              display: 'flex', gap: '4px', marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,.06)'
            }}>
              {(['orders', 'bills'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '10px',
                  background: activeTab === tab ? 'linear-gradient(90deg,#FF6A00,#FF9900)' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#6b7280',
                  border: 'none', borderRadius: '10px',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all .2s'
                }}>
                  {tab === 'orders' ? <><FaBox /> My Orders</> : <><FaFileInvoice /> Bill History</>}
                </button>
              ))}
            </div>

            {/* Orders tab */}
            {activeTab === 'orders' && (
              loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner-border" style={{ color: '#FF6A00' }} role="status" />
                  <p style={{ marginTop: '12px', color: '#9ca3af', fontSize: '14px' }}>Fetching your orders…</p>
                </div>
              ) : visibleOrders.length > 0 ? (
                visibleOrders.map(order => (
                  <OrderCard key={order._id} order={order} isPaid={isOrderPaid(order._id)} />
                ))
              ) : (
                <div style={{
                  background: '#fff', borderRadius: '20px',
                  padding: '40px 24px', textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,.06)'
                }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: '#fff8f0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 16px'
                  }}>
                    <FaBox size={30} style={{ color: '#FF6A00' }} />
                  </div>
                  <h6 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>No active orders</h6>
                  <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Looks like you haven't placed any orders yet.
                  </p>
                  <Link to="/menu" style={{
                    background: 'linear-gradient(90deg,#FF6A00,#FF9900)',
                    color: '#fff', borderRadius: '20px',
                    padding: '10px 28px', textDecoration: 'none',
                    fontSize: '13px', fontWeight: 700, display: 'inline-block'
                  }}>
                    Browse Menu
                  </Link>
                </div>
              )
            )}

            {/* Bills tab */}
            {activeTab === 'bills' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button onClick={() => fetchBills()} disabled={loadingBills} style={{
                    background: 'none', border: '1px solid #e5e7eb',
                    borderRadius: '20px', padding: '6px 16px',
                    fontSize: '12px', fontWeight: 600, color: '#6b7280',
                    cursor: 'pointer'
                  }}>
                    {loadingBills ? 'Loading…' : '↻ Refresh'}
                  </button>
                </div>
                {loadingBills ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="spinner-border" style={{ color: '#FF6A00' }} role="status" />
                    <p style={{ marginTop: '12px', color: '#9ca3af', fontSize: '14px' }}>Fetching your bills…</p>
                  </div>
                ) : bills.length > 0 ? (
                  bills.map(bill => <BillCard key={bill._id} bill={bill} />)
                ) : (
                  <div style={{
                    background: '#fff', borderRadius: '20px',
                    padding: '40px 24px', textAlign: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,.06)'
                  }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: '#f5f3ff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                      <FaFileInvoice size={30} style={{ color: '#7c3aed' }} />
                    </div>
                    <h6 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>No bill history</h6>
                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                      Your past bills will appear here once generated.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ marginBottom: '24px' }}>
          <h6 style={{ fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
            <FaUtensils style={{ color: '#FF6A00' }} /> Explore
          </h6>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link to="/menu" style={{
              background: 'linear-gradient(135deg,#FF6A00,#FF9900)',
              color: '#fff', borderRadius: '16px',
              padding: '18px 16px', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 16px rgba(255,106,0,.3)', textAlign: 'center'
            }}>
              <FaUtensils size={24} />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Browse Menu</span>
            </Link>
            <Link to="/Category" style={{
              background: '#fff', color: '#FF6A00',
              border: '2px solid #FF6A00', borderRadius: '16px',
              padding: '18px 16px', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              textAlign: 'center'
            }}>
              <FaList size={24} />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>View Categories</span>
            </Link>
          </div>
        </div>

        {/* Help links */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden'
        }}>
          {[
            { to: '/help-support',    label: 'Help & Support' },
            { to: '/terms-conditions', label: 'Terms & Conditions' },
          ].map((item, i, arr) => (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '15px 18px', textDecoration: 'none', color: '#374151',
              borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
              fontSize: '14px', fontWeight: 600
            }}>
              {item.label}
              <span style={{ color: '#d1d5db', fontSize: '18px' }}>›</span>
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: '11px', marginTop: '24px' }}>
          RestoM • v1.0
        </p>
      </div>
    </div>
  )
}

export default Profile
