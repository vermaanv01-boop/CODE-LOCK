'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getContestStatus, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  ShieldCheck,
  Brain,
  Code2,
  Bug,
  Key
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [contestStatus, setContestStatus] = useState<string>('NOT_STARTED');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successTeam, setSuccessTeam] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    teamNumber: '',
    teamName: '',
    teamLeader: '',
    thinker: '',
    coder: '',
    debugger: '',
    supporter: ''
  });

  useEffect(() => {
    getContestStatus().then(res => {
      setContestStatus(res.status);
      if (res.status !== 'NOT_STARTED') {
        setIsLocked(true);
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamNumber' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      !formData.teamNumber.trim() ||
      !formData.teamName.trim() ||
      !formData.teamLeader.trim() ||
      !formData.thinker.trim() ||
      !formData.coder.trim() ||
      !formData.debugger.trim() ||
      !formData.supporter.trim()
    ) {
      setErrorMessage('All official fields must be completed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest('/teams/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      storage.setTeam(res.team);
      setSuccessTeam(res.team);
    } catch (err: any) {
      if (err.data?.error === 'REGISTRATION_LOCKED') {
        setIsLocked(true);
      }
      setErrorMessage(err.message || 'Registration failed. Check organizer constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="max-w-xl mx-auto my-12 border border-border bg-surface p-8 font-mono select-none text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-warning/15 border border-warning text-warning mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-primary-text">REGISTRATION LOCKED</h2>
        <p className="text-xs text-muted-text font-sans max-w-md mx-auto leading-relaxed">
          The contest has already commenced (Status: <span className="text-warning font-bold">{contestStatus}</span>).
          New squad registrations are closed. Connect using your pre-assigned team identifier.
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/contest"
            className="px-5 py-2.5 bg-primary-accent text-primary-accent-contrast text-xs font-bold uppercase tracking-wider"
          >
            Go to Team Login →
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 border border-border text-xs text-muted-text hover:text-primary-text"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (successTeam) {
    return (
      <div className="max-w-2xl mx-auto my-8 border-2 border-primary-accent bg-surface p-6 sm:p-10 font-mono select-none space-y-6 shadow-md">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="text-[10px] text-muted-text tracking-widest uppercase">REGISTRATION SHEET PROCESSED</div>
            <h2 className="text-2xl font-bold text-primary-accent mt-1">OFFICIAL SQUAD DOSSIER</h2>
          </div>
          <VerifiedStamp label="REGISTERED ✓" size="md" />
        </div>

        <div className="bg-background border border-border p-4 space-y-3">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-xs text-muted-text">OFFICIAL TEAM IDENTIFIER:</span>
            <span className="text-lg font-bold text-primary-accent">{successTeam.teamNumber}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-xs text-muted-text">TEAM NAME:</span>
            <span className="text-sm font-sans text-primary-text font-semibold">{successTeam.teamName}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-xs text-muted-text">TEAM LEADER:</span>
            <span className="text-sm font-sans text-primary-text">{successTeam.teamLeader}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
            <div><span className="text-muted-text font-bold">THINKER:</span> {successTeam.thinker}</div>
            <div><span className="text-muted-text font-bold">CODER:</span> {successTeam.coder}</div>
            <div><span className="text-muted-text font-bold">DEBUGGER:</span> {successTeam.debugger}</div>
            <div><span className="text-muted-text font-bold">SUPPORTER:</span> {successTeam.supporter}</div>
          </div>
        </div>

        <p className="text-xs text-muted-text font-sans">
          Your credentials are saved on this workstation. Proceed to the contest lobby and wait for the official organizer start signal.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => router.push('/contest')}
            className="px-6 py-2.5 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90"
          >
            <span>PROCEED TO CONTEST LOBBY</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-2 sm:my-6 select-none font-mono">
      {/* Clean Editorial Technical Registration Form */}
      <div className="border border-border bg-surface p-5 sm:p-10 shadow-sm relative">
        {/* Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-border pb-6 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-text tracking-widest uppercase mb-1">
              <FileText className="w-3.5 h-3.5 text-primary-accent" />
              <span>OFFICIAL REGISTRATION PROTOCOL</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-text leading-none">
              CODE//LOCK
            </h1>
            <div className="text-xs tracking-widest text-primary-accent mt-1.5 uppercase font-bold">
              TEAM REGISTRATION / 2026
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
            <span className="text-[10px] text-muted-text border border-border px-2 py-1 inline-block bg-surface-highlight">
              TECHNICAL EVENT FORM
            </span>
            <div className="text-[10px] text-muted-text/80 mt-1">
              STATUS: PRE-CONTEST ADMISSION
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 01: Team Identification */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-primary-accent uppercase tracking-wider border-b border-border pb-1 flex justify-between items-center">
              <span>01. SQUAD IDENTIFICATION</span>
              <span className="text-[10px] text-muted-text font-normal">REQUIRED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-muted-text uppercase block mb-1">
                  TEAM NUMBER <span className="text-primary-accent">*</span>
                </label>
                <input
                  type="text"
                  name="teamNumber"
                  value={formData.teamNumber}
                  onChange={handleChange}
                  placeholder="e.g. T-027"
                  required
                  className="w-full bg-background border border-border p-2.5 text-sm font-mono text-primary-text uppercase placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
                <span className="text-[10px] text-muted-text block mt-1">
                  Organizer-assigned unique ID.
                </span>
              </div>

              <div>
                <label className="text-[11px] text-muted-text uppercase block mb-1">
                  TEAM NAME <span className="text-primary-accent">*</span>
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="e.g. BYTE RAIDERS"
                  required
                  className="w-full bg-background border border-border p-2.5 text-sm font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
                <span className="text-[10px] text-muted-text block mt-1">
                  Official name displayed on scoreboard.
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted-text uppercase block mb-1">
                TEAM LEADER <span className="text-primary-accent">*</span>
              </label>
              <input
                type="text"
                name="teamLeader"
                value={formData.teamLeader}
                onChange={handleChange}
                placeholder="Full name of designated squad captain"
                required
                className="w-full bg-background border border-border p-2.5 text-sm font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
              />
            </div>
          </div>

          {/* Section 02: Role Assignment */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-primary-accent uppercase tracking-wider border-b border-border pb-1 flex justify-between items-center">
              <span>02. ROLE ASSIGNMENT</span>
              <span className="text-[10px] text-muted-text font-normal">4 SPECIALISTS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* THINKER */}
              <div className="p-3 bg-surface-dark border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-text">
                    <Brain className="w-3.5 h-3.5 text-primary-accent" />
                    <span>THINKER</span>
                  </div>
                  <span className="text-[9px] text-muted-text uppercase border border-border px-1 bg-surface">
                    ROLE 01
                  </span>
                </div>
                <p className="text-[11px] font-sans text-muted-text leading-tight">
                  Formulates mathematical and algorithmic logic from the problem sheets.
                </p>
                <input
                  type="text"
                  name="thinker"
                  value={formData.thinker}
                  onChange={handleChange}
                  placeholder="Participant name"
                  required
                  className="w-full bg-background border border-border p-2 text-xs font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
              </div>

              {/* CODER */}
              <div className="p-3 bg-surface-dark border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-text">
                    <Code2 className="w-3.5 h-3.5 text-primary-accent" />
                    <span>CODER</span>
                  </div>
                  <span className="text-[9px] text-muted-text uppercase border border-border px-1 bg-surface">
                    ROLE 02
                  </span>
                </div>
                <p className="text-[11px] font-sans text-muted-text leading-tight">
                  Implements algorithmic logic in code based on the Thinker&apos;s analysis.
                </p>
                <input
                  type="text"
                  name="coder"
                  value={formData.coder}
                  onChange={handleChange}
                  placeholder="Participant name"
                  required
                  className="w-full bg-background border border-border p-2 text-xs font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
              </div>

              {/* DEBUGGER */}
              <div className="p-3 bg-surface-dark border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
                    <Bug className="w-3.5 h-3.5 text-warning" />
                    <span className="text-primary-text">DEBUGGER</span>
                  </div>
                  <span className="text-[9px] text-muted-text uppercase border border-border px-1 bg-surface">
                    ROLE 03
                  </span>
                </div>
                <p className="text-[11px] font-sans text-muted-text leading-tight">
                  Diagnoses pointer slips, runtime errors, and broken interval comparators.
                </p>
                <input
                  type="text"
                  name="debugger"
                  value={formData.debugger}
                  onChange={handleChange}
                  placeholder="Participant name"
                  required
                  className="w-full bg-background border border-border p-2 text-xs font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
              </div>

              {/* SUPPORTER */}
              <div className="p-3 bg-surface-dark border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-text">
                    <Key className="w-3.5 h-3.5 text-primary-accent" />
                    <span>SUPPORTER</span>
                  </div>
                  <span className="text-[9px] text-muted-text uppercase border border-border px-1 bg-surface">
                    ROLE 04
                  </span>
                </div>
                <p className="text-[11px] font-sans text-muted-text leading-tight">
                  Controls code assembly, ordering, and official portal submissions.
                </p>
                <input
                  type="text"
                  name="supporter"
                  value={formData.supporter}
                  onChange={handleChange}
                  placeholder="Participant name"
                  required
                  className="w-full bg-background border border-border p-2 text-xs font-sans text-primary-text placeholder:text-muted-text/40 focus:outline-none focus:border-primary-accent"
                />
              </div>
            </div>
          </div>

          {/* Verification & Submission */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-[11px] text-muted-text font-sans">
              * By submitting this form, the team confirms role specialization for the competition.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'ENROLLING SQUAD...' : 'SUBMIT REGISTRATION SHEET'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
