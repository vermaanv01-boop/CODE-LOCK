'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ArrowRight, Trophy, Clock, CheckCircle2 } from 'lucide-react';

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
        // Not completed yet -> route guard to round 2
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
      <div className="py-20 text-center font-mono text-xs text-muted-text">
        [VERIFYING GATE 02 COMPLETION DOSSIER...]
      </div>
    );
  }

  // Calculate split and total time
  const currentLeaderboardEntry = leaderboard.find(e => e.teamNumber === team?.teamNumber);
  const r1Time = r1Completion?.formattedCompletionTime || currentLeaderboardEntry?.formattedRound1Time || '--:--';
  const r2TotalTime = r2Completion?.formattedCompletionTime || currentLeaderboardEntry?.formattedTotalTime || '--:--';

  // Compute Round 2 relative split time
  let r2SplitFormatted = '--:--';
  if (r1Completion?.completionTimeMs && r2Completion?.completionTimeMs) {
    const splitMs = Math.max(0, r2Completion.completionTimeMs - r1Completion.completionTimeMs);
    const secs = Math.floor(splitMs / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    r2SplitFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else if (r2Completion?.formattedCompletionTime) {
    r2SplitFormatted = r2Completion.formattedCompletionTime;
  }

  return (
    <div className="space-y-8 select-none font-mono">
      {/* Distinctive Round 02 Completion Screen */}
      <div className="border-2 border-border bg-surface p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <span className="text-[10px] text-warning tracking-widest uppercase border border-warning/40 px-2 py-0.5">
              GATE 02 CLEARED
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary-text">
              ROUND 02 COMPLETE
            </h1>
            <p className="text-xs text-muted-text font-sans">
              6-digit Debugging Lock repaired and verified by official contest server.
            </p>
          </div>

          <div>
            <VerifiedStamp label="VERIFIED ✓" size="lg" />
          </div>
        </div>

        {/* Squad Metrics Dashboard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-6 border-b border-border">
          {/* Team Moniker */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TEAM</div>
            <div className="text-xl font-bold text-primary-accent mt-0.5">
              {r2Completion?.teamNumber || team?.teamNumber}
            </div>
            <div className="text-xs text-primary-text font-sans truncate mt-0.5">
              {r2Completion?.teamName || team?.teamName}
            </div>
          </div>

          {/* Round 01 Time */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 01 TIME</div>
            <div className="text-xl font-bold text-primary-text mt-0.5">
              {r1Time}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              STAGE 01 RECORD
            </div>
          </div>

          {/* Round 02 Time (Split) */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 02 TIME</div>
            <div className="text-xl font-bold text-warning mt-0.5">
              {r2SplitFormatted}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              STAGE 02 SPLIT
            </div>
          </div>

          {/* Total Elapsed Time */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TOTAL TIME</div>
            <div className="text-xl font-bold text-primary-accent mt-0.5">
              {r2TotalTime}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              CUMULATIVE SERVER TIME
            </div>
          </div>

          {/* Current Position */}
          <div className="p-4 bg-[#11110F] border border-border col-span-2 sm:col-span-1">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">CURRENT POSITION</div>
            <div className="text-xl font-bold text-primary-accent mt-0.5">
              #{r2Completion?.currentPosition ? r2Completion.currentPosition.toString().padStart(2, '0') : '01'}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              OF {r2Completion?.totalTeams || leaderboard.length} TEAMS
            </div>
          </div>
        </div>

        {/* Advance Action Callout */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-text font-sans">
            Proceed to the final confrontation. Round 03 is the Final Lock requiring synchronized 4-role collaboration.
          </div>

          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-accent text-background font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>{isAdvancing ? 'INITIALIZING FINAL LOCK...' : 'CONTINUE TO ROUND 03'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Server Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary-accent" />
            <h2 className="text-base font-bold text-primary-text uppercase tracking-wider">
              UPDATED LIVE LEADERBOARD (ROUND 02 STANDINGS)
            </h2>
          </div>
          <span className="text-[10px] text-muted-text">OFFICIAL SERVER TIME SYNCHRONIZED</span>
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
