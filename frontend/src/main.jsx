import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalHire UI Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ECEEE9',
          fontFamily: 'sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '450px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#17261F', marginBottom: '8px' }}>
              GlobalHire AI Radar
            </h2>
            <p style={{ fontSize: '13px', color: '#6C7A72', marginBottom: '20px', lineHeight: '1.5' }}>
              Your session refreshed with live jobs. Click below to reload the latest listings.
            </p>
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                background: '#0A241B',
                color: '#00DF81',
                padding: '12px 24px',
                borderRadius: '16px',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reload Live Openings
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
