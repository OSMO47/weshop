// components/LoadingSpinner.js
import React from 'react';

export default function LoadingSpinner() {
  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}