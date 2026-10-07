'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getContestStatus, storage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { 
  Shield, 
  Clock, 
  Sun, 
  Moon, 
  LogOut, 
  Radio, 
  Lock, 
  Unlock,
  Terminal,
  Activity
} from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [contestStatus, setContestStatus] = useState<string>('NOT_STARTED');
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    // Check local session
    const team = storage.getTeam();
    setCurrentTeam(team);
    if (team?.currentRound) {
      setCurrentRoundNumber(team.currentRound);
    }

    const token = storage.getAdminToken();
    setIsAdminLoggedIn(!!token);

    let serverStart: number | null = null;

    const fetchStatus = async () => {
      try {
        const res = await getContestStatus();
        setContestStatus(res.status);
        if (res.contestStartTime) {
          serverStart = res.contestStartTime;
          setStartTimeMs(res.contestStartTime);
        }

        // Re-read team in case storage changed
        const latestTeam = storage.getTeam();
        if (latestTeam) {
          setCurrentTeam(latestTeam);
          setCurrentRoundNumber(latestTeam.currentRound || 1);
        }
      } catch (e) {
        // Fallback
      }
    };

    fetchStatus();
    const pollInterval = setInterval(fetchStatus, 8000);

    // Official synchronized timer tick (based on serverStartTime)
    const timerInterval = setInterval(() => {
      if (serverStart) {
        const diff = Math.max(0, Date.now() - serverStart);
        const secs = Math.floor(diff / 1000);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setElapsedTime(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      } else {
        setElapsedTime('--:--:--');
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [pathname]);

  const handleLogoutTeam = () => {
    storage.clearTeam();
    setCurrentTeam(null);
    window.location.href = '/';
  };

  // Determine current round display
  const getRoundLabel = () => {
    if (pathname.includes('/round/1')) return 'ROUND 01';
    if (pathname.includes('/round/2')) return 'ROUND 02';
    if (pathname.includes('/round/3')) return 'ROUND 03';
    if (currentTeam?.currentRound) return `ROUND 0${currentTeam.currentRound}`;
    if (contestStatus === 'ACTIVE') return 'ACTIVE';
    return 'STANDBY';
  };

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50 select-none transition-colors">
      {/* Top micro telemetry bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-1 border-b border-border text-[11px] font-mono text-muted-text bg-surface-dark transition-colors">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <span className="flex items-center gap-1.5 text-primary-accent shrink-0">
            <Radio className="w-3 h-3 animate-pulse" />
            <span className="tracking-wider font-semibold">C//L 2026</span>
          </span>
          <span className="text-border shrink-0">|</span>
          <span className="hidden md:inline truncate">
            {isAdminRoute ? 'ORGANIZER CONTROL PROTOCOL' : 'LAN EVENT TELEMETRY'}
          </span>
          <span className="text-border hidden md:inline shrink-0">|</span>
          <span className="hidden lg:inline text-muted-text/80 truncate">
            SERVER SYNCHRONIZED
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Contest Status */}
          <div className="flex items-center gap-1">
            <span className="uppercase text-[10px] tracking-wider text-muted-text hidden xs:inline">STATUS:</span>
            <span
              className={`px-1.5 py-0.2 text-[10px] font-bold tracking-wider uppercase border ${
                contestStatus === 'ACTIVE'
                  ? 'bg-primary-accent text-primary-accent-contrast border-primary-accent'
                  : contestStatus === 'COMPLETED'
                  ? 'bg-muted-text text-background border-muted-text'
                  : 'bg-surface border-warning text-warning'
              }`}
            >
              {contestStatus}
            </span>
          </div>

          <span className="text-border">|</span>

          {/* Official Server Elapsed Time */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-primary-accent" />
            <span className="text-[10px] text-muted-text hidden sm:inline">TIME:</span>
            <span className="font-bold text-primary-accent tracking-wider">{elapsedTime}</span>
          </div>
        </div>
      </div>

      {/* Main navigation line */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 gap-2 sm:gap-4">
        {/* Brand & Editorial Title */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="text-base sm:text-lg font-mono font-bold tracking-tight text-primary-text group-hover:text-primary-accent transition-colors">
              CODE//LOCK
            </span>
            <span className="text-[10px] font-mono tracking-widest text-muted-text border border-border px-1 py-0.2 hidden sm:inline">
              2026
            </span>
          </Link>

          {/* Round Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-border text-xs font-mono">
            <span className="text-[10px] text-muted-text tracking-wider uppercase">STAGE:</span>
            <span className="px-1.5 py-0.5 border border-border bg-surface-highlight text-primary-accent font-semibold text-[11px]">
              {getRoundLabel()}
            </span>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs font-mono">
          <Link
            href="/contest"
            className={`px-2 sm:px-2.5 py-1 transition-colors ${
              pathname.startsWith('/contest') || pathname.startsWith('/round')
                ? 'bg-surface-highlight text-primary-accent border border-primary-accent font-semibold'
                : 'text-muted-text hover:text-primary-text border border-transparent'
            }`}
          >
            CONTEST
          </Link>

          <Link
            href="/leaderboard"
            className={`px-2 sm:px-2.5 py-1 transition-colors ${
              pathname === '/leaderboard'
                ? 'bg-surface-highlight text-primary-accent border border-primary-accent font-semibold'
                : 'text-muted-text hover:text-primary-text border border-transparent'
            }`}
          >
            SCOREBOARD
          </Link>

          {contestStatus === 'NOT_STARTED' && (
            <Link
              href="/register"
              className={`px-2 sm:px-2.5 py-1 transition-colors hidden xs:inline-block ${
                pathname === '/register'
                  ? 'bg-surface-highlight text-primary-accent border border-primary-accent font-semibold'
                  : 'text-muted-text hover:text-primary-text border border-transparent'
              }`}
            >
              REGISTER
            </Link>
          )}

          {/* Organizer / Admin badge - only link directly if admin is logged in or user is explicitly on admin route */}
          {(isAdminLoggedIn || isAdminRoute) && (
            <Link
              href="/admin"
              className={`px-2 sm:px-2.5 py-1 border transition-colors flex items-center gap-1 ${
                isAdminRoute
                  ? 'border-primary-accent text-primary-accent bg-surface-highlight font-semibold'
                  : 'border-border text-muted-text hover:text-primary-text'
              }`}
              title="Organizer Control Room"
            >
              <Shield className="w-3 h-3 text-primary-accent" />
              <span className="hidden md:inline">ADMIN</span>
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="ml-1 sm:ml-2 px-2 py-1 border border-border hover:border-primary-accent text-muted-text hover:text-primary-text text-[11px] font-mono flex items-center gap-1.5 bg-surface transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-warning" />
                <span className="hidden sm:inline text-[10px] font-bold">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-primary-accent" />
                <span className="hidden sm:inline text-[10px] font-bold">DARK</span>
              </>
            )}
          </button>

          {/* Current Team Status / Disconnect or Connect */}
          {currentTeam ? (
            <div className="flex items-center gap-2 pl-2 border-l border-border ml-1 sm:ml-2">
              <div className="flex flex-col text-right">
                <span className="text-[10px] sm:text-[11px] text-primary-accent font-bold leading-none tracking-wide">
                  {currentTeam.teamNumber}
                </span>
                <span className="text-[9px] text-muted-text truncate max-w-[70px] sm:max-w-[110px] leading-tight">
                  {currentTeam.teamName}
                </span>
              </div>
              <button
                onClick={handleLogoutTeam}
                title="Disconnect Team Session"
                className="p-1 hover:text-error text-muted-text transition-colors border border-transparent hover:border-border"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/contest"
              className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 text-[11px] bg-primary-accent text-primary-accent-contrast font-bold tracking-wider hover:opacity-90 transition-opacity"
            >
              CONNECT
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
