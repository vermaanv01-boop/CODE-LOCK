'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getContestStatus, apiRequest, storage } from '@/lib/api';
import { VerifiedStamp } from '@/components/VerifiedStamp';
import { 
  Terminal, 
  Lock, 
  ShieldAlert, 
  Cpu, 
  ArrowRight, 
  Users, 
  Radio, 
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [contest, setContest] = useState<any>(null);
  const [teamNumberInput, setTeamNumberInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTeam, setActiveTeam] = useState<any>(null);

  useEffect(() => {
    setActiveTeam(storage.getTeam());
    getContestStatus().then(setContest).catch(() => {});
  }, []);

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!teamNumberInput.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/team/login', {
        method: 'POST',
        body: JSON.stringify({ teamNumber: teamNumberInput.trim().toUpperCase() })
      });
      storage.setTeam(res.team);
      setActiveTeam(res.team);
      router.push('/contest');
    } catch (err: any) {
      setLoginError(err.message || 'Team number not found.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Hero / Terminal Banner */}
      <section className="border border-border bg-surface p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2 py-0.5 bg-primary-accent text-background font-bold tracking-widest uppercase">
                EVENT SPECIFICATION
              </span>
              <span className="text-xs font-mono text-muted-text">
                HOST REVISION: 2026.04
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-mono font-bold tracking-tighter text-primary-text leading-none">
              CODE//LOCK
            </h1>

            <p className="font-mono text-primary-accent text-sm tracking-widest uppercase">
              THINK. CODE. UNLOCK. DEBUG.
            </p>

            <p className="font-sans text-muted-text text-sm sm:text-base leading-relaxed">
              Offline-first full-stack team coding, debugging, and logic contest platform. 
              Designed for closed LAN environments without external cloud or internet connectivity.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-muted-text">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary-accent inline-block"></span>
                4-MEMBER SPECIALIZED SQUAD
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary-accent inline-block"></span>
                OFFICIAL SERVER TIMESTAMPING
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary-accent inline-block"></span>
                NO RUNTIME CLOUD DEPENDENCY
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between self-stretch">
            <VerifiedStamp label="OFFICIAL EVENT" size="lg" />
            
            <div className="mt-6 p-3 border border-border bg-[#11110F] text-right font-mono text-xs w-full sm:w-auto">
              <div className="text-[10px] text-muted-text tracking-widest uppercase">ORGANIZER STATUS</div>
              <div className="text-sm font-bold text-primary-accent mt-0.5">
                {contest?.status || 'CONNECTING...'}
              </div>
              <div className="text-[10px] text-muted-text mt-1">
                PORT 5000 / REST ENGINE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Team Access Console + Round Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Team Terminal Access */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-border bg-surface p-6 font-mono">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-text">
                <Terminal className="w-4 h-4 text-primary-accent" />
                <span>TERMINAL ACCESS</span>
              </div>
              <span className="text-[10px] text-muted-text">PORTAL #01</span>
            </div>

            {activeTeam ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#11110F] border border-border space-y-2">
                  <div className="text-[10px] text-muted-text uppercase tracking-widest">CONNECTED SQUAD</div>
                  <div className="text-lg font-bold text-primary-accent">{activeTeam.teamNumber}</div>
                  <div className="text-xs font-sans text-primary-text">{activeTeam.teamName}</div>
                  <div className="text-[11px] text-muted-text pt-2 border-t border-border/60 flex justify-between">
                    <span>ROUND: 0{activeTeam.currentRound}</span>
                    <span className="text-primary-accent uppercase">{activeTeam.status}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/contest"
                    className="flex-1 py-2.5 bg-primary-accent text-background font-bold text-xs text-center flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <span>ENTER CONTEST TERMINAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      storage.clearTeam();
                      setActiveTeam(null);
                    }}
                    className="px-3 py-2.5 border border-border text-xs text-muted-text hover:text-error hover:border-error transition-colors"
                  >
                    DISCONNECT
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <p className="text-xs text-muted-text leading-relaxed">
                  Enter your organizer-assigned Team Number (e.g., <span className="text-primary-text font-bold">T-001</span>) to access your squad console.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-text block">
                    TEAM IDENTIFIER
                  </label>
                  <input
                    type="text"
                    value={teamNumberInput}
                    onChange={(e) => setTeamNumberInput(e.target.value.toUpperCase())}
                    placeholder="e.g. T-027"
                    className="w-full bg-[#11110F] border border-border p-2.5 text-sm font-mono text-primary-text uppercase placeholder:text-muted-text/50 focus:outline-none focus:border-primary-accent"
                  />
                </div>

                {loginError && (
                  <div className="p-2.5 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-primary-accent text-background font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE TEAM'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-text">
                  <span>New squad?</span>
                  {contest?.status === 'NOT_STARTED' ? (
                    <Link href="/register" className="text-primary-accent hover:underline">
                      Register Team Sheet →
                    </Link>
                  ) : (
                    <span className="text-warning text-[10px] uppercase">
                      Registration Locked
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* LAN Connection Instructions Box */}
          <div className="border border-border bg-[#141412] p-5 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-primary-text font-bold text-[11px] uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-primary-accent" />
              <span>PRIVATE LAN / EVENT CONNECTIVITY</span>
            </div>
            <p className="text-muted-text text-[11px] leading-relaxed">
              Participants on the contest Wi-Fi/Ethernet switch should browse to the Organizer Machine LAN IP:
            </p>
            <div className="bg-[#0F0F0D] p-2 border border-border text-primary-accent text-[12px] select-all">
              http://[ORGANIZER-LAN-IP]:3000
            </div>
            <p className="text-[10px] text-muted-text/80">
              * Official clock synchronization occurs over HTTP with zero external WAN dependency.
            </p>
          </div>
        </div>

        {/* Right Column: Round Locks & Architecture */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-border bg-surface p-6 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-primary-text tracking-wider uppercase">
                CONTEST SEQUENCE & ROUND LOCKS
              </span>
              <span className="text-[10px] text-muted-text">3 DISCIPLINE GATES</span>
            </div>

            {/* Gate 1 */}
            <div className="p-4 border border-border bg-[#121210] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-surface text-primary-accent text-[10px] font-bold border border-border">
                    ROUND 01
                  </span>
                  <span className="font-bold text-primary-text text-sm">CODING LOCK</span>
                </div>
                <span className="text-xs text-muted-text">6 QUESTIONS / 2 DIGITS EACH</span>
              </div>
              <p className="text-xs font-sans text-muted-text">
                Six algorithmic and data structure problems. Each problem produces a 2-digit numeric output. 
                Concatenate Q1 through Q6 in order to forge the 12-digit Round 1 unlock key.
              </p>
              <div className="text-[11px] text-muted-text/80 pt-1 border-t border-border/40 flex justify-between">
                <span>UNLOCK KEY FORMAT: [XX-XX-XX-XX-XX-XX]</span>
                <span className="text-primary-accent">12 DIGITS</span>
              </div>
            </div>

            {/* Gate 2 */}
            <div className="p-4 border border-border bg-[#121210] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-surface text-warning text-[10px] font-bold border border-border">
                    ROUND 02
                  </span>
                  <span className="font-bold text-primary-text text-sm">DEBUGGING LOCK</span>
                </div>
                <span className="text-xs text-muted-text">2 BROKEN PROGRAMS / 3 DIGITS EACH</span>
              </div>
              <p className="text-xs font-sans text-muted-text">
                Two intentionally broken code implementations with pointer slips, overflow traps, or boundary logic bugs. 
                Fix the bugs and run the payload to extract two 3-digit outputs, concatenated into a 6-digit key.
              </p>
              <div className="text-[11px] text-muted-text/80 pt-1 border-t border-border/40 flex justify-between">
                <span>UNLOCK KEY FORMAT: [XXX-XXX]</span>
                <span className="text-warning">6 DIGITS</span>
              </div>
            </div>

            {/* Gate 3 */}
            <div className="p-4 border border-border bg-[#121210] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-surface text-error text-[10px] font-bold border border-border">
                    ROUND 03
                  </span>
                  <span className="font-bold text-primary-text text-sm">THE FINAL LOCK</span>
                </div>
                <span className="text-xs text-muted-text">SQUAD LOGIC RECONSTRUCTION</span>
              </div>
              <p className="text-xs font-sans text-muted-text">
                Multi-role synchronous extraction challenge. The Thinker, Coder, Debugger, and Supporter must each 
                extract their distinct cryptographic matrix shard to synthesize the master completion sequence.
              </p>
              <div className="text-[11px] text-muted-text/80 pt-1 border-t border-border/40 flex justify-between">
                <span>UNLOCK KEY FORMAT: MASTER CIPHER</span>
                <span className="text-error">FINAL VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Quick link to live scoreboard */}
          <div className="flex items-center justify-between p-4 border border-border bg-surface font-mono text-xs">
            <div>
              <div className="font-bold text-primary-text">OFFICIAL LIVE SCOREBOARD</div>
              <div className="text-muted-text text-[11px]">Server-ordered team rankings & official round split times.</div>
            </div>
            <Link
              href="/leaderboard"
              className="px-4 py-2 border border-border hover:border-primary-accent text-primary-accent transition-colors"
            >
              VIEW SCOREBOARD →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
