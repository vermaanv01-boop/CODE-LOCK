'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboard, storage } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Trophy, Clock, Search, RefreshCw, Radio } from 'lucide-react';

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [contestStatus, setContestStatus] = useState<string>('NOT_STARTED');
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [currentTeam, setCurrentTeam] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchScoreboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await getLeaderboard();
      setLeaderboard(res.leaderboard || []);
      setContestStatus(res.contestStatus);
      if (res.serverTime) setServerTime(res.serverTime);
    } catch (e) {
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

  const filtered = leaderboard.filter(e => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      e.teamNumber.toLowerCase().includes(q) ||
      e.teamName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Header bar */}
      <div className="border border-border bg-surface p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-muted-text uppercase tracking-widest mb-1">
            <Trophy className="w-3.5 h-3.5 text-primary-accent" />
            <span>OFFICIAL CONTEST SCOREBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight uppercase">
            CODE//LOCK SCOREBOARD
          </h1>
          <div className="text-xs text-muted-text mt-1">
            STATUS: <span className="text-primary-accent font-bold uppercase">{contestStatus}</span> • SYNCHRONIZED ACROSS LAN
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-text absolute left-3 top-3" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search team number or name..."
              className="bg-background border border-border pl-8 pr-3 py-2 text-xs font-mono text-primary-text placeholder:text-muted-text/50 focus:outline-none focus:border-primary-accent w-56 sm:w-64"
            />
          </div>

          <button
            onClick={fetchScoreboard}
            className="p-2 border border-border hover:border-primary-accent text-muted-text hover:text-primary-accent transition-colors flex items-center gap-1.5 text-xs bg-surface"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
        </div>
      </div>

      {/* Summary Micro Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-surface border border-border flex justify-between items-center shadow-sm">
          <span className="text-muted-text text-[10px] uppercase font-semibold">TOTAL SQUADS:</span>
          <span className="font-bold text-primary-text text-sm">{leaderboard.length}</span>
        </div>
        <div className="p-3 bg-surface border border-border flex justify-between items-center shadow-sm">
          <span className="text-muted-text text-[10px] uppercase font-semibold">FINISHED:</span>
          <span className="font-bold text-primary-accent text-sm">
            {leaderboard.filter(e => e.status === 'FINISHED').length}
          </span>
        </div>
        <div className="p-3 bg-surface border border-border flex justify-between items-center shadow-sm">
          <span className="text-muted-text text-[10px] uppercase font-semibold">STAGE 02 / 03:</span>
          <span className="font-bold text-warning text-sm">
            {leaderboard.filter(e => e.currentRound > 1).length}
          </span>
        </div>
        <div className="p-3 bg-surface border border-border flex justify-between items-center shadow-sm">
          <span className="text-muted-text text-[10px] uppercase font-semibold">STAGE 01:</span>
          <span className="font-bold text-primary-text text-sm">
            {leaderboard.filter(e => e.currentRound === 1 && e.status !== 'FINISHED').length}
          </span>
        </div>
      </div>

      {/* Scoreboard Table */}
      <LeaderboardTable
        entries={filtered}
        highlightTeamNumber={currentTeam?.teamNumber}
        showRoundBreakdown={true}
      />
    </div>
  );
}
