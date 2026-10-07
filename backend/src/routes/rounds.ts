import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { calculateLeaderboard } from '../services/leaderboard.js';
import { RoundNumber } from '@shared/types';

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

// GET questions for a round (Sanitized, route guard verified)
roundsRouter.get('/:round', async (req: Request, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const contest = await dataStore.getContest();
    if (contest.status !== 'ACTIVE' && contest.status !== 'COMPLETED') {
      return res.status(403).json({
        error: 'CONTEST_NOT_ACTIVE',
        message: 'The contest has not started yet. Round access is locked.'
      });
    }

    const teamNumberQuery = req.query.teamNumber;
    const teamNumber = (typeof teamNumberQuery === 'string' ? teamNumberQuery : '') || (req.headers['x-team-number'] as string);
    if (teamNumber) {
      const team = await dataStore.getTeamByNumber(teamNumber);
      if (team) {
        // Enforce round progression
        if (team.currentRound < roundNum) {
          return res.status(403).json({
            error: 'ROUND_LOCKED',
            message: `Round ${roundNum} is locked. You must complete Round ${team.currentRound} first.`,
            currentRound: team.currentRound
          });
        }
      }
    }

    const questions = await dataStore.getQuestionsByRound(roundNum, true);
    return res.json({
      round: roundNum,
      questions
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve round questions' });
  }
});

// SUBMIT full round unlock code
roundsRouter.post('/:round/submit', async (req: Request, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;
    if (![1, 2, 3].includes(roundNum)) {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    const { teamNumber, code } = req.body;
    if (!teamNumber || !code) {
      return res.status(400).json({ error: 'Team number and unlock code are required' });
    }

    const contest = await dataStore.getContest();
    if (contest.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'CONTEST_NOT_ACTIVE',
        message: 'Contest is not active.'
      });
    }

    const team = await dataStore.getTeamByNumber(teamNumber);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = (team._id || team.id).toString();

    // Route Guard: verify team is permitted to submit this round
    if (team.currentRound < roundNum) {
      return res.status(403).json({
        error: 'ROUND_LOCKED',
        message: `Round ${roundNum} is locked. Complete Round ${team.currentRound} first.`
      });
    }

    // Check if team has already completed this round
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

    // Official server time calculation
    const now = Date.now();
    const startTimeMs = contest.contestStartTime ? new Date(contest.contestStartTime).getTime() : now;
    const elapsedMs = Math.max(0, now - startTimeMs);

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

    // Round is successfully completed!
    await dataStore.recordRoundCompletion({
      teamId,
      round: roundNum,
      completedAt: new Date(now),
      elapsedTimeMs: elapsedMs
    });

    // Update team status and current round
    if (roundNum === 1) {
      await dataStore.updateTeamRound(teamId, 1, 'ROUND_1_COMPLETE');
    } else if (roundNum === 2) {
      await dataStore.updateTeamRound(teamId, 2, 'ROUND_2_COMPLETE');
    } else if (roundNum === 3) {
      await dataStore.updateTeamRound(teamId, 3, 'FINISHED');
    }

    // Calculate updated position on leaderboard
    const leaderboard = await calculateLeaderboard();
    const rankEntry = leaderboard.find(e => e.teamNumber === team.teamNumber);
    const currentPosition = rankEntry ? rankEntry.rank : 1;

    console.log(`[ROUND ${roundNum}] Team ${team.teamNumber} unlocked at ${formatDuration(elapsedMs)} (Rank #${currentPosition})`);

    return res.json({
      success: true,
      message: `Round 0${roundNum} successfully unlocked and verified.`,
      round: roundNum,
      completed: true,
      completionTimeMs: elapsedMs,
      formattedCompletionTime: formatDuration(elapsedMs),
      currentPosition
    });
  } catch (err: any) {
    console.error('[Rounds] Submit error:', err);
    return res.status(500).json({ error: 'Server error during submission validation' });
  }
});

// UNLOCK / ADVANCE TO NEXT ROUND
roundsRouter.post('/:round/advance', async (req: Request, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const currentRoundNum = parseInt(roundParam, 10) as RoundNumber;
    const { teamNumber } = req.body;
    if (!teamNumber) {
      return res.status(400).json({ error: 'Team number is required' });
    }

    const team = await dataStore.getTeamByNumber(teamNumber);
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

// GET ROUND COMPLETION DETAILS FOR A TEAM
roundsRouter.get('/:round/completion', async (req: Request, res: Response) => {
  try {
    const roundParam = getParam(req.params.round);
    const roundNum = parseInt(roundParam, 10) as RoundNumber;
    const teamNumber = req.query.teamNumber as string;
    if (!teamNumber) {
      return res.status(400).json({ error: 'Team number is required' });
    }

    const team = await dataStore.getTeamByNumber(teamNumber);
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
