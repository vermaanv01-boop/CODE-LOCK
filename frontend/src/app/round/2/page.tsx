'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundQuestions, submitRoundCode, getContestStatus, storage } from '@/lib/api';
import { MonacoOrFallbackEditor } from '@/components/MonacoOrFallbackEditor';
import { 
  Bug, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Code2, 
  Info,
  Send,
  Lock,
  FileCode
} from 'lucide-react';

export default function Round2Page() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({
    1: '', 2: ''
  });
  const [combinedCode, setCombinedCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentTeam = storage.getTeam();
    if (!currentTeam) {
      router.push('/contest');
      return;
    }
    setTeam(currentTeam);

    getContestStatus().then(statusRes => {
      if (statusRes.status !== 'ACTIVE' && statusRes.status !== 'COMPLETED') {
        router.push('/contest');
        return;
      }

      getRoundQuestions(2, currentTeam.teamNumber)
        .then(res => {
          setQuestions(res.questions || []);
        })
        .catch(err => {
          if (err.data?.error === 'ROUND_LOCKED') {
            // Team hasn't completed round 1 yet!
            router.push('/round/1');
          }
        })
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [router]);

  const handleDigitChange = (qNum: number, val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 3);
    const updated = { ...digitInputs, [qNum]: cleaned };
    setDigitInputs(updated);
    const fullCode = [1, 2].map(n => updated[n] || '').join('');
    setCombinedCode(fullCode);
  };

  const handleCombinedCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCombinedCode(cleaned);

    if (cleaned.length === 6) {
      setDigitInputs({
        1: cleaned.slice(0, 3),
        2: cleaned.slice(3, 6)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (combinedCode.length !== 6) {
      setSubmissionError('The Round 02 unlock code must be exactly 6 numeric digits (2 questions x 3 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(2, team.teamNumber, combinedCode);
      if (res.success || res.completed) {
        router.push('/round/2/dashboard');
      }
    } catch (err: any) {
      // SECURITY: Generic error only
      setSubmissionError(err.message || 'Verification failed. The unlock code entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-muted-text">
        [INITIALIZING ROUND 02 DEBUGGING LOCK GATEWAY...]
      </div>
    );
  }

  const currentQ = questions[activeQuestionIdx];

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Top Banner */}
      <div className="border border-border bg-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-warning uppercase tracking-widest mb-0.5">
            <Bug className="w-3.5 h-3.5 text-warning" />
            <span>SECONDARY PROTOCOL GATE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
            ROUND 02 — DEBUGGING LOCK
          </h1>
          <div className="text-xs text-warning mt-0.5 font-bold">
            2 DEBUGGING QUESTIONS / 3 DIGITS EACH
          </div>
        </div>

        <div className="p-3 bg-[#11110F] border border-border text-right text-xs">
          <div className="text-[10px] text-muted-text uppercase">STATION</div>
          <div className="font-bold text-primary-accent">{team?.teamNumber}</div>
          <div className="text-[11px] font-sans text-muted-text truncate max-w-[150px]">{team?.teamName}</div>
        </div>
      </div>

      {/* Mandatory Instruction Box */}
      <div className="border border-border bg-[#141412] p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-warning font-bold uppercase text-[11px]">
          <Info className="w-3.5 h-3.5" />
          <span>OFFICIAL DEBUGGING UNLOCK INSTRUCTIONS</span>
        </div>
        <p className="text-primary-text font-sans leading-relaxed">
          Solve both debugging questions. Each produces a 3-digit answer. Combine <strong className="text-warning font-mono font-normal">Q1 → Q2</strong> to create the final 6-digit unlock code.
        </p>
        <div className="bg-[#0E0E0C] p-2.5 border border-border/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-text">
          <span>EXAMPLE: Q1 = 381, Q2 = 724</span>
          <span className="text-warning font-bold">FINAL CODE: 381724</span>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="grid grid-cols-2 border border-border bg-surface text-center text-xs">
        {questions.map((q, idx) => {
          const isSelected = activeQuestionIdx === idx;
          return (
            <button
              key={q.questionNumber}
              onClick={() => setActiveQuestionIdx(idx)}
              className={`py-3.5 px-4 border-r border-border last:border-r-0 transition-colors flex items-center justify-center gap-3 ${
                isSelected
                  ? 'bg-[#11110F] text-warning border-b-2 border-b-warning font-bold'
                  : 'hover:bg-surface-highlight text-muted-text'
              }`}
            >
              <Bug className="w-4 h-4" />
              <span>DEBUG TASK 0{q.questionNumber}: {q.content.title}</span>
              <span className="text-[11px]">
                {digitInputs[q.questionNumber] ? `[${digitInputs[q.questionNumber]}]` : '[---]'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Broken Code Details + Optional Editor */}
      {currentQ && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question Details Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="border border-border bg-surface p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-warning text-background text-[10px] font-bold">
                    DEBUG 0{currentQ.questionNumber}
                  </span>
                  <h2 className="text-lg font-bold text-primary-text font-sans">
                    {currentQ.content.title}
                  </h2>
                </div>
                <span className="text-[10px] text-muted-text border border-border px-1.5 py-0.5">
                  OUTPUT: 3 DIGITS
                </span>
              </div>

              {/* Problem Statement */}
              <div className="space-y-2">
                <div className="text-[11px] text-warning uppercase tracking-wider font-bold">
                  DEFECT DESCRIPTION
                </div>
                <p className="font-sans text-xs text-primary-text/90 leading-relaxed whitespace-pre-line">
                  {currentQ.content.problemStatement}
                </p>
              </div>

              {/* Broken Code Block */}
              {currentQ.content.starterCode && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-text">
                    <span className="flex items-center gap-1.5 text-warning">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>INTENTIONALLY BROKEN SOURCE CODE ({currentQ.content.language?.toUpperCase() || 'C++'})</span>
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(currentQ.content.starterCode)}
                      className="hover:text-primary-text underline text-[10px]"
                    >
                      Copy Broken Code
                    </button>
                  </div>
                  <pre className="p-4 bg-[#0D0D0B] border border-border text-xs text-primary-text overflow-x-auto leading-relaxed select-text font-mono">
                    <code>{currentQ.content.starterCode}</code>
                  </pre>
                </div>
              )}

              {/* Input / Target Output Description */}
              <div className="p-3 bg-[#11110F] border border-border space-y-1">
                <div className="text-[10px] text-muted-text uppercase tracking-wider">EXECUTION PAYLOAD</div>
                <div className="text-xs text-primary-text font-sans">
                  {currentQ.content.inputDescription}
                </div>
              </div>

              {/* Answer Input */}
              <div className="p-4 bg-[#141412] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-primary-text">
                    TASK {currentQ.questionNumber} FIX CHECKSUM (3 DIGITS)
                  </div>
                  <div className="text-[10px] text-muted-text font-sans">
                    Run the fixed code locally to obtain the exact 3-digit output.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    value={digitInputs[currentQ.questionNumber] || ''}
                    onChange={(e) => handleDigitChange(currentQ.questionNumber, e.target.value)}
                    placeholder="000"
                    className="w-20 text-center text-lg font-bold bg-[#11110F] border border-warning/60 text-warning p-1.5 focus:outline-none focus:border-warning"
                  />
                  {activeQuestionIdx === 0 && (
                    <button
                      onClick={() => setActiveQuestionIdx(1)}
                      className="px-3 py-2 border border-border text-xs text-muted-text hover:text-primary-text"
                    >
                      Task 02 →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Master 6-Digit Submit Console & Optional Editor */}
          <div className="lg:col-span-5 space-y-6">
            {/* Master 6-Digit Code Submission Box */}
            <div className="border-2 border-border bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-text">
                  <Key className="w-4 h-4 text-warning" />
                  <span>SUPPORTER UNLOCK TERMINAL</span>
                </div>
                <span className="text-[10px] text-muted-text">ROUND 02 LOCK</span>
              </div>

              <p className="text-xs text-muted-text font-sans leading-relaxed">
                Supporter enters the combined 6-digit code (Q1 3-digits + Q2 3-digits).
              </p>

              {/* 2 Digit Slots visual preview */}
              <div className="grid grid-cols-2 gap-2 bg-[#11110F] p-3 border border-border text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-text">Q01 (3 DIGITS)</span>
                  <span className="text-base font-bold text-warning">
                    {digitInputs[1] ? digitInputs[1] : '---'}
                  </span>
                </div>
                <div className="flex flex-col border-l border-border/60">
                  <span className="text-[10px] text-muted-text">Q02 (3 DIGITS)</span>
                  <span className="text-base font-bold text-warning">
                    {digitInputs[2] ? digitInputs[2] : '---'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-text uppercase block">
                    6-DIGIT COMBINED UNLOCK CODE
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={combinedCode}
                    onChange={handleCombinedCodeChange}
                    placeholder="e.g. 381724"
                    className="w-full bg-[#11110F] border border-border p-3 text-center text-xl tracking-widest font-mono text-warning placeholder:text-muted-text/30 focus:outline-none focus:border-warning"
                  />
                  <div className="flex justify-between text-[10px] text-muted-text px-1">
                    <span>LENGTH: {combinedCode.length} / 6</span>
                    <span>FORMAT: NUMERIC</span>
                  </div>
                </div>

                {submissionError && (
                  <div className="p-3 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submissionError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || combinedCode.length !== 6}
                  className="w-full py-3 bg-warning text-background font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'VALIDATING WITH SERVER...' : 'SUBMIT 6-DIGIT UNLOCK CODE'}</span>
                </button>
              </form>
            </div>

            {/* Optional Editor Component with current starter code */}
            <MonacoOrFallbackEditor
              title="DEBUGGING WORKBENCH"
              language={currentQ.content.language || 'cpp'}
              initialCode={currentQ.content.starterCode || '// Paste broken code here to test fixes'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
