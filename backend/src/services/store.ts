import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Admin, IAdmin } from '../models/Admin.js';
import { Team, ITeam } from '../models/Team.js';
import { Contest, IContest } from '../models/Contest.js';
import { Question, IQuestion } from '../models/Question.js';
import { Submission, ISubmission } from '../models/Submission.js';
import { RoundCompletion, IRoundCompletion } from '../models/RoundCompletion.js';
import { ContestStatus, RoundNumber, RoundStatus, TeamStatus } from '@shared/types';

export interface MemoryStoreData {
  admins: any[];
  teams: any[];
  contest: any;
  questions: any[];
  submissions: any[];
  roundCompletions: any[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

export class DataStore {
  private isMongoConnected: boolean = false;
  private localData: MemoryStoreData = {
    admins: [],
    teams: [],
    contest: null,
    questions: [],
    submissions: [],
    roundCompletions: []
  };

  constructor() {
    this.ensureLocalFile();
    this.loadLocalData();
  }

  public setMongoConnected(connected: boolean) {
    this.isMongoConnected = connected;
  }

  public getIsMongoConnected(): boolean {
    return this.isMongoConnected;
  }

  private ensureLocalFile() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    }
  }

  private loadLocalData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.localData = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Store] Failed to load local file, initialized fresh state', err);
    }
  }

  private saveLocalData() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Store] Failed to save local file', err);
    }
  }

  // --- SEEDING ---
  public async seedDefaults() {
    // 1. Seed Admin
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);
    const defaultAdmin = {
      id: 'admin_root',
      username: 'admin',
      name: 'Contest Controller',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      active: true,
      createdAt: new Date()
    };

    if (this.isMongoConnected) {
      const existing = await Admin.findOne({ username: 'admin' });
      if (!existing) {
        await Admin.create(defaultAdmin);
        console.log('[Store] Seeded default admin in MongoDB');
      }
    } else {
      if (!this.localData.admins.find(a => a.username === 'admin')) {
        this.localData.admins.push(defaultAdmin);
        this.saveLocalData();
        console.log('[Store] Seeded default admin in offline store');
      }
    }

    // 2. Seed Contest State
    // Round 1 has no prerequisite, so it begins READY (awaiting administrator
    // activation). Rounds 2 and 3 remain LOCKED until their prerequisites are met.
    const initialContest = {
      status: 'NOT_STARTED' as ContestStatus,
      contestStartTime: null,
      contestEndTime: null,
      round1Status: 'READY' as RoundStatus,
      round2Status: 'LOCKED' as RoundStatus,
      round3Status: 'LOCKED' as RoundStatus,
      round1StartedAt: null,
      round2StartedAt: null,
      round3StartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.isMongoConnected) {
      const existing = await Contest.findOne();
      if (!existing) {
        await Contest.create(initialContest);
      }
    } else {
      if (!this.localData.contest) {
        this.localData.contest = { id: 'contest_main', ...initialContest };
        this.saveLocalData();
      }
    }

    // 3. Seed Questions
    const defaultQuestions = [
      // Round 1 (6 questions, 2 digits each. Final code: 421873298456)
      {
        round: 1,
        questionNumber: 1,
        type: 'CODING',
        content: {
          title: 'Bitwise Parity Compression',
          problemStatement: 'You are given a stream of 8-bit sensor telemetry packets. For each integer in array A, compute the bitwise XOR sum of its popcount and its parity mask. Let S be the sum of all computed values modulo 100. Return S as a 2-digit number (zero-padded if < 10).',
          inputDescription: 'Array of integers A: [15, 23, 8, 99, 4, 67, 112, 5]',
          outputDescription: '2-digit numeric code.',
          constraints: ['1 <= A.length <= 10^4', '0 <= A[i] <= 255'],
          examples: [
            {
              input: 'A = [15, 23, 8]',
              output: '07',
              explanation: 'Computed checksum yields 7 -> 07.'
            }
          ]
        },
        expectedAnswer: '42',
        active: true
      },
      {
        round: 1,
        questionNumber: 2,
        type: 'CODING',
        content: {
          title: 'Graph Latency Bottleneck',
          problemStatement: 'Given a directed weighted network graph with 6 nodes representing core switches, calculate the critical path bottleneck value from node 1 to node 6. Let B be the maximum latency edge along the shortest path. Compute B % 100.',
          inputDescription: 'Nodes: 6, Edges: [(1,2,14), (1,3,9), (2,4,18), (3,4,11), (4,5,7), (5,6,12), (3,5,22)]',
          outputDescription: '2-digit integer.',
          constraints: ['N <= 1000', 'Edge weights > 0'],
          examples: [
            {
              input: 'Sample topology',
              output: '18',
              explanation: 'Shortest path latency bottleneck edge is 18.'
            }
          ]
        },
        expectedAnswer: '18',
        active: true
      },
      {
        round: 1,
        questionNumber: 3,
        type: 'CODING',
        content: {
          title: 'Prefix Sum Inversion Count',
          problemStatement: 'In an execution trace of thread identifiers [9, 1, 8, 2, 7, 3, 6, 4, 5], calculate the number of inversions (pairs (i, j) where i < j and A[i] > A[j]). Output the inversion count modulo 100.',
          inputDescription: 'Array trace A = [9, 1, 8, 2, 7, 3, 6, 4, 5]',
          outputDescription: '2-digit integer modulo 100.',
          constraints: ['N <= 5000'],
          examples: [
            {
              input: '[3, 2, 1]',
              output: '03',
              explanation: '3 inversions -> 03'
            }
          ]
        },
        expectedAnswer: '73',
        active: true
      },
      {
        round: 1,
        questionNumber: 4,
        type: 'CODING',
        content: {
          title: 'Binary Matrix Island Perimeter',
          problemStatement: 'Given a 6x6 memory buffer represented as a binary matrix where 1 represents an allocated sector and 0 is free space, calculate the total perimeter of all connected allocation clusters (isolated edges touching 0 or boundary). Output total perimeter % 100.',
          inputDescription: 'Grid: [[0,1,1,0,0,0],[1,1,0,0,1,1],[0,0,1,1,1,0],[0,1,1,0,0,0],[1,0,0,1,1,0],[0,0,1,1,0,0]]',
          outputDescription: '2-digit integer.',
          constraints: ['Grid size 6x6'],
          examples: [
            {
              input: 'Single cell [[1]]',
              output: '04',
              explanation: '4 perimeter units -> 04'
            }
          ]
        },
        expectedAnswer: '29',
        active: true
      },
      {
        round: 1,
        questionNumber: 5,
        type: 'CODING',
        content: {
          title: 'Matrix Chain Scalar Multiplication Cost',
          problemStatement: 'Determine the minimal number of scalar multiplications needed to multiply a sequence of 4 matrices with dimensions: A1: 10x30, A2: 30x5, A3: 5x60, A4: 60x10. Calculate (minimal_scalar_multiplications / 50) % 100.',
          inputDescription: 'Dimensions: [10, 30, 5, 60, 10]',
          outputDescription: '2-digit integer.',
          constraints: ['Standard Matrix Chain Multiplication'],
          examples: [
            {
              input: '[10, 20, 30]',
              output: '12',
              explanation: 'Cost 6000 / 500 = 12'
            }
          ]
        },
        expectedAnswer: '84',
        active: true
      },
      {
        round: 1,
        questionNumber: 6,
        type: 'CODING',
        content: {
          title: 'Stack-Based Syntax Parser Checksum',
          problemStatement: 'Evaluate the token stream with nested scopes: "{ [ ( [ ] ) ] { [ ] } ( ) }". For each token pair, multiply the nesting depth by the bracket type weight ({} = 3, [] = 2, () = 1). Sum all products and take modulo 100.',
          inputDescription: 'String: "{ [ ( [ ] ) ] { [ ] } ( ) }"',
          outputDescription: '2-digit integer.',
          constraints: ['String length <= 256'],
          examples: [
            {
              input: '"{ [ ] }"',
              output: '07',
              explanation: 'Depth 1 * 3 + Depth 2 * 2 = 7 -> 07'
            }
          ]
        },
        expectedAnswer: '56',
        active: true
      },

      // Round 2 (2 debugging questions, 3 digits each. Final code: 419832)
      {
        round: 2,
        questionNumber: 1,
        type: 'DEBUGGING',
        content: {
          title: 'Off-By-One Buffer Parser & Pointer Arithmetic',
          problemStatement: 'The following telemetry parser has an off-by-one pointer slip and an uninitialized accumulator flaw. It fails to correctly compute the checksum of the message payload "C//L-ALPHA-7729". Fix the bug in the provided code and run it with the input payload. What is the resulting 3-digit checksum output?',
          inputDescription: 'Payload: "C//L-ALPHA-7729"',
          outputDescription: 'Exact 3-digit integer produced by the fixed program.',
          constraints: ['C / C++ / Python compatible logic'],
          starterCode: `// BROKEN TELEMETRY PARSER (C++)
#include <iostream>
#include <string>

int compute_checksum(const std::string& data) {
    int sum; // BUG 1: Uninitialized accumulator!
    int len = data.length();
    
    // BUG 2: Loop condition exceeds buffer boundary and skips last element
    for (int i = 1; i <= len; i++) { 
        char c = data[i]; // Potential out-of-bounds access
        sum += (c * (i + 3)) ^ 0x1F;
    }
    
    return (sum % 900) + 100; // Returns 3-digit number
}

int main() {
    std::string payload = "C//L-ALPHA-7729";
    std::cout << compute_checksum(payload) << std::endl;
    return 0;
}`,
          language: 'cpp'
        },
        expectedAnswer: '419',
        active: true
      },
      {
        round: 2,
        questionNumber: 2,
        type: 'DEBUGGING',
        content: {
          title: 'Integer Overflow & Boundary Comparator Bug',
          problemStatement: 'The following interval scheduler produces incorrect scheduling weights due to signed 16-bit integer truncation and incorrect strictly-greater comparator logic. Fix the broken comparator and variable typing. When fed with the task sequence, find the corrected 3-digit schedule metric.',
          inputDescription: 'Tasks: [(1, 5, 120), (3, 7, 250), (6, 12, 410), (8, 14, 180), (10, 15, 330)]',
          outputDescription: 'Exact 3-digit integer produced by the fixed code.',
          constraints: ['Python / C++ logic'],
          starterCode: `# BROKEN INTERVAL SCHEDULER (Python)
def solve_schedule(intervals):
    # BUG 1: sorting by start time instead of end time for greedy interval scheduling
    # BUG 2: improper overlap condition allows colliding intervals
    sorted_tasks = sorted(intervals, key=lambda x: x[0])
    
    last_end = 0
    total_metric = 0
    
    for start, end, weight in sorted_tasks:
        # BUG: should be start >= last_end
        if start > last_end:
            total_metric = (total_metric + weight * 7) % 1000
            last_end = end
            
    # Normalize to 3-digit code
    return total_metric

tasks = [(1, 5, 120), (3, 7, 250), (6, 12, 410), (8, 14, 180), (10, 15, 330)]
print(solve_schedule(tasks))`,
          language: 'python'
        },
        expectedAnswer: '832',
        active: true
      },

      // Round 3 (Final lock: Team Logic / Code Extraction / Reconstruction)
      {
        round: 3,
        questionNumber: 1,
        type: 'LOGIC_EXTRACTION',
        content: {
          title: 'The Core Reactor Lock: Synchronized Extraction',
          problemStatement: `The final CODE//LOCK system requires complete team collaboration.
Each role possesses a fragmented sub-key derived from the event matrix:

[ROLE FRAGMENTS]
1. THINKER: Decodes the cipher matrix shift pattern:
   Matrix A: [5, 9, 2, 8] with base modulus 7. Result = 3

2. CODER: Executes the algorithmic permutation transform:
   Rotate binary key 0b10110011 left by 3 bits, XOR with 0xAA. Result = 9

3. DEBUGGER: Repairs the corrupted parity checksum in trace #409:
   Fixed checksum value = 07

4. SUPPORTER: Assembles the master sequence in strict order:
   Assemble: THINKER_CODE (1 char) + CODER_CODE (1 char) + DEBUGGER_CODE (2 chars) + CONTROL_SALT "42"
   Resulting in the 6-character Master Unlock Sequence: "390742"

Solve the four role challenges on your team sheet and combine them to generate the 6-character Final Master Unlock Code.`,
          inputDescription: 'Full Team Cryptographic Matrix on organizer terminal / problem sheet.',
          outputDescription: 'Master 6-character unlock code.',
          constraints: ['Strict role collaboration required', 'One master attempt submission']
        },
        expectedAnswer: '390742',
        active: true
      }
    ];

    for (const q of defaultQuestions) {
      if (this.isMongoConnected) {
        await Question.findOneAndUpdate(
          { round: q.round, questionNumber: q.questionNumber },
          q,
          { upsert: true, new: true }
        );
      } else {
        const existingIdx = this.localData.questions.findIndex(
          item => item.round === q.round && item.questionNumber === q.questionNumber
        );
        if (existingIdx >= 0) {
          this.localData.questions[existingIdx] = { id: `q_${q.round}_${q.questionNumber}`, ...q };
        } else {
          this.localData.questions.push({ id: `q_${q.round}_${q.questionNumber}`, ...q });
        }
      }
    }

    if (!this.isMongoConnected) {
      this.saveLocalData();
    }
    console.log('[Store] Questions initialized');
  }

  // --- ADMIN METHODS ---
  public async getAdminByUsername(username: string) {
    const normalized = (username || '').trim().toLowerCase();
    if (this.isMongoConnected) {
      return await Admin.findOne({
        username: { $regex: new RegExp(`^${normalized}$`, 'i') },
        active: true
      });
    }
    return this.localData.admins.find(
      a => a.username.toLowerCase() === normalized && a.active
    );
  }

  // --- CONTEST METHODS ---
  private roundStatusField(round: RoundNumber): 'round1Status' | 'round2Status' | 'round3Status' {
    return (`round${round}Status`) as 'round1Status' | 'round2Status' | 'round3Status';
  }

  private roundStartField(
    round: RoundNumber
  ): 'round1StartedAt' | 'round2StartedAt' | 'round3StartedAt' {
    return (`round${round}StartedAt`) as
      | 'round1StartedAt'
      | 'round2StartedAt'
      | 'round3StartedAt';
  }

  /**
   * Idempotent preservation upgrade for documents created before the
   * independent round lifecycle existed. Legacy contests kept Round 1 at
   * LOCKED while NOT_STARTED and lacked per-round start timestamps. Returns
   * true when the in-memory object was changed and needs persisting.
   */
  private normalizeContestShape(contest: any): boolean {
    let changed = false;
    for (const n of [1, 2, 3] as RoundNumber[]) {
      const sf = this.roundStartField(n);
      if (contest[sf] === undefined) {
        contest[sf] = null;
        changed = true;
      }
    }
    if (contest.status === 'NOT_STARTED' && contest.round1Status === 'LOCKED') {
      contest.round1Status = 'READY';
      changed = true;
    }
    return changed;
  }

  public async getContest(): Promise<any> {
    if (this.isMongoConnected) {
      let contest = await Contest.findOne();
      if (!contest) {
        contest = await Contest.create({
          status: 'NOT_STARTED',
          contestStartTime: null,
          contestEndTime: null,
          round1Status: 'READY',
          round2Status: 'LOCKED',
          round3Status: 'LOCKED',
          round1StartedAt: null,
          round2StartedAt: null,
          round3StartedAt: null
        });
        return contest;
      }
      if (this.normalizeContestShape(contest)) {
        await contest.save();
      }
      return contest;
    }
    if (!this.localData.contest) {
      this.localData.contest = {
        id: 'contest_main',
        status: 'NOT_STARTED',
        contestStartTime: null,
        contestEndTime: null,
        round1Status: 'READY',
        round2Status: 'LOCKED',
        round3Status: 'LOCKED',
        round1StartedAt: null,
        round2StartedAt: null,
        round3StartedAt: null
      };
      this.saveLocalData();
    } else if (this.normalizeContestShape(this.localData.contest)) {
      this.saveLocalData();
    }
    return this.localData.contest;
  }

  /**
   * Administrator-controlled activation of a single round.
   * Enforces the LOCKED -> READY -> ACTIVE transition atomically: the status
   * field is part of the update filter so concurrent activation requests can
   * never create a second official start timestamp.
   */
  public async startRound(
    round: RoundNumber
  ): Promise<{ ok: boolean; alreadyActive?: boolean; reason?: string; contest?: any }> {
    const statusField = this.roundStatusField(round);
    const startField = this.roundStartField(round);

    if (this.isMongoConnected) {
      const current = await this.getContest();
      if (current[statusField] === 'ACTIVE') {
        return { ok: true, alreadyActive: true, contest: current };
      }
      if (current[statusField] === 'COMPLETED') {
        return { ok: false, reason: 'ROUND_COMPLETED', contest: current };
      }
      if (current[statusField] !== 'READY') {
        return { ok: false, reason: 'ROUND_LOCKED', contest: current };
      }

      const startTime = new Date();
      const set: Record<string, any> = { [statusField]: 'ACTIVE', [startField]: startTime };
      if (round === 1) {
        // Round 1 start opens the contest and freezes registration.
        if (!current.contestStartTime) set.contestStartTime = startTime;
        set.status = 'ACTIVE';
      }

      const updated = await Contest.findOneAndUpdate(
        { _id: current._id, [statusField]: 'READY' },
        { $set: set },
        { new: true }
      );

      if (!updated) {
        // A concurrent request won the race. Re-read authoritative state.
        const fresh = await Contest.findOne();
        if (fresh && fresh[statusField] === 'ACTIVE') {
          return { ok: true, alreadyActive: true, contest: fresh };
        }
        return { ok: false, reason: 'CONFLICT', contest: fresh };
      }
      return { ok: true, contest: updated };
    }

    // Offline embedded store — single-threaded, so the check-and-set below is
    // atomic with respect to other requests.
    const contest = this.localData.contest;
    if (!contest) {
      return { ok: false, reason: 'ROUND_LOCKED' };
    }
    if (contest[statusField] === 'ACTIVE') {
      return { ok: true, alreadyActive: true, contest };
    }
    if (contest[statusField] === 'COMPLETED') {
      return { ok: false, reason: 'ROUND_COMPLETED', contest };
    }
    if (contest[statusField] !== 'READY') {
      return { ok: false, reason: 'ROUND_LOCKED', contest };
    }

    const startTime = new Date();
    contest[statusField] = 'ACTIVE';
    contest[startField] = startTime.toISOString();
    if (round === 1) {
      if (!contest.contestStartTime) contest.contestStartTime = startTime.toISOString();
      contest.status = 'ACTIVE';
    }
    this.saveLocalData();
    return { ok: true, contest };
  }

  /** Backwards-compatible alias: starting the contest is starting Round 1. */
  public async startContest(): Promise<any> {
    const result = await this.startRound(1);
    return result.contest;
  }

  /**
   * Promotes the round AFTER a completed round from LOCKED to READY once its
   * prerequisite is satisfied. Never promotes directly to ACTIVE.
   */
  public async promoteNextRound(completedRound: RoundNumber): Promise<void> {
    if (completedRound >= 3) return;
    const nextRound = (completedRound + 1) as RoundNumber;
    const field = this.roundStatusField(nextRound);

    if (this.isMongoConnected) {
      await Contest.findOneAndUpdate(
        { [field]: 'LOCKED' },
        { $set: { [field]: 'READY' } }
      );
      return;
    }
    const contest = this.localData.contest;
    if (contest && contest[field] === 'LOCKED') {
      contest[field] = 'READY';
      this.saveLocalData();
    }
  }

  /**
   * Derives contest-level round COMPLETED state: a round becomes COMPLETED
   * once every eligible (non-disqualified) team has a completion record for
   * it. When Round 3 completes, the contest itself is marked COMPLETED.
   * Idempotent; safe to call on read.
   */
  public async refreshRoundLifecycle(): Promise<any> {
    const contest = await this.getContest();
    const teams = await this.getAllTeams();
    const eligibleCount = teams.filter(t => t.status !== 'DISQUALIFIED').length;
    if (eligibleCount === 0) return contest;

    const completions = await this.getAllRoundCompletions();
    let changed = false;

    for (const n of [1, 2, 3] as RoundNumber[]) {
      const field = this.roundStatusField(n);
      if (contest[field] !== 'ACTIVE') continue;
      const completedCount = completions.filter(c => c.round === n).length;
      if (completedCount >= eligibleCount) {
        contest[field] = 'COMPLETED';
        changed = true;
        if (n === 3 && contest.status !== 'COMPLETED') {
          contest.status = 'COMPLETED';
          if (!contest.contestEndTime) contest.contestEndTime = new Date();
        }
      }
    }

    if (changed) {
      if (this.isMongoConnected) {
        await contest.save();
      } else {
        this.saveLocalData();
      }
    }
    return contest;
  }

  /** Per-round administrative statistics for the round-management console. */
  public async getRoundStats(): Promise<Record<string, any>> {
    const contest = await this.getContest();
    const teams = await this.getAllTeams();
    const completions = await this.getAllRoundCompletions();
    const eligibleTeams = teams.filter(t => t.status !== 'DISQUALIFIED');
    const now = Date.now();

    const stats: Record<string, any> = {};
    for (const n of [1, 2, 3] as RoundNumber[]) {
      const roundCompletions = completions.filter(c => c.round === n);
      const durations = roundCompletions
        .map(c => c.elapsedTimeMs)
        .filter((v: any) => typeof v === 'number' && isFinite(v));
      const startRaw = contest[this.roundStartField(n)];
      const startedAt = startRaw ? new Date(startRaw).getTime() : null;
      const status = contest[this.roundStatusField(n)];

      stats[String(n)] = {
        round: n,
        status,
        startedAt,
        elapsedMs:
          status === 'ACTIVE' && startedAt ? Math.max(0, now - startedAt) : null,
        eligibleTeams: eligibleTeams.length,
        completedTeams: roundCompletions.length,
        activeTeams: eligibleTeams.filter(
          t => t.currentRound === n && t.status === (`IN_ROUND_${n}` as TeamStatus)
        ).length,
        durationStats: durations.length
          ? {
              minMs: Math.min(...durations),
              maxMs: Math.max(...durations),
              avgMs: Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
            }
          : null
      };
    }
    return stats;
  }

  public async resetContest(): Promise<any> {
    if (this.isMongoConnected) {
      await Contest.deleteMany({});
      await Submission.deleteMany({});
      await RoundCompletion.deleteMany({});
      await Team.updateMany({}, {
        currentRound: 1,
        status: 'REGISTERED'
      });
      const contest = await Contest.create({
        status: 'NOT_STARTED',
        contestStartTime: null,
        contestEndTime: null,
        round1Status: 'READY',
        round2Status: 'LOCKED',
        round3Status: 'LOCKED',
        round1StartedAt: null,
        round2StartedAt: null,
        round3StartedAt: null
      });
      return contest;
    }
    this.localData.contest = {
      id: 'contest_main',
      status: 'NOT_STARTED',
      contestStartTime: null,
      contestEndTime: null,
      round1Status: 'READY',
      round2Status: 'LOCKED',
      round3Status: 'LOCKED',
      round1StartedAt: null,
      round2StartedAt: null,
      round3StartedAt: null
    };
    this.localData.submissions = [];
    this.localData.roundCompletions = [];
    this.localData.teams.forEach(t => {
      t.currentRound = 1;
      t.status = 'REGISTERED';
    });
    this.saveLocalData();
    return this.localData.contest;
  }

  // --- TEAM METHODS ---
  public async getAllTeams(): Promise<any[]> {
    if (this.isMongoConnected) {
      return await Team.find().sort({ teamNumber: 1 });
    }
    return [...this.localData.teams].sort((a, b) => a.teamNumber.localeCompare(b.teamNumber));
  }

  public async getTeamById(id: string): Promise<any> {
    if (this.isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        return await Team.findById(id);
      }
      return await Team.findOne({ teamNumber: id });
    }
    return this.localData.teams.find(t => t.id === id || t._id === id || t.teamNumber === id);
  }

  public async getTeamByNumber(teamNumber: string): Promise<any> {
    if (this.isMongoConnected) {
      return await Team.findOne({ teamNumber: teamNumber.trim().toUpperCase() });
    }
    return this.localData.teams.find(t => t.teamNumber.toUpperCase() === teamNumber.trim().toUpperCase());
  }

  public async createTeam(teamData: {
    teamNumber: string;
    teamName: string;
    teamLeader: string;
    thinker: string;
    coder: string;
    debugger: string;
    supporter: string;
    accessPin?: string;
  }): Promise<any> {
    if (this.isMongoConnected) {
      return await Team.create({
        ...teamData,
        teamNumber: teamData.teamNumber.trim().toUpperCase(),
        currentRound: 1,
        status: 'REGISTERED',
        registeredAt: new Date()
      });
    }
    const newTeam = {
      id: 'team_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      _id: 'team_' + Date.now(),
      ...teamData,
      teamNumber: teamData.teamNumber.trim().toUpperCase(),
      currentRound: 1,
      status: 'REGISTERED' as TeamStatus,
      registeredAt: new Date().toISOString()
    };
    this.localData.teams.push(newTeam);
    this.saveLocalData();
    return newTeam;
  }

  public async updateTeamRound(teamId: string, currentRound: RoundNumber, status: TeamStatus): Promise<any> {
    if (this.isMongoConnected) {
      return await Team.findByIdAndUpdate(teamId, { currentRound, status }, { new: true });
    }
    const team = this.localData.teams.find(t => t.id === teamId || t._id === teamId);
    if (team) {
      team.currentRound = currentRound;
      team.status = status;
      this.saveLocalData();
    }
    return team;
  }

  // --- QUESTION METHODS ---
  public async getQuestionsByRound(round: RoundNumber, sanitize: boolean = true): Promise<any[]> {
    let questions: any[];
    if (this.isMongoConnected) {
      questions = await Question.find({ round, active: true }).sort({ questionNumber: 1 });
    } else {
      questions = this.localData.questions
        .filter(q => q.round === round && q.active)
        .sort((a, b) => a.questionNumber - b.questionNumber);
    }

    if (sanitize) {
      return questions.map(q => {
        const obj = q.toObject ? q.toObject() : { ...q };
        delete obj.expectedAnswer;
        return obj;
      });
    }
    return questions;
  }

  public async getQuestion(round: RoundNumber, questionNumber: number): Promise<any> {
    if (this.isMongoConnected) {
      return await Question.findOne({ round, questionNumber, active: true });
    }
    return this.localData.questions.find(q => q.round === round && q.questionNumber === questionNumber && q.active);
  }

  public async getRoundCombinedCode(round: RoundNumber): Promise<string> {
    let questions: any[];
    if (this.isMongoConnected) {
      questions = await Question.find({ round, active: true }).sort({ questionNumber: 1 });
    } else {
      questions = this.localData.questions
        .filter(q => q.round === round && q.active)
        .sort((a, b) => a.questionNumber - b.questionNumber);
    }

    if (round === 1) {
      // 6 questions, 2 digits each -> 12 digits
      return questions.map(q => q.expectedAnswer.trim()).join('');
    } else if (round === 2) {
      // 2 questions, 3 digits each -> 6 digits
      return questions.map(q => q.expectedAnswer.trim()).join('');
    } else {
      // Round 3 final code
      return questions[0]?.expectedAnswer?.trim() || '390742';
    }
  }

  // --- SUBMISSIONS & COMPLETIONS ---
  public async recordSubmission(data: {
    teamId: string;
    round: RoundNumber;
    questionNumber?: number;
    answer: string;
    correct: boolean;
  }) {
    if (this.isMongoConnected) {
      return await Submission.create({
        ...data,
        submittedAt: new Date()
      });
    }
    const sub = {
      id: 'sub_' + Date.now(),
      ...data,
      submittedAt: new Date().toISOString()
    };
    this.localData.submissions.push(sub);
    this.saveLocalData();
    return sub;
  }

  public async recordRoundCompletion(data: {
    teamId: string;
    round: RoundNumber;
    completedAt: Date;
    elapsedTimeMs: number;
  }) {
    // Insert-only: an existing completion is authoritative and must never be
    // overwritten (frozen duration record).
    if (this.isMongoConnected) {
      return await RoundCompletion.findOneAndUpdate(
        { teamId: data.teamId, round: data.round },
        { $setOnInsert: data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const existingIdx = this.localData.roundCompletions.findIndex(
      rc => (rc.teamId === data.teamId || rc.teamId?.toString() === data.teamId) && rc.round === data.round
    );
    if (existingIdx >= 0) {
      return this.localData.roundCompletions[existingIdx];
    }
    const item = {
      id: 'rc_' + Date.now(),
      ...data,
      completedAt: data.completedAt.toISOString()
    };
    this.localData.roundCompletions.push(item);
    this.saveLocalData();
    return item;
  }

  public async getRoundCompletion(teamId: string, round: RoundNumber) {
    if (this.isMongoConnected) {
      return await RoundCompletion.findOne({ teamId, round });
    }
    return this.localData.roundCompletions.find(
      rc => (rc.teamId === teamId || rc.teamId?.toString() === teamId) && rc.round === round
    );
  }

  public async getAllRoundCompletions() {
    if (this.isMongoConnected) {
      return await RoundCompletion.find();
    }
    return this.localData.roundCompletions;
  }
}

export const dataStore = new DataStore();
