import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

export const contestRouter = Router();

// Get Contest Status & Official Server Time
contestRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const contest = await dataStore.getContest();
    const now = Date.now();
    const startTimeMs = contest.contestStartTime ? new Date(contest.contestStartTime).getTime() : null;
    const elapsedMs = (contest.status === 'ACTIVE' && startTimeMs) ? Math.max(0, now - startTimeMs) : 0;

    return res.json({
      status: contest.status,
      serverTime: now,
      contestStartTime: startTimeMs,
      contestEndTime: contest.contestEndTime ? new Date(contest.contestEndTime).getTime() : null,
      elapsedMs,
      round1Status: contest.round1Status,
      round2Status: contest.round2Status,
      round3Status: contest.round3Status
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve contest status' });
  }
});

// Admin: Start Contest
contestRouter.post('/start', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contest = await dataStore.getContest();
    if (contest.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Contest is already active' });
    }

    const updated = await dataStore.startContest();
    
    // Also transition all REGISTERED teams to IN_ROUND_1
    const teams = await dataStore.getAllTeams();
    for (const team of teams) {
      const teamId = (team._id || team.id).toString();
      await dataStore.updateTeamRound(teamId, 1, 'IN_ROUND_1');
    }

    console.log(`[CONTEST] Started by admin ${req.admin?.username} at ${updated.contestStartTime}`);

    return res.json({
      message: 'Contest started successfully',
      contest: {
        status: updated.status,
        contestStartTime: new Date(updated.contestStartTime).getTime(),
        round1Status: updated.round1Status
      }
    });
  } catch (err: any) {
    console.error('[Contest] Start error:', err);
    return res.status(500).json({ error: 'Failed to start contest' });
  }
});

// Admin: Reset Contest (for test/re-run in local event)
contestRouter.post('/reset', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const resetResult = await dataStore.resetContest();
    console.log(`[CONTEST] Reset by admin ${req.admin?.username}`);
    return res.json({
      message: 'Contest reset to NOT_STARTED state',
      contest: resetResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset contest' });
  }
});
