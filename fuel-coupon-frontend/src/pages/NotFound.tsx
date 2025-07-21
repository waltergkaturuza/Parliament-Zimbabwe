// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import ParliamentLogo from '@/components/ParliamentLogo';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 relative">
      {/* Full logo in top-left corner */}
      <div className="absolute top-4 left-4">
        <ParliamentLogo size="xs" showText={true} />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
