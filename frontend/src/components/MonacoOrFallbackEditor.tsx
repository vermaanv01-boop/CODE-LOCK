'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/lib/theme';
import { Terminal, Copy, RotateCcw, ChevronDown, ChevronUp, Code2 } from 'lucide-react';

// Dynamic import of Monaco to avoid SSR issues & lazy-load heavy bundle
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center font-mono text-xs text-muted-text bg-background">
        [INITIALIZING OFFLINE TERMINAL EDITOR...]
      </div>
    )
  }
);

interface MonacoOrFallbackEditorProps {
  initialCode?: string;
  language?: string;
  title?: string;
}

export const MonacoOrFallbackEditor: React.FC<MonacoOrFallbackEditorProps> = ({
  initialCode = '// Type or test offline code here\n',
  language = 'cpp',
  title = 'SCRATCHPAD / CODE CONSOLE'
}) => {
  const { theme } = useTheme();
  const [code, setCode] = useState<string>(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [useFallbackTextarea, setUseFallbackTextarea] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset scratchpad code back to original?')) {
      setCode(initialCode);
    }
  };

  const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark';

  return (
    <div className="border border-border bg-surface my-4 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-border bg-surface-dark text-xs font-mono gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary-accent" />
          <span className="font-bold text-primary-text tracking-wider">{title}</span>
          <span className="border border-primary-accent/50 text-primary-accent px-1.5 py-0.2 text-[10px] tracking-widest font-semibold uppercase bg-primary-accent/10">
            OPTIONAL EDITOR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-background border border-border text-[11px] text-primary-text px-2 py-0.5 font-mono focus:outline-none focus:border-primary-accent"
          >
            <option value="cpp">C++ (GCC)</option>
            <option value="c">C</option>
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="java">Java</option>
          </select>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 border border-border hover:border-primary-text text-[11px] text-muted-text hover:text-primary-text transition-colors bg-surface"
            title="Copy code"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1 border border-border hover:border-warning text-muted-text hover:text-warning transition-colors bg-surface"
            title="Reset to starter"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 border border-border hover:border-primary-accent text-muted-text hover:text-primary-accent transition-colors bg-surface"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Mandatory disclaimer box */}
      <div className="px-3 py-1.5 bg-surface-highlight border-b border-border/70 text-[11px] font-mono text-muted-text flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <p>
          <strong className="text-primary-text font-semibold">OPTIONAL EDITOR:</strong> You may use this editor or any offline compiler/IDE installed on your system.
        </p>
        <button
          onClick={() => setUseFallbackTextarea(!useFallbackTextarea)}
          className="text-[10px] text-muted-text hover:text-primary-accent underline shrink-0 whitespace-nowrap"
        >
          {useFallbackTextarea ? 'Switch to Monaco' : 'Raw Textarea'}
        </button>
      </div>

      {/* Editor Body */}
      {!isCollapsed && (
        <div className="relative">
          {useFallbackTextarea ? (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full p-3 font-mono text-xs bg-background text-primary-text border-none focus:outline-none resize-y leading-relaxed"
              style={{ tabSize: 2 }}
            />
          ) : (
            <div className="h-72 w-full bg-background">
              <MonacoEditor
                height="100%"
                language={selectedLanguage}
                theme={monacoTheme}
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'IBM Plex Mono, Consolas, Courier New, monospace',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  tabSize: 2,
                  overviewRulerBorder: false,
                  cursorBlinking: 'smooth',
                  padding: { top: 8, bottom: 8 }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
