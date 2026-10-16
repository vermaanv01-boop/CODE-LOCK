'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundCompletion, getLeaderboard, advanceRound, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Stat, LoadingState, SectionLabel } from '@/components/ui';
import { ArrowRight, Trophy } from 'lucide-react';

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
      storage.setTeam({ ...team, currentRound: 2, status: 'IN_ROUND_2' });
      router.push('/round/2');
    } catch (err: any) {
      router.push('/round/2');
    } finally {
      setIsAdvancing(false);
    }
  };

  if (loading) return <LoadingState label="Verifying Round 01 record" />;

  const teamRow = leaderboard.find((e) => e.teamNumber === team?.teamNumber);
  const roundTime = completion?.formattedCompletionTime || teamRow?.formattedRound1Time || '--:--';
  const totalTime = teamRow?.formattedTotalTime || completion?.formattedCompletionTime || '--:--';
  const currentPos = teamRow ? teamRow.rank : (completion?.currentPosition || 1);

  return (
    <div className="space-y-6">
      {/* Completion banner */}
      <div className="rounded-md border border-border bg-surface p-5 sm:p-8">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 md:flex-row md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-accent-green px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-accent">
                C//L 2026
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-text">
                Control room
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-4xl">
              Round 01 complete
            </h1>
            <p className="text-xs leading-relaxed text-muted-text">
              Gate 01 Coding Lock has been verified by the authoritative server clock.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <VerifiedStamp label="Verified" size="lg" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-text">
              Official server audit
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 py-6 lg:grid-cols-6">
          <Stat label="Team" value={completion?.teamNumber || team?.teamNumber} accent="green" />
          <Stat label="Team name" value={completion?.teamName || team?.teamName} />
          <Stat label="Round time" value={roundTime} hint="Coding Lock" />
          <Stat label="Total time" value={totalTime} accent="green" hint="Cumulative" />
          <Stat label="Questions" value="06 / 06" hint="Completed" />
          <Stat label="Position" value={`#${currentPos.toString().padStart(2, '0')}`} accent="yellow" hint={`of ${leaderboard.length}`} />
        </div>

        {/* Continue */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-relaxed text-muted-text">
            Round 02 presents broken source files with runtime exceptions. Begin triage with your
            assigned Debugger.
          </p>
          <button
            onClick={handleContinue}
            disabled={isAdvancing}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded bg-primary-accent px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            <span>{isAdvancing ? 'Initializing Gate 02…' : 'Proceed to Round 02'}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
              Live leaderboard · Round 01
            </h2>
          </div>
          <SectionLabel>Server synchronized</SectionLabel>
        </div>
        <LeaderboardTable entries={leaderboard} highlightTeamNumber={team?.teamNumber} showRoundBreakdown />
      </div>
    </div>
  );
}
