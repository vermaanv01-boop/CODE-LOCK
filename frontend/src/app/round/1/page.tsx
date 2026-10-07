'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundQuestions, submitRoundCode, getContestStatus, storage } from '@/lib/api';
import { MonacoOrFallbackEditor } from '@/components/MonacoOrFallbackEditor';
import { 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  HelpCircle, 
  Code2, 
  Info,
  Send,
  Radio,
  Clock,
  ArrowRight,
  FileCode
} from 'lucide-react';

export default function Round1Page() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: ''
  });
  const [combinedCode, setCombinedCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [serverTimeStr, setServerTimeStr] = useState<string>('00:00:00');

  useEffect(() => {
    const currentTeam = storage.getTeam();
    if (!currentTeam) {
      router.push('/contest');
      return;
    }
    setTeam(currentTeam);

    let startTime: number | null = null;

    // Fetch contest status & questions
    getContestStatus().then(statusRes => {
      if (statusRes.status !== 'ACTIVE' && statusRes.status !== 'COMPLETED') {
        router.push('/contest');
        return;
      }
      if (statusRes.contestStartTime) {
        startTime = statusRes.contestStartTime;
      }

      getRoundQuestions(1, currentTeam.teamNumber)
        .then(res => {
          setQuestions(res.questions || []);
        })
        .catch(err => {
          if (err.data?.error === 'ROUND_LOCKED') {
            router.push('/contest');
          }
        })
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));

    const timerInterval = setInterval(() => {
      if (startTime) {
        const diff = Math.max(0, Date.now() - startTime);
        const secs = Math.floor(diff / 1000);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setServerTimeStr(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [router]);

  // Handle individual question 2-digit input
  const handleDigitChange = (qNum: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    const updated = { ...digitInputs, [qNum]: cleaned };
    setDigitInputs(updated);

    const fullCode = [1, 2, 3, 4, 5, 6].map(n => updated[n] || '').join('');
    setCombinedCode(fullCode);
  };

  // Handle direct 12-digit combined input
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
        6: cleaned.slice(10, 12)
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmissionError('');

    if (combinedCode.length !== 12) {
      setSubmissionError('The Round 01 unlock code must be exactly 12 numeric digits (6 questions x 2 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(1, team.teamNumber, combinedCode);
      if (res.success || res.completed) {
        router.push('/round/1/dashboard');
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'Verification failed. The unlock code entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [INITIALIZING ROUND 01 CODING LOCK SECURE SHEET...]
      </div>
    );
  }

  const currentQ = questions[activeQuestionIdx];

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Header Structure: ROUND 01 | CODING LOCK | TEAM NUMBER | TEAM NAME | SERVER TIME */}
      <div className="border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="text-[10px] text-primary-accent tracking-widest uppercase font-bold flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>ROUND 01</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              CODING LOCK
            </h1>
          </div>

          {/* Telemetry metadata: TEAM NUMBER, TEAM NAME, SERVER TIME */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs">
            <div className="p-2.5 bg-background border border-border">
              <div className="text-[10px] text-muted-text uppercase">TEAM NUMBER</div>
              <div className="font-bold text-primary-accent text-sm mt-0.5">{team?.teamNumber}</div>
            </div>

            <div className="p-2.5 bg-background border border-border">
              <div className="text-[10px] text-muted-text uppercase">TEAM NAME</div>
              <div className="font-sans text-primary-text text-xs truncate max-w-[120px] sm:max-w-[180px] mt-0.5">
                {team?.teamName}
              </div>
            </div>

            <div className="p-2.5 bg-background border border-border">
              <div className="text-[10px] text-muted-text uppercase flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-primary-accent" />
                <span>SERVER TIME</span>
              </div>
              <div className="font-bold text-primary-accent text-sm mt-0.5">{serverTimeStr}</div>
            </div>
          </div>
        </div>

        {/* Question Navigation: 01 02 03 04 05 06 */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] text-muted-text uppercase tracking-wider font-semibold">
            QUESTION NAVIGATION:
          </div>

          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {questions.map((q, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const val = digitInputs[q.questionNumber];
              const isFilled = val && val.length === 2;

              return (
                <button
                  key={q.questionNumber}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`py-2 px-2 sm:px-4 border text-center transition-colors flex flex-col items-center gap-0.5 ${
                    isSelected
                      ? 'bg-primary-accent text-primary-accent-contrast border-primary-accent font-bold'
                      : isFilled
                      ? 'bg-surface-highlight text-primary-accent border-border font-semibold hover:border-primary-accent'
                      : 'bg-background text-muted-text border-border hover:text-primary-text hover:border-border'
                  }`}
                >
                  <span className="text-xs font-mono">0{q.questionNumber}</span>
                  <span className="text-[9px] font-mono tracking-tighter">
                    {val ? `[${val}]` : '[--]'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Question Area (Problem-Sheet Layout) */}
      {currentQ && (
        <div className="border border-border bg-surface p-5 sm:p-8 space-y-6 shadow-sm">
          {/* Question Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-border pb-4 gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary-accent font-bold">
                SHEET ENTRY / 0{currentQ.questionNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-text font-sans">
                QUESTION 0{currentQ.questionNumber}: {currentQ.content.title}
              </h2>
            </div>
            <span className="text-[10px] text-muted-text border border-border px-2 py-1 bg-surface-dark w-fit">
              OUTPUT REQUIREMENT: 2-DIGIT NUMERIC
            </span>
          </div>

          {/* PROBLEM */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary-accent uppercase tracking-wider">
              PROBLEM
            </div>
            <p className="font-sans text-xs sm:text-sm text-primary-text leading-relaxed whitespace-pre-line bg-background p-4 border border-border">
              {currentQ.content.problemStatement}
            </p>
          </div>

          {/* INPUT & OUTPUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                INPUT
              </div>
              <div className="p-3.5 bg-background border border-border text-xs text-primary-text font-mono leading-relaxed whitespace-pre-wrap">
                {currentQ.content.inputDescription || 'Supplied via problem specification.'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                OUTPUT
              </div>
              <div className="p-3.5 bg-background border border-border text-xs text-primary-text font-mono leading-relaxed">
                {currentQ.content.outputDescription || '2-digit numeric integer (zero-padded if < 10).'}
              </div>
            </div>
          </div>

          {/* CONSTRAINTS */}
          {currentQ.content.constraints && currentQ.content.constraints.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                CONSTRAINTS
              </div>
              <ul className="p-3 bg-surface-dark border border-border text-xs text-muted-text space-y-1 list-disc list-inside font-sans">
                {currentQ.content.constraints.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* EXAMPLE */}
          {currentQ.content.examples && currentQ.content.examples.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                EXAMPLE
              </div>
              {currentQ.content.examples.map((ex: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-background border border-border text-xs space-y-1.5 font-mono">
                  <div><span className="text-muted-text">Input:</span> <span className="text-primary-text">{ex.input}</span></div>
                  <div><span className="text-muted-text">Output:</span> <span className="text-primary-accent font-bold">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="text-[11px] text-muted-text font-sans pt-1 border-t border-border/50">
                      {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ANSWER: [ INPUT ] [ SUBMIT / RECORD ] */}
          <div className="p-4 sm:p-5 bg-surface-dark border-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-primary-text uppercase tracking-wider">
                ANSWER (QUESTION 0{currentQ.questionNumber})
              </div>
              <div className="text-[11px] text-muted-text font-sans">
                Enter the calculated 2-digit solution for this problem sheet.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                maxLength={2}
                value={digitInputs[currentQ.questionNumber] || ''}
                onChange={(e) => handleDigitChange(currentQ.questionNumber, e.target.value)}
                placeholder="00"
                className="w-20 text-center text-xl font-bold bg-background border-2 border-primary-accent/80 text-primary-accent p-2 focus:outline-none focus:border-primary-accent font-mono"
              />

              {activeQuestionIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveQuestionIdx(activeQuestionIdx + 1)}
                  className="px-4 py-2.5 bg-surface border border-border hover:border-primary-accent text-xs font-mono text-primary-text hover:text-primary-accent flex items-center gap-1"
                >
                  <span>NEXT (Q0{activeQuestionIdx + 2})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('code-generation-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-primary-accent text-primary-accent-contrast text-xs font-mono font-bold flex items-center gap-1"
                >
                  <span>REVIEW CODE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROUND 1 INSTRUCTION PANEL (Directly below question section) */}
      <div id="code-generation-panel" className="border-2 border-border bg-surface p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-accent" />
            <h3 className="text-sm font-bold text-primary-text uppercase tracking-wider">
              CODE GENERATION
            </h3>
          </div>
          <span className="text-[10px] text-primary-accent border border-primary-accent/40 px-2 py-0.5 uppercase">
            12-DIGIT PROTOCOL
          </span>
        </div>

        <p className="text-xs text-primary-text font-sans leading-relaxed">
          Each question produces a 2-digit answer. Combine the answers in <strong className="text-primary-accent font-mono font-normal">Q1 → Q6</strong> order to create the final 12-digit unlock code.
        </p>

        {/* Compact Example Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-background p-3 border border-border text-xs font-mono">
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q1</span> <span className="font-bold text-muted-text">24</span></div>
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q2</span> <span className="font-bold text-muted-text">71</span></div>
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q3</span> <span className="font-bold text-muted-text">08</span></div>
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q4</span> <span className="font-bold text-muted-text">35</span></div>
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q5</span> <span className="font-bold text-muted-text">62</span></div>
          <div className="p-1.5 border border-border/60 text-center"><span className="text-muted-text block text-[10px]">Q6</span> <span className="font-bold text-muted-text">19</span></div>
          <div className="p-1.5 border border-primary-accent/50 bg-primary-accent/10 text-center col-span-2 sm:col-span-1">
            <span className="text-primary-accent block text-[9px] font-bold">FINAL:</span>
            <span className="font-bold text-primary-accent text-[11px]">247108356219</span>
          </div>
        </div>

        {/* Current Team Assembly Grid */}
        <div className="space-y-3 pt-2">
          <div className="text-[11px] text-muted-text uppercase tracking-wider flex justify-between">
            <span>YOUR ASSEMBLED KEY:</span>
            <span>LENGTH: {combinedCode.length} / 12 DIGITS</span>
          </div>

          <div className="grid grid-cols-6 gap-2 bg-surface-dark p-3 border border-border text-center">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="flex flex-col">
                <span className="text-[10px] text-muted-text">Q0{n}</span>
                <span className="text-sm sm:text-base font-bold text-primary-accent">
                  {digitInputs[n] ? digitInputs[n] : '--'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <input
                type="text"
                maxLength={12}
                value={combinedCode}
                onChange={handleCombinedCodeChange}
                placeholder="247108356219"
                className="w-full bg-background border-2 border-border focus:border-primary-accent p-3 text-center text-lg sm:text-xl tracking-widest font-mono text-primary-accent placeholder:text-muted-text/30"
              />
            </div>

            {submissionError && (
              <div className="p-3 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || combinedCode.length !== 12}
              className="w-full py-3.5 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'OFFICIALLY VERIFYING KEY...' : 'SUBMIT 12-DIGIT UNLOCK CODE'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* OPTIONAL EDITOR (Clearly labeled as optional tool) */}
      <MonacoOrFallbackEditor
        title="OPTIONAL SCRATCHPAD / COMPILER"
        language="cpp"
        initialCode={`// CODE//LOCK — ROUND 01 SCRATCHPAD
// You may use this editor or any offline compiler/IDE installed on your system.
#include <iostream>
using namespace std;

int main() {
    // Solve and output your 2-digit answer:
    cout << "Ready" << endl;
    return 0;
}`}
      />
    </div>
  );
}
