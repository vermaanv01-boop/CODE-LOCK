'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundQuestions, submitRoundCode, storage } from '@/lib/api';
import { useContestStatus } from '@/lib/contest-context';
import { LoadingState, SectionLabel } from '@/components/ui';
import { Key, AlertTriangle, Send, ArrowRight, Clock, Check } from 'lucide-react';

export default function Round1Page() {
  const router = useRouter();
  const { rounds, loading: statusLoading } = useContestStatus();
  const [team, setTeam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '',
  });
  const [combinedCode, setCombinedCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());
  const [roundElapsedStr, setRoundElapsedStr] = useState<string>('00:00:00');

  const roundState = rounds[1];

  // Load the problem set once the round is authoritatively ACTIVE. Lifecycle
  // violations and expired sessions are pushed back to the correct surface.
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
      router.replace('/round/1/dashboard');
      return;
    }
    if (st !== 'ACTIVE') {
      router.replace('/contest');
      return;
    }

    getRoundQuestions(1, currentTeam.teamNumber)
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

  // Independent per-round clock — derived only from this round's server start.
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
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    const updated = { ...digitInputs, [qNum]: cleaned };
    setDigitInputs(updated);
    setCombinedCode([1, 2, 3, 4, 5, 6].map((n) => updated[n] || '').join(''));
  };

  const handleCombinedCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
    setCombinedCode(cleaned);
    if (cleaned.length === 12) {
      setDigitInputs({
        1: cleaned.slice(0, 2),
        2: cleaned.slice(2, 4),
        3: cleaned.slice(4, 6),
        4: cleaned.slice(6, 8),
        5: cleaned.slice(8, 10),
        6: cleaned.slice(10, 12),
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmissionError('');

    if (combinedCode.length !== 12) {
      setSubmissionError(
        'The Round 01 unlock code must be exactly 12 numeric digits (6 questions × 2 digits).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(1, team.teamNumber, combinedCode);
      if (res.success || res.completed) {
        router.push('/round/1/dashboard');
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

  if (loading) return <LoadingState label="Loading Round 01 sheet" />;

  const currentQ = questions[activeQuestionIdx];

  return (
    <div className="space-y-6">
      {/* Round header band */}
      <div className="rounded-md border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
          <div>
            <SectionLabel>Round 01 · Coding Lock</SectionLabel>
            <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
              Coding Lock
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
              <div className="mt-0.5 font-mono font-semibold tabular-nums text-primary-accent">
                {roundElapsedStr}
              </div>
            </div>
          </div>
        </div>

        {/* Question navigation */}
        <div className="flex flex-col justify-between gap-2 pt-4 sm:flex-row sm:items-center">
          <SectionLabel>Question navigation</SectionLabel>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {questions.map((q, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const val = digitInputs[q.questionNumber];
              const isFilled = val && val.length === 2;
              return (
                <button
                  key={q.questionNumber}
                  onClick={() => setActiveQuestionIdx(idx)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-md border px-2 py-2 transition-colors duration-150 sm:px-4 ${
                    isSelected
                      ? 'border-primary-accent bg-primary-accent text-primary-accent-contrast'
                      : isFilled
                      ? 'border-border bg-accent-green/25 text-primary-accent hover:border-primary-accent'
                      : 'border-border bg-background text-muted-text hover:text-primary-text'
                  }`}
                >
                  <span className="flex items-center gap-1 font-mono text-xs">
                    0{q.questionNumber}
                    {isFilled && <Check className="h-3 w-3" aria-hidden="true" />}
                  </span>
                  <span className="font-mono text-[9px] tracking-tight">
                    {val ? `[${val}]` : '[--]'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentQ && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Primary: problem sheet */}
          <div className="space-y-6 lg:col-span-7">
            <article className="rounded-md border border-border bg-surface p-5 sm:p-8">
              <header className="mb-5 flex flex-col justify-between gap-2 border-b-2 border-border pb-4 sm:flex-row sm:items-center">
                <div>
                  <SectionLabel>Sheet entry · 0{currentQ.questionNumber}</SectionLabel>
                  <h2 className="mt-1 text-xl font-semibold text-primary-text sm:text-2xl">
                    Q0{currentQ.questionNumber}: {currentQ.content.title}
                  </h2>
                </div>
                <span className="w-fit rounded-sm border border-border bg-surface-highlight px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-text">
                  Output · 2-digit numeric
                </span>
              </header>

              <section className="space-y-2">
                <SectionLabel>Problem</SectionLabel>
                <p className="whitespace-pre-line rounded-md border border-border bg-surface-highlight p-4 text-sm leading-relaxed text-primary-text">
                  {currentQ.content.problemStatement}
                </p>
              </section>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <section className="space-y-1.5">
                  <SectionLabel>Input</SectionLabel>
                  <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3.5 font-mono text-xs leading-relaxed text-primary-text">
                    {currentQ.content.inputDescription || 'Supplied via the problem specification.'}
                  </div>
                </section>
                <section className="space-y-1.5">
                  <SectionLabel>Output</SectionLabel>
                  <div className="rounded-md border border-border bg-background p-3.5 font-mono text-xs leading-relaxed text-primary-text">
                    {currentQ.content.outputDescription ||
                      '2-digit numeric integer (zero-padded if under 10).'}
                  </div>
                </section>
              </div>

              {currentQ.content.constraints?.length > 0 && (
                <section className="mt-6 space-y-1.5">
                  <SectionLabel>Constraints</SectionLabel>
                  <ul className="list-disc space-y-1 rounded-md border border-border bg-background p-3.5 pl-6 text-xs leading-relaxed text-muted-text">
                    {currentQ.content.constraints.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}

              {currentQ.content.examples?.length > 0 && (
                <section className="mt-6 space-y-2">
                  <SectionLabel>Examples</SectionLabel>
                  {currentQ.content.examples.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="space-y-1.5 rounded-md border border-border bg-background p-3.5 font-mono text-xs"
                    >
                      <div>
                        <span className="text-muted-text">Input: </span>
                        <span className="text-primary-text">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-muted-text">Output: </span>
                        <span className="font-semibold text-success">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="border-t border-border pt-1.5 text-[11px] leading-relaxed text-muted-text">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </article>
          </div>

          {/* Secondary: answer entry + code generation */}
          <div className="space-y-6 lg:col-span-5">
            {/* Current question answer */}
            <div className="rounded-md border border-border bg-surface p-5">
              <SectionLabel>Answer · Question 0{currentQ.questionNumber}</SectionLabel>
              <p className="mt-1 text-[11px] text-muted-text">
                Enter the calculated 2-digit answer for this problem sheet.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  aria-label={`Answer for question ${currentQ.questionNumber}`}
                  value={digitInputs[currentQ.questionNumber] || ''}
                  onChange={(e) => handleDigitChange(currentQ.questionNumber, e.target.value)}
                  placeholder="00"
                  className="w-24 rounded-md border-2 border-border bg-background p-2 text-center font-mono text-xl font-semibold tabular-nums text-primary-accent placeholder:text-muted-text/30 focus:border-primary-accent focus:outline-none"
                />

                {activeQuestionIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveQuestionIdx(activeQuestionIdx + 1)}
                    className="flex items-center gap-1 rounded border border-border px-4 py-2.5 text-xs font-semibold text-primary-text hover:border-primary-accent hover:text-primary-accent"
                  >
                    <span>Next (Q0{activeQuestionIdx + 2})</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById('code-generation-panel')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="flex items-center gap-1 rounded bg-primary-accent px-4 py-2.5 text-xs font-semibold text-primary-accent-contrast"
                  >
                    <span>Review code</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Code generation + submission */}
            <div id="code-generation-panel" className="rounded-md border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary-accent" aria-hidden="true" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
                    Code generation
                  </h3>
                </div>
                <span className="rounded-sm bg-accent-yellow px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-accent">
                  12-digit protocol
                </span>
              </div>

              <p className="text-xs leading-relaxed text-primary-text">
                Each question produces a 2-digit answer. Combine the answers from Q1 through Q6, in
                order, to produce the final 12-digit unlock code.
              </p>

              {/* Example matrix */}
              <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-md border border-border bg-background p-3 font-mono text-xs sm:grid-cols-7">
                {[
                  ['Q1', '24'], ['Q2', '71'], ['Q3', '08'], ['Q4', '35'],
                  ['Q5', '62'], ['Q6', '19'],
                ].map(([q, v]) => (
                  <div key={q} className="rounded border border-border/70 p-1.5 text-center">
                    <span className="block text-[10px] text-muted-text">{q}</span>
                    <span className="font-semibold text-muted-text">{v}</span>
                  </div>
                ))}
                <div className="col-span-4 rounded border border-primary-accent/40 bg-accent-yellow/25 p-1.5 text-center sm:col-span-1">
                  <span className="block text-[9px] font-semibold text-primary-accent">Final</span>
                  <span className="text-[10px] font-semibold text-primary-accent">247108356219</span>
                </div>
              </div>

              {/* Assembled key */}
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-[11px] uppercase tracking-[0.1em] text-muted-text">
                  <span>Your assembled key</span>
                  <span className="tabular-nums">{combinedCode.length} / 12 digits</span>
                </div>

                <div className="grid grid-cols-6 gap-2 rounded-md border border-border bg-surface-highlight p-3 text-center">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="flex flex-col">
                      <span className="text-[10px] text-muted-text">Q0{n}</span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-primary-accent sm:text-base">
                        {digitInputs[n] || '--'}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <label htmlFor="combined-code" className="sr-only">
                    12-digit unlock code
                  </label>
                  <input
                    id="combined-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={combinedCode}
                    onChange={handleCombinedCodeChange}
                    placeholder="247108356219"
                    className="w-full rounded-md border-2 border-border bg-background p-3 text-center font-mono text-lg tracking-[0.2em] text-primary-accent placeholder:text-muted-text/30 focus:border-primary-accent focus:outline-none"
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
                    disabled={isSubmitting || combinedCode.length !== 12}
                    className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isSubmitting
                        ? 'Verifying key…'
                        : 'Submit 12-digit unlock code'}
                    </span>
                  </button>
                </form>

                <p className="text-[10px] leading-relaxed text-muted-text">
                  Write and compile your solutions in your own IDE or offline compiler, then enter
                  each 2-digit result above. This platform only presents problems and submits
                  answers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
