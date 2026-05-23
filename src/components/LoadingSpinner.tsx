import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'spinner-border-sm',
    medium: '',
    large: 'spinner-border'
  }

  const containerStyle: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px'
  }

  return (
    <div style={containerStyle}>
      <div 
        className={`spinner-border text-primary ${sizeClasses[size]}`}
        style={{ 
          color: '#4F46E5',
          width: size === 'large' ? '3rem' : size === 'medium' ? '2rem' : '1.5rem',
          height: size === 'large' ? '3rem' : size === 'medium' ? '2rem' : '1.5rem'
        }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && (
        <p className="mt-3 text-muted" style={{ fontSize: '14px' }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default LoadingSpinner
