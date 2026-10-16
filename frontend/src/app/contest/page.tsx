'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getContestStatus, getLeaderboard, storage } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { StatusBadge, Stat, LoadingState, SectionLabel } from '@/components/ui';
import { ArrowRight, AlertTriangle, Clock, Lock, Radio, Trophy } from 'lucide-react';

export default function ContestHubPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [teamInput, setTeamInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

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
      // transient failure — keep last state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContestAndTeam();
    const interval = setInterval(refreshContestAndTeam, 4000);
    return () => clearInterval(interval);
  }, []);

  // Standby dashboard preview (only rendered before the contest starts).
  useEffect(() => {
    if (contest?.status !== 'NOT_STARTED') return;
    let active = true;
    const load = () =>
      getLeaderboard()
        .then((res) => active && setLeaderboard(res.leaderboard || []))
        .catch(() => {});
    load();
    const i = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, [contest?.status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!teamInput.trim()) return;

    try {
      const res = await apiRequest('/auth/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamNumber: teamInput.trim().toUpperCase() }),
      });
      storage.setTeam(res.team);
      setTeam(res.team);
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || 'Team identifier not recognized.');
    }
  };

  if (loading) return <LoadingState label="Initializing contest gateway" />;

  // Not logged in → connect
  if (!team) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-md border border-border bg-surface p-6 sm:p-8">
        <div className="mb-4 border-b border-border pb-4">
          <SectionLabel>Station authentication</SectionLabel>
          <h1 className="mt-1 text-2xl font-semibold text-primary-text">Connect squad</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="connect-team" className="mb-1 block text-[11px] uppercase text-muted-text">
              Enter team number
            </label>
            <input
              id="connect-team"
              type="text"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value.toUpperCase())}
              placeholder="e.g. T-027"
              autoFocus
              className="w-full rounded border border-border bg-background p-3 font-mono text-sm uppercase text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
            />
          </div>

          {loginError && (
            <div role="alert" className="flex items-center gap-2 rounded border border-error/40 bg-error/10 p-2.5 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
          >
            Access contest console
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-4 flex justify-between border-t border-border pt-3 text-xs text-muted-text">
          <span>Need registration?</span>
          <Link href="/register" className="font-semibold text-primary-accent hover:underline">
            Registration sheet →
          </Link>
        </div>
      </div>
    );
  }

  // Standby (contest not started) → dashboard summary
  if (contest?.status === 'NOT_STARTED') {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-sm bg-accent-yellow px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-accent">
                  <Radio className="h-3 w-3" aria-hidden="true" />
                  Standby
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-text">
                  Synchronizing with organizer
                </span>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
                Contest not started
              </h1>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-text">
                The organizer server has not dispatched the start signal. Keep this window open —
                Round 01 unlocks automatically as soon as the global contest timer activates.
              </p>
            </div>
            <StatusBadge status={contest?.status} />
          </div>

          {/* Team identity + members */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionLabel>Assigned squad</SectionLabel>
              <div className="mt-2 rounded-md border border-border bg-surface-highlight p-4">
                <div className="font-mono text-2xl font-semibold text-primary-accent">
                  {team.teamNumber}
                </div>
                <div className="text-sm font-medium text-primary-text">{team.teamName}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                  {[
                    ['Thinker', team.thinker],
                    ['Coder', team.coder],
                    ['Debugger', team.debugger],
                    ['Supporter', team.supporter],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-text">
                        {label}
                      </div>
                      <div className="truncate text-primary-text">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SectionLabel>Round progress</SectionLabel>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { n: '01', name: 'Coding Lock', tint: 'bg-accent-yellow' },
                  { n: '02', name: 'Debugging Lock', tint: 'bg-accent-pink' },
                  { n: '03', name: 'Final Lock', tint: 'bg-accent-blue' },
                ].map((r) => (
                  <div key={r.n} className="overflow-hidden rounded-md border border-border">
                    <div className={`h-1 w-full ${r.tint}`} aria-hidden="true" />
                    <div className="flex items-center justify-between bg-surface-highlight px-3 py-3">
                      <div>
                        <div className="font-mono text-xs font-semibold text-muted-text">Round {r.n}</div>
                        <div className="text-sm font-medium text-primary-text">{r.name}</div>
                      </div>
                      <Lock className="h-4 w-4 text-muted-text" aria-hidden="true" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat label="Server clock" value="00:00:00" hint="Starts on signal" />
                <Stat label="Registered squads" value={leaderboard.length} accent="blue" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-md border border-border bg-surface-highlight px-3 py-3 text-xs text-muted-text">
            <Clock className="h-4 w-4 text-primary-accent" aria-hidden="true" />
            Listening on the local network for the server start signal…
          </div>
        </div>

        {/* Leaderboard preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
                Registered squads
              </h2>
            </div>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-text">
              Updates automatically
            </span>
          </div>
          <LeaderboardTable entries={leaderboard} highlightTeamNumber={team?.teamNumber} />
        </div>
      </div>
    );
  }

  // ACTIVE (transient) or COMPLETED → direct position card
  return (
    <div className="mx-auto my-8 max-w-xl rounded-md border border-border bg-surface p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <SectionLabel>Squad position</SectionLabel>
          <h1 className="mt-0.5 text-xl font-semibold text-primary-text">
            {team.teamNumber} — {team.teamName}
          </h1>
        </div>
        <StatusBadge status={contest?.status} />
      </div>

      <div className="space-y-2 rounded-md border border-border bg-surface-highlight p-4 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-text">Current stage</span>
          <span className="font-semibold text-primary-accent">Round 0{team.currentRound}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-text">Stage status</span>
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
      >
        Enter Round 0{team.currentRound} console
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
