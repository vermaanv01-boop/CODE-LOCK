import React from 'react';

interface VerifiedStampProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VerifiedStamp: React.FC<VerifiedStampProps> = ({
  label = 'Verified',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <div
      className={`inline-flex select-none flex-col items-center justify-center rounded-md border border-success/50 bg-accent-green/25 font-mono uppercase tracking-[0.14em] text-success ${sizeClasses[size]} ${className}`}
      style={{ transform: 'rotate(-1.5deg)' }}
      aria-label={label}
    >
      <div className="mb-0.5 flex w-full items-center justify-between gap-3 border-b border-success/30 pb-0.5 text-[9px] opacity-80">
        <span>C//L</span>
        <span>2026</span>
      </div>
      <div className="text-center font-semibold">{label}</div>
    </div>
  );
};
