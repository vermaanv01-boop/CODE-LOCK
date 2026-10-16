'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Code2,
  Bug,
  KeyRound,
  Trophy,
  FileText,
  Lock,
  X,
} from 'lucide-react';
import { useContestStatus } from '@/lib/contest-context';
import { storage } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When provided, the item is shown/locked based on this round's lifecycle. */
  round?: 1 | 2 | 3;
  requiresNotStarted?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/contest', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/round/1', label: 'Round 1', sublabel: 'Coding Lock', icon: Code2, round: 1 },
  { href: '/round/2', label: 'Round 2', sublabel: 'Debugging Lock', icon: Bug, round: 2 },
  { href: '/round/3', label: 'Round 3', sublabel: 'Final Lock', icon: KeyRound, round: 3 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/register', label: 'Register', sublabel: 'Before start', icon: FileText, requiresNotStarted: true },
];

// The contestant navigation is only meaningful inside the contestant
// workspace. Public (landing/login/register) and administrator surfaces have
// their own hierarchy.
function isWorkspaceRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/contest') ||
    pathname.startsWith('/round') ||
    pathname.startsWith('/leaderboard')
  );
}

export const ContestantSidebar: React.FC<{
  open?: boolean;
  onClose?: () => void;
}> = ({ open = false, onClose }) => {
  const pathname = usePathname();
  const { status, rounds, teamRevision } = useContestStatus();

  // Re-read team session whenever the shared context reports a change.
  const team = React.useMemo(() => storage.getTeam(), [teamRevision]);

  const isActive = (href: string) =>
    href === '/contest'
      ? pathname === '/contest' || pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  const roundStatus = (n: 1 | 2 | 3) => rounds[n]?.status ?? 'LOCKED';

  const roundLockReason = (n: 1 | 2 | 3): string | null => {
    if (!team) return 'Connect with your team number to unlock this round';
    const st = roundStatus(n);
    if (st === 'ACTIVE' || st === 'COMPLETED') return null;
    if (st === 'READY') return 'Round is staged — waiting for the organizer to activate it';
    return 'Locked until your team unlocks this round';
  };

  const isLocked = (item: NavItem): boolean => {
    if (item.requiresNotStarted) return status !== 'NOT_STARTED';
    if (item.round) return roundLockReason(item.round) !== null;
    return false;
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requiresNotStarted) return status === 'NOT_STARTED' || pathname === '/register';
    return true;
  });

  const nav = (
    <nav aria-label="Contest navigation" className="flex h-full flex-col gap-1 p-3">
      <div className="mb-2 flex items-center justify-between px-1 lg:mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-text">
          Navigation
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded border border-border p-1 text-muted-text hover:text-primary-text lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const locked = isLocked(item);
          const Icon = item.icon;

          const content = (
            <>
              <span
                className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-primary-accent transition-opacity duration-150 ${
                  active ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              />
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? 'text-primary-accent' : 'text-muted-text'}`}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-col">
                <span
                  className={`truncate text-sm ${
                    active ? 'font-semibold text-primary-accent' : 'font-medium text-primary-text'
                  }`}
                >
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="truncate text-[10px] uppercase tracking-[0.1em] text-muted-text">
                    {item.sublabel}
                  </span>
                )}
              </span>
              {locked && (
                <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-text" aria-hidden="true" />
              )}
            </>
          );

          const base =
            'relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150';

          if (locked) {
            const reason = item.requiresNotStarted
              ? 'Available before the contest starts'
              : item.round
                ? roundLockReason(item.round) ?? 'Locked'
                : 'Locked';
            return (
              <li key={item.href}>
                <span
                  className={`${base} cursor-not-allowed bg-transparent opacity-60`}
                  aria-disabled="true"
                  title={reason}
                >
                  {content}
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`${base} ${
                  active
                    ? 'bg-surface-highlight text-primary-accent'
                    : 'text-primary-text hover:bg-surface-highlight'
                }`}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>

      {!team && (
        <div className="mt-4 space-y-2">
          <p className="rounded-md border border-border bg-surface-highlight px-3 py-2 text-[11px] leading-relaxed text-muted-text">
            Connect with your team number to unlock the rounds.
          </p>
          <Link
            href="/login"
            className="block rounded-md bg-primary-accent px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
          >
            Team login
          </Link>
        </div>
      )}
    </nav>
  );

  // Hide the contestant rail outside the contestant workspace.
  if (!isWorkspaceRoute(pathname)) return null;

  return (
    <>
      {/* Desktop sticky column */}
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-surface lg:block lg:w-60">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-primary-accent/30 animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface animate-fade-in">
            {nav}
          </div>
        </div>
      )}
    </>
  );
};
