'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { storage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useContestStatus } from '@/lib/contest-context';
import { StatusBadge } from '@/components/ui';
import { Menu, Sun, Moon, LogOut, Shield, Clock, Users } from 'lucide-react';

export const Header: React.FC<{
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}> = ({ onMenuToggle, menuOpen }) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { status, elapsedLabel, teamRevision, refreshTeam } = useContestStatus();
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    setCurrentTeam(storage.getTeam());
    setIsAdminLoggedIn(!!storage.getAdminToken());
  }, [teamRevision]);

  const handleLogoutTeam = () => {
    storage.clearTeam();
    refreshTeam();
    setCurrentTeam(null);
    window.location.href = '/';
  };

  const roundLabel = () => {
    if (pathname.includes('/round/1')) return 'Round 01';
    if (pathname.includes('/round/2')) return 'Round 02';
    if (pathname.includes('/round/3')) return 'Round 03';
    if (currentTeam?.currentRound) return `Round 0${currentTeam.currentRound}`;
    if (status === 'ACTIVE') return 'Live';
    return 'Standby';
  };

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-surface/95 backdrop-blur select-none">
      <div className="flex h-full items-center gap-3 px-3 sm:px-4">
        {/* Mobile menu trigger */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            className="rounded border border-border p-1.5 text-primary-text hover:border-primary-accent lg:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {/* Brand */}
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-serif text-lg font-semibold tracking-tight text-primary-text">
            CODE<span className="text-muted-text">//</span>LOCK
          </span>
          <span className="hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-text sm:inline">
            2026
          </span>
        </Link>

        {/* Round label */}
        <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
            Stage
          </span>
          <span className="rounded-sm bg-surface-highlight px-2 py-0.5 text-xs font-semibold text-primary-accent">
            {roundLabel()}
          </span>
        </div>

        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <StatusBadge status={status} />
          </div>

          {/* Server elapsed clock */}
          <div className="hidden items-center gap-1.5 rounded-md border border-border px-2 py-1 md:flex">
            <Clock className="h-3.5 w-3.5 text-muted-text" aria-hidden="true" />
            <span className="sr-only">Server elapsed time</span>
            <span className="font-mono text-xs font-semibold tabular-nums text-primary-accent">
              {elapsedLabel}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded border border-border p-1.5 text-muted-text hover:border-primary-accent hover:text-primary-text"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Organizer link (admin only / admin routes) */}
          {(isAdminLoggedIn || isAdminRoute) && (
            <Link
              href="/admin"
              className={`hidden items-center gap-1.5 rounded border px-2 py-1.5 text-xs font-semibold transition-colors sm:flex ${
                isAdminRoute
                  ? 'border-primary-accent bg-surface-highlight text-primary-accent'
                  : 'border-border text-muted-text hover:border-primary-accent hover:text-primary-text'
              }`}
              title="Organizer control room"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          {/* Team session */}
          {currentTeam ? (
            <div className="flex items-center gap-2 border-l border-border pl-2">
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="font-mono text-xs font-semibold text-primary-accent">
                  {currentTeam.teamNumber}
                </span>
                <span className="max-w-[120px] truncate text-[10px] text-muted-text">
                  {currentTeam.teamName}
                </span>
              </div>
              <span
                className="flex items-center gap-1 rounded-sm bg-accent-pink px-2 py-1 font-mono text-xs font-semibold text-primary-accent sm:hidden"
                title={currentTeam.teamName}
              >
                <Users className="h-3 w-3" aria-hidden="true" />
                {currentTeam.teamNumber}
              </span>
              <button
                onClick={handleLogoutTeam}
                title="Disconnect team session"
                aria-label="Disconnect team session"
                className="rounded border border-transparent p-1 text-muted-text hover:border-error/40 hover:text-error"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              href="/contest"
              className="rounded bg-primary-accent px-3 py-1.5 text-xs font-semibold text-primary-accent-contrast hover:opacity-90"
            >
              Connect
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
