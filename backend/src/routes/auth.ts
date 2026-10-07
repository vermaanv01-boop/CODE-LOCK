import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../services/store.js';
import { generateAdminToken, generateTeamToken } from '../middleware/auth.js';

export const authRouter = Router();

// Admin Login
authRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.toString().trim().toLowerCase();
    const cleanPassword = password.toString().trim();

    const admin = await dataStore.getAdminByUsername(cleanUsername);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isValid = await bcrypt.compare(cleanPassword, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const adminId = (admin._id || admin.id).toString();
    const token = generateAdminToken({
      id: adminId,
      username: admin.username,
      role: admin.role
    });

    return res.json({
      token,
      admin: {
        id: adminId,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err: any) {
    console.error('[Auth] Admin login error:', err);
    return res.status(500).json({ error: 'Server error during authentication' });
  }
});

// Team Login / Verification
authRouter.post('/team/login', async (req: Request, res: Response) => {
  try {
    const { teamNumber } = req.body;
    if (!teamNumber) {
      return res.status(400).json({ error: 'Team number is required' });
    }

    const team = await dataStore.getTeamByNumber(teamNumber);
    if (!team) {
      return res.status(404).json({ error: 'Team not found with the specified team number' });
    }

    const teamId = (team._id || team.id).toString();
    const token = generateTeamToken({
      id: teamId,
      teamNumber: team.teamNumber
    });

    return res.json({
      token,
      team: {
        id: teamId,
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        teamLeader: team.teamLeader,
        currentRound: team.currentRound,
        status: team.status
      }
    });
  } catch (err: any) {
    console.error('[Auth] Team login error:', err);
    return res.status(500).json({ error: 'Server error during team lookup' });
  }
});
