'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ArrowRight, Trophy, Clock, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function Round1DashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
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
        const comp = await getRoundCompletion(1, currentTeam.teamNumber);
        setCompletion(comp);
      } catch (err) {
        router.push('/round/1');
        return;
      }

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
      await advanceRound(1, team.teamNumber);
      storage.setTeam({
        ...team,
        currentRound: 2,
        status: 'IN_ROUND_2'
      });
      router.push('/round/2');
    } catch (err: any) {
      router.push('/round/2');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [VERIFYING ROUND 01 TELEMETRY RECORD...]
      </div>
    );
  }

  // Find team row from leaderboard
  const teamRow = leaderboard.find(e => e.teamNumber === team?.teamNumber);
  const roundTime = completion?.formattedCompletionTime || teamRow?.formattedRound1Time || '--:--';
  const totalTime = teamRow?.formattedTotalTime || completion?.formattedCompletionTime || '--:--';
  const currentPos = teamRow ? teamRow.rank : (completion?.currentPosition || 1);

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Visual Style: CONTROL ROOM */}
      <div className="border-2 border-border bg-surface p-5 sm:p-8 shadow-sm">
        {/* Top Control Room Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-border gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary-accent tracking-widest uppercase border border-primary-accent/40 bg-primary-accent/10 px-2 py-0.5 font-bold">
                C//L 2026
              </span>
              <span className="text-[10px] text-muted-text tracking-widest uppercase">
                CONTROL ROOM TELEMETRY
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-text leading-none">
              ROUND 01 COMPLETE
            </h1>

            <p className="text-xs text-muted-text font-sans">
              Gate 01 Coding Lock has been verified by the authoritative server clock.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <VerifiedStamp label="VERIFIED ✓" size="lg" />
            <span className="text-[10px] text-muted-text uppercase">OFFICIAL SERVER AUDIT</span>
          </div>
        </div>

        {/* Dense Control Room Metrics Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 py-6 border-b border-border">
          {/* TEAM NUMBER */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TEAM NUMBER</div>
            <div className="text-xl font-bold text-primary-accent mt-1">
              {completion?.teamNumber || team?.teamNumber}
            </div>
          </div>

          {/* TEAM NAME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TEAM NAME</div>
            <div className="text-xs font-sans font-semibold text-primary-text truncate mt-1.5">
              {completion?.teamName || team?.teamName}
            </div>
          </div>

          {/* ROUND TIME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND TIME</div>
            <div className="text-xl font-bold text-primary-text mt-1">
              {roundTime}
            </div>
          </div>

          {/* TOTAL TIME */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TOTAL TIME</div>
            <div className="text-xl font-bold text-primary-accent mt-1">
              {totalTime}
            </div>
          </div>

          {/* QUESTIONS COMPLETED */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">QUESTIONS COMPLETED</div>
            <div className="text-xl font-bold text-primary-text mt-1">
              06 / 06
            </div>
          </div>

          {/* CURRENT POSITION */}
          <div className="p-3.5 bg-surface-dark border-2 border-primary-accent/80 col-span-2 lg:col-span-1">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">CURRENT POSITION</div>
            <div className="text-xl font-bold text-primary-accent mt-1">
              #{currentPos.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Continue Action */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-text font-sans leading-relaxed">
            Round 02 presents broken source files with runtime exceptions. Only the assigned squad Debugger should begin triage.
          </div>

          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shrink-0"
          >
            <span>{isAdvancing ? 'INITIALIZING GATE 02...' : 'PROCEED TO ROUND 02'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* LIVE LEADERBOARD (Dense Technical Scoreboard) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary-accent" />
            <h2 className="text-sm font-bold text-primary-text uppercase tracking-wider">
              LIVE LEADERBOARD (ROUND 01 STANDINGS)
            </h2>
          </div>
          <span className="text-[10px] text-muted-text">SERVER SYNCHRONIZED</span>
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
