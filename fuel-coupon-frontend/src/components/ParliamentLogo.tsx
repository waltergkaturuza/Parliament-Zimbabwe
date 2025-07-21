// src/components/ParliamentLogo.tsx
import { FC } from 'react';
import parliamentLogo from '../assets/Logo_of_the_Parliament_of_Zimbabwe.png';

type LogoSize = 'xs' | 'small' | 'medium' | 'large';

interface ParliamentLogoProps {
  size?: LogoSize;
  className?: string;
  showText?: boolean;
}

const ParliamentLogo: FC<ParliamentLogoProps> = ({ 
  size = 'medium', 
  className = '',
  showText = true 
}) => {
  // TEMPORARILY HIDDEN - Return empty div
  return <div style={{ display: 'none' }}></div>;
  
  const sizeClasses: Record<LogoSize, string> = {
    xs: 'h-6 w-6',
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const textSizeClasses: Record<LogoSize, string> = {
    xs: 'text-xs',
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={parliamentLogo} 
        alt="Parliament of Zimbabwe Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-800 ${textSizeClasses[size]} leading-tight`}>
            Parliament of Zimbabwe
          </span>
          <span className={`text-gray-600 ${size === 'xs' ? 'text-xs' : size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'} leading-tight`}>
            Fuel Coupon System
          </span>
        </div>
      )}
    </div>
  );
};

export default ParliamentLogo;
