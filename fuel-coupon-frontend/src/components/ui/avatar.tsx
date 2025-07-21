// src/components/ui/avatar.tsx (example with TypeScript)
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  // Add any other specific props for your Avatar component
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className, ...props }) => {
  return <img src={src} alt={alt} className={`your-avatar-styles ${className}`} {...props} />;
};
