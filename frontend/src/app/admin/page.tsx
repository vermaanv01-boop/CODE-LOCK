'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, storage, getAdminLeaderboard } from '@/lib/api';
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
  Layers
} from 'lucide-react';

export default function AdminControlRoomPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    return () => clearInterval(interval);
  }, [router]);

  const handleStartContest = async () => {
    if (!confirm('CONFIRM START CONTEST: This will lock registration, record official contestStartTime, and activate Round 01 for all registered teams. Proceed?')) {
      return;
    }

    setActionLoading(true);
    setMsg(null);
    try {
      const res = await apiRequest('/contest/start', { method: 'POST' });
      setMsg({ type: 'success', text: 'CONTEST IS NOW LIVE! Official server timer running.' });
      fetchDashboard();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to start contest' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetContest = async () => {
    if (!confirm('CAUTION: Reset contest back to NOT_STARTED state? All submissions and round completions will be cleared. Teams will remain registered.')) {
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
      <div className="py-20 text-center font-mono text-xs text-muted-text">
        [CONNECTING TO ORGANIZER CONTROL ROOM TELEMETRY...]
      </div>
    );
  }

  const contest = data?.contest;
  const stats = data?.stats;

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Top Control Room Title Bar */}
      <div className="border border-border bg-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-muted-text uppercase tracking-widest mb-1">
            <Radio className="w-3.5 h-3.5 text-primary-accent animate-pulse" />
            <span>CENTRAL COMMAND TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
            CODE//LOCK / CONTROL
          </h1>
          <div className="text-xs text-muted-text mt-1">
            ORGANIZER SUPERVISORY ENGINE • DIRECT SERVER AUTHORITY
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/teams"
            className="px-3.5 py-2 border border-border hover:border-primary-accent text-primary-text hover:text-primary-accent text-xs transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>TEAMS ROSTER</span>
          </Link>

          <Link
            href="/admin/leaderboard"
            className="px-3.5 py-2 border border-border hover:border-primary-accent text-primary-text hover:text-primary-accent text-xs transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>SCOREBOARD</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-2 border border-border hover:border-error text-muted-text hover:text-error text-xs transition-colors flex items-center gap-1.5"
            title="Exit Control Room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXIT</span>
          </button>
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

      {/* Primary Status Banner & Big Action */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Status Card */}
        <div className="md:col-span-8 border border-border bg-[#131310] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs text-muted-text uppercase tracking-wider">CONTEST STATUS</span>
            <span
              className={`px-3 py-1 text-xs font-bold tracking-widest uppercase ${
                contest?.status === 'ACTIVE'
                  ? 'bg-primary-accent text-background'
                  : contest?.status === 'COMPLETED'
                  ? 'bg-muted-text text-background'
                  : 'bg-surface border border-warning text-warning'
              }`}
            >
              {contest?.status || 'NOT STARTED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#11110F] border border-border space-y-1">
              <div className="text-[10px] text-muted-text uppercase">REGISTERED TEAMS</div>
              <div className="text-2xl font-bold text-primary-text">
                {stats?.registeredTeamsCount || 0}
              </div>
            </div>

            <div className="p-3 bg-[#11110F] border border-border space-y-1">
              <div className="text-[10px] text-muted-text uppercase">ACTIVE TEAMS</div>
              <div className="text-2xl font-bold text-primary-accent">
                {stats?.activeTeamsCount || 0}
              </div>
            </div>

            <div className="p-3 bg-[#11110F] border border-border space-y-1">
              <div className="text-[10px] text-muted-text uppercase">COMPLETED TEAMS</div>
              <div className="text-2xl font-bold text-primary-accent">
                {stats?.completedTeamsCount || 0}
              </div>
            </div>
          </div>

          {/* Gate status indicators */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 border border-border bg-[#11110F] flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 01</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 font-bold uppercase ${
                  contest?.round1Status === 'ACTIVE'
                    ? 'text-primary-accent border border-primary-accent'
                    : 'text-muted-text border border-border'
                }`}
              >
                {contest?.round1Status || 'LOCKED'}
              </span>
            </div>

            <div className="p-3 border border-border bg-[#11110F] flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 02</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 font-bold uppercase ${
                  contest?.status === 'ACTIVE'
                    ? 'text-warning border border-warning'
                    : 'text-muted-text border border-border'
                }`}
              >
                {contest?.status === 'ACTIVE' ? 'PROGRESSIVE' : 'LOCKED'}
              </span>
            </div>

            <div className="p-3 border border-border bg-[#11110F] flex items-center justify-between">
              <span className="text-[11px] text-muted-text">ROUND 03</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 font-bold uppercase ${
                  contest?.status === 'ACTIVE'
                    ? 'text-primary-accent border border-primary-accent'
                    : 'text-muted-text border border-border'
                }`}
              >
                {contest?.status === 'ACTIVE' ? 'PROGRESSIVE' : 'LOCKED'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button Box */}
        <div className="md:col-span-4 border-2 border-border bg-surface p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] text-muted-text uppercase tracking-widest">MASTER CONTROL</div>
            <h3 className="text-base font-bold text-primary-text mt-1">ORGANIZER DISPATCH</h3>
            <p className="text-xs text-muted-text font-sans mt-2 leading-relaxed">
              When clicked, the official server clock begins ticking for all connected workstations simultaneously.
            </p>
          </div>

          <div className="space-y-3">
            {contest?.status !== 'ACTIVE' ? (
              <button
                onClick={handleStartContest}
                disabled={actionLoading}
                className="w-full py-4 bg-primary-accent text-background font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>[ START CONTEST ]</span>
              </button>
            ) : (
              <div className="p-3 bg-primary-accent/10 border border-primary-accent text-primary-accent text-xs text-center font-bold">
                ● CONTEST IS RUNNING
              </div>
            )}

            <button
              onClick={handleResetContest}
              disabled={actionLoading}
              className="w-full py-2.5 border border-border hover:border-warning text-muted-text hover:text-warning text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET CONTEST (ORGANIZER DEBUG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown by Round */}
      <div className="border border-border bg-surface p-6 font-mono space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-primary-text uppercase tracking-wider">
            SQUAD DISTRIBUTION MATRIX
          </span>
          <span className="text-[10px] text-muted-text">REAL-TIME POSITION TRACKER</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-muted-text text-[10px] uppercase">IN ROUND 01</div>
            <div className="text-2xl font-bold text-primary-text mt-1">
              {stats?.teamsByRound?.round1 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-1">CODING LOCK</div>
          </div>

          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-muted-text text-[10px] uppercase">IN ROUND 02</div>
            <div className="text-2xl font-bold text-warning mt-1">
              {stats?.teamsByRound?.round2 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-1">DEBUGGING LOCK</div>
          </div>

          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-muted-text text-[10px] uppercase">IN ROUND 03</div>
            <div className="text-2xl font-bold text-primary-accent mt-1">
              {stats?.teamsByRound?.round3 || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-1">FINAL EXTRACTION</div>
          </div>

          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-muted-text text-[10px] uppercase">COMPLETED CONTEST</div>
            <div className="text-2xl font-bold text-primary-accent mt-1">
              {stats?.teamsByRound?.finished || 0}
            </div>
            <div className="text-[10px] text-muted-text mt-1">ALL GATES UNLOCKED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
