'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  UserPlus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert,
  Terminal,
  Activity
} from 'lucide-react';
import { apiRequest, adminRegisterTeam, adminRemoveTeam, storage } from '@/lib/api';

interface TeamMemberForm {
  teamNumber: string;
  teamName: string;
  teamLeader: string;
  thinker: string;
  coder: string;
  debugger: string;
  supporter: string;
  stageOption: string;
}

const initialFormState: TeamMemberForm = {
  teamNumber: '',
  teamName: '',
  teamLeader: '',
  thinker: '',
  coder: '',
  debugger: '',
  supporter: '',
  stageOption: 'AUTO'
};

export default function AdminTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any | null>(null);
  const [formData, setFormData] = useState<TeamMemberForm>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status message notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    if (searchParams.get('action') === 'register') {
      setShowRegisterModal(true);
    }
  }, [router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      let customRound: number | undefined;
      let customStatus: string | undefined;

      if (formData.stageOption === 'REGISTERED') {
        customRound = 1;
        customStatus = 'REGISTERED';
      } else if (formData.stageOption === 'ROUND_1') {
        customRound = 1;
        customStatus = 'IN_ROUND_1';
      } else if (formData.stageOption === 'ROUND_2') {
        customRound = 2;
        customStatus = 'IN_ROUND_2';
      } else if (formData.stageOption === 'ROUND_3') {
        customRound = 3;
        customStatus = 'IN_ROUND_3';
      }

      const res = await adminRegisterTeam({
        teamNumber: formData.teamNumber.trim(),
        teamName: formData.teamName.trim(),
        teamLeader: formData.teamLeader.trim(),
        thinker: formData.thinker.trim(),
        coder: formData.coder.trim(),
        debugger: formData.debugger.trim(),
        supporter: formData.supporter.trim(),
        currentRound: customRound,
        status: customStatus
      });

      setNotification({
        type: 'success',
        text: `SQUAD ${res.team?.teamNumber || formData.teamNumber.toUpperCase()} (${formData.teamName}) SUCCESSFULLY ENROLLED!`
      });
      setShowRegisterModal(false);
      setFormData(initialFormState);
      await fetchTeams();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to register squad under administrative control.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    setDeleting(true);
    setNotification(null);

    try {
      const identifier = teamToDelete.id || teamToDelete.teamNumber;
      const res = await adminRemoveTeam(identifier);

      setNotification({
        type: 'success',
        text: res.message || `SQUAD ${teamToDelete.teamNumber} (${teamToDelete.teamName}) HAS BEEN PERMANENTLY REMOVED.`
      });
      setTeamToDelete(null);
      await fetchTeams();
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || `Failed to remove squad ${teamToDelete.teamNumber}.`
      });
    } finally {
      setDeleting(false);
    }
  };

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
            <span>ROSTER CONTROLLER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight uppercase">
            SQUAD DIRECTORY & CONTROL
          </h1>
          <div className="text-xs text-muted-text mt-1">
            TOTAL ENROLLED SQUADS: <span className="text-primary-accent font-bold">{teams.length}</span>
            <span className="mx-2 text-border">|</span>
            ADMINISTRATIVE DISCRETION ACTIVE
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-text absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team number or name..."
              className="bg-background border border-border pl-8 pr-3 py-2 text-xs font-mono text-primary-text placeholder:text-muted-text/50 focus:outline-none focus:border-primary-accent w-56 sm:w-64"
            />
          </div>

          <button
            onClick={() => {
              setFormData(initialFormState);
              setShowRegisterModal(true);
            }}
            className="px-3.5 py-2 border border-primary-accent bg-primary-accent/10 hover:bg-primary-accent hover:text-primary-accent-contrast text-primary-accent text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ENROLL SQUAD</span>
          </button>

          <button
            onClick={fetchTeams}
            title="Refresh Squad Roster"
            className="p-2 border border-border hover:border-primary-accent text-muted-text hover:text-primary-accent text-xs flex items-center gap-1 bg-surface transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 text-xs flex items-center justify-between gap-2 border transition-all ${
            notification.type === 'success'
              ? 'bg-primary-accent/10 border-primary-accent text-primary-accent'
              : 'bg-error/10 border-error text-error'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="font-medium tracking-wide">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted-text hover:text-primary-text p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Teams Table */}
      <div className="border border-border bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-xs min-w-[850px]">
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
              <th className="py-2.5 px-3 border-r border-border text-center w-32">STATUS</th>
              <th className="py-2.5 px-3 text-center w-28">ADMIN ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-text">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Terminal className="w-6 h-6 text-muted-text/40" />
                    <span>[NO TEAMS MATCHING CURRENT SEARCH CRITERIA]</span>
                  </div>
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
                  <td className="py-2.5 px-3 border-r border-border/60 text-center">
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
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => setTeamToDelete(t)}
                      title={`Remove Squad ${t.teamNumber}`}
                      className="px-2 py-1 border border-border hover:border-error text-muted-text hover:text-error text-[10px] transition-colors inline-flex items-center gap-1 bg-background"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>REMOVE</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: REGISTER SQUAD (ADMIN OVERRIDE) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-surface border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary-accent" />
                <h2 className="text-base font-bold text-primary-text uppercase tracking-wider">
                  ENROLL SQUAD (ADMINISTRATIVE OVERRIDE)
                </h2>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-muted-text hover:text-primary-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-muted-text bg-background p-3 border border-border">
              <p>
                <strong className="text-primary-accent">ADMIN PRIVILEGE:</strong> You can register squads at any time during the event, regardless of contest lifecycle locks.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    SQUAD / TEAM NUMBER *
                  </label>
                  <input
                    type="text"
                    name="teamNumber"
                    required
                    value={formData.teamNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. T-04 or T04"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    TEAM NAME *
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    required
                    value={formData.teamName}
                    onChange={handleInputChange}
                    placeholder="e.g. Cyber Knights"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    TEAM LEADER *
                  </label>
                  <input
                    type="text"
                    name="teamLeader"
                    required
                    value={formData.teamLeader}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    THINKER (ALGORITHM SPECIALIST) *
                  </label>
                  <input
                    type="text"
                    name="thinker"
                    required
                    value={formData.thinker}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    CODER (IMPLEMENTATION) *
                  </label>
                  <input
                    type="text"
                    name="coder"
                    required
                    value={formData.coder}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    DEBUGGER (FAULT ANALYSIS) *
                  </label>
                  <input
                    type="text"
                    name="debugger"
                    required
                    value={formData.debugger}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                    SUPPORTER (STRATEGY) *
                  </label>
                  <input
                    type="text"
                    name="supporter"
                    required
                    value={formData.supporter}
                    onChange={handleInputChange}
                    placeholder="Full name"
                    className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-muted-text uppercase tracking-wider mb-1">
                  INITIAL LIFECYCLE STAGE
                </label>
                <select
                  name="stageOption"
                  value={formData.stageOption}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-border px-3 py-2 text-xs font-mono text-primary-text focus:outline-none focus:border-primary-accent"
                >
                  <option value="AUTO">Auto-Detect (Match current contest status - Recommended)</option>
                  <option value="REGISTERED">Registered (Waiting to Start)</option>
                  <option value="ROUND_1">Round 1 (IN_ROUND_1)</option>
                  <option value="ROUND_2">Round 2 (IN_ROUND_2)</option>
                  <option value="ROUND_3">Round 3 (IN_ROUND_3)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-border text-xs text-muted-text hover:text-primary-text hover:border-primary-text transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-primary-accent bg-primary-accent text-primary-accent-contrast text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'ENROLLING SQUAD...' : 'ENROLL SQUAD NOW'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE SQUAD */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface border border-error/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-error border-b border-border pb-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <h2 className="text-base font-bold uppercase tracking-wider">
                CONFIRM SQUAD REMOVAL
              </h2>
            </div>

            <div className="space-y-3 text-xs text-primary-text">
              <p>
                Are you sure you want to permanently remove squad <strong className="text-primary-accent">{teamToDelete.teamNumber}</strong> ({teamToDelete.teamName})?
              </p>
              <div className="bg-background border border-error/30 p-3 text-muted-text text-[11px] space-y-1">
                <div>• Leader: <span className="text-primary-text">{teamToDelete.teamLeader}</span></div>
                <div>• Current Stage: <span className="text-primary-accent">ROUND 0{teamToDelete.currentRound} ({teamToDelete.status})</span></div>
                <div className="text-error font-medium pt-1">
                  ⚠ This action will immediately purge this team and all their round submissions and leaderboard telemetry from the server.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 border border-border text-xs text-muted-text hover:text-primary-text transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 border border-error bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? 'REMOVING...' : 'PERMANENTLY REMOVE SQUAD'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
