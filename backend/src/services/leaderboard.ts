import { dataStore } from './store.js';
import { LeaderboardEntry, RoundNumber } from '@shared/types';

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined || ms < 0) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export async function calculateLeaderboard(): Promise<LeaderboardEntry[]> {
  const teams = await dataStore.getAllTeams();
  const contest = await dataStore.getContest();
  const contestStartTime = contest.contestStartTime ? new Date(contest.contestStartTime).getTime() : null;
  const completions = await dataStore.getAllRoundCompletions();

  // Map completions by teamId
  const completionMap = new Map<string, { r1?: any; r2?: any; r3?: any }>();
  for (const c of completions) {
    const tId = (c.teamId?._id || c.teamId || '').toString();
    if (!completionMap.has(tId)) {
      completionMap.set(tId, {});
    }
    const entry = completionMap.get(tId)!;
    if (c.round === 1) entry.r1 = c;
    if (c.round === 2) entry.r2 = c;
    if (c.round === 3) entry.r3 = c;
  }

  const entries: Array<Omit<LeaderboardEntry, 'rank'>> = teams.map(team => {
    const tId = (team._id || team.id || '').toString();
    const comp = completionMap.get(tId) || {};

    const r1TimeMs = comp.r1 ? comp.r1.elapsedTimeMs : null;
    const r2TimeMs = comp.r2 ? comp.r2.elapsedTimeMs : null;
    const r3TimeMs = comp.r3 ? comp.r3.elapsedTimeMs : null;

    let totalTimeMs: number | null = null;
    let lastSolvedAt: number | null = null;

    if (comp.r3) {
      totalTimeMs = comp.r3.elapsedTimeMs;
      lastSolvedAt = new Date(comp.r3.completedAt).getTime();
    } else if (comp.r2) {
      totalTimeMs = comp.r2.elapsedTimeMs;
      lastSolvedAt = new Date(comp.r2.completedAt).getTime();
    } else if (comp.r1) {
      totalTimeMs = comp.r1.elapsedTimeMs;
      lastSolvedAt = new Date(comp.r1.completedAt).getTime();
    }

    return {
      teamId: tId,
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      currentRound: team.currentRound,
      status: team.status,
      round1TimeMs: r1TimeMs,
      round2TimeMs: r2TimeMs,
      round3TimeMs: r3TimeMs,
      totalTimeMs: totalTimeMs,
      formattedRound1Time: formatDuration(r1TimeMs),
      formattedRound2Time: formatDuration(r2TimeMs),
      formattedRound3Time: formatDuration(r3TimeMs),
      formattedTotalTime: formatDuration(totalTimeMs),
      lastSolvedAt: lastSolvedAt
    };
  });

  // Ranking logic:
  // 1. Teams that finished Round 3 come first, sorted by totalTimeMs ascending.
  // 2. Teams that finished Round 2 come next, sorted by totalTimeMs ascending.
  // 3. Teams that finished Round 1 come next, sorted by totalTimeMs ascending.
  // 4. Teams currently in Round 1/active, sorted by registration/team number.
  function getScoreWeight(entry: Omit<LeaderboardEntry, 'rank'>): number {
    if (entry.status === 'FINISHED' || entry.round3TimeMs !== null) return 4;
    if (entry.status === 'ROUND_2_COMPLETE' || entry.currentRound === 3 || entry.round2TimeMs !== null) return 3;
    if (entry.status === 'ROUND_1_COMPLETE' || entry.currentRound === 2 || entry.round1TimeMs !== null) return 2;
    if (entry.status === 'IN_ROUND_1') return 1;
    return 0;
  }

  entries.sort((a, b) => {
    const weightA = getScoreWeight(a);
    const weightB = getScoreWeight(b);

    if (weightA !== weightB) {
      return weightB - weightA; // higher progress first
    }

    // If both have completed the same round and have a time:
    if (a.totalTimeMs !== null && b.totalTimeMs !== null) {
      return a.totalTimeMs - b.totalTimeMs; // lower time first
    }
    if (a.totalTimeMs !== null) return -1;
    if (b.totalTimeMs !== null) return 1;

    // Tie-breaker: team number
    return a.teamNumber.localeCompare(b.teamNumber);
  });

  return entries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1
  }));
}
