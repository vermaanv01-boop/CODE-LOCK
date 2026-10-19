'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, storage, getAdminLeaderboard, startRound } from '@/lib/api';
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
  Cpu,
  UserPlus
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

  const handleStartRound = async (round: number) => {
    if (
      !confirm(
        `CONFIRM: Activate Round 0${round}? This releases the independent round timer and unlocks the challenge for all eligible squads.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      await startRound(round);
      setMsg({ type: 'success', text: `ROUND 0${round} IS NOW ACTIVE. Independent timer running.` });
      fetchDashboard();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || `Failed to start Round 0${round}` });
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
              href="/admin/teams?action=register"
              className="px-3.5 py-2 border border-primary-accent bg-primary-accent/10 hover:bg-primary-accent hover:text-primary-accent-contrast text-primary-accent text-xs transition-colors flex items-center gap-1.5 font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ ENROLL SQUAD</span>
            </Link>

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
            {([
              ['ROUND 01', contest?.round1Status],
              ['ROUND 02', contest?.round2Status],
              ['ROUND 03', contest?.round3Status],
            ] as [string, string | undefined][]).map(([label, rStatus]) => (
              <div key={label} className="p-2.5 border border-border bg-background flex items-center justify-between">
                <span className="text-[11px] text-muted-text">{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 font-bold uppercase border ${
                    rStatus === 'ACTIVE'
                      ? 'text-primary-accent border-primary-accent bg-primary-accent/10'
                      : rStatus === 'READY'
                      ? 'text-warning border-warning bg-warning/10'
                      : rStatus === 'COMPLETED'
                      ? 'text-muted-text border-border bg-muted-text/10'
                      : 'text-muted-text border-border'
                  }`}
                >
                  {rStatus || 'LOCKED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ROUND MANAGEMENT (4 Cols) */}
        <div className="md:col-span-4 border-2 border-border bg-surface p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="text-[10px] text-muted-text uppercase tracking-widest font-bold">
              ROUND MANAGEMENT
            </div>
            <h3 className="text-base font-bold text-primary-text mt-1">DISPATCH ROUNDS</h3>
            <p className="text-xs text-muted-text font-sans mt-2 leading-relaxed">
              Each round runs on its own independent timer. Activate a round when its squads are ready.
            </p>
          </div>

          <div className="space-y-2">
            {([1, 2, 3] as const).map((n) => {
              const rStatus = contest?.[`round${n}Status`] as string | undefined;
              const isReady = rStatus === 'READY';
              const isActive = rStatus === 'ACTIVE';
              const isCompleted = rStatus === 'COMPLETED';
              return (
                <div key={n} className="flex items-center gap-2 border border-border bg-background p-2">
                  <span className="flex-1 text-xs font-bold text-primary-text">ROUND 0{n}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-bold uppercase border ${
                      isActive
                        ? 'text-primary-accent border-primary-accent bg-primary-accent/10'
                        : isReady
                        ? 'text-warning border-warning bg-warning/10'
                        : 'text-muted-text border-border'
                    }`}
                  >
                    {rStatus || 'LOCKED'}
                  </span>
                  {isReady ? (
                    <button
                      onClick={() => handleStartRound(n)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-primary-accent text-primary-accent-contrast font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      START
                    </button>
                  ) : isActive ? (
                    <span className="px-3 py-1.5 text-[11px] font-bold text-primary-accent">● LIVE</span>
                  ) : isCompleted ? (
                    <span className="px-3 py-1.5 text-[11px] font-bold text-muted-text">DONE</span>
                  ) : (
                    <span className="px-3 py-1.5 text-[11px] text-muted-text">LOCKED</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            {contest?.status === 'NOT_STARTED' && (
              <button
                onClick={handleStartContest}
                disabled={actionLoading}
                className="w-full py-3 bg-primary-accent text-primary-accent-contrast font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ START CONTEST ]</span>
              </button>
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
