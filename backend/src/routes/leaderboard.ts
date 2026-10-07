import { Router, Request, Response } from 'express';
import { calculateLeaderboard } from '../services/leaderboard.js';
import { dataStore } from '../services/store.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const leaderboardRouter = Router();

// Public Leaderboard
leaderboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    const contest = await dataStore.getContest();
    const leaderboard = await calculateLeaderboard();
    const now = Date.now();
    const startTimeMs = contest.contestStartTime ? new Date(contest.contestStartTime).getTime() : null;

    return res.json({
      contestStatus: contest.status,
      contestStartTime: startTimeMs,
      serverTime: now,
      leaderboard
    });
  } catch (err: any) {
    console.error('[Leaderboard] Error:', err);
    return res.status(500).json({ error: 'Failed to generate leaderboard' });
  }
});

// Admin Leaderboard & System Stats
leaderboardRouter.get('/admin', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contest = await dataStore.getContest();
    const leaderboard = await calculateLeaderboard();
    const teams = await dataStore.getAllTeams();
    const now = Date.now();
    const startTimeMs = contest.contestStartTime ? new Date(contest.contestStartTime).getTime() : null;

    const stats = {
      contestStatus: contest.status,
      serverTime: now,
      contestStartTime: startTimeMs,
      registeredTeamsCount: teams.length,
      activeTeamsCount: teams.filter(t => t.status !== 'REGISTERED' && t.status !== 'FINISHED').length,
      completedTeamsCount: teams.filter(t => t.status === 'FINISHED').length,
      teamsByRound: {
        round1: teams.filter(t => t.currentRound === 1).length,
        round2: teams.filter(t => t.currentRound === 2).length,
        round3: teams.filter(t => t.currentRound === 3).length,
        finished: teams.filter(t => t.status === 'FINISHED').length
      }
    };

    return res.json({
      stats,
      contest,
      leaderboard
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate admin leaderboard' });
  }
});
