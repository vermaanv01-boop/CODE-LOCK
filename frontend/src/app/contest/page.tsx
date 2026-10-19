'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getLeaderboard, storage } from '@/lib/api';
import { useContestStatus } from '@/lib/contest-context';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { BackButton } from '@/components/BackButton';
import { StatusBadge, Stat, LoadingState, SectionLabel } from '@/components/ui';
import {
  ArrowRight,
  Clock,
  Lock,
  Code2,
  Bug,
  KeyRound,
  Users,
  CheckCircle2,
  Radio,
  LogOut,
} from 'lucide-react';

const ROUND_META = [
  { n: 1 as const, code: '01', name: 'Coding Lock', icon: Code2, tint: 'bg-accent-yellow' },
  { n: 2 as const, code: '02', name: 'Debugging Lock', icon: Bug, tint: 'bg-accent-pink' },
  { n: 3 as const, code: '03', name: 'Final Lock', icon: KeyRound, tint: 'bg-accent-blue' },
];

function formatHms(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export default function ContestDashboardPage() {
  const router = useRouter();
  const { status, rounds, teamRevision } = useContestStatus();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  const localTeam = useMemo(() => storage.getTeam(), [teamRevision]);

  // Load the server-authoritative team record. A 401 means the stored session
  // is no longer valid — tear it down and return to login.
  const loadTeam = useCallback(async () => {
    const session = storage.getTeam();
    if (!session?.teamNumber) {
      router.replace('/login');
      return;
    }
    try {
      const res = await apiRequest(`/teams/${session.teamNumber}`);
      if (res?.team) {
        storage.setTeam({ ...session, ...res.team });
        setTeam(res.team);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        storage.clearSession();
        router.replace('/login');
        return;
      }
      setTeam(session);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      getLeaderboard()
        .then((res) => active && setLeaderboard(res.leaderboard || []))
        .catch(() => {});
    load();
    const i = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, []);

  const handleLogout = () => {
    storage.clearSession();
    router.replace('/login');
  };

  if (loading) return <LoadingState label="Synchronizing squad state" />;

  const activeRound = ROUND_META.find((r) => rounds[r.n].status === 'ACTIVE');
  const activeElapsed =
    activeRound && rounds[activeRound.n].startedAt
      ? Math.max(0, now - (rounds[activeRound.n].startedAt as number))
      : null;

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/" label="HOME PORTAL" />
      </div>

      {/* Squad identity */}
      <section className="rounded-md border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-accent" aria-hidden="true" />
              <SectionLabel>Contestant dashboard</SectionLabel>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
              {localTeam?.teamNumber || '\u2014'}
            </h1>
            <p className="mt-1 text-sm text-primary-text">{localTeam?.teamName}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={status} />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-text hover:border-error hover:text-error"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>

        {team && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Thinker', team.thinker],
              ['Coder', team.coder],
              ['Debugger', team.debugger],
              ['Supporter', team.supporter],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-md border border-border bg-surface-highlight px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-text">
                  {label}
                </div>
                <div className="truncate text-sm text-primary-text">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Contest" value={(status || '\u2014').replace(/_/g, ' ')} accent="blue" />
          <Stat label="Your stage" value={`Round 0${team?.currentRound ?? localTeam?.currentRound ?? 1}`} />
          <Stat
            label="Active round"
            value={activeRound ? formatHms(activeElapsed ?? 0) : '--:--:--'}
            hint={activeRound ? `Round 0${activeRound.n} live` : 'No round running'}
            accent={activeRound ? 'green' : 'default'}
          />
          <Stat label="Registered squads" value={leaderboard.length} />
        </div>
      </section>

      {/* Round access */}
      <section>
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div>
            <SectionLabel>Round access</SectionLabel>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text">
              Locks &amp; progress
            </h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.1em] text-muted-text">
            Gated by the organizer server
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {ROUND_META.map((r) => {
            const Icon = r.icon;
            const rs = rounds[r.n];
            const enterable = rs.status === 'ACTIVE' || rs.status === 'COMPLETED';
            const done = rs.status === 'COMPLETED';
            const elapsed =
              rs.startedAt != null ? Math.max(0, now - rs.startedAt) : null;

            return (
              <article key={r.n} className="overflow-hidden rounded-md border border-border bg-surface">
                <div className={`h-1 w-full ${r.tint}`} aria-hidden="true" />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-muted-text">ROUND {r.code}</span>
                    <Icon className="h-4 w-4 text-muted-text" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-primary-text">{r.name}</h3>

                  <div className="mt-3 flex items-center gap-2">
                    <RoundStatePill state={rs.status} />
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-text">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-mono tabular-nums">
                      {rs.status === 'ACTIVE' && elapsed != null
                        ? formatHms(elapsed)
                        : rs.status === 'COMPLETED'
                        ? 'Completed'
                        : '--:--:--'}
                    </span>
                  </div>

                  <div className="mt-4">
                    {enterable ? (
                      <Link
                        href={done ? `/round/${r.n}/dashboard` : `/round/${r.n}`}
                        className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
                      >
                        {done ? 'View round summary' : 'Enter round'}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span
                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded border border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-text opacity-70"
                        aria-disabled="true"
                        title={
                          rs.status === 'READY'
                            ? 'Waiting for the organizer to activate this round'
                            : 'Locked'
                        }
                      >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        {rs.status === 'READY' ? 'Staged' : 'Locked'}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Standby notice */}
      {status === 'NOT_STARTED' && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface-highlight px-4 py-3 text-xs text-muted-text">
          <Radio className="h-4 w-4 text-primary-accent" aria-hidden="true" />
          Contest not started. Keep this page open — Round 01 unlocks the moment the organizer
          activates it.
        </div>
      )}

      {/* Leaderboard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
            Leaderboard
          </h2>
          <span className="text-[10px] uppercase tracking-[0.1em] text-muted-text">
            Updates automatically
          </span>
        </div>
        <LeaderboardTable entries={leaderboard} highlightTeamNumber={localTeam?.teamNumber} />
      </section>
    </div>
  );
}

const RoundStatePill: React.FC<{ state: string }> = ({ state }) => {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ACTIVE: {
      label: 'Live',
      cls: 'bg-accent-green text-primary-accent',
      icon: <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />,
    },
    COMPLETED: { label: 'Completed', cls: 'bg-accent-blue text-primary-accent', icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> },
    READY: { label: 'Staged', cls: 'bg-accent-yellow text-primary-accent', icon: <Clock className="h-3 w-3" aria-hidden="true" /> },
    LOCKED: { label: 'Locked', cls: 'bg-surface-highlight text-muted-text', icon: <Lock className="h-3 w-3" aria-hidden="true" /> },
  };
  const item = map[state] || map.LOCKED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${item.cls}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};
