'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getContestStatus, apiRequest, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { StatusBadge } from '@/components/ui';
import { ArrowRight, Radio, AlertTriangle, Users, Clock, Wifi } from 'lucide-react';

const GATES = [
  {
    round: 'Round 01',
    name: 'Coding Lock',
    detail: '6 problems · 2 digits each',
    body: 'Six algorithmic problems. Each yields a 2-digit numeric answer. Combine Q1 through Q6 in order to forge the 12-digit unlock key.',
    format: 'XX-XX-XX-XX-XX-XX',
    digits: '12 digits',
    tint: 'bg-accent-yellow',
  },
  {
    round: 'Round 02',
    name: 'Debugging Lock',
    detail: '2 broken programs · 3 digits each',
    body: 'Two intentionally broken programs with boundary and logic bugs. Repair them, run the payload, and concatenate the two 3-digit outputs into a 6-digit key.',
    format: 'XXX-XXX',
    digits: '6 digits',
    tint: 'bg-accent-pink',
  },
  {
    round: 'Round 03',
    name: 'The Final Lock',
    detail: 'Squad reconstruction',
    body: 'A multi-role extraction challenge. The Thinker, Coder, Debugger, and Supporter each contribute a fragment to synthesize the master completion sequence.',
    format: 'Master cipher',
    digits: 'Final verified',
    tint: 'bg-accent-blue',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [contest, setContest] = useState<any>(null);
  const [teamNumberInput, setTeamNumberInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTeam, setActiveTeam] = useState<any>(null);

  useEffect(() => {
    setActiveTeam(storage.getTeam());
    getContestStatus().then(setContest).catch(() => {});
  }, []);

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!teamNumberInput.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamNumber: teamNumberInput.trim().toUpperCase() }),
      });
      storage.setTeam(res.team);
      setActiveTeam(res.team);
      router.push('/contest');
    } catch (err: any) {
      setLoginError(err.message || 'Team number not found.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial hero */}
      <section className="rounded-md border border-border bg-surface p-6 sm:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-primary-accent px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-accent-contrast">
                Event specification
              </span>
              <span className="font-mono text-xs text-muted-text">Host revision 2026.04</span>
            </div>

            <h1 className="font-serif text-4xl font-semibold leading-none tracking-tight text-primary-text sm:text-6xl">
              CODE<span className="text-muted-text">//</span>LOCK
            </h1>

            <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-warning">
              Think. Code. Unlock. Debug.
            </p>

            <p className="text-sm leading-relaxed text-muted-text">
              An offline-first team coding, debugging, and logic contest built for closed LAN
              environments — no cloud or internet connectivity required.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs text-muted-text">
              <span className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-yellow" aria-hidden="true" />
                4-member specialized squad
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" aria-hidden="true" />
                Official server timestamps
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-blue" aria-hidden="true" />
                No cloud runtime dependency
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <VerifiedStamp label="Official event" size="lg" />
            <div className="w-full rounded-md border border-border bg-surface-highlight px-4 py-3 text-left md:text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
                Organizer status
              </div>
              <div className="mt-1 flex items-center gap-2 md:justify-end">
                <span className="font-mono text-sm font-semibold text-primary-accent">
                  {contest?.status || 'Connecting…'}
                </span>
                <StatusBadge status={contest?.status} />
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-text">Port 5000 · REST engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Access console + round architecture */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: team access */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-md border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
                Team access
              </h2>
              <span className="font-mono text-[10px] text-muted-text">Portal 01</span>
            </div>

            {activeTeam ? (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-surface-highlight p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
                    Connected squad
                  </div>
                  <div className="mt-1 font-mono text-xl font-semibold text-primary-accent">
                    {activeTeam.teamNumber}
                  </div>
                  <div className="text-sm font-medium text-primary-text">{activeTeam.teamName}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-text">
                    <span>Stage · Round 0{activeTeam.currentRound}</span>
                    <StatusBadge status={activeTeam.status} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/contest"
                    className="flex flex-1 items-center justify-center gap-2 rounded bg-primary-accent px-4 py-2.5 text-xs font-semibold text-primary-accent-contrast hover:opacity-90"
                  >
                    Enter contest
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    onClick={() => {
                      storage.clearTeam();
                      setActiveTeam(null);
                    }}
                    className="rounded border border-border px-3 py-2.5 text-xs text-muted-text hover:border-error hover:text-error"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <p className="text-xs leading-relaxed text-muted-text">
                  Enter your organizer-assigned team number (for example{' '}
                  <span className="font-mono font-semibold text-primary-text">T-001</span>) to access
                  your squad console.
                </p>

                <div>
                  <label
                    htmlFor="team-number"
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-text"
                  >
                    Team identifier
                  </label>
                  <input
                    id="team-number"
                    type="text"
                    value={teamNumberInput}
                    onChange={(e) => setTeamNumberInput(e.target.value.toUpperCase())}
                    placeholder="e.g. T-027"
                    className="w-full rounded border border-border bg-background p-2.5 font-mono text-sm uppercase text-primary-text placeholder:text-muted-text/50 focus:border-primary-accent focus:outline-none"
                  />
                </div>

                {loginError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded border border-error/40 bg-error/10 p-2.5 text-xs text-error"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating…' : 'Authenticate team'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-text">
                  <span>New squad?</span>
                  {contest?.status === 'NOT_STARTED' ? (
                    <Link href="/register" className="font-semibold text-primary-accent hover:underline">
                      Register team sheet →
                    </Link>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-warning">
                      Registration locked
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* LAN connectivity */}
          <div className="rounded-md border border-border bg-surface-highlight p-5 text-xs">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-text">
              <Wifi className="h-3.5 w-3.5 text-primary-accent" aria-hidden="true" />
              Private LAN connectivity
            </div>
            <p className="leading-relaxed text-muted-text">
              Participants on the contest network should browse to the organizer machine&apos;s LAN
              address:
            </p>
            <div className="mt-2 select-all rounded border border-border bg-background px-2 py-1.5 font-mono text-primary-accent">
              http://[ORGANIZER-LAN-IP]:3000
            </div>
            <p className="mt-2 text-[10px] text-muted-text">
              Clock synchronization runs over HTTP with zero external WAN dependency.
            </p>
          </div>
        </div>

        {/* Right: round architecture */}
        <div className="space-y-4 lg:col-span-7">
          <div className="rounded-md border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
                Contest sequence &amp; round locks
              </h2>
              <span className="font-mono text-[10px] text-muted-text">3 gates</span>
            </div>

            <div className="space-y-3">
              {GATES.map((gate) => (
                <div key={gate.round} className="overflow-hidden rounded-md border border-border">
                  <div className={`h-1 w-full ${gate.tint}`} aria-hidden="true" />
                  <div className="space-y-2 bg-surface-highlight p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-text">
                          {gate.round}
                        </span>
                        <span className="text-sm font-semibold text-primary-text">{gate.name}</span>
                      </div>
                      <span className="text-[11px] text-muted-text">{gate.detail}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-text">{gate.body}</p>
                    <div className="flex justify-between border-t border-border pt-2 text-[11px] text-muted-text">
                      <span className="font-mono">{gate.format}</span>
                      <span className="font-semibold text-primary-accent">{gate.digits}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoreboard link */}
          <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
            <div>
              <div className="text-sm font-semibold text-primary-text">Official live scoreboard</div>
              <div className="text-[11px] text-muted-text">
                Server-ordered rankings and official round split times.
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="rounded border border-border px-4 py-2 text-xs font-semibold text-primary-accent hover:border-primary-accent"
            >
              View scoreboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
