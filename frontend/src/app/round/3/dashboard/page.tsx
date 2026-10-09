'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoundCompletion, getLeaderboard, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Trophy, CheckCircle2, Clock, Award, ShieldCheck } from 'lucide-react';

export default function Round3DashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [r1, setR1] = useState<any>(null);
  const [r2, setR2] = useState<any>(null);
  const [r3, setR3] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
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
        const comp3 = await getRoundCompletion(3, currentTeam.teamNumber);
        setR3(comp3);
      } catch (err) {
        router.push('/round/3');
        return;
      }

      try {
        const comp1 = await getRoundCompletion(1, currentTeam.teamNumber);
        setR1(comp1);
      } catch (err) {}

      try {
        const comp2 = await getRoundCompletion(2, currentTeam.teamNumber);
        setR2(comp2);
      } catch (err) {}

      try {
        const lbRes = await getLeaderboard();
        setLeaderboard(lbRes.leaderboard || []);
      } catch (err) {}

      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted-text">
        [GENERATING OFFICIAL FINAL COMPETITION CERTIFICATE & DOSSIER...]
      </div>
    );
  }

  // Find leaderboard row for official splits
  const row = leaderboard.find(e => e.teamNumber === team?.teamNumber);
  const r1Time = r1?.formattedCompletionTime || row?.formattedRound1Time || '--:--';

  let r2Split = row?.formattedRound2Time || '--:--';
  if (r1?.completionTimeMs && r2?.completionTimeMs) {
    const split2 = Math.max(0, r2.completionTimeMs - r1.completionTimeMs);
    const secs = Math.floor(split2 / 1000);
    r2Split = `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  }

  let r3Split = row?.formattedRound3Time || '--:--';
  if (r2?.completionTimeMs && r3?.completionTimeMs) {
    const split3 = Math.max(0, r3.completionTimeMs - r2.completionTimeMs);
    const secs = Math.floor(split3 / 1000);
    r3Split = `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
  }

  const totalTime = r3?.formattedCompletionTime || row?.formattedTotalTime || '--:--';
  const finalRank = row ? row.rank : (r3?.currentPosition || 1);

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Grand Completion Certificate Banner */}
      <div className="border-2 border-primary-accent bg-surface p-6 sm:p-10 relative overflow-hidden shadow-md">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b-2 border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary-accent-contrast bg-primary-accent font-bold tracking-widest uppercase px-2.5 py-0.5">
                OFFICIAL CONTEST RECORD
              </span>
              <span className="text-xs text-muted-text">
                FULL TOURNAMENT CLEARED
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-primary-text leading-none uppercase">
              CODE//LOCK
            </h1>

            <div className="text-base sm:text-lg font-bold text-primary-accent tracking-widest uppercase">
              CHALLENGE COMPLETE
            </div>

            <p className="text-xs sm:text-sm text-muted-text font-sans max-w-xl leading-relaxed">
              All three cryptographic and logic gates have been officially unlocked and verified by the organizer server clock.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <VerifiedStamp label="FINAL VERIFIED ✓" size="lg" />
            <div className="text-[10px] text-muted-text uppercase tracking-wider text-right">
              SHA-256 PARITY VERIFIED
            </div>
          </div>
        </div>

        {/* Squad Info & Round Breakdown Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 py-6 border-b border-border">
          {/* Team Moniker */}
          <div className="p-3.5 bg-background border border-border col-span-2">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">OFFICIAL SQUAD</div>
            <div className="text-2xl font-bold text-primary-accent mt-0.5">
              {team?.teamNumber}
            </div>
            <div className="text-sm text-primary-text font-sans truncate mt-1">
              {team?.teamName}
            </div>
          </div>

          {/* Round 01 */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 01</div>
            <div className="text-xl font-bold text-primary-text mt-1">{r1Time}</div>
            <div className="text-[9px] text-muted-text mt-1">CODING LOCK</div>
          </div>

          {/* Round 02 */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 02</div>
            <div className="text-xl font-bold text-warning mt-1">{r2Split}</div>
            <div className="text-[9px] text-muted-text mt-1">DEBUGGING</div>
          </div>

          {/* Round 03 */}
          <div className="p-3.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">ROUND 03</div>
            <div className="text-xl font-bold text-primary-accent mt-1">{r3Split}</div>
            <div className="text-[9px] text-muted-text mt-1">FINAL LOCK</div>
          </div>

          {/* Total & Final Rank */}
          <div className="p-3.5 bg-surface-dark border-2 border-primary-accent col-span-2 sm:col-span-1">
            <div className="text-[10px] text-muted-text uppercase tracking-wider">TOTAL / RANK</div>
            <div className="text-xl font-bold text-primary-accent mt-1">{totalTime}</div>
            <div className="text-sm font-bold text-primary-text mt-0.5">
              RANK #{finalRank.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Squad Members Credits */}
        <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-2.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase">THINKER</div>
            <div className="font-sans font-semibold text-primary-text mt-0.5">{team?.thinker}</div>
          </div>
          <div className="p-2.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase">CODER</div>
            <div className="font-sans font-semibold text-primary-text mt-0.5">{team?.coder}</div>
          </div>
          <div className="p-2.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase">DEBUGGER</div>
            <div className="font-sans font-semibold text-primary-text mt-0.5">{team?.debugger}</div>
          </div>
          <div className="p-2.5 bg-background border border-border">
            <div className="text-[10px] text-muted-text uppercase">SUPPORTER</div>
            <div className="font-sans font-semibold text-primary-text mt-0.5">{team?.supporter}</div>
          </div>
        </div>
      </div>

      {/* Final Official Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-accent" />
            <h2 className="text-base font-bold text-primary-text uppercase tracking-wider">
              FINAL TOURNAMENT SCOREBOARD
            </h2>
          </div>
          <span className="text-xs text-muted-text">OFFICIAL RECORDED RANKING</span>
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
