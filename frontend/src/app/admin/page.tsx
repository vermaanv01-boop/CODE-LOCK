'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, storage, getAdminLeaderboard } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { 
  Shield, 
  Play, 
  RotateCcw, 
  Users, 
  Trophy, 
  Clock, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  LogOut,
  Layers,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';

export default function AdminControlRoomPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());

  const fetchDashboard = async () => {
    try {
      const res = await getAdminLeaderboard();
      setData(res);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        storage.clearAdminToken();
        router.push('/admin/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = storage.getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 4000);
    const clockInterval = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [router]);

  const handleStartContest = async () => {
    if (!confirm('CONFIRM START CONTEST: This locks registration, activates Round 01 on all workstations, and starts official server timing. Proceed?')) {
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await apiRequest('/contest/start', { method: 'POST' });
      setMsg({ type: 'success', text: 'CONTEST IS NOW LIVE! Server timer active.' });
      fetchDashboard();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to start contest' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetContest = async () => {
    if (!confirm('CAUTION: Reset contest back to NOT_STARTED? All submissions and completions will be cleared. Teams will remain registered.')) {
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      await apiRequest('/contest/reset', { method: 'POST' });
      setMsg({ type: 'success', text: 'Contest state reset back to NOT_STARTED.' });
      fetchDashboard();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to reset contest' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    storage.clearAdminToken();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [CONNECTING TO ORGANIZER CONTROL ROOM TELEMETRY...]
      </div>
    );
  }

  const contest = data?.contest;
  const stats = data?.stats;
  const leaderboard = data?.leaderboard || [];

  const formattedStartTime = contest?.contestStartTime 
    ? new Date(contest.contestStartTime).toLocaleTimeString()
    : 'NOT STARTED';

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Title Bar: DENSE TECHNICAL CONTROL PANEL */}
      <div className="border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-text uppercase tracking-widest mb-1">
              <Radio className="w-3.5 h-3.5 text-primary-accent animate-pulse" />
              <span>CENTRAL COMMAND TELEMETRY</span>
              <span className="text-border">|</span>
              <span className="text-primary-accent font-bold">SUPERVISORY ACCESS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              ORGANIZER CONTROL ROOM
            </h1>
            <div className="text-xs text-muted-text mt-0.5">
              AUTHORITATIVE TIMER • LAN ORCHESTRATION ENGINE
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/admin/teams"
              className="px-3.5 py-2 border border-border hover:border-primary-accent text-primary-text hover:text-primary-accent text-xs transition-colors flex items-center gap-1.5 bg-background"
            >
              <Users className="w-3.5 h-3.5" />
              <span>ROSTER ({stats?.registeredTeamsCount || 0})</span>
            </Link>

            <Link
              href="/admin/leaderboard"
              className="px-3.5 py-2 border border-border hover:border-primary-accent text-primary-text hover:text-primary-accent text-xs transition-colors flex items-center gap-1.5 bg-background"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>SCOREBOARD</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-2 border border-border hover:border-error text-muted-text hover:text-error text-xs transition-colors flex items-center gap-1.5 bg-background"
              title="Exit Supervisory Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXIT</span>
            </button>
          </div>
        </div>

        {/* Server Time & Start Time Metadata Strip */}
        <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-background border border-border">
            <span className="text-[10px] text-muted-text uppercase block">SERVER TIME</span>
            <span className="font-bold text-primary-text">{new Date(currentTimeMs).toLocaleTimeString()}</span>
          </div>

          <div className="p-2.5 bg-background border border-border">
            <span className="text-[10px] text-muted-text uppercase block">CONTEST START</span>
            <span className="font-bold text-primary-accent">{formattedStartTime}</span>
          </div>

          <div className="p-2.5 bg-background border border-border">
            <span className="text-[10px] text-muted-text uppercase block">CURRENT STATUS</span>
            <span className="font-bold text-warning uppercase">{contest?.status || 'NOT STARTED'}</span>
          </div>

          <div className="p-2.5 bg-background border border-border">
            <span className="text-[10px] text-muted-text uppercase block">DATABASE MODE</span>
            <span className="font-bold text-primary-accent">SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 text-xs flex items-center gap-2 border ${
            msg.type === 'success'
              ? 'bg-primary-accent/10 border-primary-accent text-primary-accent'
              : 'bg-error/10 border-error text-error'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Telemetry Status Monitor (8 Cols) */}
        <div className="md:col-span-8 border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-accent" />
              <span className="text-xs font-bold text-primary-text uppercase tracking-wider">
                CONTEST TELEMETRY
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold tracking-widest uppercase border ${
                contest?.status === 'ACTIVE'
                  ? 'bg-primary-accent text-primary-accent-contrast border-primary-accent'
                  : contest?.status === 'COMPLETED'
                  ? 'bg-muted-text text-background border-muted-text'
                  : 'bg-surface-dark border-warning text-warning'
              }`}
            >
              {contest?.status || 'NOT STARTED'}
            </span>
          </div>

          {/* Key Stat Blocks */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-background border border-border space-y-0.5">
              <div className="text-[10px] text-muted-text uppercase">REGISTERED</div>
              <div className="text-2xl font-bold text-primary-text">
                {stats?.registeredTeamsCount || 0}
              </div>
            </div>

            <div className="p-3 bg-background border border-border space-y-0.5">
              <div className="text-[10px] text-muted-text uppercase">ACTIVE</div>
              <div className="text-2xl font-bold text-primary-accent">
                {stats?.activeTeamsCount || 0}
              </div>
            </div>

            <div className="p-3 bg-background border border-border space-y-0.5">
              <div className="text-[10px] text-muted-text uppercase">COMPLETED</div>
              <div className="text-2xl font-bold text-primary-accent">
                {stats?.completedTeamsCount || 0}
              </div>
            </div>
          </div>

          {/* Stage Status */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 border border-border bg-background flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 01</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 font-bold uppercase border ${
                  contest?.round1Status === 'ACTIVE'
                    ? 'text-primary-accent border-primary-accent bg-primary-accent/10'
                    : 'text-muted-text border-border'
                }`}
              >
                {contest?.round1Status || 'LOCKED'}
              </span>
            </div>

            <div className="p-2.5 border border-border bg-background flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 02</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 font-bold uppercase border ${
                  contest?.status === 'ACTIVE'
                    ? 'text-warning border-warning bg-warning/10'
                    : 'text-muted-text border-border'
                }`}
              >
                {contest?.status === 'ACTIVE' ? 'PROGRESSIVE' : 'LOCKED'}
              </span>
            </div>

            <div className="p-2.5 border border-border bg-background flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 03</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 font-bold uppercase border ${
                  contest?.status === 'ACTIVE'
                    ? 'text-primary-accent border-primary-accent bg-primary-accent/10'
                    : 'text-muted-text border-border'
                }`}
              >
                {contest?.status === 'ACTIVE' ? 'PROGRESSIVE' : 'LOCKED'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Controls (4 Cols) */}
        <div className="md:col-span-4 border-2 border-border bg-surface p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="text-[10px] text-muted-text uppercase tracking-widest font-bold">
              AUTHORITATIVE ACTION
            </div>
            <h3 className="text-base font-bold text-primary-text mt-1">START DISPATCH</h3>
            <p className="text-xs text-muted-text font-sans mt-2 leading-relaxed">
              Activating the contest locks team registration and starts the synchronized timer.
            </p>
          </div>

          <div className="space-y-3">
            {contest?.status !== 'ACTIVE' ? (
              <button
                onClick={handleStartContest}
                disabled={actionLoading}
                className="w-full py-4 bg-primary-accent text-primary-accent-contrast font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ START CONTEST ]</span>
              </button>
            ) : (
              <div className="p-3 bg-primary-accent/15 border border-primary-accent text-primary-accent text-xs text-center font-bold">
                ● CONTEST IS RUNNING
              </div>
            )}

            <button
              onClick={handleResetContest}
              disabled={actionLoading}
              className="w-full py-2.5 border border-border hover:border-warning text-muted-text hover:text-warning text-xs flex items-center justify-center gap-1.5 transition-colors bg-background"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET CONTEST (TESTING)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SQUAD DISTRIBUTION MATRIX */}
      <div className="border border-border bg-surface p-5 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold text-primary-text uppercase tracking-wider">
            SQUAD DISTRIBUTION MATRIX
          </span>
          <span className="text-[10px] text-muted-text">LIVE BREAKDOWN</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-background border border-border">
            <div className="text-muted-text text-[10px] uppercase">ROUND 01</div>
            <div className="text-2xl font-bold text-primary-text mt-0.5">
              {stats?.teamsByRound?.round1 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">CODING LOCK</div>
          </div>

          <div className="p-3 bg-background border border-border">
            <div className="text-muted-text text-[10px] uppercase">ROUND 02</div>
            <div className="text-2xl font-bold text-warning mt-0.5">
              {stats?.teamsByRound?.round2 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">DEBUGGING LOCK</div>
          </div>

          <div className="p-3 bg-background border border-border">
            <div className="text-muted-text text-[10px] uppercase">ROUND 03</div>
            <div className="text-2xl font-bold text-primary-accent mt-0.5">
              {stats?.teamsByRound?.round3 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">FINAL LOCK</div>
          </div>

          <div className="p-3 bg-background border border-border">
            <div className="text-muted-text text-[10px] uppercase">FINISHED</div>
            <div className="text-2xl font-bold text-primary-accent mt-0.5">
              {stats?.teamsByRound?.finished || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">ALL UNLOCKED</div>
          </div>
        </div>
      </div>

      {/* SUPERVISORY LIVE SCOREBOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary-accent" />
            <h2 className="text-sm font-bold text-primary-text uppercase tracking-wider">
              OFFICIAL SUPERVISORY LEADERBOARD
            </h2>
          </div>
          <span className="text-[10px] text-muted-text">AUTO-POLLING EVERY 4S</span>
        </div>

        <LeaderboardTable
          entries={leaderboard}
          showRoundBreakdown={true}
        />
      </div>
    </div>
  );
}
