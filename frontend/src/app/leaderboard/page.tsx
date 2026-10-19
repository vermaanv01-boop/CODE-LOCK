'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboard, storage } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { BackButton } from '@/components/BackButton';
import { StatusBadge } from '@/components/ui';
import { Trophy, Search, RefreshCw } from 'lucide-react';

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [contestStatus, setContestStatus] = useState<string>('NOT_STARTED');
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchScoreboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setContestStatus(res.contestStatus);
    } catch (e) {
      // keep last standings on transient failure
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setCurrentTeam(storage.getTeam());
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = leaderboard.filter((e) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      e.teamNumber.toLowerCase().includes(q) || e.teamName.toLowerCase().includes(q)
    );
  });

  const finished = leaderboard.filter((e) => e.status === 'FINISHED').length;
  const stage23 = leaderboard.filter((e) => e.currentRound > 1).length;
  const stage1 = leaderboard.filter((e) => e.currentRound === 1 && e.status !== 'FINISHED').length;

  return (
    <div className="space-y-6">
      <div>
        <BackButton href="/" label="HOME PORTAL" />
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-md border border-border bg-surface p-5 sm:p-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-text">
            <Trophy className="h-3.5 w-3.5 text-primary-accent" aria-hidden="true" />
            Official contest scoreboard
          </div>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-primary-text sm:text-3xl">
            CODE<span className="text-muted-text">//</span>LOCK Scoreboard
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-text">
            <StatusBadge status={contestStatus} />
            <span>Synchronized across LAN</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-text"
              aria-hidden="true"
            />
            <label htmlFor="lb-search" className="sr-only">
              Search teams
            </label>
            <input
              id="lb-search"
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search team number or name…"
              className="w-56 rounded border border-border bg-background py-2 pl-8 pr-3 text-xs text-primary-text placeholder:text-muted-text/50 focus:border-primary-accent focus:outline-none sm:w-64"
            />
          </div>

          <button
            onClick={fetchScoreboard}
            className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-2 text-xs text-muted-text hover:border-primary-accent hover:text-primary-accent"
            title="Refresh now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
            Total squads
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-primary-text">
            {leaderboard.length}
          </div>
        </div>
        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
            Finished
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-success">{finished}</div>
        </div>
        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
            Stage 02 / 03
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-warning">{stage23}</div>
        </div>
        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-text">
            Stage 01
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-primary-text">{stage1}</div>
        </div>
      </div>

      {/* Table */}
      <LeaderboardTable
        entries={filtered}
        highlightTeamNumber={currentTeam?.teamNumber}
        showRoundBreakdown={true}
      />
    </div>
  );
}
