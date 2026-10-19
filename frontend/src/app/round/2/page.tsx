'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundQuestions, submitRoundCode, storage } from '@/lib/api';
import { useContestStatus } from '@/lib/contest-context';
import { LoadingState, SectionLabel } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { Bug, Key, AlertTriangle, Send, ArrowRight, Clock, Copy, FileCode } from 'lucide-react';

export default function Round2Page() {
  const router = useRouter();
  const { rounds, loading: statusLoading } = useContestStatus();
  const [team, setTeam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({ 1: '', 2: '' });
  const [combinedCode, setCombinedCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [roundElapsedStr, setRoundElapsedStr] = useState<string>('00:00:00');
  const [copied, setCopied] = useState<boolean>(false);

  const roundState = rounds[2];

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
      router.replace('/round/2/dashboard');
      return;
    }
    if (st !== 'ACTIVE') {
      router.replace('/contest');
      return;
    }

    getRoundQuestions(2, currentTeam.teamNumber)
      .then((res) => setQuestions(res.questions || []))
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

  const handleDigitChange = (qNum: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 3);
    const updated = { ...digitInputs, [qNum]: cleaned };
    setDigitInputs(updated);
    setCombinedCode([1, 2].map((n) => updated[n] || '').join(''));
  };

  const handleCombinedCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCombinedCode(cleaned);
    if (cleaned.length === 6) {
      setDigitInputs({ 1: cleaned.slice(0, 3), 2: cleaned.slice(3, 6) });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmissionError('');

    if (combinedCode.length !== 6) {
      setSubmissionError(
        'The Round 02 unlock code must be exactly 6 numeric digits (2 questions × 3 digits).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(2, team.teamNumber, combinedCode);
      if (res.success || res.completed) {
        router.push('/round/2/dashboard');
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
      setSubmissionError(err.message || 'Verification failed. The unlock code entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading Round 02 sheet" />;

  const currentQ = questions[activeQuestionIdx];

  const renderBrokenCode = (code: string) => {
    if (!code) return null;
    const lines = code.split('\n');
    return (
      <div className="code-panel">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isBugLine =
                line.includes('BUG') || line.includes('// BUG') || line.includes('# BUG');
              return (
                <tr key={idx} className={isBugLine ? 'bg-error/10' : ''}>
                  <td
                    className="w-10 select-none border-r border-border/60 px-2 text-right align-top font-mono text-[11px] tabular-nums text-muted-text/70"
                    aria-hidden="true"
                  >
                    {lineNum}
                  </td>
                  <td className="whitespace-pre px-3 align-top font-mono text-primary-text">
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/contest" label="CONTEST LOBBY" />
      </div>

      {/* Round header band */}
      <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
          <div>
            <SectionLabel>Round 02 · Debugging Lock</SectionLabel>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
              Debugging Lock
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs sm:gap-4">
            <div className="rounded border border-border bg-surface-highlight px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-text">Team</div>
              <div className="mt-0.5 font-mono font-semibold text-primary-accent">
                {team?.teamNumber}
              </div>
            </div>
            <div className="min-w-0 rounded border border-border bg-surface-highlight px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.1em] text-muted-text">Name</div>
              <div className="mt-0.5 truncate text-primary-text">{team?.teamName}</div>
            </div>
            <div className="rounded border border-border bg-surface-highlight px-3 py-2">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-muted-text">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                Round time
              </div>
              <div className="mt-0.5 font-mono font-semibold tabular-nums text-warning">
                {roundElapsedStr}
              </div>
            </div>
          </div>
        </div>

        {/* Task navigation */}
        <div className="flex flex-col justify-between gap-2 pt-4 sm:flex-row sm:items-center">
          <SectionLabel>Debugging tasks</SectionLabel>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            {questions.map((q, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const val = digitInputs[q.questionNumber];
              return (
                <button
                  key={q.questionNumber}
                  onClick={() => setActiveQuestionIdx(idx)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex items-center justify-between gap-3 rounded-md border px-4 py-2 transition-colors duration-150 ${
                    isSelected
                      ? 'border-warning bg-accent-pink text-primary-accent'
                      : 'border-border bg-background text-muted-text hover:text-primary-text'
                  }`}
                >
                  <span className="text-xs font-semibold">Task 0{q.questionNumber}</span>
                  <span className="font-mono text-[11px]">{val ? `[${val}]` : '[---]'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentQ && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Primary: defect + broken code */}
          <div className="space-y-6 lg:col-span-7">
            <article className="rounded-md border border-border bg-surface p-5 sm:p-8">
              <header className="mb-5 flex flex-col justify-between gap-2 border-b-2 border-border pb-4 sm:flex-row sm:items-center">
                <div>
                  <SectionLabel>Debugging target · 0{currentQ.questionNumber}</SectionLabel>
                  <h2 className="mt-1 text-xl font-semibold text-primary-text sm:text-2xl">
                    Q0{currentQ.questionNumber}: {currentQ.content.title}
                  </h2>
                </div>
                <span className="w-fit rounded-sm border border-border bg-surface-highlight px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-text">
                  Output · 3-digit numeric
                </span>
              </header>

              <section className="space-y-2">
                <SectionLabel>Defect analysis</SectionLabel>
                <p className="whitespace-pre-line rounded-md border border-border bg-surface-highlight p-4 text-sm leading-relaxed text-primary-text">
                  {currentQ.content.problemStatement}
                </p>
              </section>

              <section className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-text">
                    <FileCode className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                    Broken code ({currentQ.content.language?.toUpperCase() || 'SOURCE'})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(currentQ.content.starterCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[10px] text-muted-text underline hover:text-primary-text"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {renderBrokenCode(currentQ.content.starterCode)}
              </section>

              {currentQ.content.inputDescription && (
                <section className="mt-6 space-y-1.5">
                  <SectionLabel>Execution payload</SectionLabel>
                  <div className="rounded-md border border-border bg-background p-3 font-mono text-xs text-primary-text">
                    {currentQ.content.inputDescription}
                  </div>
                </section>
              )}
            </article>
          </div>

          {/* Secondary: answer + submission */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-md border border-border bg-surface p-5">
              <SectionLabel>Task 0{currentQ.questionNumber} output · 3 digits</SectionLabel>
              <p className="mt-1 text-[11px] text-muted-text">
                Run the repaired implementation to extract the verified 3-digit checksum.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  aria-label={`Answer for task ${currentQ.questionNumber}`}
                  value={digitInputs[currentQ.questionNumber] || ''}
                  onChange={(e) => handleDigitChange(currentQ.questionNumber, e.target.value)}
                  placeholder="000"
                  className="w-28 rounded-md border-2 border-border bg-background p-2 text-center font-mono text-xl font-semibold tabular-nums text-warning placeholder:text-muted-text/30 focus:border-warning focus:outline-none"
                />

                {activeQuestionIdx === 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveQuestionIdx(1)}
                    className="flex items-center gap-1 rounded border border-border px-4 py-2.5 text-xs font-semibold text-primary-text hover:border-warning hover:text-warning"
                  >
                    <span>Next (Task 02)</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById('r2-code-generation-panel')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="flex items-center gap-1 rounded bg-warning px-4 py-2.5 text-xs font-semibold text-warning-contrast"
                  >
                    <span>Review code</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Code generation + submission */}
            <div id="r2-code-generation-panel" className="rounded-md border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-warning" aria-hidden="true" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
                    Code generation
                  </h3>
                </div>
                <span className="rounded-sm bg-accent-pink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-accent">
                  6-digit protocol
                </span>
              </div>

              <p className="text-xs leading-relaxed text-primary-text">
                Each debugging question produces a 3-digit answer. Combine Q1 followed by Q2 to
                produce the final 6-digit unlock code.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-border bg-background p-3 font-mono text-xs">
                <div className="rounded border border-border/70 p-2 text-center">
                  <span className="block text-[10px] text-muted-text">Q1</span>
                  <span className="font-semibold text-muted-text">381</span>
                </div>
                <div className="rounded border border-border/70 p-2 text-center">
                  <span className="block text-[10px] text-muted-text">Q2</span>
                  <span className="font-semibold text-muted-text">724</span>
                </div>
                <div className="rounded border border-warning/50 bg-accent-pink/25 p-2 text-center">
                  <span className="block text-[9px] font-semibold text-primary-accent">Final</span>
                  <span className="font-semibold text-primary-accent">381724</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-[11px] uppercase tracking-[0.1em] text-muted-text">
                  <span>Your assembled key</span>
                  <span className="tabular-nums">{combinedCode.length} / 6 digits</span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-highlight p-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-text">Q01 (3 digits)</span>
                    <span className="font-mono text-base font-semibold tabular-nums text-warning sm:text-lg">
                      {digitInputs[1] || '---'}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-border/60">
                    <span className="text-[10px] text-muted-text">Q02 (3 digits)</span>
                    <span className="font-mono text-base font-semibold tabular-nums text-warning sm:text-lg">
                      {digitInputs[2] || '---'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <label htmlFor="r2-combined" className="sr-only">
                    6-digit unlock code
                  </label>
                  <input
                    id="r2-combined"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={combinedCode}
                    onChange={handleCombinedCodeChange}
                    placeholder="381724"
                    className="w-full rounded-md border-2 border-border bg-background p-3 text-center font-mono text-xl tracking-[0.2em] text-warning placeholder:text-muted-text/30 focus:border-warning focus:outline-none"
                  />

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
                    disabled={isSubmitting || combinedCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded bg-warning px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-warning-contrast hover:opacity-90 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>{isSubmitting ? 'Validating…' : 'Submit 6-digit unlock code'}</span>
                  </button>
                </form>

                <p className="text-[10px] leading-relaxed text-muted-text">
                  Repair and run the programs in your own IDE or offline compiler, then enter each
                  3-digit result above. Source code is shown read-only here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
