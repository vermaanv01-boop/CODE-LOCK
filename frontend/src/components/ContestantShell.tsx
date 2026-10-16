'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { ContestantSidebar } from '@/components/ContestantSidebar';

export const ContestantShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-primary-text">
      <Header onMenuToggle={() => setMenuOpen((o) => !o)} menuOpen={menuOpen} />

      <div className="flex w-full flex-1">
        <ContestantSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">CODE//LOCK</span>
            <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-text">
              C//L 2026
            </span>
            <span className="hidden text-muted-text sm:inline">
              — Team logic &amp; debugging competition
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-text">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-green" aria-hidden="true" />
            <span className="font-mono uppercase tracking-[0.1em]">
              Offline LAN · Server synchronized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
