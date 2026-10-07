import { Router, Request, Response } from 'express';
import { dataStore } from '../services/store.js';
import { generateTeamToken } from '../middleware/auth.js';

export const teamsRouter = Router();

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// Register a new team
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
