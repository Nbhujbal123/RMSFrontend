import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { FaPlus, FaMinus, FaShoppingCart, FaArrowLeft, FaTrash, FaShoppingBag, FaCheckCircle } from 'react-icons/fa'
import { toast } from '../../components/Toast'
import { API_BASE_URL } from '../../config/api'

const Cart = () => {
  const { cart, updateQuantity, getTotalPrice, clearCart, removeFromCart, tableNumber } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOrdering, setIsOrdering] = useState(false)
  const [showOrderPlaced, setShowOrderPlaced] = useState(false)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderTotal, setOrderTotal] = useState(0)
  const [orderTableNumber, setOrderTableNumber] = useState<string | null>(null)

  const TAX_RATE   = 0.05
  const taxAmount  = getTotalPrice() * TAX_RATE
  const grandTotal = getTotalPrice() + taxAmount

  const handleQuantityChange = (id: number, newQty: number) => {
    if (newQty <= 0) removeFromCart(id)
    else updateQuantity(id, newQty)
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) clearCart()
  }

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) { toast.error('Your cart is empty.'); return }
    setIsOrdering(true)

    let userId        = user?.id    || null
    let customerName  = user?.name  || ''
    let customerEmail = user?.email || ''

    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        const info    = JSON.parse(storedUserInfo)
        customerName  = info.name  || customerName
        customerEmail = info.email || customerEmail
      } catch {}
    }

    const orderPayload = {
      user: userId,
      tableNumber,
      orderType: tableNumber ? 'dine-in' : 'takeaway',
      customer: { name: customerName, email: customerEmail, phone: '', address: tableNumber ? `Table ${tableNumber}` : '' },
      items: cart.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      totalAmount: grandTotal,
    }

    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-site-code': siteCode },
        body: JSON.stringify(orderPayload),
      })
      if (res.ok) {
        setOrderItems(cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })))
        setOrderTotal(grandTotal)
        setOrderTableNumber(tableNumber)
        setShowOrderPlaced(true)
        setIsOrdering(false)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || 'Failed to place order. Please try again.')
        setIsOrdering(false)
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.')
      setIsOrdering(false)
    }
  }

  const handleCloseOrderPlaced = () => {
    clearCart()
    setShowOrderPlaced(false)
    navigate('/profile')
  }

  /* ─── empty state ─── */
  if (cart.length === 0) {
    return (
      <div style={{
        background: '#f8f9fa', minHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: '#fff8f0', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', boxShadow: '0 4px 20px rgba(255,106,0,.15)',
        }}>
          <FaShoppingCart size={40} style={{ color: '#FF6A00', opacity: .6 }} />
        </div>
        <h3 style={{ fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>Your cart is empty</h3>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Add something tasty from our menu!</p>
        <Link to="/menu" style={{
          background: 'linear-gradient(90deg,#FF6A00,#FF9900)', color: '#fff',
          borderRadius: '50px', padding: '12px 36px', textDecoration: 'none',
          fontWeight: 700, fontSize: '15px', boxShadow: '0 4px 16px rgba(255,106,0,.3)',
        }}>
          Browse Menu
        </Link>
      </div>
    )
  }

  /* ─── qty stepper ─── */
  const QtyControl = ({ item }: { item: typeof cart[0] }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      background: 'linear-gradient(90deg,#FF6A00,#FF9900)',
      borderRadius: '50px', overflow: 'hidden',
    }}>
      <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} style={{
        background: 'transparent', border: 'none', color: '#fff',
        width: '34px', height: '34px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FaMinus size={10} />
      </button>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>
        {item.quantity}
      </span>
      <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} style={{
        background: 'transparent', border: 'none', color: '#fff',
        width: '34px', height: '34px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FaPlus size={10} />
      </button>
    </div>
  )

  return (
    <>
      {/* ─── responsive styles ─── */}
      <style>{`
        .cart-page { background: #f8f9fa; min-height: 100vh; padding: 16px 12px 120px; }
        .cart-inner { max-width: 960px; margin: 0 auto; }

        /* item row — desktop */
        .cart-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-bottom: 1px solid #f3f4f6;
        }
        .cart-item-info   { flex: 1; min-width: 0; }
        .cart-item-right  { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .cart-item-total  { font-weight: 800; font-size: 15px; color: #1f2937; min-width: 68px; text-align: right; }
        .cart-item-img    { width: 68px; height: 68px; border-radius: 12px; object-fit: cover; flex-shrink: 0; border: 2px solid #fff8f0; }

        /* item row — mobile (<= 500px) */
        @media (max-width: 500px) {
          .cart-item         { flex-wrap: wrap; gap: 10px; padding: 12px 14px; }
          .cart-item-img     { width: 56px; height: 56px; border-radius: 10px; }
          .cart-item-info    { flex: 1; min-width: 0; }
          .cart-item-right   { width: 100%; justify-content: space-between; margin-top: 2px; }
          .cart-item-total   { font-size: 14px; min-width: unset; }
        }

        /* summary sidebar */
        .cart-summary-sidebar { position: sticky; top: 72px; }

        /* mobile bottom bar — hidden on desktop */
        .cart-bottom-bar {
          display: none;
        }
        @media (max-width: 991px) {
          .cart-page { padding-bottom: 140px; }
          .cart-bottom-bar {
            display: block;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #fff;
            border-top: 1px solid #f3f4f6;
            padding: 12px 16px;
            z-index: 500;
            box-shadow: 0 -4px 20px rgba(0,0,0,.10);
          }
          /* hide the sidebar summary on mobile since bottom bar covers it */
          .cart-summary-col { display: none !important; }
        }
      `}</style>

      <div className="cart-page">
        <div className="cart-inner">

          {/* ── header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <Link to="/menu" style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#fff', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#374151', textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,.07)', flexShrink: 0,
            }}>
              <FaArrowLeft size={14} />
            </Link>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '20px', color: '#1f2937', margin: 0 }}>Your Order</h1>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* table badge (mobile visible) */}
          {tableNumber && (
            <div style={{
              background: '#fff8f0', border: '1px solid #fde8cc',
              borderRadius: '12px', padding: '10px 16px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>🍽</span>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>DINING AT</div>
                <div style={{ fontWeight: 800, color: '#FF6A00' }}>Table {tableNumber}</div>
              </div>
            </div>
          )}

          <div className="row g-4">

            {/* ── cart items list ── */}
            <div className="col-12 col-lg-7">
              <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,.07)', overflow: 'hidden' }}>
                {cart.map(item => (
                  <div key={`${item.id}-${item.spiceLevel}`} className="cart-item">

                    {/* image */}
                    <img src={item.image} alt={item.name} className="cart-item-img" />

                    {/* name + price */}
                    <div className="cart-item-info">
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#FF6A00', fontWeight: 600, marginTop: '3px' }}>
                        ₹{item.price.toFixed(2)} each
                      </div>
                    </div>

                    {/* qty + total + remove */}
                    <div className="cart-item-right">
                      <QtyControl item={item} />
                      <div className="cart-item-total">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button onClick={() => handleQuantityChange(item.id, 0)} style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#fff1f2', color: '#dc2626',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* clear cart */}
              <button onClick={handleClearCart} style={{
                marginTop: '12px', background: 'transparent', border: 'none',
                color: '#9ca3af', fontSize: '13px', cursor: 'pointer',
                padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <FaTrash size={11} /> Clear cart
              </button>
            </div>

            {/* ── order summary sidebar (desktop only) ── */}
            <div className="col-12 col-lg-5 cart-summary-col">
              <div className="cart-summary-sidebar" style={{
                background: '#fff', borderRadius: '20px',
                boxShadow: '0 2px 16px rgba(0,0,0,.07)', overflow: 'hidden',
              }}>
                <div style={{ background: 'linear-gradient(90deg,#FF6A00,#FF9900)', padding: '18px 24px' }}>
                  <h5 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>Order Summary</h5>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {tableNumber && (
                    <div style={{
                      background: '#fff8f0', borderRadius: '12px', padding: '12px 16px',
                      marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px',
                      border: '1px solid #fde8cc',
                    }}>
                      <span style={{ fontSize: '22px' }}>🍽</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>DINING AT</div>
                        <div style={{ fontWeight: 800, color: '#FF6A00' }}>Table {tableNumber}</div>
                      </div>
                    </div>
                  )}

                  {[
                    { label: 'Subtotal', value: `₹${getTotalPrice().toFixed(2)}` },
                    { label: 'Tax (5%)', value: `₹${taxAmount.toFixed(2)}` },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                      <span style={{ color: '#6b7280' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{row.value}</span>
                    </div>
                  ))}

                  <div style={{ height: '1px', background: '#f3f4f6', margin: '14px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: '#1f2937' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '20px', color: '#FF6A00' }}>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <button disabled={isOrdering} onClick={handleProceedToCheckout} style={{
                    width: '100%', border: 'none', borderRadius: '50px', padding: '14px',
                    background: isOrdering ? '#d1d5db' : 'linear-gradient(90deg,#FF6A00,#FF9900)',
                    color: '#fff', fontWeight: 800, fontSize: '15px',
                    cursor: isOrdering ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: isOrdering ? 'none' : '0 6px 20px rgba(255,106,0,.35)',
                    marginBottom: '10px', transition: 'all .2s',
                  }}>
                    {isOrdering
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status" /> Processing…</>
                      : <><FaCheckCircle /> Place Order</>}
                  </button>

                  <button onClick={() => navigate('/menu')} style={{
                    width: '100%', border: '2px solid #FF9900', borderRadius: '50px', padding: '12px',
                    background: 'transparent', color: '#FF6A00', fontWeight: 700, fontSize: '14px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    <FaShoppingBag /> Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── mobile bottom bar ── */}
      <div className="cart-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Subtotal + Tax (5%)</div>
            <div style={{ fontWeight: 800, fontSize: '20px', color: '#FF6A00' }}>₹{grandTotal.toFixed(2)}</div>
          </div>
          <button onClick={() => navigate('/menu')} style={{
            border: 'none', background: '#f3f4f6', color: '#6b7280',
            borderRadius: '50px', padding: '8px 16px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <FaShoppingBag size={12} /> Menu
          </button>
        </div>
        <button disabled={isOrdering} onClick={handleProceedToCheckout} style={{
          width: '100%', border: 'none', borderRadius: '50px', padding: '15px',
          background: isOrdering ? '#d1d5db' : 'linear-gradient(90deg,#FF6A00,#FF9900)',
          color: '#fff', fontWeight: 800, fontSize: '16px',
          cursor: isOrdering ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: isOrdering ? 'none' : '0 6px 20px rgba(255,106,0,.4)',
        }}>
          {isOrdering
            ? <><span className="spinner-border spinner-border-sm me-1" role="status" /> Processing…</>
            : <><FaCheckCircle /> Place Order — ₹{grandTotal.toFixed(2)}</>}
        </button>
      </div>

      {/* ── Order Placed Popup ── */}
      {showOrderPlaced && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', cursor: 'pointer',
          }}
          onClick={handleCloseOrderPlaced}
        >
          <div
            style={{
              background: '#fff', borderRadius: '24px', padding: '32px 24px',
              maxWidth: '380px', width: '90%', textAlign: 'center', cursor: 'default',
              boxShadow: '0 20px 60px rgba(0,0,0,.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#10B981,#34D399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(16,185,129,.3)',
            }}>
              <FaCheckCircle size={38} style={{ color: '#fff' }} />
            </div>

            <h3 style={{ fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>Order Placed!</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              We're preparing your delicious food. Hang tight!
            </p>

            {orderTableNumber && (
              <div style={{
                background: '#fff8f0', border: '1px solid #fde8cc',
                borderRadius: '12px', padding: '10px 16px', marginBottom: '16px',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                <span>🍽</span>
                <span style={{ fontWeight: 800, color: '#FF6A00' }}>Table {orderTableNumber}</span>
              </div>
            )}

            {orderItems.length > 0 && (
              <div style={{
                background: '#f9fafb', borderRadius: '14px',
                padding: '14px 16px', marginBottom: '20px', textAlign: 'left',
              }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, marginBottom: '8px', letterSpacing: '.5px' }}>
                  ORDER SUMMARY
                </div>
                {orderItems.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span style={{ color: '#FF6A00', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                {orderItems.length > 3 && (
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>+{orderItems.length - 3} more</div>
                )}
                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                  <span style={{ color: '#1f2937' }}>Total</span>
                  <span style={{ color: '#FF6A00' }}>₹{orderTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              <button onClick={handleCloseOrderPlaced} style={{
                background: 'linear-gradient(90deg,#FF6A00,#FF9900)', color: '#fff',
                border: 'none', borderRadius: '50px', padding: '13px',
                fontWeight: 800, cursor: 'pointer', fontSize: '14px',
                boxShadow: '0 4px 16px rgba(255,106,0,.3)',
              }}>
                View My Orders
              </button>
              <button onClick={() => { setShowOrderPlaced(false); navigate('/menu') }} style={{
                border: '2px solid #FF9900', color: '#FF6A00',
                background: 'transparent', borderRadius: '50px',
                padding: '11px', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Cart
