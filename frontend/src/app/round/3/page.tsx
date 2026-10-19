'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundQuestions, submitRoundCode, storage } from '@/lib/api';
import { useContestStatus } from '@/lib/contest-context';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LoadingState, SectionLabel } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { Key, AlertTriangle, Send, Clock, Users, Lock } from 'lucide-react';

export default function Round3Page() {
  const router = useRouter();
  const { rounds, loading: statusLoading } = useContestStatus();
  const [team, setTeam] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [masterCode, setMasterCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [roundElapsedStr, setRoundElapsedStr] = useState<string>('00:00:00');

  const [roleFragments, setRoleFragments] = useState({
    thinker: '',
    coder: '',
    debugger: '',
    salt: '42',
  });

  const roundState = rounds[3];

  useEffect(() => {
    const currentTeam = storage.getTeam();
    if (!currentTeam) {
      router.replace('/login');
      return;
    }
    setTeam(currentTeam);

    if (statusLoading) return;
    const st = roundState?.status;
    if (st === 'COMPLETED') {
      router.replace('/round/3/dashboard');
      return;
    }
    if (st !== 'ACTIVE') {
      router.replace('/contest');
      return;
    }

    getRoundQuestions(3, currentTeam.teamNumber)
      .then((res) => {
        if (res.questions && res.questions.length > 0) {
          setQuestion(res.questions[0]);
        }
      })
      .catch((err) => {
        const e = err?.data?.error;
        if (err?.status === 401 || err?.status === 403) {
          storage.clearSession();
          router.replace('/login');
        } else if (
          e === 'ROUND_LOCKED' ||
          e === 'ROUND_NOT_ACTIVE' ||
          e === 'ROUND_NOT_STARTED' ||
          e === 'ROUND_CLOSED'
        ) {
          router.replace('/contest');
        }
      })
      .finally(() => setLoading(false));
  }, [router, statusLoading, roundState?.status]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const startedAt = roundState?.startedAt;
    if (roundState?.status === 'ACTIVE' && startedAt != null) {
      const secs = Math.floor(Math.max(0, now - startedAt) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setRoundElapsedStr([h, m, s].map((n) => n.toString().padStart(2, '0')).join(':'));
    }
  }, [now, roundState?.status, roundState?.startedAt]);

  const updateFragment = (key: 'thinker' | 'coder' | 'debugger', val: string) => {
    const updated = { ...roleFragments, [key]: val.trim().toUpperCase() };
    setRoleFragments(updated);
    const combined = `${updated.thinker}${updated.coder}${updated.debugger}${updated.salt}`;
    setMasterCode(combined);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmissionError('');

    if (!masterCode.trim()) {
      setSubmissionError('Please enter the Master Unlock Code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(3, team.teamNumber, masterCode.trim());
      if (res.success || res.completed) {
        router.push('/round/3/dashboard');
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        storage.clearSession();
        router.replace('/login');
        return;
      }
      const e = err?.data?.error;
      if (e === 'ROUND_NOT_ACTIVE' || e === 'ROUND_CLOSED' || e === 'ROUND_NOT_STARTED') {
        router.replace('/contest');
        return;
      }
      setSubmissionError(err.message || 'Verification failed. The final unlock code is rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Initializing the Final Lock collaboration matrix" />;

  const fragments: {
    key: 'thinker' | 'coder' | 'debugger';
    role: string;
    roleNo: string;
    hint: string;
    digits: string;
    accent: 'green' | 'blue' | 'pink' | 'yellow';
  }[] = [
    {
      key: 'thinker',
      role: 'Thinker',
      roleNo: 'Role 01',
      hint: 'Cipher matrix shift pattern modulus 7.',
      digits: '1 digit',
      accent: 'green',
    },
    {
      key: 'coder',
      role: 'Coder',
      roleNo: 'Role 02',
      hint: 'Binary key left-shift 3, XOR 0xAA.',
      digits: '1 digit',
      accent: 'blue',
    },
    {
      key: 'debugger',
      role: 'Debugger',
      roleNo: 'Role 03',
      hint: 'Repaired parity checksum trace #409.',
      digits: '2 digits',
      accent: 'pink',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/contest" label="CONTEST LOBBY" />
      </div>

      {/* Final Lock header */}
      <div className="rounded-md border border-primary-accent/40 bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-[10px] uppercase tracking-[0.12em] text-muted-text">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary-accent">Gate 03 · Terminal specification</span>
            <span className="text-border">|</span>
            <span>Parity: rigid</span>
            <span className="text-border">|</span>
            <span>Reconstruction: synchronized</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Station</span>
            <span className="font-mono font-semibold text-primary-accent">{team?.teamNumber}</span>
            <span className="text-border">|</span>
            <Clock className="h-3 w-3 text-primary-accent" aria-hidden="true" />
            <span className="font-mono font-semibold tabular-nums text-primary-text">
              {roundElapsedStr}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 pt-5 md:flex-row md:items-end">
          <div>
            <SectionLabel>Stage 03 · Terminal confrontation</SectionLabel>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight text-primary-text sm:text-6xl">
              Final Lock
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-text">
              Multi-role cryptographic extraction. All four specialists must contribute their
              verified fragments to assemble the master completion sequence.
            </p>
          </div>
          <div className="shrink-0">
            <VerifiedStamp label="Stage 03 ready" size="md" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: dossier + shards */}
        <div className="space-y-6 lg:col-span-7">
          <article className="rounded-md border border-border bg-surface p-5 sm:p-7">
            <header className="mb-5 flex flex-col justify-between gap-2 border-b-2 border-border pb-4 sm:flex-row sm:items-center">
              <div>
                <SectionLabel>Master spec</SectionLabel>
                <h2 className="mt-1 text-lg font-semibold text-primary-text sm:text-xl">
                  {question?.content.title || 'The Core Reactor Lock: Synchronized Extraction'}
                </h2>
              </div>
              <span className="w-fit rounded-sm border border-border bg-surface-highlight px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-text">
                4-role synchronization
              </span>
            </header>

            <section className="space-y-2">
              <SectionLabel>Challenge dossier</SectionLabel>
              <p className="whitespace-pre-line rounded-md border border-border bg-surface-highlight p-4 text-sm leading-relaxed text-primary-text">
                {question?.content.problemStatement}
              </p>
            </section>

            {/* Role shards */}
            <section className="mt-6 space-y-2">
              <SectionLabel>Role sub-key shards</SectionLabel>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fragments.map((f) => (
                  <div
                    key={f.key}
                    className="space-y-1.5 rounded-md border border-border bg-surface-highlight p-3"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-semibold uppercase tracking-[0.1em] ${
                          f.accent === 'pink' ? 'text-warning' : 'text-primary-accent'
                        }`}
                      >
                        {f.role} shard
                      </span>
                      <span className="rounded-sm border border-border bg-surface px-1 text-muted-text">
                        {f.roleNo}
                      </span>
                    </div>
                    <div className="text-xs leading-relaxed text-muted-text">{f.hint}</div>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-text">
                        {f.digits}
                      </span>
                      <input
                        type="text"
                        maxLength={f.key === 'debugger' ? 2 : 1}
                        aria-label={`${f.role} fragment`}
                        value={roleFragments[f.key]}
                        onChange={(e) => updateFragment(f.key, e.target.value)}
                        placeholder={f.key === 'debugger' ? '00' : '0'}
                        className={`w-16 rounded border border-border bg-background p-1.5 text-center font-mono text-sm font-semibold tabular-nums placeholder:text-muted-text/30 focus:outline-none ${
                          f.accent === 'pink'
                            ? 'text-warning focus:border-warning'
                            : 'text-primary-accent focus:border-primary-accent'
                        }`}
                      />
                    </div>
                  </div>
                ))}

                {/* Supporter / salt */}
                <div className="space-y-1.5 rounded-md border border-border bg-surface-highlight p-3">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold uppercase tracking-[0.1em] text-primary-accent">
                      Supporter assembly
                    </span>
                    <span className="rounded-sm border border-border bg-surface px-1 text-muted-text">
                      Role 04
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed text-muted-text">
                    Strict sequence concatenation + Salt.
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-text">
                      Control salt
                    </span>
                    <span className="rounded border border-border bg-background px-3 py-1.5 font-mono text-sm font-semibold text-primary-accent">
                      42
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Protocol note replaces scratchpad */}
            <section className="mt-6 rounded-md border border-border bg-background p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">
                <Lock className="h-3.5 w-3.5 text-primary-accent" aria-hidden="true" />
                Extraction protocol
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-[11px] text-primary-text sm:grid-cols-4">
                <div className="rounded border border-border/70 px-2 py-1.5">01 · Thinker (1)</div>
                <div className="rounded border border-border/70 px-2 py-1.5">02 · Coder (1)</div>
                <div className="rounded border border-border/70 px-2 py-1.5">03 · Debugger (2)</div>
                <div className="rounded border border-border/70 px-2 py-1.5">04 · Salt 42</div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-text">
                Fragments are concatenation-sensitive. Assemble locally with your team, then
                transmit the verified sequence.
              </p>
            </section>
          </article>
        </div>

        {/* Right: final terminal */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-md border-2 border-primary-accent/50 bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
                <Key className="h-4 w-4 text-primary-accent" aria-hidden="true" />
                Final master unlock terminal
              </div>
              <span className="rounded-sm bg-accent-yellow px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-accent">
                Gate 03
              </span>
            </div>

            <p className="text-xs leading-relaxed text-muted-text">
              Assemble the four team fragments in strict order:
            </p>
            <div className="mt-2 rounded border border-border bg-surface-highlight px-3 py-2 font-mono text-[11px] font-semibold text-primary-text">
              THINKER (1) + CODER (1) + DEBUGGER (2) + SALT &quot;42&quot;
            </div>

            {/* Live assembly preview */}
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-[11px] uppercase tracking-[0.1em] text-muted-text">
                <span>Live assembly</span>
                <span className="tabular-nums">{masterCode.length} / 6 chars</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                <div className="rounded border border-border bg-background p-2">
                  <span className="block text-[9px] text-muted-text">Thinker</span>
                  <span className="font-semibold text-primary-accent">{roleFragments.thinker || '·'}</span>
                </div>
                <div className="rounded border border-border bg-background p-2">
                  <span className="block text-[9px] text-muted-text">Coder</span>
                  <span className="font-semibold text-primary-accent">{roleFragments.coder || '·'}</span>
                </div>
                <div className="rounded border border-border bg-background p-2">
                  <span className="block text-[9px] text-muted-text">Debugger</span>
                  <span className="font-semibold text-primary-accent">{roleFragments.debugger || '··'}</span>
                </div>
                <div className="rounded border border-border bg-background p-2">
                  <span className="block text-[9px] text-muted-text">Salt</span>
                  <span className="font-semibold text-primary-accent">42</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="master-code"
                  className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-text"
                >
                  Master unlock sequence (6 characters)
                </label>
                <input
                  id="master-code"
                  type="text"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
                  placeholder="390742"
                  className="w-full rounded-md border-2 border-primary-accent/60 bg-background p-3.5 text-center font-mono text-2xl tracking-[0.2em] text-primary-accent placeholder:text-muted-text/30 focus:border-primary-accent focus:outline-none"
                />
              </div>

              {submissionError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded border border-error/40 bg-error/10 p-3 text-xs text-error"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{submissionError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !masterCode.trim()}
                className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isSubmitting ? 'Verifying with server…' : 'Transmit final unlock sequence'}
                </span>
              </button>
            </form>
          </div>

          {/* Squad coordination */}
          <div className="rounded-md border border-border bg-surface p-5">
            <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">
              <Users className="h-3.5 w-3.5 text-primary-accent" aria-hidden="true" />
              Squad coordination
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-text">Thinker</dt>
                <dd className="truncate font-semibold text-primary-text">{team?.thinker}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-text">Coder</dt>
                <dd className="truncate font-semibold text-primary-text">{team?.coder}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-text">Debugger</dt>
                <dd className="truncate font-semibold text-primary-text">{team?.debugger}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-text">Supporter</dt>
                <dd className="truncate font-semibold text-primary-text">{team?.supporter}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
