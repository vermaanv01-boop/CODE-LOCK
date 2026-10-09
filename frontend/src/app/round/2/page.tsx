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
  FileCode,
  Clock,
  ArrowRight,
  ShieldAlert
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
  const [serverTimeStr, setServerTimeStr] = useState<string>('00:00:00');

  useEffect(() => {
    const currentTeam = storage.getTeam();
    if (!currentTeam) {
      router.push('/contest');
      return;
    }
    setTeam(currentTeam);

    let startTime: number | null = null;

    getContestStatus().then(statusRes => {
      if (statusRes.status !== 'ACTIVE' && statusRes.status !== 'COMPLETED') {
        router.push('/contest');
        return;
      }
      if (statusRes.contestStartTime) {
        startTime = statusRes.contestStartTime;
      }

      getRoundQuestions(2, currentTeam.teamNumber)
        .then(res => {
          setQuestions(res.questions || []);
        })
        .catch(err => {
          if (err.data?.error === 'ROUND_LOCKED') {
            router.push('/round/1');
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      setSubmissionError(err.message || 'Verification failed. The unlock code entered is incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [INITIALIZING ROUND 02 DEBUGGING LOCK GATEWAY...]
      </div>
    );
  }

  const currentQ = questions[activeQuestionIdx];

  // Render broken code with line numbers
  const renderBrokenCode = (code: string) => {
    if (!code) return null;
    const lines = code.split('\n');
    return (
      <div className="bg-background border border-border p-3 overflow-x-auto text-xs font-mono select-text">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isBugLine = line.includes('BUG') || line.includes('// BUG') || line.includes('# BUG');
              return (
                <tr key={idx} className={isBugLine ? 'bg-warning/10' : ''}>
                  <td className="pr-3 text-right text-muted-text/60 select-none border-r border-border/40 w-10 text-[11px]">
                    {lineNum}
                  </td>
                  <td className="pl-3 font-mono whitespace-pre text-primary-text leading-relaxed">
                    {line}
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
    <div className="space-y-6 select-none font-mono">
      {/* Header: ROUND 02 | DEBUGGING LOCK | TELEMETRY */}
      <div className="border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="text-[10px] text-warning tracking-widest uppercase font-bold flex items-center gap-1.5 mb-1">
              <Bug className="w-3.5 h-3.5" />
              <span>ROUND 02</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              DEBUGGING LOCK
            </h1>
          </div>

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
                <Clock className="w-2.5 h-2.5 text-warning" />
                <span>SERVER TIME</span>
              </div>
              <div className="font-bold text-warning text-sm mt-0.5">{serverTimeStr}</div>
            </div>
          </div>
        </div>

        {/* Task Selection Navigation */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] text-muted-text uppercase tracking-wider font-semibold">
            DEBUGGING CONSOLE TASKS:
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-auto w-full">
            {questions.map((q, idx) => {
              const isSelected = activeQuestionIdx === idx;
              const val = digitInputs[q.questionNumber];
              return (
                <button
                  key={q.questionNumber}
                  onClick={() => setActiveQuestionIdx(idx)}
                  className={`py-2 px-4 border text-center transition-colors flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-warning text-background border-warning font-bold'
                      : 'bg-background text-muted-text border-border hover:text-primary-text'
                  }`}
                >
                  <span className="text-xs">QUESTION 0{q.questionNumber}</span>
                  <span className="text-[11px]">
                    {val ? `[${val}]` : '[---]'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Debugging Terminal / Question Sheet */}
      {currentQ && (
        <div className="border border-border bg-surface p-5 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-border pb-4 gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-warning font-bold">
                DEBUGGING TARGET / 0{currentQ.questionNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-text font-sans">
                QUESTION 0{currentQ.questionNumber}: {currentQ.content.title}
              </h2>
            </div>
            <span className="text-[10px] text-muted-text border border-border px-2 py-1 bg-surface-dark w-fit">
              OUTPUT REQUIREMENT: 3-DIGIT NUMERIC
            </span>
          </div>

          {/* Defect Description */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-warning uppercase tracking-wider">
              DEFECT ANALYSIS
            </div>
            <p className="font-sans text-xs sm:text-sm text-primary-text leading-relaxed whitespace-pre-line bg-background p-4 border border-border">
              {currentQ.content.problemStatement}
            </p>
          </div>

          {/* BROKEN CODE (Line numbers, formatted code block) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-muted-text uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-warning">
                <FileCode className="w-3.5 h-3.5" />
                <span>BROKEN CODE ({currentQ.content.language?.toUpperCase() || 'SOURCE'})</span>
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(currentQ.content.starterCode)}
                className="text-[10px] hover:text-primary-text text-muted-text underline font-normal"
              >
                Copy to Clipboard
              </button>
            </div>
            {renderBrokenCode(currentQ.content.starterCode)}
          </div>

          {/* EXECUTION PAYLOAD */}
          {currentQ.content.inputDescription && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                EXECUTION PAYLOAD
              </div>
              <div className="p-3 bg-surface-dark border border-border text-xs text-primary-text font-mono">
                {currentQ.content.inputDescription}
              </div>
            </div>
          )}

          {/* Current Question Answer Box */}
          <div className="p-4 sm:p-5 bg-surface-dark border-2 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-primary-text uppercase tracking-wider">
                QUESTION 0{currentQ.questionNumber} OUTPUT (3 DIGITS)
              </div>
              <div className="text-[11px] text-muted-text font-sans">
                Run the repaired implementation to extract the verified 3-digit checksum.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                maxLength={3}
                value={digitInputs[currentQ.questionNumber] || ''}
                onChange={(e) => handleDigitChange(currentQ.questionNumber, e.target.value)}
                placeholder="000"
                className="w-24 text-center text-xl font-bold bg-background border-2 border-warning/80 text-warning p-2 focus:outline-none focus:border-warning font-mono"
              />

              {activeQuestionIdx === 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveQuestionIdx(1)}
                  className="px-4 py-2.5 bg-surface border border-border hover:border-warning text-xs font-mono text-primary-text hover:text-warning flex items-center gap-1"
                >
                  <span>NEXT (TASK 02)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('r2-code-generation-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-warning text-background text-xs font-mono font-bold flex items-center gap-1"
                >
                  <span>REVIEW CODE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROUND 2 CODE GENERATION INSTRUCTION PANEL */}
      <div id="r2-code-generation-panel" className="border-2 border-border bg-surface p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-bold text-primary-text uppercase tracking-wider">
              ROUND 02 CODE GENERATION
            </h3>
          </div>
          <span className="text-[10px] text-warning border border-warning/40 px-2 py-0.5 uppercase">
            6-DIGIT PROTOCOL
          </span>
        </div>

        <p className="text-xs text-primary-text font-sans leading-relaxed">
          Each debugging question produces a 3-digit answer. Combine <strong className="text-warning font-mono font-normal">Q1 → Q2</strong> to create the final 6-digit unlock code.
        </p>

        {/* Clear Example Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-background p-3 border border-border text-xs font-mono">
          <div className="p-2 border border-border/60 text-center">
            <span className="text-muted-text block text-[10px]">Q1</span>
            <span className="font-bold text-muted-text">381</span>
          </div>
          <div className="p-2 border border-border/60 text-center">
            <span className="text-muted-text block text-[10px]">Q2</span>
            <span className="font-bold text-muted-text">724</span>
          </div>
          <div className="p-2 border border-warning/50 bg-warning/10 text-center">
            <span className="text-warning block text-[9px] font-bold">FINAL:</span>
            <span className="font-bold text-warning text-sm">381724</span>
          </div>
        </div>

        {/* Combined 6-Digit Submission Box */}
        <div className="space-y-3 pt-2">
          <div className="text-[11px] text-muted-text uppercase tracking-wider flex justify-between">
            <span>YOUR ASSEMBLED KEY:</span>
            <span>LENGTH: {combinedCode.length} / 6 DIGITS</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-surface-dark p-3 border border-border text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-text">Q01 (3 DIGITS)</span>
              <span className="text-base sm:text-lg font-bold text-warning">
                {digitInputs[1] ? digitInputs[1] : '---'}
              </span>
            </div>
            <div className="flex flex-col border-l border-border/60">
              <span className="text-[10px] text-muted-text">Q02 (3 DIGITS)</span>
              <span className="text-base sm:text-lg font-bold text-warning">
                {digitInputs[2] ? digitInputs[2] : '---'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={combinedCode}
                onChange={handleCombinedCodeChange}
                placeholder="381724"
                className="w-full bg-background border-2 border-border focus:border-warning p-3 text-center text-xl tracking-widest font-mono text-warning placeholder:text-muted-text/30"
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
              disabled={isSubmitting || combinedCode.length !== 6}
              className="w-full py-3.5 bg-warning text-background font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'VALIDATING REPAIRED GATE...' : 'SUBMIT 6-DIGIT UNLOCK CODE'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* OPTIONAL EDITOR */}
      <MonacoOrFallbackEditor
        title="OPTIONAL DEBUGGING WORKBENCH"
        language={currentQ?.content.language || 'cpp'}
        initialCode={currentQ?.content.starterCode || '// Paste broken code here to test fixes'}
      />
    </div>
  );
}
