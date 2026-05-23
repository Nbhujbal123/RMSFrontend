import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    })
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div 
          className="d-flex flex-column align-items-center justify-content-center py-5"
          style={{ minHeight: '50vh' }}
        >
          <div className="text-center p-4">
            <div 
              className="mb-4"
              style={{ 
                fontSize: '60px',
                lineHeight: 1
              }}
            >
              ⚠️
            </div>
            <h4 
              className="fw-bold mb-3"
              style={{ color: '#4F46E5' }}
            >
              Oops! Something went wrong
            </h4>
            <p className="text-muted mb-4" style={{ maxWidth: '400px' }}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <div 
                className="alert alert-danger text-start mb-4" 
                style={{ 
                  maxWidth: '500px', 
                  margin: '0 auto',
                  fontSize: '12px' 
                }}
                role="alert"
              >
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-primary px-4 py-2 rounded-pill"
                style={{ 
                  background: '#4F46E5',
                  border: 'none'
                }}
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                className="btn btn-outline-secondary px-4 py-2 rounded-pill"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
