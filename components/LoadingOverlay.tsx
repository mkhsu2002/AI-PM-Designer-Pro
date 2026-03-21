import React from 'react';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  title: string;
  description: string;
  colorClass?: string; // e.g. 'purple', 'blue', 'green'
}

const COLOR_MAP: Record<string, string> = {
  purple: 'text-purple-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  title,
  description,
  colorClass = 'purple',
}) => {
  const spinnerColor = COLOR_MAP[colorClass] || COLOR_MAP.purple;

  return (
    <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative">
        <Spinner className={`w-20 h-20 ${spinnerColor}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-white rounded-full opacity-10 animate-ping"></div>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
};
