/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-highlight': 'var(--surface-highlight)',
        'surface-dark': 'var(--surface-dark)',
        'primary-text': 'var(--primary-text)',
        'muted-text': 'var(--muted-text)',
        border: 'var(--border)',
        'primary-accent': 'var(--primary-accent)',
        'primary-accent-contrast': 'var(--primary-accent-contrast)',
        warning: 'var(--warning)',
        'warning-contrast': 'var(--warning-contrast)',
        error: 'var(--error)',
        'error-contrast': 'var(--error-contrast)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'DM Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"IBM Plex Mono"',
          'Consolas',
          '"Liberation Mono"',
          'Courier New',
          'monospace'
        ]
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px'
      }
    },
  },
  plugins: [],
};
