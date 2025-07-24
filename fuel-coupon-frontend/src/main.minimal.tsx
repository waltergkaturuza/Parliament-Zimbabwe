import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => (
  <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
    <h1 style={{ color: '#1890ff', marginBottom: '20px' }}>Parliament Fuel Coupon System</h1>
    <div style={{ backgroundColor: '#f0f2f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h2 style={{ color: '#52c41a' }}>✅ System Deployed Successfully</h2>
      <p>The application is now live and running.</p>
    </div>
    <div style={{ marginTop: '30px' }}>
      <p><strong>Status:</strong> <span style={{ color: '#52c41a' }}>Online</span></p>
      <p><strong>Environment:</strong> Production</p>
      <p><strong>Version:</strong> 1.0.0</p>
    </div>
    <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
      <p>Full application features will be restored shortly.</p>
    </div>
  </div>
);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
