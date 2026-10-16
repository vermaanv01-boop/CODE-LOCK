export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // In LAN mode, connect to Express port 5000 on the same host
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${host}:5000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

// Storage helpers for Team Session and Admin Token
export const storage = {
  getTeam: () => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('codelock_team');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setTeam: (team: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('codelock_team', JSON.stringify(team));
    } catch {}
  },
  clearTeam: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('codelock_team');
  },
  getTeamToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('codelock_team_token');
  },
  setTeamToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('codelock_team_token', token);
  },
  clearTeamToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('codelock_team_token');
  },
  getAdminToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('codelock_admin_token');
  },
  setAdminToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('codelock_admin_token', token);
  },
  clearAdminToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('codelock_admin_token');
  },
  // Full contestant session teardown.
  clearSession: () => {
    storage.clearTeam();
    storage.clearTeamToken();
  }
};

// Administrator-only endpoints. These must carry the admin bearer token; a
// contestant (team) session must never be able to authorize them.
const ADMIN_ENDPOINT = /^\/(auth\/admin|contest\/start|contest\/reset|contest\/round\/\d+\/start|leaderboard\/admin)/;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  // Role-isolated authorization: exactly one credential is attached per
  // request. Admin endpoints use the admin token; all other authenticated
  // requests use the contestant (team) token. Neither role can authorize the
  // other's operations.
  if (!headers['Authorization']) {
    if (ADMIN_ENDPOINT.test(endpoint)) {
      const adminToken = storage.getAdminToken();
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    } else {
      const teamToken = storage.getTeamToken();
      if (teamToken) headers['Authorization'] = `Bearer ${teamToken}`;
    }
  }

  const team = storage.getTeam();
  if (team?.teamNumber && !headers['x-team-number']) {
    headers['x-team-number'] = team.teamNumber;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).data = data;
    (err as any).status = res.status;
    throw err;
  }

  return data;
}

// Contest state & timer helper
export async function getContestStatus() {
  return await apiRequest('/contest/status');
}

export async function getLeaderboard() {
  return await apiRequest('/leaderboard');
}

export async function getAdminLeaderboard() {
  return await apiRequest('/leaderboard/admin');
}

// Admin: activate an independent round (1 | 2 | 3).
export async function startRound(round: number) {
  return await apiRequest(`/contest/round/${round}/start`, { method: 'POST' });
}

export async function submitRoundCode(round: number, teamNumber: string, code: string) {
  return await apiRequest(`/rounds/${round}/submit`, {
    method: 'POST',
    body: JSON.stringify({ teamNumber, code })
  });
}

export async function advanceRound(round: number, teamNumber: string) {
  return await apiRequest(`/rounds/${round}/advance`, {
    method: 'POST',
    body: JSON.stringify({ teamNumber })
  });
}

export async function getRoundCompletion(round: number, teamNumber: string) {
  return await apiRequest(`/rounds/${round}/completion?teamNumber=${encodeURIComponent(teamNumber)}`);
}

export async function getRoundQuestions(round: number, teamNumber?: string) {
  const query = teamNumber ? `?teamNumber=${encodeURIComponent(teamNumber)}` : '';
  return await apiRequest(`/rounds/${round}${query}`);
}
