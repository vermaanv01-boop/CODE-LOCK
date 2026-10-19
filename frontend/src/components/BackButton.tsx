'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  label = 'BACK',
  className = ''
}) => {
  const router = useRouter();

  const buttonClasses = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-surface hover:bg-surface-highlight text-primary-text hover:text-primary-accent hover:border-primary-accent font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-150 shadow-sm ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-muted-text group-hover:text-primary-accent" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={() => router.back()}
      type="button"
      className={buttonClasses}
    >
      <ArrowLeft className="w-3.5 h-3.5 shrink-0 text-muted-text" />
      <span>{label}</span>
    </button>
  );
};
