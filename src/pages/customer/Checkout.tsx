import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from '../../components/Toast'
import { API_BASE_URL } from '../../config/api'

interface OrderData {
  name: string
  email: string
  phone: string
  address: string
}

const Checkout = () => {
  const { cart, getTotalPrice, clearCart, tableNumber } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderData, setOrderData] = useState<OrderData>({
    name: '',
    email: '',
    phone: '',
    address: tableNumber ? `Table ${tableNumber} - Dine in` : ''
  })

  const deliveryFee = tableNumber ? 0 : 2.99
  const tax = getTotalPrice() * 0.08
  const total = Math.round((getTotalPrice() + deliveryFee + tax) * 100) / 100

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Generate random order ID
    const orderId = 'FF' + Math.random().toString(36).substr(2, 9).toUpperCase()

    const orderPayload = {
      orderId,
      user: user?.id || null,
      tableNumber: tableNumber,
      customer: {
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        spiceLevel: item.spiceLevel
      })),
      totalAmount: total,
      orderType: tableNumber ? 'dine-in' : 'delivery'
    }

    try {
      const siteCode = localStorage.getItem('siteCode') || ''
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-site-code': siteCode
        },
        body: JSON.stringify(orderPayload)
      })

      if (response.ok) {
        // Clear the cart after successful order
        clearCart()
        localStorage.setItem('userEmail', orderData.email)
        localStorage.setItem('userInfo', JSON.stringify({
          name: orderData.name,
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          tableNumber: tableNumber
        }))
        toast.success('Order placed successfully!')
        // Pass order details to success page
        navigate('/order-success', { 
          state: { 
            orderId, 
            tableNumber 
          } 
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Failed to place order. Please try again.')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-center mb-5" style={{ color: '#4F46E5' }}>Checkout</h1>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Customer Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={orderData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={orderData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={orderData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="address" className="form-label">
                      {tableNumber ? 'Additional Notes (Optional)' : 'Delivery Address'}
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows={3}
                      value={orderData.address}
                      onChange={handleInputChange}
                      required={!tableNumber}
                      placeholder={tableNumber ? 'Any special instructions?' : 'Enter your delivery address'}
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>
          </div>

        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Order Summary</h5>
            </div>
            <div className="card-body">
              {/* Table Number Display */}
              {tableNumber && (
                <div 
                  className="mb-3 p-3 rounded-3"
                  style={{
                    background: 'linear-gradient(135deg, #FF6A00, #FF9900)',
                    color: 'white'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <span className="me-2">🍽</span>
                    <div>
                      <small className="d-block opacity-75">Dining at</small>
                      <strong>Table {tableNumber}</strong>
                    </div>
                  </div>
                </div>
              )}
              
              {cart.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>{tableNumber ? <span className="text-success">Free</span> : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Tax:</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total:</span>
                <span className="fw-bold text-primary fs-5">₹{total.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout