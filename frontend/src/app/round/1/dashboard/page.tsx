'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { ArrowRight, Trophy, Clock, CheckCircle2 } from 'lucide-react';

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
        // If not completed yet, route guard back to round 1
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
      // Update local team storage currentRound to 2
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
      <div className="py-20 text-center font-mono text-xs text-muted-text">
        [CALCULATING OFFICIAL ROUND 01 VERIFICATION RECORD...]
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-mono">
      {/* Distinctive Round 01 Completion Screen */}
      <div className="border-2 border-border bg-surface p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <span className="text-[10px] text-primary-accent tracking-widest uppercase border border-primary-accent/40 px-2 py-0.5">
              GATE 01 CLEARED
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary-text">
              ROUND 01 COMPLETE
            </h1>
            <p className="text-xs text-muted-text font-sans">
              12-digit Coding Lock decrypted and verified by official contest server.
            </p>
          </div>

          <div>
            <VerifiedStamp label="VERIFIED ✓" size="lg" />
          </div>
        </div>

        {/* Squad Metrics Dashboard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-border">
          {/* Team Moniker */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TEAM</div>
            <div className="text-xl font-bold text-primary-accent mt-0.5">
              {completion?.teamNumber || team?.teamNumber}
            </div>
            <div className="text-xs text-primary-text font-sans truncate mt-0.5">
              {completion?.teamName || team?.teamName}
            </div>
          </div>

          {/* Completion Time */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">COMPLETION TIME</div>
            <div className="text-2xl font-bold text-primary-text mt-0.5">
              {completion?.formattedCompletionTime || '--:--'}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              OFFICIAL SERVER ELAPSED
            </div>
          </div>

          {/* Current Position */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">CURRENT POSITION</div>
            <div className="text-2xl font-bold text-primary-accent mt-0.5">
              #{completion?.currentPosition ? completion.currentPosition.toString().padStart(2, '0') : '01'}
            </div>
            <div className="text-[10px] text-muted-text mt-0.5">
              OF {completion?.totalTeams || leaderboard.length} TEAMS
            </div>
          </div>

          {/* Questions Solved */}
          <div className="p-4 bg-[#11110F] border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">QUESTIONS</div>
            <div className="text-2xl font-bold text-primary-text mt-0.5">
              06 / 06
            </div>
            <div className="text-[10px] text-primary-accent mt-0.5">
              ALL UNLOCKED
            </div>
          </div>
        </div>

        {/* Advance Action Callout */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-text font-sans">
            Ready for Gate 02? Round 02 presents broken runtime algorithms that require debugger intervention.
          </div>

          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-accent text-background font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>{isAdvancing ? 'UNLOCKING GATE 02...' : 'CONTINUE TO ROUND 02'}</span>
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
              LIVE LEADERBOARD (ROUND 01 STANDINGS)
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
