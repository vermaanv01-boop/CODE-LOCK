'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getContestStatus, storage } from '@/lib/api';

export type ContestStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | string;
export type RoundLifecycleStatus = 'LOCKED' | 'READY' | 'ACTIVE' | 'COMPLETED' | string;

export interface RoundState {
  status: RoundLifecycleStatus;
  startedAt: number | null;
}

export type RoundMap = Record<1 | 2 | 3, RoundState>;

const DEFAULT_ROUNDS: RoundMap = {
  1: { status: 'LOCKED', startedAt: null },
  2: { status: 'LOCKED', startedAt: null },
  3: { status: 'LOCKED', startedAt: null },
};

interface ContestStatusContextType {
  status: ContestStatus;
  contestStartTime: number | null;
  /** Authoritative elapsed time since server start, in ms (0 when unknown). */
  elapsedMs: number;
  /** HH:MM:SS derived from elapsedMs, or placeholder before start. */
  elapsedLabel: string;
  /** Independent lifecycle state for each round. */
  rounds: RoundMap;
  /** Bumped whenever the team session in localStorage may have changed. */
  teamRevision: number;
  refreshTeam: () => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ContestStatusContext = createContext<ContestStatusContextType>({
  status: 'NOT_STARTED',
  contestStartTime: null,
  elapsedMs: 0,
  elapsedLabel: '--:--:--',
  rounds: DEFAULT_ROUNDS,
  teamRevision: 0,
  refreshTeam: () => {},
  loading: true,
  refresh: async () => {},
});

const POLL_MS = 8000;

function formatHms(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export const ContestStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ContestStatus>('NOT_STARTED');
  const [contestStartTime, setContestStartTime] = useState<number | null>(null);
  const [rounds, setRounds] = useState<RoundMap>(DEFAULT_ROUNDS);
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(true);
  const [teamRevision, setTeamRevision] = useState<number>(0);
  const startRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getContestStatus();
      setStatus(res.status);
      if (res.contestStartTime) {
        startRef.current = res.contestStartTime;
        setContestStartTime(res.contestStartTime);
      }
      setRounds({
        1: { status: res.round1Status || 'LOCKED', startedAt: res.round1StartedAt ?? null },
        2: { status: res.round2Status || 'LOCKED', startedAt: res.round2StartedAt ?? null },
        3: { status: res.round3Status || 'LOCKED', startedAt: res.round3StartedAt ?? null },
      });
    } catch {
      // Keep last known status on transient failure.
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTeam = useCallback(() => setTeamRevision((r) => r + 1), []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, POLL_MS);
    return () => clearInterval(poll);
  }, [refresh]);

  // Isolated 1s clock tick, driven by the server start timestamp only.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Track team session changes made by other modules (login/logout/advance).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'codelock_team') setTeamRevision((r) => r + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const start = startRef.current ?? contestStartTime;
  const elapsedMs = start ? Math.max(0, now - start) : 0;
  const elapsedLabel = start ? formatHms(elapsedMs) : '--:--:--';

  return (
    <ContestStatusContext.Provider
      value={{
        status,
        contestStartTime: start,
        elapsedMs,
        elapsedLabel,
        rounds,
        teamRevision,
        refreshTeam,
        loading,
        refresh,
      }}
    >
      {children}
    </ContestStatusContext.Provider>
  );
};

export const useContestStatus = () => useContext(ContestStatusContext);
