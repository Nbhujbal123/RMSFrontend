import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCheckCircle, FaShoppingCart } from 'react-icons/fa'

interface CartToastProps {
  show: boolean
  itemName?: string
  onClose: () => void
}

const CartToast: React.FC<CartToastProps> = ({ show, itemName, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to finish
  }

  const handleViewCart = () => {
    handleClose()
    navigate('/cart')
  }

  if (!show && !isVisible) return null

  return (
    <div
      className={`position-fixed bottom-0 end-0 m-3 p-3 bg-white shadow-lg rounded-3 d-flex align-items-center gap-3 ${isVisible ? 'toast-show' : 'toast-hide'}`}
      style={{
        zIndex: 9999,
        minWidth: '280px',
        maxWidth: '350px',
        borderLeft: '4px solid #4F46E5',
        animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in'
      }}
    >
      {/* Success Icon */}
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#4F46E5',
          flexShrink: 0
        }}
      >
        <FaCheckCircle className="text-white" size={20} />
      </div>

      {/* Content */}
      <div className="flex-grow-1">
        <p className="mb-0 fw-bold text-dark" style={{ fontSize: '14px' }}>
          {itemName ? `${itemName} added to cart` : 'Item added to cart'}
        </p>
        <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
          {itemName ? `${itemName} • Added successfully` : 'Successfully added'}
        </p>
      </div>

      {/* View Cart Button */}
      <button
        onClick={handleViewCart}
        className="btn btn-sm fw-semibold px-3 py-2"
        style={{
          background: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}
      >
        <FaShoppingCart className="me-1" size={12} />
        View Cart
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="btn-close position-absolute"
        style={{ top: '8px', right: '8px', opacity: 0.5 }}
        aria-label="Close"
      />

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .toast-show {
          animation: slideIn 0.3s ease-out forwards;
        }

        .toast-hide {
          animation: slideOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  )
}

export default CartToast
