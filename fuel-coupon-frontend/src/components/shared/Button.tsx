// src/components/shared/Button.tsx
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'outline';
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'border text-gray-700 hover:bg-gray-50';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}
