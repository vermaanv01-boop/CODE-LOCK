import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { generateTeamToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { RoundNumber, TeamStatus } from '@shared/types';

export const teamsRouter = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// Admin: Register a new team with full administrative override
const handleAdminRegister = async (req: AuthRequest, res: Response) => {
  try {
    const {
      teamNumber,
      teamName,
      teamLeader,
      thinker,
      coder,
      debugger: debuggerMember,
      supporter,
      accessPin,
      currentRound: customRound,
      status: customStatus
    } = req.body;

    if (!teamNumber || !teamName || !teamLeader || !thinker || !coder || !debuggerMember || !supporter) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'All squad member fields are required (Team Number, Team Name, Team Leader, Thinker, Coder, Debugger, Supporter).'
      });
    }

    const formattedTeamNumber = teamNumber.trim().toUpperCase();

    // Check if team number is already registered
    const existing = await dataStore.getTeamByNumber(formattedTeamNumber);
    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_TEAM_NUMBER',
        message: `Team number ${formattedTeamNumber} is already registered.`
      });
    }

    const contest = await dataStore.getContest();
    let initialRound: RoundNumber = (customRound && [1, 2, 3].includes(Number(customRound))) ? Number(customRound) as RoundNumber : 1;
    let initialStatus: TeamStatus = customStatus || 'REGISTERED';

    if (!customStatus) {
      if (contest.status === 'ACTIVE') {
        if (contest.round3Status === 'ACTIVE') {
          initialRound = 3;
          initialStatus = 'IN_ROUND_3';
        } else if (contest.round2Status === 'ACTIVE') {
          initialRound = 2;
          initialStatus = 'IN_ROUND_2';
        } else if (contest.round1Status === 'ACTIVE') {
          initialRound = 1;
          initialStatus = 'IN_ROUND_1';
        }
      }
    }

    const newTeam = await dataStore.createTeam({
      teamNumber: formattedTeamNumber,
      teamName: teamName.trim(),
      teamLeader: teamLeader.trim(),
      thinker: thinker.trim(),
      coder: coder.trim(),
      debugger: debuggerMember.trim(),
      supporter: supporter.trim(),
      accessPin: accessPin ? accessPin.trim() : undefined,
      currentRound: initialRound,
      status: initialStatus
    });

    const teamId = (newTeam._id || newTeam.id).toString();
    const token = generateTeamToken({
      id: teamId,
      teamNumber: newTeam.teamNumber
    });

    console.log(`[Teams] Admin ${req.admin?.username} registered team ${newTeam.teamNumber} (${newTeam.teamName})`);

    return res.status(201).json({
      message: 'Team successfully registered by admin',
      token,
      team: {
        id: teamId,
        teamNumber: newTeam.teamNumber,
        teamName: newTeam.teamName,
        teamLeader: newTeam.teamLeader,
        thinker: newTeam.thinker,
        coder: newTeam.coder,
        debugger: newTeam.debugger,
        supporter: newTeam.supporter,
        currentRound: newTeam.currentRound,
        status: newTeam.status
      }
    });
  } catch (err: any) {
    console.error('[Teams] Admin registration error:', err);
    return res.status(500).json({ error: 'Server error during admin team registration' });
  }
};

teamsRouter.post('/admin', requireAdmin, handleAdminRegister);
teamsRouter.post('/admin/register', requireAdmin, handleAdminRegister);

// Admin: Delete/remove a team completely
const handleAdminDelete = async (req: AuthRequest, res: Response) => {
  try {
    const param = getParam(req.params.idOrNumber);
    if (!param) {
      return res.status(400).json({ error: 'Team identifier is required' });
    }

    const removedTeam = await dataStore.deleteTeam(param);
    if (!removedTeam) {
      return res.status(404).json({
        error: 'TEAM_NOT_FOUND',
        message: `Team "${param}" not found.`
      });
    }

    console.log(`[Teams] Admin ${req.admin?.username} removed team ${removedTeam.teamNumber} (${removedTeam.teamName})`);

    return res.json({
      message: `Team ${removedTeam.teamNumber} (${removedTeam.teamName}) has been successfully removed.`,
      team: {
        id: (removedTeam._id || removedTeam.id).toString(),
        teamNumber: removedTeam.teamNumber,
        teamName: removedTeam.teamName
      }
    });
  } catch (err: any) {
    console.error('[Teams] Admin delete error:', err);
    return res.status(500).json({ error: 'Failed to remove team' });
  }
};

teamsRouter.delete('/admin/:idOrNumber', requireAdmin, handleAdminDelete);
teamsRouter.delete('/:idOrNumber', requireAdmin, handleAdminDelete);

// Register a new team (Contestant self-registration)
teamsRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const contest = await dataStore.getContest();
    if (contest.status !== 'NOT_STARTED') {
      return res.status(403).json({
        error: 'REGISTRATION_LOCKED',
        message: 'Registration is locked. The contest is currently active or completed.'
      });
    }

    const {
      teamNumber,
      teamName,
      teamLeader,
      thinker,
      coder,
      debugger: debuggerMember,
      supporter
    } = req.body;

    if (!teamNumber || !teamName || !teamLeader || !thinker || !coder || !debuggerMember || !supporter) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'All fields are required (Team Number, Team Name, Team Leader, Thinker, Coder, Debugger, Supporter).'
      });
    }

    const formattedTeamNumber = teamNumber.trim().toUpperCase();

    // Check if team number is already registered
    const existing = await dataStore.getTeamByNumber(formattedTeamNumber);
    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_TEAM_NUMBER',
        message: `Team number ${formattedTeamNumber} is already registered.`
      });
    }

    const newTeam = await dataStore.createTeam({
      teamNumber: formattedTeamNumber,
      teamName: teamName.trim(),
      teamLeader: teamLeader.trim(),
      thinker: thinker.trim(),
      coder: coder.trim(),
      debugger: debuggerMember.trim(),
      supporter: supporter.trim()
    });

    const teamId = (newTeam._id || newTeam.id).toString();
    const token = generateTeamToken({
      id: teamId,
      teamNumber: newTeam.teamNumber
    });

    return res.status(201).json({
      message: 'Team successfully registered',
      token,
      team: {
        id: teamId,
        teamNumber: newTeam.teamNumber,
        teamName: newTeam.teamName,
        teamLeader: newTeam.teamLeader,
        thinker: newTeam.thinker,
        coder: newTeam.coder,
        debugger: newTeam.debugger,
        supporter: newTeam.supporter,
        currentRound: newTeam.currentRound,
        status: newTeam.status
      }
    });
  } catch (err: any) {
    console.error('[Teams] Registration error:', err);
    return res.status(500).json({ error: 'Server error during team registration' });
  }
});

// Get all teams (for admin / monitoring)
teamsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const teams = await dataStore.getAllTeams();
    const sanitized = teams.map(t => ({
      id: (t._id || t.id).toString(),
      teamNumber: t.teamNumber,
      teamName: t.teamName,
      teamLeader: t.teamLeader,
      thinker: t.thinker,
      coder: t.coder,
      debugger: t.debugger,
      supporter: t.supporter,
      currentRound: t.currentRound,
      status: t.status,
      registeredAt: t.registeredAt
    }));
    return res.json({ teams: sanitized });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID or team number
teamsRouter.get('/:idOrNumber', async (req: Request, res: Response) => {
  try {
    const param = getParam(req.params.idOrNumber);
    let team = await dataStore.getTeamById(param);
    if (!team) {
      team = await dataStore.getTeamByNumber(param);
    }
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamId = (team._id || team.id).toString();
    return res.json({
      team: {
        id: teamId,
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        teamLeader: team.teamLeader,
        thinker: team.thinker,
        coder: team.coder,
        debugger: team.debugger,
        supporter: team.supporter,
        currentRound: team.currentRound,
        status: team.status,
        registeredAt: team.registeredAt
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch team details' });
  }
});
