import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'antd/dist/reset.css';

// Simple minimal components
const queryClient = new QueryClient();

const MinimalHome = () => (
  <div style={{ padding: '20px' }}>
    <h1>Parliament Fuel Coupon System</h1>
    <p>System is being deployed. Please wait...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="*" element={<MinimalHome />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
