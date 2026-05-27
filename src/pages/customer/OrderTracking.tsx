import React, { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaCheckCircle, FaUtensils, FaCreditCard, FaWallet, FaMobileAlt, FaShoppingBag, FaBox } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
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
  createdAt: string
  tableNumber?: string
  orderType?: string
}

const OrderTracking: React.FC = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [orderType, setOrderType] = useState<string>('')
  const [tableNumber, setTableNumber] = useState<string>('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFlash, setStatusFlash] = useState(false)

  const fetchOrderDetails = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/orders/user/${user.id}`, {
        headers: { 'x-site-code': siteCode }
      })
      if (response.ok) {
        const orders = await response.json()
        const foundOrder = orders.find((o: Order) => o._id === orderId || o._id.slice(-8).toUpperCase() === orderId?.toUpperCase())
        if (foundOrder) {
          setOrder(foundOrder)
          if (foundOrder.tableNumber) setTableNumber(foundOrder.tableNumber)
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, orderId])

  const fetchLatestOrder = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true)
    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/orders/user/${user.id}`, {
        headers: { 'x-site-code': siteCode }
      })
      if (response.ok) {
        const orders = await response.json()
        if (orders.length > 0) setOrder(orders[0])
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const method = sessionStorage.getItem('paymentMethod') || 'card'
    const type = sessionStorage.getItem('orderType') || 'Dine-In'
    const table = localStorage.getItem('lastTableNumber') || ''
    setPaymentMethod(method)
    setOrderType(type)
    setTableNumber(table)

    if (orderId && user?.id) {
      fetchOrderDetails()
    } else {
      fetchLatestOrder()
    }
  }, [orderId, user?.id, fetchOrderDetails, fetchLatestOrder])

  // Poll order status every 5 seconds so customer sees updates without refreshing
  useEffect(() => {
    if (!order?._id) return

    const currentOrderId = order._id

    const poll = async () => {
      try {
        const siteCode = localStorage.getItem('siteCode') || ''
        const res = await fetch(`${API_BASE_URL}/orders/${currentOrderId}`, {
          headers: { 'x-site-code': siteCode }
        })
        if (!res.ok) return
        const fresh: Order = await res.json()
        setOrder(prev => {
          if (!prev || prev.orderStatus === fresh.orderStatus) return prev
          // Status changed — flash the badge
          setStatusFlash(true)
          setTimeout(() => setStatusFlash(false), 1500)
          return { ...prev, orderStatus: fresh.orderStatus }
        })
      } catch {
        // silent — next poll will retry
      }
    }

    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [order?._id])

  // Also keep socket listener as instant-update layer on top of polling
  useEffect(() => {
    if (!socket) return

    const handleStatusUpdate = ({ orderId: updatedId, status }: { orderId: string; status: string }) => {
      setOrder(prev => {
        if (!prev || prev._id.toString() !== updatedId.toString()) return prev
        return { ...prev, orderStatus: status }
      })
      setStatusFlash(true)
      setTimeout(() => setStatusFlash(false), 1500)
    }

    socket.on('order:status-updated', handleStatusUpdate)
    return () => { socket.off('order:status-updated', handleStatusUpdate) }
  }, [socket])

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'upi': return <FaMobileAlt className="text-primary me-2" />
      case 'wallet': return <FaWallet className="text-success me-2" />
      case 'card': return <FaCreditCard className="text-warning me-2" />
      default: return <FaCreditCard className="text-secondary me-2" />
    }
  }

  const getOrderTypeIcon = () => {
    return orderType === 'Takeaway'
      ? <FaShoppingBag className="text-info me-2" />
      : <FaUtensils className="text-danger me-2" />
  }

  // Get the current step based on order status (matching admin dashboard status)
  const getCurrentStep = () => {
    if (!order) return 0
    switch (order.orderStatus) {
      case 'PENDING': return 0
      case 'PREPARING': return 1
      case 'READY': return 2
      case 'COMPLETED': return 3
      case 'DELIVERED': return 3 // Legacy support
      default: return 0
    }
  }

  const currentStep = getCurrentStep()

  if (loading) {
    return (
      <div className="container py-5" style={{ minHeight: '100vh' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 text-center">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5" style={{ minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">

          <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
            <div className="d-flex justify-content-center align-items-center">
              <FaCheckCircle className="text-success mb-3" size={50} />
            </div>

            <h3 className="fw-bold mb-1">Order Confirmed!</h3>
            <p className="text-muted mb-2">Thank you for your payment.</p>
            <div className="mb-3">
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: statusFlash ? '#dcfce7' : '#f0fdf4',
                color: '#16a34a', border: '1px solid #86efac',
                borderRadius: '20px', padding: '3px 12px', fontSize: '0.78rem', fontWeight: '600',
                transition: 'background 0.4s ease',
              }}>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e',
                  display: 'inline-block', animation: 'livePulse 1.5s infinite',
                }} />
                Tracking live
              </span>
            </div>

            {/* Order ID */}
            {order && (
              <div className="mb-3">
                <small className="text-muted">Order ID: {order._id.slice(-8).toUpperCase()}</small>
              </div>
            )}
  
            {/* Payment Info */}
            <div className="d-flex align-items-center justify-content-center mb-3">
              {getPaymentIcon()}
              <h6 className="mb-0 fw-semibold">
                {paymentMethod === 'upi'
                  ? 'Paid via UPI'
                  : paymentMethod === 'wallet'
                  ? 'Paid via Wallet'
                  : 'Paid via Credit/Debit Card'}
              </h6>
            </div>

            {/* Table Number - Show for dine-in orders */}
            {(tableNumber || order?.tableNumber) && (
              <div className="mb-3">
                <span 
                  className="badge px-3 py-2"
                  style={{
                    background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  🍽 Table {tableNumber || order?.tableNumber}
                </span>
              </div>
            )}
  
            {/* Order Type */}
            <div className="d-flex align-items-center justify-content-center mb-4">
              {getOrderTypeIcon()}
              <h6 className="mb-0 fw-semibold">
                {orderType} Order
              </h6>
            </div>
  
            {/* Tracking Steps */}
            <div className="text-start">
              <div className={`d-flex align-items-center mb-3 ${currentStep >= 0 ? 'opacity-100' : 'opacity-50'}`}>
                <FaUtensils className={currentStep >= 0 ? 'text-success me-3' : 'text-muted me-3'} />
                <div>
                  <h6 className="fw-semibold mb-0">Order Received</h6>
                  <small className="text-muted">Your order has been received</small>
                </div>
              </div>
  
              <div className={`d-flex align-items-center mb-3 ${currentStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                <FaBox className={currentStep >= 1 ? 'text-primary me-3' : 'text-muted me-3'} />
                <div>
                  <h6 className="fw-semibold mb-0">Preparing</h6>
                  <small className="text-muted">Our chefs are preparing your meal</small>
                </div>
              </div>

              <div className={`d-flex align-items-center mb-3 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                <FaCheckCircle className={currentStep >= 2 ? 'text-warning me-3' : 'text-muted me-3'} />
                <div>
                  <h6 className="fw-semibold mb-0">Ready for Pickup</h6>
                  <small className="text-muted">Your order is ready to serve</small>
                </div>
              </div>
  
              <div className={`d-flex align-items-center ${currentStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                <FaCheckCircle className={currentStep >= 3 ? 'text-success me-3' : 'text-muted me-3'} />
                <div>
                  <h6 className="fw-semibold mb-0">Completed</h6>
                  <small className="text-muted">Enjoy your meal!</small>
                </div>
              </div>
            </div>

            {/* Order Total */}
            {order && (
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Total Amount</span>
                  <h5 className="fw-bold text-success mb-0">₹{Math.round(order.total)}</h5>
                </div>
              </div>
            )}

            <Link to="/profile" className="btn mt-4 w-100 rounded-pill text-white fw-semibold py-2"
              style={{ background: 'linear-gradient(90deg, #4F46E5, #6366F1)' }}>
              View My Orders
            </Link>
          </div>

          <style>{`
            @keyframes livePulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50%       { opacity: 0.4; transform: scale(1.4); }
            }
          `}</style>

        </div>
      </div>
    </div>
  )
}

export default OrderTracking
