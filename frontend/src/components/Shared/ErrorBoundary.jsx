import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to error monitoring service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%)',
          borderRadius: '12px',
          margin: '20px',
          border: '1px solid #fecaca'
        }}>
          <FiAlertTriangle style={{ 
            fontSize: '48px', 
            color: '#dc2626', 
            marginBottom: '16px' 
          }} />
          
          <h2 style={{ 
            color: '#dc2626', 
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: '600'
          }}>
            Oops! Something went wrong
          </h2>
          
          <p style={{ 
            color: '#7f1d1d', 
            marginBottom: '24px',
            fontSize: '16px',
            maxWidth: '500px'
          }}>
            We encountered an unexpected error. Don't worry, your data is safe. 
            Please try refreshing the page or contact support if the problem persists.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              <FiRefreshCw />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#dc2626';
              }}
            >
              Refresh Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '24px', 
              padding: '16px',
              background: '#fee2e2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: '500',
                color: '#7f1d1d',
                marginBottom: '8px'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{ 
                fontSize: '12px', 
                color: '#7f1d1d',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
