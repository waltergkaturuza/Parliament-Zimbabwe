// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/providers/QueryProvider';
import router from '@/routes';
import './index.css';

// Temporarily suppress React 19/Antd compatibility warning for development
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('antd: compatible') || args[0]?.includes?.('React is 16 ~ 18')) {
    return; // Suppress the specific warning
  }
  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>
);
