'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, storage } from '@/lib/api';
import { Users, ArrowLeft, Search, RefreshCw, Shield, CheckCircle2 } from 'lucide-react';

export default function AdminTeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await apiRequest('/teams');
      setTeams(res.teams || []);
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
    fetchTeams();
  }, [router]);

  const filtered = teams.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.teamNumber.toLowerCase().includes(q) ||
      t.teamName.toLowerCase().includes(q) ||
      t.teamLeader.toLowerCase().includes(q)
    );
  });

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
            <span>ROSTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight uppercase">
            REGISTERED TEAMS DIRECTORY
          </h1>
          <div className="text-xs text-muted-text mt-1">
            TOTAL ENROLLED SQUADS: <span className="text-primary-accent font-bold">{teams.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-text absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team number or name..."
              className="bg-background border border-border pl-8 pr-3 py-2 text-xs font-mono text-primary-text placeholder:text-muted-text/50 focus:outline-none focus:border-primary-accent w-64"
            />
          </div>

          <button
            onClick={fetchTeams}
            className="p-2 border border-border hover:border-primary-accent text-muted-text hover:text-primary-accent text-xs flex items-center gap-1 bg-surface"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Teams Table */}
      <div className="border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-surface-dark text-muted-text text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 border-r border-border w-24">TEAM NO.</th>
              <th className="py-2.5 px-4 border-r border-border">TEAM NAME</th>
              <th className="py-2.5 px-3 border-r border-border">LEADER</th>
              <th className="py-2.5 px-3 border-r border-border">THINKER</th>
              <th className="py-2.5 px-3 border-r border-border">CODER</th>
              <th className="py-2.5 px-3 border-r border-border">DEBUGGER</th>
              <th className="py-2.5 px-3 border-r border-border">SUPPORTER</th>
              <th className="py-2.5 px-3 border-r border-border text-center w-24">STAGE</th>
              <th className="py-2.5 px-3 text-center w-32">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-text">
                  [NO TEAMS MATCHING CURRENT SEARCH CRITERIA]
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/70 hover:bg-surface-highlight transition-colors">
                  <td className="py-2.5 px-3 border-r border-border/60 font-bold text-primary-accent">
                    {t.teamNumber}
                  </td>
                  <td className="py-2.5 px-4 border-r border-border/60 font-sans text-primary-text font-medium">
                    {t.teamName}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 font-sans text-muted-text">
                    {t.teamLeader}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 font-sans text-muted-text">
                    {t.thinker}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 font-sans text-muted-text">
                    {t.coder}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 font-sans text-muted-text">
                    {t.debugger}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 font-sans text-muted-text">
                    {t.supporter}
                  </td>
                  <td className="py-2.5 px-3 border-r border-border/60 text-center">
                    <span className="px-1.5 py-0.5 border border-border text-[10px] bg-background">
                      ROUND 0{t.currentRound}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        t.status === 'FINISHED'
                          ? 'bg-primary-accent text-primary-accent-contrast'
                          : t.status.startsWith('IN_')
                          ? 'text-primary-accent border border-primary-accent'
                          : 'text-muted-text border border-border'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
