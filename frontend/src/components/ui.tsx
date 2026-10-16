import React from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

/* Small uppercase editorial label */
export const SectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-text ${className}`}
  >
    {children}
  </div>
);

/* Status pill — never colour-only: always carries a text label */
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-accent-green text-primary-accent border-transparent',
  COMPLETED: 'bg-accent-blue text-primary-accent border-transparent',
  NOT_STARTED: 'bg-accent-yellow text-primary-accent border-transparent',
  FINISHED: 'bg-accent-green text-primary-accent border-transparent',
  ROUND_1_COMPLETE: 'bg-accent-blue text-primary-accent border-transparent',
  ROUND_2_COMPLETE: 'bg-accent-blue text-primary-accent border-transparent',
  IN_ROUND_3: 'bg-accent-pink text-primary-accent border-transparent',
};

export const StatusBadge: React.FC<{ status?: string; className?: string }> = ({
  status,
  className = '',
}) => {
  const key = (status || '').toUpperCase();
  const style = STATUS_STYLES[key] || 'bg-surface-highlight text-muted-text border-border';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${style} ${className}`}
    >
      {(key === 'ACTIVE' || key === 'IN_ROUND_3') && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {(status || 'UNKNOWN').replace(/_/g, ' ')}
    </span>
  );
};

/* Metric tile used across dashboards/scoreboards */
export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: 'default' | 'green' | 'blue' | 'pink' | 'yellow';
  className?: string;
}> = ({ label, value, hint, accent = 'default', className = '' }) => {
  const valueColor =
    accent === 'green'
      ? 'text-success'
      : accent === 'blue'
      ? 'text-primary-accent'
      : accent === 'pink'
      ? 'text-primary-accent'
      : accent === 'yellow'
      ? 'text-warning'
      : 'text-primary-text';
  return (
    <div
      className={`min-w-0 rounded-md border border-border bg-surface px-4 py-3 ${className}`}
    >
      <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
        {label}
      </div>
      <div className={`mt-1 truncate text-xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.1em] text-muted-text">
          {hint}
        </div>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'Loading…',
}) => (
  <div
    className="flex items-center justify-center gap-2 py-20 text-sm text-muted-text animate-fade-in"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    <span className="font-mono text-xs uppercase tracking-[0.14em]">{label}</span>
  </div>
);

export const EmptyState: React.FC<{
  title?: string;
  description?: React.ReactNode;
}> = ({ title = 'Nothing here yet', description }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
    <Inbox className="h-5 w-5 text-muted-text" aria-hidden="true" />
    <div className="text-sm font-semibold text-primary-text">{title}</div>
    {description && (
      <div className="max-w-sm text-xs leading-relaxed text-muted-text">{description}</div>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
}> = ({ title = 'Something went wrong', description, onRetry }) => (
  <div
    className="flex flex-col items-center justify-center gap-3 py-14 text-center"
    role="alert"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-error/40 bg-error/10 text-error">
      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
    </div>
    <div className="text-sm font-semibold text-primary-text">{title}</div>
    {description && (
      <div className="max-w-sm text-xs leading-relaxed text-muted-text">{description}</div>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-text hover:border-primary-accent"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    )}
  </div>
);
