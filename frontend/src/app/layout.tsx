import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { ContestStatusProvider } from '@/lib/contest-context';
import { ContestantShell } from '@/components/ContestantShell';

export const metadata: Metadata = {
  title: 'CODE//LOCK 2026 | Technical Contest Platform',
  description:
    'Offline-first full-stack team coding, debugging and logic contest platform. THINK. CODE. UNLOCK. DEBUG.',
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('codelock_theme');
    var theme = (saved === 'light' || saved === 'dark')
      ? saved
      : ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.classList.add('light');
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background text-primary-text antialiased">
        <ThemeProvider>
          <ContestStatusProvider>
            <ContestantShell>{children}</ContestantShell>
          </ContestStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
