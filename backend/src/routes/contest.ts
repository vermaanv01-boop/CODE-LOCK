import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { RoundNumber } from '@shared/types';

export const contestRouter = Router();

function toMs(value: any): number | null {
  return value ? new Date(value).getTime() : null;
}

// Get Contest Status & Official Server Time (public)
contestRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const contest = await dataStore.refreshRoundLifecycle();
    const now = Date.now();
    const startTimeMs = toMs(contest.contestStartTime);
    const elapsedMs = (contest.status === 'ACTIVE' && startTimeMs) ? Math.max(0, now - startTimeMs) : 0;

    return res.json({
      status: contest.status,
      serverTime: now,
      contestStartTime: startTimeMs,
      contestEndTime: toMs(contest.contestEndTime),
      elapsedMs,
      round1Status: contest.round1Status,
      round2Status: contest.round2Status,
      round3Status: contest.round3Status,
      round1StartedAt: toMs(contest.round1StartedAt),
      round2StartedAt: toMs(contest.round2StartedAt),
      round3StartedAt: toMs(contest.round3StartedAt)
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve contest status' });
  }
});

/**
 * Admin: Start a specific round. Enforces the LOCKED -> READY -> ACTIVE
 * lifecycle on the backend. Idempotent when the round is already ACTIVE.
 */
contestRouter.post('/round/:round/start', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const roundParam = Array.isArray(req.params.round) ? req.params.round[0] : req.params.round;
    const roundNum = parseInt(roundParam || '', 10) as RoundNumber;
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const result = await dataStore.startRound(roundNum);

    if (!result.ok) {
      const messages: Record<string, string> = {
        ROUND_LOCKED: `Round 0${roundNum} is locked. Its prerequisites are not yet satisfied.`,
        ROUND_COMPLETED: `Round 0${roundNum} is already completed and cannot be restarted.`,
        CONFLICT: `A concurrent activation of Round 0${roundNum} was detected. Re-read the current state.`
      };
      return res.status(409).json({
        error: result.reason || 'ROUND_NOT_ACTIVATABLE',
        message: messages[result.reason || ''] || `Round 0${roundNum} cannot be started.`,
        contest: result.contest
      });
    }

    // Starting Round 1 also opens the contest and moves registered teams into Round 1.
    if (roundNum === 1 && !result.alreadyActive) {
      const teams = await dataStore.getAllTeams();
      for (const team of teams) {
        if (team.status === 'REGISTERED') {
          const teamId = (team._id || team.id).toString();
          await dataStore.updateTeamRound(teamId, 1, 'IN_ROUND_1');
        }
      }
      console.log(`[CONTEST] Round 1 started by admin ${req.admin?.username} at ${result.contest?.round1StartedAt}`);
    } else {
      console.log(`[CONTEST] Round ${roundNum} ${result.alreadyActive ? 'already active' : 'started'} by admin ${req.admin?.username}`);
    }

    const contest = result.contest;
    return res.json({
      message: result.alreadyActive
        ? `Round 0${roundNum} is already active.`
        : `Round 0${roundNum} started successfully.`,
      alreadyActive: !!result.alreadyActive,
      contest: {
        status: contest.status,
        contestStartTime: toMs(contest.contestStartTime),
        round1Status: contest.round1Status,
        round2Status: contest.round2Status,
        round3Status: contest.round3Status,
        round1StartedAt: toMs(contest.round1StartedAt),
        round2StartedAt: toMs(contest.round2StartedAt),
        round3StartedAt: toMs(contest.round3StartedAt)
      }
    });
  } catch (err: any) {
    console.error('[Contest] Start round error:', err);
    return res.status(500).json({ error: 'Failed to start round' });
  }
});

/**
 * Legacy admin endpoint retained for API compatibility. Starting the contest
 * is equivalent to starting Round 1.
 */
contestRouter.post('/start', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await dataStore.startRound(1);
    if (!result.ok) {
      return res.status(409).json({
        error: result.reason || 'ROUND_NOT_ACTIVATABLE',
        message: 'Contest cannot be started from its current state.'
      });
    }

    if (!result.alreadyActive) {
      const teams = await dataStore.getAllTeams();
      for (const team of teams) {
        if (team.status === 'REGISTERED') {
          const teamId = (team._id || team.id).toString();
          await dataStore.updateTeamRound(teamId, 1, 'IN_ROUND_1');
        }
      }
    }

    const contest = result.contest;
    return res.json({
      message: result.alreadyActive ? 'Contest is already active' : 'Contest started successfully',
      alreadyActive: !!result.alreadyActive,
      contest: {
        status: contest.status,
        contestStartTime: toMs(contest.contestStartTime),
        round1Status: contest.round1Status,
        round1StartedAt: toMs(contest.round1StartedAt)
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
