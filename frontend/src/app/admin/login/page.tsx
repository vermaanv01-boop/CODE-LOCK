'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, storage } from '@/lib/api';
import { Shield, Key, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please provide administrative credentials.');
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      const res = await apiRequest('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
      });

      storage.setAdminToken(res.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Administrative authentication rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="max-w-md mx-auto my-14 select-none font-mono">
      <div className="border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-border pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-muted-text uppercase tracking-widest font-semibold">
              <Shield className="w-3.5 h-3.5 text-primary-accent" />
              <span>ORGANIZER CONSOLE</span>
            </div>
            <h1 className="text-2xl font-bold text-primary-text mt-1">ADMIN LOGIN</h1>
          </div>
          <span className="text-[10px] text-primary-accent border border-primary-accent/40 px-2 py-0.5 bg-primary-accent/10">
            AUTHORIZED
          </span>
        </div>

        <p className="text-xs text-muted-text font-sans leading-relaxed">
          Access restricted to contest organizers. Credentials authenticate against Express server password hash.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-text block font-semibold">
              OPERATOR USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
              className="w-full bg-background border border-border p-2.5 text-sm font-mono text-primary-text focus:outline-none focus:border-primary-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-text block font-semibold">
              AUTHORIZATION SECRET
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-background border border-border p-2.5 text-sm font-mono text-primary-text focus:outline-none focus:border-primary-accent"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-error/10 border border-error text-error text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-accent text-primary-accent-contrast font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'AUTHENTICATING ON SERVER...' : 'ACCESS CONTROL ROOM'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted-text">
            <span>Default configured operator:</span>
            <span className="text-primary-text font-mono font-bold">admin / admin123</span>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            className="w-full py-1.5 px-2 border border-border hover:border-primary-accent text-[11px] text-primary-accent hover:bg-primary-accent/10 transition-colors uppercase font-semibold"
          >
            [ AUTO-FILL DEFAULT CREDENTIALS ]
          </button>
        </div>
      </div>
    </div>
  );
}
