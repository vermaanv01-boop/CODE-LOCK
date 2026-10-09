'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundQuestions, submitRoundCode, getContestStatus, storage } from '@/lib/api';
import { MonacoOrFallbackEditor } from '@/components/MonacoOrFallbackEditor';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { 
  ShieldAlert, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Send, 
  Lock, 
  Users,
  Cpu,
  Layers,
  Sparkles,
  Clock,
  Radio
} from 'lucide-react';

export default function Round3Page() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [masterCode, setMasterCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [serverTimeStr, setServerTimeStr] = useState<string>('00:00:00');

  // Role fragment inputs for squad coordination
  const [roleFragments, setRoleFragments] = useState({
    thinker: '',
    coder: '',
    debugger: '',
    salt: '42'
  });

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

      getRoundQuestions(3, currentTeam.teamNumber)
        .then(res => {
          if (res.questions && res.questions.length > 0) {
            setQuestion(res.questions[0]);
          }
        })
        .catch(err => {
          if (err.data?.error === 'ROUND_LOCKED') {
            router.push('/round/2');
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

  // Auto-compose master code from role fragments
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
      setSubmissionError(err.message || 'Verification failed. The final unlock code is rejected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [INITIALIZING THE FINAL LOCK COLLABORATION MATRIX...]
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-mono">
      {/* FINAL LOCK Banner - Distinct Physical Event Aesthetic */}
      <div className="border-2 border-primary-accent bg-surface p-6 sm:p-8 relative shadow-md">
        {/* Technical Markings */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-text border-b border-border pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary-accent font-bold">[GATE-03 // TERMINAL SPECIFICATION]</span>
            <span className="text-border">|</span>
            <span>PARITY: RIGID</span>
            <span className="text-border">|</span>
            <span>RECONSTRUCTION: SYNCHRONIZED</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-text">STATION:</span>
            <span className="font-bold text-primary-accent">{team?.teamNumber}</span>
            <span className="text-border">|</span>
            <Clock className="w-3 h-3 text-primary-accent" />
            <span className="font-bold text-primary-text">{serverTimeStr}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary-accent font-bold mb-1">
              STAGE 03 / TERMINAL CONFRONTATION
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary-text leading-none uppercase">
              FINAL LOCK
            </h1>
            <p className="text-xs sm:text-sm text-muted-text font-sans max-w-xl mt-2 leading-relaxed">
              Multi-role cryptographic extraction. All four specialists must contribute their verified fragments to assemble the master completion sequence.
            </p>
          </div>

          <div className="shrink-0">
            <VerifiedStamp label="STAGE 03 READY" size="md" />
          </div>
        </div>
      </div>

      {/* Main Challenge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clue / Logic Panels */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-border bg-surface p-5 sm:p-7 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-accent text-primary-accent-contrast text-[10px] font-bold">
                  MASTER SPEC
                </span>
                <h2 className="text-lg font-bold text-primary-text font-sans">
                  {question?.content.title || 'The Core Reactor Lock: Synchronized Extraction'}
                </h2>
              </div>
              <span className="text-[10px] text-muted-text border border-border px-2 py-0.5">
                4-ROLE SYNCHRONIZATION
              </span>
            </div>

            {/* Problem Specification */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-primary-accent uppercase tracking-wider">
                CHALLENGE DOSSIER
              </div>
              <p className="font-sans text-xs text-primary-text leading-relaxed whitespace-pre-line bg-background p-4 border border-border">
                {question?.content.problemStatement}
              </p>
            </div>

            {/* 4 Role Fragment Input Shards */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-muted-text uppercase tracking-wider">
                ROLE SUB-KEY SHARDS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* THINKER */}
                <div className="p-3 bg-surface-dark border border-border space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-primary-accent font-bold uppercase">THINKER SHARD</span>
                    <span className="text-muted-text border border-border px-1 bg-surface">ROLE 01</span>
                  </div>
                  <div className="text-xs text-muted-text font-sans">
                    Cipher matrix shift pattern modulus 7.
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-text font-semibold">1 DIGIT:</span>
                    <input
                      type="text"
                      maxLength={1}
                      value={roleFragments.thinker}
                      onChange={(e) => updateFragment('thinker', e.target.value)}
                      placeholder="3"
                      className="w-12 text-center bg-background border border-border text-primary-accent font-bold p-1 focus:outline-none focus:border-primary-accent"
                    />
                  </div>
                </div>

                {/* CODER */}
                <div className="p-3 bg-surface-dark border border-border space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-primary-accent font-bold uppercase">CODER SHARD</span>
                    <span className="text-muted-text border border-border px-1 bg-surface">ROLE 02</span>
                  </div>
                  <div className="text-xs text-muted-text font-sans">
                    Binary key left-shift 3, XOR 0xAA.
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-text font-semibold">1 DIGIT:</span>
                    <input
                      type="text"
                      maxLength={1}
                      value={roleFragments.coder}
                      onChange={(e) => updateFragment('coder', e.target.value)}
                      placeholder="9"
                      className="w-12 text-center bg-background border border-border text-primary-accent font-bold p-1 focus:outline-none focus:border-primary-accent"
                    />
                  </div>
                </div>

                {/* DEBUGGER */}
                <div className="p-3 bg-surface-dark border border-border space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-warning font-bold uppercase">DEBUGGER SHARD</span>
                    <span className="text-muted-text border border-border px-1 bg-surface">ROLE 03</span>
                  </div>
                  <div className="text-xs text-muted-text font-sans">
                    Repaired parity checksum trace #409.
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-text font-semibold">2 DIGITS:</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={roleFragments.debugger}
                      onChange={(e) => updateFragment('debugger', e.target.value)}
                      placeholder="07"
                      className="w-14 text-center bg-background border border-border text-warning font-bold p-1 focus:outline-none focus:border-warning"
                    />
                  </div>
                </div>

                {/* SUPPORTER */}
                <div className="p-3 bg-surface-dark border border-border space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-primary-accent font-bold uppercase">SUPPORTER ASSEMBLY</span>
                    <span className="text-muted-text border border-border px-1 bg-surface">ROLE 04</span>
                  </div>
                  <div className="text-xs text-muted-text font-sans">
                    Strict sequence concatenation + Salt.
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-muted-text font-semibold">CONTROL SALT:</span>
                    <span className="font-bold text-primary-accent px-2 py-0.5 bg-background border border-border text-xs">
                      42
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Final Answer Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-2 border-primary-accent bg-surface p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-text">
                <Key className="w-4 h-4 text-primary-accent" />
                <span>FINAL MASTER UNLOCK TERMINAL</span>
              </div>
              <span className="text-[10px] text-primary-accent font-bold border border-primary-accent/40 px-1.5 py-0.2">
                GATE 03
              </span>
            </div>

            <p className="text-xs text-muted-text font-sans leading-relaxed">
              Assemble the four team fragments in strict order:
              <br />
              <strong className="text-primary-text font-mono text-[11px]">THINKER (1) + CODER (1) + DEBUGGER (2) + SALT &quot;42&quot;</strong>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-text uppercase block font-semibold">
                  MASTER UNLOCK SEQUENCE (6 CHARACTERS)
                </label>
                <input
                  type="text"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
                  placeholder="390742"
                  className="w-full bg-background border-2 border-primary-accent p-3.5 text-center text-2xl tracking-widest font-mono text-primary-accent placeholder:text-muted-text/30 focus:outline-none"
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
                disabled={isSubmitting || !masterCode.trim()}
                className="w-full py-4 bg-primary-accent text-primary-accent-contrast font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'OFFICIALLY VERIFYING WITH SERVER...' : 'TRANSMIT FINAL UNLOCK SEQUENCE'}</span>
              </button>
            </form>
          </div>

          {/* Optional Scratchpad */}
          <MonacoOrFallbackEditor
            title="ROUND 03 EXTRACTION SCRATCHPAD"
            language="python"
            initialCode={`# ROUND 03 — FINAL RECONSTRUCTION SCRATCHPAD
# Coordinate role fragments:
# Thinker: cipher shift pattern
# Coder: binary permutation transform
# Debugger: parity checksum
# Supporter: sequence synthesis

print("Collaboration station active")`}
          />
        </div>
      </div>
    </div>
  );
}
