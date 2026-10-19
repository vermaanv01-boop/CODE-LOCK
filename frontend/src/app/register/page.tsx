'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, getContestStatus, storage } from '@/lib/api';
import { BackButton } from '@/components/BackButton';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { AlertCircle, ArrowRight, Lock, Brain, Code2, Bug, Key } from 'lucide-react';

const ROLES = [
  {
    name: 'thinker',
    label: 'Thinker',
    roleNo: 'Role 01',
    icon: Brain,
    tint: 'bg-accent-blue',
    description: 'Formulates the mathematical and algorithmic logic from the problem sheets.',
  },
  {
    name: 'coder',
    label: 'Coder',
    roleNo: 'Role 02',
    icon: Code2,
    tint: 'bg-accent-green',
    description: 'Implements the Thinker’s analysis in working code.',
  },
  {
    name: 'debugger',
    label: 'Debugger',
    roleNo: 'Role 03',
    icon: Bug,
    tint: 'bg-accent-pink',
    description: 'Diagnoses pointer slips, runtime errors, and broken comparators.',
  },
  {
    name: 'supporter',
    label: 'Supporter',
    roleNo: 'Role 04',
    icon: Key,
    tint: 'bg-accent-yellow',
    description: 'Controls code assembly, ordering, and official submissions.',
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [contestStatus, setContestStatus] = useState<string>('NOT_STARTED');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successTeam, setSuccessTeam] = useState<any>(null);

  const [formData, setFormData] = useState({
    teamNumber: '',
    teamName: '',
    teamLeader: '',
    thinker: '',
    coder: '',
    debugger: '',
    supporter: '',
  });

  useEffect(() => {
    getContestStatus()
      .then((res) => {
        setContestStatus(res.status);
        if (res.status !== 'NOT_STARTED') setIsLocked(true);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'teamNumber' ? value.toUpperCase() : value,
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
        body: JSON.stringify(formData),
      });
      storage.setTeam(res.team);
      if (res.token) storage.setTeamToken(res.token);
      setSuccessTeam(res.team);
    } catch (err: any) {
      if (err.data?.error === 'REGISTRATION_LOCKED') setIsLocked(true);
      setErrorMessage(err.message || 'Registration failed. Check organizer constraints.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="mx-auto my-12 max-w-xl space-y-4">
        <div>
          <BackButton href="/" label="HOME PORTAL" />
        </div>
        <div className="rounded-md border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-warning/40 bg-accent-yellow/30 text-warning">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-primary-text">Registration locked</h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-text">
          The contest has already commenced (status{' '}
          <span className="font-semibold text-warning">{contestStatus}</span>). New squad
          registrations are closed. Connect using your pre-assigned team identifier.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded bg-primary-accent px-5 py-2.5 text-xs font-semibold text-primary-accent-contrast"
          >
            Go to team login →
          </Link>
          <Link
            href="/"
            className="rounded border border-border px-5 py-2.5 text-xs text-muted-text hover:text-primary-text"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

  if (successTeam) {
    return (
      <div className="mx-auto my-8 max-w-2xl space-y-4">
        <div>
          <BackButton href="/" label="HOME PORTAL" />
        </div>
        <div className="rounded-md border border-border bg-surface p-6 sm:p-10">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
              Registration sheet processed
            </div>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-primary-accent">
              Official squad dossier
            </h1>
          </div>
          <VerifiedStamp label="Registered" size="md" />
        </div>

        <dl className="mt-6 divide-y divide-border rounded-md border border-border bg-surface-highlight px-4">
          <div className="flex items-center justify-between py-3">
            <dt className="text-xs text-muted-text">Team identifier</dt>
            <dd className="font-mono text-lg font-semibold text-primary-accent">
              {successTeam.teamNumber}
            </dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-xs text-muted-text">Team name</dt>
            <dd className="text-sm font-semibold text-primary-text">{successTeam.teamName}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-xs text-muted-text">Team leader</dt>
            <dd className="text-sm text-primary-text">{successTeam.teamLeader}</dd>
          </div>
        </dl>

        <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          {[
            ['Thinker', successTeam.thinker],
            ['Coder', successTeam.coder],
            ['Debugger', successTeam.debugger],
            ['Supporter', successTeam.supporter],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-border bg-background px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-text">
                {label}
              </span>
              <div className="text-sm text-primary-text">{value}</div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-text">
          Your credentials are saved on this workstation. Proceed to the contest lobby and wait for
          the organizer&apos;s start signal.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => router.push('/contest')}
            className="flex items-center gap-2 rounded bg-primary-accent px-6 py-2.5 text-xs font-semibold text-primary-accent-contrast hover:opacity-90"
          >
            Proceed to contest lobby
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="mx-auto my-2 max-w-3xl space-y-4 sm:my-6">
      <div>
        <BackButton href="/" label="HOME PORTAL" />
      </div>
      <div className="rounded-md border border-border bg-surface p-5 sm:p-10">
        {/* Editorial header */}
        <div className="mb-6 flex flex-col justify-between border-b-2 border-border pb-6 sm:flex-row sm:items-start">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
              Official registration protocol
            </div>
            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
              CODE<span className="text-muted-text">//</span>LOCK
            </h1>
            <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-warning">
              Team registration · 2026
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3 text-left sm:mt-0 sm:border-t-0 sm:pt-0 sm:text-right">
            <span className="inline-block rounded-sm border border-border bg-surface-highlight px-2 py-1 text-[10px] text-muted-text">
              Technical event form
            </span>
            <div className="mt-1 text-[10px] text-muted-text">Status · Pre-contest admission</div>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 rounded border border-error/40 bg-error/10 p-3 text-xs text-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 01 */}
          <fieldset className="space-y-3">
            <legend className="flex w-full items-center justify-between border-b border-border pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-accent">
              <span>01 · Squad identification</span>
              <span className="text-[10px] font-normal text-muted-text">Required</span>
            </legend>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="teamNumber" className="mb-1 block text-[11px] uppercase text-muted-text">
                  Team number <span className="text-primary-accent">*</span>
                </label>
                <input
                  id="teamNumber"
                  type="text"
                  name="teamNumber"
                  value={formData.teamNumber}
                  onChange={handleChange}
                  placeholder="e.g. T-027"
                  required
                  className="w-full rounded border border-border bg-background p-2.5 font-mono text-sm uppercase text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
                />
                <span className="mt-1 block text-[10px] text-muted-text">
                  Organizer-assigned unique ID.
                </span>
              </div>

              <div>
                <label htmlFor="teamName" className="mb-1 block text-[11px] uppercase text-muted-text">
                  Team name <span className="text-primary-accent">*</span>
                </label>
                <input
                  id="teamName"
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="e.g. BYTE RAIDERS"
                  required
                  className="w-full rounded border border-border bg-background p-2.5 text-sm text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
                />
                <span className="mt-1 block text-[10px] text-muted-text">
                  Official name shown on the scoreboard.
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="teamLeader" className="mb-1 block text-[11px] uppercase text-muted-text">
                Team leader <span className="text-primary-accent">*</span>
              </label>
              <input
                id="teamLeader"
                type="text"
                name="teamLeader"
                value={formData.teamLeader}
                onChange={handleChange}
                placeholder="Full name of the designated squad captain"
                required
                className="w-full rounded border border-border bg-background p-2.5 text-sm text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
              />
            </div>
          </fieldset>

          {/* Section 02 */}
          <fieldset className="space-y-3 pt-2">
            <legend className="flex w-full items-center justify-between border-b border-border pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-accent">
              <span>02 · Role assignment</span>
              <span className="text-[10px] font-normal text-muted-text">4 specialists</span>
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <div key={role.name} className="overflow-hidden rounded-md border border-border">
                    <div className={`flex items-center justify-between px-3 py-1.5 ${role.tint}`}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-accent">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {role.label}
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-primary-accent/80">
                        {role.roleNo}
                      </span>
                    </div>
                    <div className="space-y-2 bg-surface p-3">
                      <p className="text-[11px] leading-snug text-muted-text">{role.description}</p>
                      <input
                        id={role.name}
                        type="text"
                        name={role.name}
                        value={formData[role.name as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder="Participant name"
                        required
                        aria-label={`${role.label} participant name`}
                        className="w-full rounded border border-border bg-background p-2 text-xs text-primary-text placeholder:text-muted-text/40 focus:border-primary-accent focus:outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* Submission */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p className="text-[11px] text-muted-text">
              By submitting this form, the team confirms role specialization for the competition.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary-accent px-8 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? 'Enrolling squad…' : 'Submit registration sheet'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
