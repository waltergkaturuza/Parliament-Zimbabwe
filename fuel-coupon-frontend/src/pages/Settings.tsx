// src/pages/Settings.tsx
import ParliamentLogo from '@/components/ParliamentLogo';

export default function Settings() {
    return (
      <div className="p-4">
        {/* Header with Parliament Logo */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b">
          <ParliamentLogo size="xs" showText={true} />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        {/* Add your settings content here */}
      </div>
    );
  }
