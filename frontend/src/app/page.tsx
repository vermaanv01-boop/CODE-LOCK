'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getContestStatus, storage } from '@/lib/api';
import { StatusBadge, SectionLabel, Stat } from '@/components/ui';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import {
  ArrowRight,
  Code2,
  Bug,
  KeyRound,
  Users,
  Clock,
  ShieldCheck,
  WifiOff,
  Trophy,
  Lightbulb,
  PenTool,
  Search,
  Headphones,
  LogIn,
  Settings,
} from 'lucide-react';

const ROUNDS = [
  {
    n: '01',
    name: 'Coding Lock',
    icon: Code2,
    tint: 'bg-accent-yellow',
    desc: 'Receive the problem sheets and compose a working solution as a squad. Correct logic yields the round pass code.',
  },
  {
    n: '02',
    name: 'Debugging Lock',
    icon: Bug,
    tint: 'bg-accent-pink',
    desc: 'A broken program is placed in front of you. Find the faults, repair the logic, and unlock the next stage.',
  },
  {
    n: '03',
    name: 'Final Lock',
    icon: KeyRound,
    tint: 'bg-accent-blue',
    desc: 'Role fragments must be combined in the correct order to assemble the master code and seal the competition.',
  },
];

const ROLES = [
  { name: 'Thinker', icon: Lightbulb, desc: 'Deciphers the puzzle and plans the approach.' },
  { name: 'Coder', icon: PenTool, desc: 'Writes the solution under the squad\u2019s direction.' },
  { name: 'Debugger', icon: Search, desc: 'Traces and repairs faults in the program.' },
  { name: 'Supporter', icon: Headphones, desc: 'Manages timing, codes and communication.' },
];

export default function LandingPage() {
  const [contest, setContest] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);

  useEffect(() => {
    setTeam(storage.getTeam());
    getContestStatus()
      .then(setContest)
      .catch(() => {});
  }, []);

  const registrationOpen = contest?.status === 'NOT_STARTED';

  return (
    <div className="space-y-16 py-2">
      {/* Hero */}
      <section className="animate-rise-in">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <SectionLabel>Team logic &amp; debugging competition</SectionLabel>
              {contest && <StatusBadge status={contest.status} />}
            </div>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-primary-text sm:text-6xl">
              CODE<span className="text-muted-text">//</span>LOCK
            </h1>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.28em] text-primary-accent sm:text-sm">
              Think. Code. Unlock. Debug.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-text">
              A three-round contest for four-person squads. Each round hides the way forward behind a
              locked code — solve the challenge, earn the unlock, and advance. Everything runs on the
              local network against a single organizer server, so timings and standings stay fair.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {team ? (
                <Link
                  href="/contest"
                  className="inline-flex items-center gap-2 rounded bg-primary-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
                >
                  Resume as {team.teamNumber}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded bg-primary-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Contestant login
                </Link>
              )}

              {registrationOpen && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded border border-border-strong bg-surface px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-text hover:border-primary-accent"
                >
                  Register your team
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-text hover:text-primary-text"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                Administrator login
              </Link>
            </div>
          </div>

          {/* Status panel */}
          <div className="lg:col-span-5">
            <div className="rounded-md border border-border bg-surface p-5">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
                  Contest telemetry
                </span>
                <VerifiedStamp label="Server synchronized" size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Contest" value={(contest?.status || '—').replace(/_/g, ' ')} accent="blue" />
                <Stat
                  label="Round 01"
                  value={(contest?.round1Status || 'LOCKED')}
                  accent="yellow"
                />
                <Stat label="Round 02" value={(contest?.round2Status || 'LOCKED')} />
                <Stat label="Round 03" value={(contest?.round3Status || 'LOCKED')} />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-text">
                Rounds activate on the organizer&apos;s signal. Your squad&apos;s timer starts the moment
                a round goes live and is measured by the server clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competition overview */}
      <section>
        <div className="flex items-end justify-between border-b border-border pb-3">
          <div>
            <SectionLabel>The format</SectionLabel>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
              Three rounds, three locks
            </h2>
          </div>
          <Trophy className="hidden h-5 w-5 text-muted-text sm:block" aria-hidden="true" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ROUNDS.map((r, i) => {
            const Icon = r.icon;
            return (
              <article
                key={r.n}
                className="animate-rise-in overflow-hidden rounded-md border border-border bg-surface"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`h-1 w-full ${r.tint}`} aria-hidden="true" />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-muted-text">ROUND {r.n}</span>
                    <Icon className="h-4 w-4 text-muted-text" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-primary-text">{r.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-text">{r.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Roles & rules */}
      <section className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="border-b border-border pb-3">
            <SectionLabel>Each squad, four roles</SectionLabel>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
              Everyone has a job
            </h2>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <li
                  key={role.name}
                  className="flex items-start gap-3 rounded-md border border-border bg-surface p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-surface-highlight text-primary-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-primary-text">{role.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-text">
                      {role.desc}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div className="border-b border-border pb-3">
            <SectionLabel>Ground rules</SectionLabel>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
              How it runs
            </h2>
          </div>
          <ul className="mt-5 space-y-3 text-sm text-primary-text">
            {[
              { icon: Clock, text: 'Round timings are enforced by the organizer server — not your device.' },
              { icon: KeyRound, text: 'Advancing requires the unlock code earned by completing the round.' },
              { icon: ShieldCheck, text: 'Codes and submissions are validated on the server; duplicates are ignored.' },
              { icon: WifiOff, text: 'No internet required — the whole contest runs on the local network.' },
            ].map((rule, i) => {
              const Icon = rule.icon;
              return (
                <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-surface p-4">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-accent" aria-hidden="true" />
                  <span className="leading-relaxed">{rule.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-md border border-border bg-surface-highlight p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-primary-text">
              Ready to take the lock?
            </h2>
            <p className="mt-1 text-sm text-muted-text">
              {registrationOpen
                ? 'Registration is open. Assemble your squad of four and claim a station.'
                : 'Registration has closed. Existing squads can sign in to continue.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {registrationOpen && (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded bg-primary-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90"
              >
                Register your team
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded border border-border-strong bg-surface px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-text hover:border-primary-accent"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Contestant login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
