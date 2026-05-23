import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/customer/Login'
import Signup from '../pages/customer/Signup'
import { toast } from '../components/Toast'

const WelcomePage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const handleStart = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuth = () => {
    setShowAuthModal(false)
  }

  const handleSwitchToSignup = () => {
    setAuthMode('signup')
  }

  const handleSwitchToLogin = () => {
    setAuthMode('login')
  }

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('token', token)
    if (user?.siteCode) {
      localStorage.setItem('siteCode', user.siteCode)
    }
    login({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      profilePicture: '',
    })
    setShowAuthModal(false)
    navigate('/menu')
  }

  const handleSignup = async (userData) => {
    try {
      const response = await fetch('https://restom-backend-2.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      const data = await response.json()
      if (response.ok) {
        // Signup successful, now show OTP verification
        // But since Signup component handles it, perhaps just close modal
        // Actually, the Signup component shows OTP modal on success
        // So this handleSignup is called after OTP verification
        // Wait, looking at Signup.tsx, onSignup is called with userData, but in Signup, onSignup is for after verification?
        // In Signup.tsx, onSignup: (userData: { name: string; email: string; phone: string; password: string }) => void
        // But it's called in handleOTPVerify, after verification.
        // In WelcomePage, handleSignup is passed to Signup as onSignup, so it's called after successful signup + OTP.
        // So I need to login the user after signup.
        // But the API returns message, not token.
        // After OTP verification, the user should login.
        // But in Signup.tsx, after verify OTP, it calls onSwitchToLogin, which switches to login modal.
        // So handleSignup in WelcomePage is not called.
        // The Signup component handles the flow internally.
        // So this handleSignup is not used.
        // To fix, perhaps remove it or implement if needed.
        console.log('Signup completed:', userData)
        setShowAuthModal(false)
        navigate('/category')
      } else {
        toast.error(data.message || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Signup failed. Please try again.')
    }
  }

  return (
    <div
      className="relative d-flex flex-column justify-content-center align-items-center vh-100 text-center overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #fffaf4, #fff3e0)',
        color: '#333',
      }}
    >
      {/* 🌟 Floating Stars Background */}
      {/* <div className="absolute inset-0 overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="star absolute text-warning opacity-50"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 18 + 8}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div> */}

      {/* Logo */}
      <img
        src="/assets/images/Logo.png"
        alt="Logo"
        className="mb-4"
        style={{
          width: '220px',
          height: '80px',
          objectFit: 'contain',
          marginBottom: '40px',
        }}
      />

      {/* Tagline */}
      <p
        className="text-danger fw-semibold mb-3"
        style={{
          fontSize: '16px',
          letterSpacing: '0.5px',
        }}
      >
        Authentic Flavors Delivered
      </p>

      {/* Description */}
      <p
        className="text-muted mb-4"
        style={{
          maxWidth: '320px',
          fontSize: '15px',
          lineHeight: '1.6',
        }}
      >
        Experience the finest culinary delights from our kitchen to your table — fresh, fast, and bursting with flavor.
      </p>

      {/* Button */}
      <button
        className="btn text-white px-5 py-2 fw-semibold"
        style={{
          background: 'linear-gradient(90deg, #FFA500, #FF6B00)',
          borderRadius: '25px',
          boxShadow: '0px 4px 10px rgba(255, 107, 0, 0.3)',
          fontSize: '15px',
        }}
        onClick={handleStart}
      >
        Ready to Order
      </button>

      {/* Auth Modal */}
      {showAuthModal && (
        authMode === 'login' ? (
          <Login
            onClose={handleCloseAuth}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <Signup
            onClose={handleCloseAuth}
            onSwitchToLogin={handleSwitchToLogin}
            onSignup={handleSignup}
          />
        )
      )}

      {/* ⭐ Floating Stars Animation CSS */}
      <style>{`
        // @keyframes float {
        //   0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        //   25% { transform: translate(-10px, 10px) scale(1.1); opacity: 0.6; }
        //   50% { transform: translate(10px, -10px) scale(0.9); opacity: 0.5; }
        //   75% { transform: translate(-5px, 5px) scale(1.05); opacity: 0.7; }
        //   100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        // }

        // .star {
        //   position: absolute;
        //   animation: float infinite ease-in-out;
        //   color: gold;
        //   text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
        //   pointer-events: none;
        //   user-select: none;
        // }
      `}</style>
    </div>
  )
}

export default WelcomePage