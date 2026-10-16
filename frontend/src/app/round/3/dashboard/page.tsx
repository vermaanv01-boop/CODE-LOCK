'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRoundCompletion, getLeaderboard, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Stat, LoadingState, SectionLabel } from '@/components/ui';
import { Trophy, Award } from 'lucide-react';

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
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          storage.clearSession();
          router.replace('/login');
          return;
        }
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

  if (loading) return <LoadingState label="Generating official final record" />;

  const row = leaderboard.find((e) => e.teamNumber === team?.teamNumber);
  // Per-round durations are stored independently (not cumulative).
  const r1Time = r1?.formattedCompletionTime || row?.formattedRound1Time || '--:--';
  const r2Split = r2?.formattedCompletionTime || row?.formattedRound2Time || '--:--';
  const r3Split = r3?.formattedCompletionTime || row?.formattedRound3Time || '--:--';
  const totalTime = row?.formattedTotalTime || '--:--';
  const finalRank = row ? row.rank : (r3?.currentPosition || 1);

  return (
    <div className="space-y-6">
      {/* Completion certificate */}
      <div className="rounded-md border-2 border-primary-accent/50 bg-surface p-5 sm:p-10">
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 md:flex-row md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-primary-accent px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-accent-contrast">
                Official contest record
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-text">
                Full tournament cleared
              </span>
            </div>

            <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary-text sm:text-5xl">
              CODE<span className="text-muted-text">//</span>LOCK
            </h1>
            <div className="font-serif text-base font-semibold uppercase tracking-[0.18em] text-primary-accent sm:text-lg">
              Challenge complete
            </div>

            <p className="max-w-xl text-sm leading-relaxed text-muted-text">
              All three cryptographic and logic gates have been officially unlocked and verified by
              the organizer server clock.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <VerifiedStamp label="Final verified" size="lg" />
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-text md:text-right">
              Server parity verified
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 py-6 lg:grid-cols-6">
          <Stat label="Official squad" value={r3?.teamNumber || team?.teamNumber} accent="green" hint={r3?.teamName || team?.teamName} />
          <Stat label="Round 01" value={r1Time} hint="Coding Lock" />
          <Stat label="Round 02" value={r2Split} accent="pink" hint="Debugging" />
          <Stat label="Round 03" value={r3Split} accent="yellow" hint="Final Lock" />
          <Stat label="Total time" value={totalTime} accent="green" hint="Active rounds" />
          <Stat label="Final rank" value={`#${finalRank.toString().padStart(2, '0')}`} accent="blue" hint={`of ${leaderboard.length}`} />
        </div>

        {/* Squad credits */}
        <div className="border-t border-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary-accent" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-text">
              Squad credits
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              ['Thinker', team?.thinker, 'green'],
              ['Coder', team?.coder, 'blue'],
              ['Debugger', team?.debugger, 'pink'],
              ['Supporter', team?.supporter, 'yellow'],
            ].map(([role, name, accent]) => (
              <div key={role as string} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.1em] text-muted-text">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      accent === 'green'
                        ? 'bg-success'
                        : accent === 'blue'
                        ? 'bg-accent-blue'
                        : accent === 'pink'
                        ? 'bg-accent-pink'
                        : 'bg-accent-yellow'
                    }`}
                    aria-hidden="true"
                  />
                  {role}
                </div>
                <div className="mt-1 truncate font-semibold text-primary-text">{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final leaderboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-primary-text">
              Final tournament scoreboard
            </h2>
          </div>
          <SectionLabel>Official recorded ranking</SectionLabel>
        </div>
        <LeaderboardTable entries={leaderboard} highlightTeamNumber={team?.teamNumber} showRoundBreakdown />
      </div>
    </div>
  );
}
