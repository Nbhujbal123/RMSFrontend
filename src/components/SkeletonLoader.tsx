import React from 'react'

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'text'
  count?: number
}

const SkeletonLoader = ({ type = 'card', count = 3 }: SkeletonLoaderProps) => {
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }

  // Add keyframes for shimmer animation
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  if (type === 'card') {
    return (
      <div className="row g-3 g-md-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="col-12 col-sm-6 col-lg-4">
            <div 
              className="card border-0 shadow-sm"
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            >
              <div 
                style={{ 
                  height: '200px', 
                  width: '100%',
                  ...shimmerStyle 
                }} 
              />
              <div className="card-body p-3">
                <div 
                  style={{ 
                    height: '20px', 
                    width: '70%', 
                    borderRadius: '4px',
                    marginBottom: '12px',
                    ...shimmerStyle 
                  }} 
                />
                <div 
                  style={{ 
                    height: '14px', 
                    width: '100%', 
                    borderRadius: '4px',
                    marginBottom: '8px',
                    ...shimmerStyle 
                  }} 
                />
                <div 
                  style={{ 
                    height: '14px', 
                    width: '60%', 
                    borderRadius: '4px',
                    ...shimmerStyle 
                  }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: 5 }).map((_, index) => (
                <th key={index}>
                  <div style={{ height: '16px', width: '80px', borderRadius: '4px', ...shimmerStyle }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <div style={{ height: '14px', width: '100%', borderRadius: '4px', ...shimmerStyle }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div>
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index}
            className="d-flex align-items-center p-3 mb-2"
            style={{ 
              borderRadius: '8px', 
              background: '#f8f9fa',
              ...shimmerStyle 
            }}
          >
            <div style={{ height: '40px', width: '40px', borderRadius: '50%', marginRight: '12px', ...shimmerStyle }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: '8px', ...shimmerStyle }} />
              <div style={{ height: '12px', width: '40%', borderRadius: '4px', ...shimmerStyle }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default text skeleton
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          style={{ 
            height: '14px', 
            width: `${Math.random() * 40 + 60}%`, 
            borderRadius: '4px',
            marginBottom: '8px',
            ...shimmerStyle 
          }} 
        />
      ))}
    </div>
  )
}

export default SkeletonLoader
