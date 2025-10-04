import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '0.75rem',
    }}
  >
    <div aria-label="loading" role="status" style={{ fontSize: '2rem' }}>
      ⏳
    </div>
    <p style={{ margin: 0 }}>{message}</p>
  </div>
);

export default LoadingSpinner;
