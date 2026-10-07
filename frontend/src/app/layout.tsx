import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { ThemeProvider } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'CODE//LOCK 2026 | Technical Contest Platform',
  description: 'Offline-first full-stack team coding, debugging and logic contest platform. THINK. CODE. UNLOCK. DEBUG.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('codelock_theme');
                  var root = document.documentElement;
                  if (saved === 'light') {
                    root.classList.remove('dark');
                    root.classList.add('light');
                    root.setAttribute('data-theme', 'light');
                  } else {
                    root.classList.remove('light');
                    root.classList.add('dark');
                    root.setAttribute('data-theme', 'dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-primary-text min-h-screen flex flex-col technical-grid selection:bg-primary-accent selection:text-primary-accent-contrast">
        <ThemeProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
            {children}
          </main>
          <footer className="border-t border-border bg-surface-dark py-4 text-center text-xs font-mono text-muted-text select-none">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-primary-text font-bold">CODE//LOCK</span>
                <span className="text-[10px] border border-border px-1 py-0.2">C//L 2026</span>
                <span className="text-muted-text hidden sm:inline">— TEAM LOGIC & DEBUGGING COMPETITION</span>
              </div>
              <div className="text-[11px] text-muted-text/80 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-primary-accent rounded-full"></span>
                <span>OFFLINE LAN SYSTEM • NO CLOUD DEPENDENCY • SERVER SYNCHRONIZED</span>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
