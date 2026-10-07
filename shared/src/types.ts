export type ContestStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';

export type RoundNumber = 1 | 2 | 3;

export type RoundStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED';

export type TeamStatus = 'REGISTERED' | 'IN_ROUND_1' | 'ROUND_1_COMPLETE' | 'IN_ROUND_2' | 'ROUND_2_COMPLETE' | 'IN_ROUND_3' | 'FINISHED' | 'DISQUALIFIED';

export type ParticipantRole = 'THINKER' | 'CODER' | 'DEBUGGER' | 'SUPPORTER';

export interface Participant {
  name: string;
  role: ParticipantRole;
}

export interface TeamData {
  id: string;
  teamNumber: string;
  teamName: string;
  teamLeader: string;
  thinker: string;
  coder: string;
  debugger: string;
  supporter: string;
  currentRound: RoundNumber;
  status: TeamStatus;
  registeredAt: string;
}

export interface ContestState {
  status: ContestStatus;
  contestStartTime: number | null; // Unix timestamp ms
  contestEndTime: number | null;
  round1Status: RoundStatus;
  round2Status: RoundStatus;
  round3Status: RoundStatus;
}

export interface QuestionData {
  id: string;
  round: RoundNumber;
  questionNumber: number;
  title: string;
  type: 'CODING' | 'DEBUGGING' | 'LOGIC_EXTRACTION';
  problemStatement: string;
  inputDescription?: string;
  outputDescription?: string;
  constraints?: string[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode?: string; // e.g. for debugging round
  language?: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamNumber: string;
  teamName: string;
  currentRound: RoundNumber;
  status: TeamStatus;
  round1TimeMs: number | null;
  round2TimeMs: number | null;
  round3TimeMs: number | null;
  totalTimeMs: number | null;
  formattedRound1Time: string;
  formattedRound2Time: string;
  formattedRound3Time: string;
  formattedTotalTime: string;
  lastSolvedAt: number | null;
}

export interface AdminStats {
  contestStatus: ContestStatus;
  serverTime: number;
  contestStartTime: number | null;
  registeredTeamsCount: number;
  activeTeamsCount: number;
  completedTeamsCount: number;
  teamsByRound: {
    round1: number;
    round2: number;
    round3: number;
    finished: number;
  };
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  round?: RoundNumber;
  completed?: boolean;
  completionTimeMs?: number;
  formattedCompletionTime?: string;
}
