import React from 'react';

interface VerifiedStampProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifiedStamp: React.FC<VerifiedStampProps> = ({
  label = 'VERIFIED ✓',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px] tracking-widest',
    md: 'px-3.5 py-1.5 text-xs tracking-widest',
    lg: 'px-5 py-2.5 text-xs sm:text-sm tracking-widest'
  };

  return (
    <div
      className={`inline-flex flex-col items-center justify-center font-mono uppercase border-2 border-primary-accent text-primary-accent bg-surface select-none shadow-sm ${sizeClasses[size]} ${className}`}
      style={{
        transform: 'rotate(-1deg)'
      }}
    >
      <div className="flex items-center justify-between w-full text-[9px] sm:text-[10px] opacity-80 border-b border-primary-accent/40 pb-0.5 mb-0.5 tracking-wider gap-3">
        <span>C//L</span>
        <span>2026</span>
      </div>
      <div className="font-bold tracking-widest text-center">
        {label}
      </div>
    </div>
  );
};
