'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest, storage, getContestStatus } from '@/lib/api';
import { StatusBadge, SectionLabel } from '@/components/ui';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { Users, ArrowRight, AlertTriangle, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [teamNumber, setTeamNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    setConnected(storage.getTeam());
    getContestStatus()
      .then((res) => {
        setContest(res);
        setRegistrationOpen(res.status === 'NOT_STARTED');
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = teamNumber.trim().toUpperCase();
    if (!clean) {
      setError('Enter your team identifier to continue.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest('/auth/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamNumber: clean })
      });
      if (res.token) storage.setTeamToken(res.token);
      storage.setTeam(res.team);
      router.push('/contest');
    } catch (err: any) {
      setError(err.message || 'Team authentication rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    storage.clearSession();
    setConnected(null);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 py-4 lg:grid-cols-12">
      {/* Left: intro */}
      <div className="space-y-6 lg:col-span-5">
        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <SectionLabel>Contestant access</SectionLabel>
          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
            Team login
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-text">
            Sign in with the squad identifier issued during registration. Your session is verified
            against the organizer server so your team state, round access and timings stay
            authoritative.
          </p>

          <ul className="mt-6 space-y-2 text-xs text-muted-text">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-green" aria-hidden="true" />
              Rounds unlock only when the organizer activates them.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden="true" />
              Timings are measured by the organizer server clock.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-pink" aria-hidden="true" />
              Everything runs on the local network — no internet required.
            </li>
          </ul>
        </div>
      </div>

      {/* Right: form / connected card */}
      <div className="space-y-6 lg:col-span-7">
        <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary-text">
                Squad session
              </h2>
            </div>
            {contest && <StatusBadge status={contest.status} />}
          </div>

          {connected ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-surface-highlight p-4">
                <div className="font-mono text-lg font-semibold text-primary-accent">
                  {connected.teamNumber}
                </div>
                <div className="mt-0.5 text-sm text-primary-text">{connected.teamName}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-text">
                  <span>Stage · Round 0{connected.currentRound}</span>
                  <StatusBadge status={connected.status} />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contest"
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-primary-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
                >
                  Enter contest
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button
                  onClick={handleDisconnect}
                  className="rounded border border-border px-4 py-3 text-xs font-semibold text-muted-text hover:border-error hover:text-error"
                >
                  Disconnect
                </button>
              </div>
              <p className="text-[11px] text-muted-text">
                Sign in with a different team below to replace this session.
              </p>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="team-number"
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-text"
              >
                <KeyRound className="h-3 w-3" aria-hidden="true" />
                Team identifier
              </label>
              <input
                id="team-number"
                type="text"
                autoFocus
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value.toUpperCase())}
                placeholder="e.g. T-027"
                className="w-full rounded border border-border bg-background px-3 py-3 font-mono text-sm uppercase tracking-[0.1em] text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded border border-error/40 bg-error/10 p-3 text-xs text-error"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-40"
            >
              <span>{loading ? 'Authenticating…' : 'Authenticate team'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-muted-text">
              <Link href="/" className="underline hover:text-primary-text">
                ← Back to home
              </Link>
              {registrationOpen ? (
                <Link href="/register" className="underline hover:text-primary-text">
                  New squad? Register →
                </Link>
              ) : (
                <span>Registration closed</span>
              )}
            </div>
          </form>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
              Organizer?
            </div>
            <div className="text-xs text-primary-text">Administrative console is separate.</div>
          </div>
          <Link
            href="/admin/login"
            className="text-xs font-semibold text-muted-text underline hover:text-primary-text"
          >
            Administrator login →
          </Link>
        </div>

        <div className="flex justify-end">
          <VerifiedStamp label="Secure LAN session" size="sm" />
        </div>
      </div>
    </div>
  );
}
