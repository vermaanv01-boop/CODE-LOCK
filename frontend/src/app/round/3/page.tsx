'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundQuestions, submitRoundCode, getContestStatus, storage } from '@/lib/api';
import { MonacoOrFallbackEditor } from '@/components/MonacoOrFallbackEditor';
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
  Sparkles
} from 'lucide-react';

export default function Round3Page() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [masterCode, setMasterCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Optional role fragment inputs for squad coordination
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

    getContestStatus().then(statusRes => {
      if (statusRes.status !== 'ACTIVE' && statusRes.status !== 'COMPLETED') {
        router.push('/contest');
        return;
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
  }, [router]);

  // Auto-compose master code from role fragments if typed
  const updateFragment = (key: 'thinker' | 'coder' | 'debugger', val: string) => {
    const updated = { ...roleFragments, [key]: val.trim().toUpperCase() };
    setRoleFragments(updated);
    // Combine: Thinker + Coder + Debugger + Salt
    const combined = `${updated.thinker}${updated.coder}${updated.debugger}${updated.salt}`;
    setMasterCode(combined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    if (!masterCode.trim()) {
      setSubmissionError('Please enter the Master Unlock Code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRoundCode(3, team.teamNumber, masterCode.trim());
      if (res.success || res.completed) {
        // Nav to Final Dashboard!
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
      <div className="py-20 text-center font-mono text-xs text-muted-text">
        [INITIALIZING THE FINAL LOCK COLLABORATION MATRIX...]
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Top Banner - High stakes Final Lock styling */}
      <div className="border-2 border-primary-accent bg-[#151512] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-primary-accent uppercase tracking-widest mb-0.5">
            <ShieldAlert className="w-4 h-4 text-primary-accent animate-pulse" />
            <span>TERMINAL PROTOCOL GATE / FINAL LOCK</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-text tracking-tight">
            ROUND 03 — SYNCHRONIZED RECONSTRUCTION
          </h1>
          <div className="text-xs text-primary-accent mt-1 font-bold">
            TEAM LOGIC / CODE EXTRACTION / RECONSTRUCTION CHALLENGE
          </div>
        </div>

        <div className="p-3 bg-[#11110F] border border-border text-right text-xs">
          <div className="text-[10px] text-muted-text uppercase">STATION</div>
          <div className="font-bold text-primary-accent">{team?.teamNumber}</div>
          <div className="text-[11px] font-sans text-muted-text truncate max-w-[150px]">{team?.teamName}</div>
        </div>
      </div>

      {/* Main Challenge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Challenge Dossier & Role Matrix */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-border bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-accent text-background text-[10px] font-bold">
                  MASTER SPEC
                </span>
                <h2 className="text-lg font-bold text-primary-text font-sans">
                  {question?.content.title || 'The Core Reactor Lock'}
                </h2>
              </div>
              <span className="text-[10px] text-primary-accent border border-primary-accent/40 px-2 py-0.5 uppercase">
                4-ROLE SYNCHRONIZATION
              </span>
            </div>

            {/* Problem Statement */}
            <div className="space-y-2">
              <div className="text-[11px] text-primary-accent uppercase tracking-wider font-bold">
                COLLABORATIVE LOGIC SPECIFICATION
              </div>
              <p className="font-sans text-xs text-primary-text/90 leading-relaxed whitespace-pre-line">
                {question?.content.problemStatement}
              </p>
            </div>

            {/* 4 Role Shard Breakdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Thinker Shard */}
              <div className="p-3 bg-[#11110F] border border-border space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-primary-accent font-bold uppercase">THINKER SHARD</span>
                  <span className="text-muted-text">ROLE 01</span>
                </div>
                <div className="text-xs text-muted-text font-sans">
                  Decodes matrix shift pattern modulus 7.
                </div>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-text">OUTPUT (1 DIGIT):</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={roleFragments.thinker}
                    onChange={(e) => updateFragment('thinker', e.target.value)}
                    placeholder="3"
                    className="w-12 text-center bg-[#151512] border border-border text-primary-accent font-bold p-1 focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              {/* Coder Shard */}
              <div className="p-3 bg-[#11110F] border border-border space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-primary-accent font-bold uppercase">CODER SHARD</span>
                  <span className="text-muted-text">ROLE 02</span>
                </div>
                <div className="text-xs text-muted-text font-sans">
                  Rotates binary key left by 3 and XORs with 0xAA.
                </div>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-text">OUTPUT (1 DIGIT):</span>
                  <input
                    type="text"
                    maxLength={1}
                    value={roleFragments.coder}
                    onChange={(e) => updateFragment('coder', e.target.value)}
                    placeholder="9"
                    className="w-12 text-center bg-[#151512] border border-border text-primary-accent font-bold p-1 focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              {/* Debugger Shard */}
              <div className="p-3 bg-[#11110F] border border-border space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-primary-accent font-bold uppercase">DEBUGGER SHARD</span>
                  <span className="text-muted-text">ROLE 03</span>
                </div>
                <div className="text-xs text-muted-text font-sans">
                  Repairs corrupted parity checksum in trace #409.
                </div>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-text">OUTPUT (2 DIGITS):</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={roleFragments.debugger}
                    onChange={(e) => updateFragment('debugger', e.target.value)}
                    placeholder="07"
                    className="w-14 text-center bg-[#151512] border border-border text-primary-accent font-bold p-1 focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              {/* Supporter Assembly */}
              <div className="p-3 bg-[#11110F] border border-border space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-primary-accent font-bold uppercase">SUPPORTER ASSEMBLY</span>
                  <span className="text-muted-text">ROLE 04</span>
                </div>
                <div className="text-xs text-muted-text font-sans">
                  Concatenates in strict sequence with SALT &quot;42&quot;.
                </div>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-text">CONTROL SALT:</span>
                  <span className="font-bold text-muted-text px-2 py-1 bg-[#151512] border border-border">
                    42
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Master Submission Console & Optional Editor */}
        <div className="lg:col-span-5 space-y-6">
          {/* Master Final Unlock Box */}
          <div className="border-2 border-primary-accent bg-surface p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-text">
                <Key className="w-4 h-4 text-primary-accent" />
                <span>FINAL MASTER UNLOCK TERMINAL</span>
              </div>
              <span className="text-[10px] text-primary-accent font-bold">GATE 03</span>
            </div>

            <p className="text-xs text-muted-text font-sans leading-relaxed">
              Once the 4 specialists have aligned their results, enter the Master Unlock Sequence below to complete the CODE//LOCK competition.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-text uppercase block">
                  MASTER UNLOCK SEQUENCE
                </label>
                <input
                  type="text"
                  value={masterCode}
                  onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 390742"
                  className="w-full bg-[#11110F] border-2 border-primary-accent/80 p-3 text-center text-2xl tracking-widest font-mono text-primary-accent placeholder:text-muted-text/30 focus:outline-none focus:border-primary-accent"
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
                className="w-full py-4 bg-primary-accent text-background font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
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
