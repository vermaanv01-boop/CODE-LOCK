import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { calculateLeaderboard } from '../services/leaderboard.js';
import { RoundNumber } from '@shared/types';
import { requireTeam, AuthRequest } from '../middleware/auth.js';

export const roundsRouter = Router();

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

function roundStatusOf(contest: any, round: RoundNumber): string {
  return contest[`round${round}Status`] || 'LOCKED';
}

function roundStartOf(contest: any, round: RoundNumber): number | null {
  const raw = contest[`round${round}StartedAt`];
  return raw ? new Date(raw).getTime() : null;
}

/**
 * Round eligibility is derived from server-side completion records — never
 * from a client-invoked "advance" action. A squad has access to Round N when it
 * has already completed Round N-1 (Round 1 is always reachable).
 */
async function canAccessRound(teamId: string, team: any, roundNum: RoundNumber): Promise<boolean> {
  if (roundNum === 1) return true;
  if (team.currentRound >= roundNum) return true;
  const previous = (roundNum - 1) as RoundNumber;
  const cleared = await dataStore.getRoundCompletion(teamId, previous);
  return !!cleared;
}

// GET questions for a round (authenticated, lifecycle + progression guarded)
roundsRouter.get('/:round', requireTeam, async (req: AuthRequest, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const contest = await dataStore.getContest();
    const roundStatus = roundStatusOf(contest, roundNum);
    if (roundStatus !== 'ACTIVE' && roundStatus !== 'COMPLETED') {
      return res.status(403).json({
        error: 'ROUND_NOT_ACTIVE',
        message: `Round 0${roundNum} has not been started by the organizer yet.`,
        roundStatus
      });
    }

    const team = await dataStore.getTeamByNumber(req.authenticatedTeamNumber || '');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Enforce round eligibility from authoritative completion records.
    const teamId = (team._id || team.id).toString();
    if (!(await canAccessRound(teamId, team, roundNum))) {
      return res.status(403).json({
        error: 'ROUND_LOCKED',
        message: `Round ${roundNum} is locked. Complete Round ${roundNum - 1} first.`,
        currentRound: team.currentRound
      });
    }

    const questions = await dataStore.getQuestionsByRound(roundNum, true);
    return res.json({
      round: roundNum,
      roundStatus,
      startedAt: roundStartOf(contest, roundNum),
      questions
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve round questions' });
  }
});

// SUBMIT full round unlock code
roundsRouter.post('/:round/submit', requireTeam, async (req: AuthRequest, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Unlock code is required' });
    }

    // Authoritative identity from the verified team token.
    const teamNumber = req.authenticatedTeamNumber || '';
    const team = await dataStore.getTeamByNumber(teamNumber);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const teamId = (team._id || team.id).toString();

    // Route Guard: verify team is eligible to submit this round
    if (!(await canAccessRound(teamId, team, roundNum))) {
      return res.status(403).json({
        error: 'ROUND_LOCKED',
        message: `Round ${roundNum} is locked. Complete Round ${roundNum - 1} first.`
      });
    }

    // Already completed? Return the frozen original record (immutable).
    const existingComp = await dataStore.getRoundCompletion(teamId, roundNum);
    if (existingComp) {
      return res.json({
        success: true,
        message: `Round 0${roundNum} already unlocked and verified.`,
        round: roundNum,
        completed: true,
        completionTimeMs: existingComp.elapsedTimeMs,
        formattedCompletionTime: formatDuration(existingComp.elapsedTimeMs)
      });
    }

    const contest = await dataStore.getContest();
    const roundStatus = roundStatusOf(contest, roundNum);
    if (roundStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: roundStatus === 'COMPLETED' ? 'ROUND_CLOSED' : 'ROUND_NOT_ACTIVE',
        message: `Round 0${roundNum} is not currently active.`,
        roundStatus
      });
    }

    // Official per-round server time. The start timestamp is persisted by the
    // administrator activation; client clocks are never trusted.
    const roundStartMs = roundStartOf(contest, roundNum);
    if (!roundStartMs) {
      return res.status(403).json({
        error: 'ROUND_NOT_STARTED',
        message: `Round 0${roundNum} has no authoritative start timestamp.`
      });
    }
    const now = Date.now();
    const durationMs = Math.max(0, now - roundStartMs);

    // Fetch the official expected code for this round
    const expectedCode = await dataStore.getRoundCombinedCode(roundNum);
    const cleanedSubmission = code.toString().trim().replace(/\s+/g, '');

    const isMatch = cleanedSubmission === expectedCode;

    // Record submission attempt
    await dataStore.recordSubmission({
      teamId,
      round: roundNum,
      answer: cleanedSubmission,
      correct: isMatch
    });

    if (!isMatch) {
      // SECURITY: Generic error ONLY. Never reveal wrong digit, wrong question, or expected answer.
      return res.status(400).json({
        success: false,
        error: 'INVALID_UNLOCK_CODE',
        message: 'Verification failed. The unlock code entered is incorrect.'
      });
    }

    // Round is successfully completed! Freeze the per-round duration.
    await dataStore.recordRoundCompletion({
      teamId,
      round: roundNum,
      completedAt: new Date(now),
      elapsedTimeMs: durationMs
    });

    // Update team status and current round
    if (roundNum === 1) {
      await dataStore.updateTeamRound(teamId, 1, 'ROUND_1_COMPLETE');
    } else if (roundNum === 2) {
      await dataStore.updateTeamRound(teamId, 2, 'ROUND_2_COMPLETE');
    } else if (roundNum === 3) {
      await dataStore.updateTeamRound(teamId, 3, 'FINISHED');
    }

    // Make the next round READY (awaiting explicit administrator activation).
    await dataStore.promoteNextRound(roundNum);
    // Derive contest-level round completion when all teams are done.
    await dataStore.refreshRoundLifecycle();

    // Calculate updated position on leaderboard
    const leaderboard = await calculateLeaderboard();
    const rankEntry = leaderboard.find(e => e.teamNumber === team.teamNumber);
    const currentPosition = rankEntry ? rankEntry.rank : 1;

    console.log(
      `[ROUND ${roundNum}] Team ${team.teamNumber} unlocked in ${formatDuration(durationMs)} (Rank #${currentPosition})`
    );

    return res.json({
      success: true,
      message: `Round 0${roundNum} successfully unlocked and verified.`,
      round: roundNum,
      completed: true,
      completionTimeMs: durationMs,
      formattedCompletionTime: formatDuration(durationMs),
      currentPosition
    });
  } catch (err: any) {
    console.error('[Rounds] Submit error:', err);
    return res.status(500).json({ error: 'Server error during submission validation' });
  }
});

// UNLOCK / ADVANCE TO NEXT ROUND
roundsRouter.post('/:round/advance', requireTeam, async (req: AuthRequest, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const currentRoundNum = parseInt(roundParam, 10) as RoundNumber;

    const team = await dataStore.getTeamByNumber(req.authenticatedTeamNumber || '');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = (team._id || team.id).toString();

    // Verify completion of current round
    const completion = await dataStore.getRoundCompletion(teamId, currentRoundNum);
    if (!completion) {
      return res.status(403).json({
        error: 'ROUND_NOT_COMPLETED',
        message: `Cannot advance. Round ${currentRoundNum} has not been completed yet.`
      });
    }

    if (currentRoundNum === 1) {
      await dataStore.updateTeamRound(teamId, 2, 'IN_ROUND_2');
      return res.json({
        message: 'Successfully advanced to Round 2',
        nextRound: 2
      });
    } else if (currentRoundNum === 2) {
      await dataStore.updateTeamRound(teamId, 3, 'IN_ROUND_3');
      return res.json({
        message: 'Successfully advanced to Round 3',
        nextRound: 3
      });
    } else {
      return res.json({
        message: 'All rounds finished',
        nextRound: null
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to advance to next round' });
  }
});

// GET ROUND COMPLETION DETAILS FOR THE AUTHENTICATED TEAM
roundsRouter.get('/:round/completion', requireTeam, async (req: AuthRequest, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;

    const team = await dataStore.getTeamByNumber(req.authenticatedTeamNumber || '');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = (team._id || team.id).toString();
    const completion = await dataStore.getRoundCompletion(teamId, roundNum);
    if (!completion) {
      return res.status(404).json({ error: 'Round completion not found for this team' });
    }

    const leaderboard = await calculateLeaderboard();
    const rankEntry = leaderboard.find(e => e.teamNumber === team.teamNumber);

    return res.json({
      round: roundNum,
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      completionTimeMs: completion.elapsedTimeMs,
      formattedCompletionTime: formatDuration(completion.elapsedTimeMs),
      completedAt: completion.completedAt,
      currentPosition: rankEntry ? rankEntry.rank : 1,
      totalTeams: leaderboard.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve round completion' });
  }
});
