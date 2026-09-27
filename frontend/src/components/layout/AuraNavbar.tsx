import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AuraNavbarProps {
  onNavigate?: (section: string) => void;
  onGetStarted?: () => void;
}

export const AuraNavbar: React.FC<AuraNavbarProps> = ({
  onNavigate,
  onGetStarted,
}) => {
  return (
    <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between">
      {/* 1. Brand Logo & Tagline */}
      <div
        onClick={() => onNavigate?.('home')}
        className="flex items-center gap-3.5 cursor-pointer group select-none"
      >
        {/* Iridescent Ribbon A Logo */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-md group-hover:blur-lg transition-all" />
          <svg
            className="w-9 h-9 relative z-10 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]"
            viewBox="0 0 48 48"
            fill="none"
          >
            <defs>
              <linearGradient id="auraLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="45%" stopColor="#6366f1" />
                <stop offset="75%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Iridescent Ribbon Loop "A" */}
            <path
              d="M24 6 C17 18 10 32 8 38 C7 41 9 43 13 41 C17 39 21 34 24 28 C27 34 31 39 35 41 C39 43 41 41 40 38 C38 32 31 18 24 6 Z"
              fill="url(#auraLogoGrad)"
              opacity="0.95"
              filter="url(#logoGlow)"
            />
            {/* Inner Center Ribbon Crossbar */}
            <path
              d="M17 29 C21 27 27 27 31 29 C29 32 19 32 17 29 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            {/* Center Core Sparkle Star */}
            <path
              d="M24 16 L25.2 21.2 L30 22 L25.2 22.8 L24 28 L22.8 22.8 L18 22 L22.8 21.2 Z"
              fill="#ffffff"
              className="drop-shadow-[0_0_6px_#fff]"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col justify-center">
          <span className="text-xl font-black tracking-widest text-slate-800 font-sans flex items-center gap-1">
            AURA
          </span>
          <span className="text-[8.5px] uppercase tracking-[0.25em] text-cyan-600/90 font-bold">
            YOUR AI CALL ASSISTANT
          </span>
        </div>
      </div>

      {/* 2. Action Button & Top-Right Micro-Text */}
      <div className="flex items-center gap-6">
        <button
          onClick={onGetStarted}
          className="relative group px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-pink-500 text-white font-semibold text-xs tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(56,189,248,0.7)] flex items-center gap-2 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Top-Right Micro-Text with Left Accent Line */}
        <div className="hidden xl:flex items-center gap-2.5 pl-3 border-l border-cyan-500/30 text-left select-none">
          <div className="flex flex-col text-[8px] font-extrabold tracking-[0.22em] text-slate-400 leading-[11px] uppercase">
            <span>SMARTER</span>
            <span>CONVERSATIONS</span>
            <span>BRIGHTER</span>
            <span className="text-cyan-400">DAYS</span>
          </div>
        </div>
      </div>
    </header>
  );
};
