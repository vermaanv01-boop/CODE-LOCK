'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ArrowRight, Trophy, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Round2DashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [r1Completion, setR1Completion] = useState<any>(null);
  const [r2Completion, setR2Completion] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentTeam = storage.getTeam();
    if (!currentTeam) {
      router.push('/contest');
      return;
    }
    setTeam(currentTeam);

    const loadData = async () => {
      try {
        const comp2 = await getRoundCompletion(2, currentTeam.teamNumber);
        setR2Completion(comp2);
      } catch (err) {
        router.push('/round/2');
        return;
      }

      try {
        const comp1 = await getRoundCompletion(1, currentTeam.teamNumber);
        setR1Completion(comp1);
      } catch (err) {}

      try {
        const lbRes = await getLeaderboard();
        setLeaderboard(lbRes.leaderboard || []);
      } catch (err) {}

      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [router]);

  const handleContinue = async () => {
    setIsAdvancing(true);
    try {
      await advanceRound(2, team.teamNumber);
      storage.setTeam({
        ...team,
        currentRound: 3,
        status: 'IN_ROUND_3'
      });
      router.push('/round/3');
    } catch (err: any) {
      router.push('/round/3');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [COMPILING GATE 02 DEBUGGING SCOREBOARD RECORD...]
      </div>
    );
  }

  // Calculate official splits from leaderboard
  const teamRow = leaderboard.find(e => e.teamNumber === team?.teamNumber);
  const r1Time = r1Completion?.formattedCompletionTime || teamRow?.formattedRound1Time || '--:--';
  const totalTime = r2Completion?.formattedCompletionTime || teamRow?.formattedTotalTime || '--:--';

  let r2SplitFormatted = teamRow?.formattedRound2Time || '--:--';
  if (r1Completion?.completionTimeMs && r2Completion?.completionTimeMs) {
    const splitMs = Math.max(0, r2Completion.completionTimeMs - r1Completion.completionTimeMs);
    const secs = Math.floor(splitMs / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    r2SplitFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else if (r2Completion?.formattedCompletionTime) {
    r2SplitFormatted = r2Completion.formattedCompletionTime;
  }

  const currentPos = teamRow ? teamRow.rank : (r2Completion?.currentPosition || 1);

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Visual style: SCOREBOARD */}
      <div className="border-2 border-border bg-surface p-5 sm:p-8 shadow-sm">
        {/* Scoreboard Banner */}
        <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-border gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-warning tracking-widest uppercase border border-warning/40 bg-warning/10 px-2 py-0.5 font-bold">
                GATE 02 CLEARED
              </span>
              <span className="text-[10px] text-muted-text tracking-widest uppercase">
                OFFICIAL COMPETITION SCOREBOARD
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-text leading-none">
              ROUND 02 COMPLETE
            </h1>

            <p className="text-xs text-muted-text font-sans">
              All debugging defects resolved. Server clock split has been officially locked.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <VerifiedStamp label="VERIFIED ✓" size="lg" />
            <span className="text-[10px] text-muted-text uppercase">SPLIT AUDIT SECURED</span>
          </div>
        </div>

        {/* Dense Scoreboard Times Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 py-6 border-b border-border">
          {/* TEAM IDENTIFIER */}
          <div className="p-3.5 bg-background border border-border col-span-2 lg:col-span-1">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TEAM</div>
            <div className="text-xl font-bold text-primary-accent mt-1">
              {team?.teamNumber}
            </div>
            <div className="text-xs font-sans text-primary-text truncate mt-1">
              {team?.teamName}
            </div>
          </div>

          {/* ROUND 01 TIME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 01 TIME</div>
            <div className="text-2xl font-bold text-primary-text mt-1">
              {r1Time}
            </div>
            <div className="text-[10px] text-muted-text mt-1">CODING LOCK STAGE</div>
          </div>

          {/* ROUND 02 TIME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 02 TIME</div>
            <div className="text-2xl font-bold text-warning mt-1">
              {r2SplitFormatted}
            </div>
            <div className="text-[10px] text-muted-text mt-1">DEBUGGING SPLIT</div>
          </div>

          {/* TOTAL TIME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TOTAL TIME</div>
            <div className="text-2xl font-bold text-primary-accent mt-1">
              {totalTime}
            </div>
            <div className="text-[10px] text-muted-text mt-1">CUMULATIVE SERVER TIME</div>
          </div>

          {/* CURRENT POSITION */}
          <div className="p-3.5 bg-surface-dark border-2 border-warning/80 col-span-2 lg:col-span-1">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">CURRENT POSITION</div>
            <div className="text-2xl font-bold text-warning mt-1">
              #{currentPos.toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] text-muted-text mt-1">
              OF {leaderboard.length} TEAMS
            </div>
          </div>
        </div>

        {/* Advance to Round 3 Button */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-text font-sans leading-relaxed">
            Final stage preparation: Round 03 is the Final Lock. The Thinker, Coder, Debugger, and Supporter must synchronously reconstruct the master key.
          </div>

          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
          >
            <span>{isAdvancing ? 'INITIALIZING FINAL LOCK...' : 'CONTINUE TO ROUND 03'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* UPDATED LIVE LEADERBOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-bold text-primary-text uppercase tracking-wider">
              UPDATED SCOREBOARD (ROUND 02 STANDINGS)
            </h2>
          </div>
          <span className="text-[10px] text-muted-text">OFFICIAL SERVER AUDIT RECORD</span>
        </div>

        <LeaderboardTable
          entries={leaderboard}
          highlightTeamNumber={team?.teamNumber}
          showRoundBreakdown={true}
        />
      </div>
    </div>
  );
}
