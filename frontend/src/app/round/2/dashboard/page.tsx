'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Stat, LoadingState, SectionLabel } from '@/components/ui';
import { ArrowRight, Trophy } from 'lucide-react';

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
      storage.setTeam({ ...team, currentRound: 3, status: 'IN_ROUND_3' });
      router.push('/round/3');
    } catch (err: any) {
      router.push('/round/3');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (loading) return <LoadingState label="Verifying Round 02 record" />;

  const teamRow = leaderboard.find((e) => e.teamNumber === team?.teamNumber);
  const r1Time = r1Completion?.formattedCompletionTime || teamRow?.formattedRound1Time || '--:--';
  const totalTime = r2Completion?.formattedCompletionTime || teamRow?.formattedTotalTime || '--:--';

  let r2SplitFormatted = teamRow?.formattedRound2Time || '--:--';
  if (r1Completion?.completionTimeMs && r2Completion?.completionTimeMs) {
    const splitMs = Math.max(0, r2Completion.completionTimeMs - r1Completion.completionTimeMs);
    const secs = Math.floor(splitMs / 1000);
    r2SplitFormatted = `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60)
      .toString()
      .padStart(2, '0')}`;
  } else if (r2Completion?.formattedCompletionTime) {
    r2SplitFormatted = r2Completion.formattedCompletionTime;
  }

  const currentPos = teamRow ? teamRow.rank : (r2Completion?.currentPosition || 1);

  return (
    <div className="space-y-6">
      {/* Completion banner */}
      <div className="rounded-md border border-border bg-surface p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 md:flex-row md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-accent-pink px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-accent">
                Gate 02 cleared
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-text">
                Debugging Lock audit
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
              Round 02 complete
            </h1>
            <p className="text-xs leading-relaxed text-muted-text">
              All debugging defects resolved. The server clock split has been officially locked.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <VerifiedStamp label="Verified" size="lg" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-text">
              Split audit secured
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 py-6 lg:grid-cols-6">
          <Stat label="Team" value={r2Completion?.teamNumber || team?.teamNumber} accent="green" />
          <Stat label="Team name" value={r2Completion?.teamName || team?.teamName} />
          <Stat label="Round 01" value={r1Time} hint="Coding Lock" />
          <Stat label="Round 02" value={r2SplitFormatted} accent="pink" hint="Debugging split" />
          <Stat label="Total time" value={totalTime} accent="green" hint="Cumulative" />
          <Stat label="Position" value={`#${currentPos.toString().padStart(2, '0')}`} accent="yellow" hint={`of ${leaderboard.length}`} />
        </div>

        {/* Continue */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-relaxed text-muted-text">
            Round 03 is the Final Lock. The Thinker, Coder, Debugger, and Supporter must
            synchronously reconstruct the master key.
          </p>
          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded bg-primary-accent px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <span>{isAdvancing ? 'Initializing Final Lock…' : 'Continue to Round 03'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
              Leaderboard · Round 02 standings
            </h2>
          </div>
          <SectionLabel>Server synchronized</SectionLabel>
        </div>
        <LeaderboardTable entries={leaderboard} highlightTeamNumber={team?.teamNumber} showRoundBreakdown />
      </div>
    </div>
  );
}
