import React from 'react';
import { CursorMode } from '../ui/AuraSparkCursor';

interface SparkCursorConsoleProps {
  currentMode: CursorMode;
  onSelectMode: (mode: CursorMode) => void;
}

export const SparkCursorConsole: React.FC<SparkCursorConsoleProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const modes: { id: CursorMode; label: string; preview: React.ReactNode }[] = [
    {
      id: 'normal',
      label: 'Normal',
      preview: (
        <div className="relative w-9 h-9 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'moving',
      label: 'Moving',
      preview: (
        <div className="relative w-9 h-9 flex items-center justify-center">
          {/* Dust tail */}
          <div className="absolute right-0 bottom-1 flex gap-1 items-center">
            <span className="w-1 h-1 rounded-full bg-cyan-400 opacity-40" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 opacity-60" />
            <span className="w-2 h-2 rounded-full bg-cyan-200 opacity-80" />
          </div>
          <svg
            className="w-5 h-5 text-cyan-200 drop-shadow-[0_0_10px_rgba(56,189,248,1)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'hover',
      label: 'Hover',
      preview: (
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute w-8 h-8 rounded-full border border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.5)]" />
          <svg
            className="w-5 h-5 text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
          </svg>
        </div>
      ),
    },
    {
      id: 'click',
      label: 'Click',
      preview: (
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute w-9 h-9 rounded-full border border-purple-400/80 animate-ping opacity-60" />
          <div className="absolute w-7 h-7 rounded-full border border-cyan-400/80 bg-cyan-400/20" />
          <svg
            className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(168,85,247,1)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
          </svg>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-8 select-none">
      {/* Console Container */}
      <div className="rounded-3xl bg-white border border-cyan-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Console Title & State Selector */}
        <div className="flex flex-col items-center sm:items-start gap-3 w-full sm:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-600">
            A U R A &nbsp; S P A R K &nbsp; C U R S O R
          </span>

          <div className="flex items-center gap-4 sm:gap-6">
            {modes.map((m) => {
              const isActive = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(isActive ? 'auto' : m.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-300 group cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="group-hover:scale-110 transition-transform">
                    {m.preview}
                  </div>
                  <span
                    className={`text-[11px] font-medium tracking-wide transition-colors ${
                      isActive ? 'text-cyan-600 font-semibold' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side Micro-Quote */}
        <div className="flex flex-col items-center sm:items-end text-center sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500 leading-[14px]">
            <span>A SMALL SPARK</span> <br />
            <span>FOR A SMARTER</span> <br />
            <span className="text-cyan-600">TOMORROW</span>
          </div>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-2" />
        </div>
      </div>
    </div>
  );
};
