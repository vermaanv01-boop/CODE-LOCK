import React from 'react';
import { LeaderboardEntry } from '@shared/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightTeamNumber?: string;
  showRoundBreakdown?: boolean;
}

const statusPill = (status: string) => {
  switch (status) {
    case 'FINISHED':
      return 'bg-accent-green text-primary-accent';
    case 'ROUND_2_COMPLETE':
    case 'ROUND_1_COMPLETE':
      return 'bg-accent-blue text-primary-accent';
    case 'IN_ROUND_3':
      return 'bg-accent-pink text-primary-accent';
    default:
      return 'bg-surface-highlight text-muted-text';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'FINISHED':
      return 'Finished';
    case 'ROUND_2_COMPLETE':
      return 'R2 cleared';
    case 'ROUND_1_COMPLETE':
      return 'R1 cleared';
    case 'IN_ROUND_3':
      return 'Final lock';
    default:
      return status.replace(/_/g, ' ');
  }
};

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  highlightTeamNumber,
  showRoundBreakdown = true,
}) => {
  return (
    <div className="table-scroll-container w-full rounded-md border border-border bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-highlight text-[10px] uppercase tracking-[0.12em] text-muted-text">
            <th scope="col" className="w-16 px-3 py-2.5 text-center font-semibold">Rank</th>
            <th scope="col" className="w-28 px-3 py-2.5 font-semibold">Team</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Name</th>
            <th scope="col" className="w-28 px-3 py-2.5 text-center font-semibold">Round</th>
            {showRoundBreakdown && (
              <>
                <th scope="col" className="w-24 px-3 py-2.5 text-right font-semibold">R01</th>
                <th scope="col" className="w-24 px-3 py-2.5 text-right font-semibold">R02</th>
                <th scope="col" className="w-24 px-3 py-2.5 text-right font-semibold">R03</th>
              </>
            )}
            <th scope="col" className="w-28 px-3 py-2.5 text-right font-semibold">Total</th>
            <th scope="col" className="w-32 px-3 py-2.5 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td
                colSpan={showRoundBreakdown ? 9 : 6}
                className="px-3 py-12 text-center text-xs text-muted-text"
              >
                No teams on the scoreboard yet.
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const isHighlighted = !!(
                highlightTeamNumber &&
                entry.teamNumber.toUpperCase() === highlightTeamNumber.toUpperCase()
              );

              return (
                <tr
                  key={entry.teamNumber}
                  className={`border-b border-border/70 transition-colors duration-150 ${
                    isHighlighted ? 'bg-accent-yellow/20 font-semibold' : 'hover:bg-surface-highlight'
                  }`}
                >
                  <td className="px-3 py-2.5 text-center font-mono tabular-nums">
                    {entry.rank <= 3 ? (
                      <span className="inline-flex min-w-8 items-center justify-center rounded-sm border border-border-strong bg-surface px-1.5 py-0.5 font-semibold text-primary-accent">
                        {entry.rank.toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <span className="text-muted-text">
                        {entry.rank.toString().padStart(2, '0')}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 font-mono font-semibold text-primary-accent">
                    {entry.teamNumber}
                    {isHighlighted && (
                      <span className="ml-1.5 rounded-sm bg-primary-accent px-1 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary-accent-contrast">
                        You
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-sm text-primary-text">{entry.teamName}</td>

                  <td className="px-3 py-2.5 text-center">
                    <span className="rounded-sm border border-border bg-surface-highlight px-1.5 py-0.5 text-[10px] tabular-nums">
                      R0{entry.currentRound}
                    </span>
                  </td>

                  {showRoundBreakdown && (
                    <>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-text">
                        {entry.formattedRound1Time}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-text">
                        {entry.formattedRound2Time}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-text">
                        {entry.formattedRound3Time}
                      </td>
                    </>
                  )}

                  <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-primary-accent">
                    {entry.formattedTotalTime}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(
                        entry.status
                      )}`}
                    >
                      {statusLabel(entry.status)}
                    </span>
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
