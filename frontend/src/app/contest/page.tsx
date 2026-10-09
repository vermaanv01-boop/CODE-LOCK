'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getContestStatus, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { 
  Terminal, 
  Clock, 
  ArrowRight, 
  Radio, 
  ShieldCheck, 
  AlertTriangle,
  Lock,
  Unlock,
  Users
} from 'lucide-react';

export default function ContestHubPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [teamInput, setTeamInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const refreshContestAndTeam = async () => {
    try {
      const cRes = await getContestStatus();
      setContest(cRes);

      const localTeam = storage.getTeam();
      if (localTeam?.teamNumber) {
        try {
          const tRes = await apiRequest(`/teams/${localTeam.teamNumber}`);
          if (tRes?.team) {
            storage.setTeam(tRes.team);
            setTeam(tRes.team);

            if (cRes.status === 'ACTIVE') {
              if (tRes.team.status === 'ROUND_1_COMPLETE') {
                router.push('/round/1/dashboard');
                return;
              }
              if (tRes.team.status === 'ROUND_2_COMPLETE') {
                router.push('/round/2/dashboard');
                return;
              }
              if (tRes.team.status === 'FINISHED') {
                router.push('/round/3/dashboard');
                return;
              }
              if (tRes.team.currentRound === 1) {
                router.push('/round/1');
                return;
              }
              if (tRes.team.currentRound === 2) {
                router.push('/round/2');
                return;
              }
              if (tRes.team.currentRound === 3) {
                router.push('/round/3');
                return;
              }
            }
          }
        } catch {
          setTeam(localTeam);
        }
      }
    } catch (e) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContestAndTeam();
    const interval = setInterval(refreshContestAndTeam, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!teamInput.trim()) return;

    try {
      const res = await apiRequest('/auth/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamNumber: teamInput.trim().toUpperCase() })
      });
      storage.setTeam(res.team);
      setTeam(res.team);
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || 'Team identifier not recognized.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [INITIALIZING CONTEST GATEWAY ROUTE GUARD...]
      </div>
    );
  }

  // If not logged in, ask for team number
  if (!team) {
    return (
      <div className="max-w-md mx-auto my-12 border border-border bg-surface p-6 sm:p-8 font-mono select-none space-y-6 shadow-sm">
        <div className="border-b border-border pb-4">
          <div className="text-[10px] text-muted-text uppercase tracking-widest font-semibold">STATION AUTHENTICATION</div>
          <h2 className="text-2xl font-bold text-primary-text mt-1">CONNECT SQUAD</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-muted-text">ENTER TEAM NUMBER</label>
            <input
              type="text"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value.toUpperCase())}
              placeholder="e.g. T-027"
              className="w-full bg-background border border-border p-3 text-sm font-mono text-primary-text uppercase placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
              autoFocus
            />
          </div>

          {loginError && (
            <div className="p-2.5 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>ACCESS CONTEST CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-border text-xs text-muted-text flex justify-between">
          <span>Need registration?</span>
          <Link href="/register" className="text-primary-accent hover:underline font-semibold">
            Registration Sheet →
          </Link>
        </div>
      </div>
    );
  }

  // If contest is NOT_STARTED, show STANDBY screen
  if (contest?.status === 'NOT_STARTED') {
    return (
      <div className="max-w-2xl mx-auto my-8 border border-border bg-surface p-6 sm:p-10 font-mono select-none space-y-6 text-center shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-dark border border-border text-xs text-warning uppercase">
          <Radio className="w-3.5 h-3.5 animate-pulse text-warning" />
          <span>STANDBY MODE / SYNCHRONIZING WITH ORGANIZER</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-primary-text tracking-tight uppercase">
          CONTEST NOT STARTED
        </h1>

        <p className="text-xs font-sans text-muted-text max-w-lg mx-auto leading-relaxed">
          The organizer server has not dispatched the contest start signal. 
          Keep this window open; this terminal will automatically unlock Round 01 as soon as the global contest timer activates.
        </p>

        {/* Squad Card */}
        <div className="bg-background border border-border p-4 text-left space-y-3">
          <div className="flex justify-between items-center border-b border-border/60 pb-2">
            <div>
              <span className="text-[10px] text-muted-text uppercase">ASSIGNED TERMINAL</span>
              <div className="text-lg font-bold text-primary-accent">{team.teamNumber}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-text uppercase">TEAM</span>
              <div className="text-sm font-sans text-primary-text font-semibold">{team.teamName}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div>
              <div className="text-muted-text text-[9px] uppercase font-bold">THINKER</div>
              <div className="truncate font-sans">{team.thinker}</div>
            </div>
            <div>
              <div className="text-muted-text text-[9px] uppercase font-bold">CODER</div>
              <div className="truncate font-sans">{team.coder}</div>
            </div>
            <div>
              <div className="text-muted-text text-[9px] uppercase font-bold">DEBUGGER</div>
              <div className="truncate font-sans">{team.debugger}</div>
            </div>
            <div>
              <div className="text-muted-text text-[9px] uppercase font-bold">SUPPORTER</div>
              <div className="truncate font-sans">{team.supporter}</div>
            </div>
          </div>
        </div>

        <div className="p-3 border border-border bg-surface-dark text-xs text-muted-text flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary-accent" />
          <span>LISTENING ON LOCAL NETWORK FOR SERVER START SIGNAL...</span>
        </div>
      </div>
    );
  }

  // If contest is ACTIVE or COMPLETED, provide direct navigation button according to their progress
  return (
    <div className="max-w-xl mx-auto my-8 border border-border bg-surface p-6 sm:p-8 font-mono select-none space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <div className="text-[10px] text-muted-text uppercase">SQUAD POSITION</div>
          <h2 className="text-xl font-bold text-primary-text mt-0.5">{team.teamNumber} — {team.teamName}</h2>
        </div>
        <span className="px-2 py-0.5 bg-primary-accent text-primary-accent-contrast text-xs font-bold uppercase">
          LIVE
        </span>
      </div>

      <div className="p-4 bg-background border border-border space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-text">CURRENT STAGE:</span>
          <span className="text-primary-accent font-bold">ROUND 0{team.currentRound}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-text">STAGE STATUS:</span>
          <span className="text-primary-text">{team.status}</span>
        </div>
      </div>

      <button
        onClick={() => {
          if (team.status === 'ROUND_1_COMPLETE') router.push('/round/1/dashboard');
          else if (team.status === 'ROUND_2_COMPLETE') router.push('/round/2/dashboard');
          else if (team.status === 'FINISHED') router.push('/round/3/dashboard');
          else router.push(`/round/${team.currentRound}`);
        }}
        className="w-full py-3 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span>ENTER ROUND 0{team.currentRound} CONSOLE</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
