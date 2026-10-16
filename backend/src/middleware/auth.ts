import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'codelock_secret_key_offline_mode_2026';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
  team?: {
    id: string;
    teamNumber: string;
  };
  /** Team number resolved from a verified TEAM token, when present. */
  authenticatedTeamNumber?: string;
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin token' });
  }
}

/**
 * Resolves the authenticated contestant identity from a verified TEAM token.
 * The token is the authoritative source of team identity; client-supplied
 * team numbers (body/query/header) are never trusted as authorization.
 */
export function requireTeam(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Team authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'TEAM') {
      return res.status(403).json({ error: 'Forbidden: Team privilege required' });
    }
    req.team = { id: decoded.id, teamNumber: decoded.teamNumber };
    req.authenticatedTeamNumber = decoded.teamNumber;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired team token' });
  }
}

export function generateAdminToken(admin: { id: string; username: string; role: string }): string {
  return jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role, type: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function generateTeamToken(team: { id: string; teamNumber: string }): string {
  return jwt.sign(
    { id: team.id, teamNumber: team.teamNumber, type: 'TEAM' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
