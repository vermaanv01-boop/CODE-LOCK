'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminLeaderboard, storage } from '@/lib/api';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { BackButton } from '@/components/BackButton';
import { ArrowLeft, Trophy, RefreshCw, Radio } from 'lucide-react';

export default function AdminLeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchScoreboard = async () => {
    try {
      const res = await getAdminLeaderboard();
      setData(res);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = storage.getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 4000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Header bar */}
      <div className="border border-border bg-surface p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-muted-text uppercase tracking-widest mb-1">
            <Link href="/admin" className="text-primary-accent hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              <span>CONTROL ROOM</span>
            </Link>
            <span>/</span>
            <span>SUPERVISORY SCOREBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight uppercase">
            ADMIN LIVE SCOREBOARD
          </h1>
          <div className="text-xs text-muted-text mt-1">
            CONTEST STATUS: <span className="text-primary-accent font-bold uppercase">{data?.contest?.status || 'ACTIVE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <BackButton href="/admin" label="CONTROL ROOM" />

          <button
            onClick={fetchScoreboard}
            className="p-2 border border-border hover:border-primary-accent text-primary-accent text-xs flex items-center gap-1.5 bg-background transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>POLL SCOREBOARD</span>
          </button>
        </div>
      </div>

      <LeaderboardTable
        entries={data?.leaderboard || []}
        showRoundBreakdown={true}
      />
    </div>
  );
}
