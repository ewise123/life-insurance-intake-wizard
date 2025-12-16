import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  // Ensure we don't exceed 100% and handle 0 gracefully
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-xs font-semibold text-brand-textSecondary uppercase tracking-wide mb-2">
        <span>Step {current}</span>
        <span>Life Insurance Intake</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-brand-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
