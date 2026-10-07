import React from 'react';
import { LeaderboardEntry } from '@shared/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightTeamNumber?: string;
  showRoundBreakdown?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  highlightTeamNumber,
  showRoundBreakdown = true
}) => {
  return (
    <div className="w-full border border-border bg-surface font-mono overflow-x-auto select-none shadow-sm">
      <table className="w-full text-left border-collapse text-xs min-w-[720px]">
        <thead>
          <tr className="border-b border-border bg-surface-dark text-muted-text text-[11px] tracking-wider uppercase">
            <th className="py-2.5 px-3 border-r border-border text-center w-14 font-semibold">RANK</th>
            <th className="py-2.5 px-3 border-r border-border w-28 font-semibold">TEAM NO.</th>
            <th className="py-2.5 px-4 border-r border-border font-semibold">TEAM NAME</th>
            <th className="py-2.5 px-3 border-r border-border text-center w-28 font-semibold">CURRENT ROUND</th>
            {showRoundBreakdown && (
              <>
                <th className="py-2.5 px-3 border-r border-border text-right w-24 font-semibold">R01 TIME</th>
                <th className="py-2.5 px-3 border-r border-border text-right w-24 font-semibold">R02 TIME</th>
                <th className="py-2.5 px-3 border-r border-border text-right w-24 font-semibold">R03 TIME</th>
              </>
            )}
            <th className="py-2.5 px-3 border-r border-border text-right w-28 text-primary-accent font-semibold">TOTAL TIME</th>
            <th className="py-2.5 px-3 text-center w-32 font-semibold">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={showRoundBreakdown ? 9 : 6} className="py-8 text-center text-muted-text text-xs">
                [NO REGISTERED TEAMS ON SCOREBOARD RECORD]
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const isHighlighted = !!(highlightTeamNumber && entry.teamNumber.toUpperCase() === highlightTeamNumber.toUpperCase());
              const isFinished = entry.status === 'FINISHED';

              return (
                <tr
                  key={entry.teamNumber}
                  className={`border-b border-border/70 transition-colors ${
                    isHighlighted
                      ? 'bg-primary-accent/15 font-semibold text-primary-text'
                      : 'hover:bg-surface-highlight'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 border-r border-border/60 text-center font-bold">
                    {entry.rank === 1 ? (
                      <span className="inline-flex items-center justify-center text-primary-accent font-bold px-1 border border-primary-accent/50 bg-primary-accent/10">
                        #01
                      </span>
                    ) : (
                      <span className={entry.rank <= 3 ? 'text-primary-text font-semibold' : 'text-muted-text'}>
                        #{entry.rank.toString().padStart(2, '0')}
                      </span>
                    )}
                  </td>

                  {/* Team Number */}
                  <td className="py-2.5 px-3 border-r border-border/60 font-bold text-primary-accent tracking-wide">
                    {entry.teamNumber}
                    {isHighlighted && (
                      <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-primary-accent text-primary-accent-contrast uppercase">
                        YOU
                      </span>
                    )}
                  </td>

                  {/* Team Name */}
                  <td className="py-2.5 px-4 border-r border-border/60 font-sans text-primary-text text-sm">
                    {entry.teamName}
                  </td>

                  {/* Current Round */}
                  <td className="py-2.5 px-3 border-r border-border/60 text-center">
                    <span className="px-1.5 py-0.5 border border-border text-[10px] bg-surface-highlight">
                      ROUND 0{entry.currentRound}
                    </span>
                  </td>

                  {/* Round breakdown */}
                  {showRoundBreakdown && (
                    <>
                      <td className="py-2.5 px-3 border-r border-border/60 text-right text-muted-text font-mono">
                        {entry.formattedRound1Time}
                      </td>
                      <td className="py-2.5 px-3 border-r border-border/60 text-right text-muted-text font-mono">
                        {entry.formattedRound2Time}
                      </td>
                      <td className="py-2.5 px-3 border-r border-border/60 text-right text-muted-text font-mono">
                        {entry.formattedRound3Time}
                      </td>
                    </>
                  )}

                  {/* Total Official Time */}
                  <td className="py-2.5 px-3 border-r border-border/60 text-right font-bold text-primary-accent text-sm font-mono">
                    {entry.formattedTotalTime}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3 text-center">
                    {isFinished ? (
                      <span className="inline-block px-2 py-0.5 text-[10px] bg-primary-accent text-primary-accent-contrast font-bold tracking-wider uppercase border border-primary-accent">
                        FINISHED ✓
                      </span>
                    ) : entry.status === 'ROUND_2_COMPLETE' ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-surface-highlight border border-border text-primary-accent uppercase">
                        R2 PASSED
                      </span>
                    ) : entry.status === 'ROUND_1_COMPLETE' ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] bg-surface-highlight border border-border text-primary-accent uppercase">
                        R1 PASSED
                      </span>
                    ) : entry.status === 'IN_ROUND_3' ? (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] border border-warning text-warning uppercase bg-warning/10">
                        FINAL LOCK
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 text-[10px] border border-border text-muted-text uppercase bg-surface-highlight">
                        {entry.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
