import React from 'react';
import { ExtendedNavTab } from './FloatingNavDock';
import { Layers, ShieldAlert, PhoneCall, FileText, Settings, UserCheck } from 'lucide-react';

interface AuraCosmicFooterProps {
  onSelectTab?: (tab: ExtendedNavTab) => void;
  activeEmergencyCount?: number;
}

export const AuraCosmicFooter: React.FC<AuraCosmicFooterProps> = ({
  onSelectTab,
  activeEmergencyCount = 0,
}) => {
  const [showConsole, setShowConsole] = React.useState(false);

  const managementItems: { id: ExtendedNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'calls', label: 'Call Log & Transcripts', icon: <PhoneCall className="w-4 h-4 text-cyan-400" /> },
    { id: 'emergency', label: 'Emergency Center', icon: <ShieldAlert className="w-4 h-4 text-rose-400" />, badge: activeEmergencyCount },
    { id: 'interview', label: 'Interview Grounding', icon: <UserCheck className="w-4 h-4 text-purple-400" /> },
    { id: 'resume', label: 'Resume & PII Privacy', icon: <FileText className="w-4 h-4 text-teal-400" /> },
    { id: 'settings', label: 'Security & PIN Settings', icon: <Settings className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <footer className="relative z-20 w-full mt-12 pb-8 overflow-hidden select-none">
      {/* 1. Decorative wave divider (light-theme) */}
      <div className="relative w-full h-16 pointer-events-none">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="terrainGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="rockFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#f0f4ff" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 Q180,15 360,38 T720,25 T1080,40 T1440,30 L1440,80 L0,80 Z"
            fill="url(#terrainGlow)"
          />
          <path
            d="M0,52 Q120,38 260,50 Q380,60 520,45 Q680,35 840,52 Q1000,62 1160,48 Q1300,40 1440,52 L1440,80 L0,80 Z"
            fill="url(#rockFill)"
          />
        </svg>
      </div>

      {/* 2. Management Drawer / Quick Access Bar (Collapsible) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mb-6">
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="px-4 py-1.5 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-slate-800 hover:border-cyan-400 text-xs font-semibold tracking-wide transition-all shadow flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>{showConsole ? 'Hide System Console' : 'Open System Intelligence Console'}</span>
            {activeEmergencyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                {activeEmergencyCount} Alert
              </span>
            )}
          </button>
        </div>

        {showConsole && (
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-md flex flex-wrap items-center justify-center gap-3">
            {managementItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectTab?.(item.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-cyan-400 text-xs font-medium text-slate-700 transition-all flex items-center gap-2.5 shadow-sm"
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] text-white font-bold animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Bottom Micro-Copy Bar */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: AURA —— */}
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest text-slate-500 font-sans text-xs">
            AURA
          </span>
          <div className="w-12 h-px bg-slate-300" />
        </div>

        {/* Right: SMARTER CONVERSATIONS BRIGHTER DAYS —— */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-500">
            SMARTER CONVERSATIONS <span className="text-cyan-600">BRIGHTER DAYS</span>
          </span>
          <div className="w-12 h-px bg-cyan-500/40" />
        </div>
      </div>
    </footer>
  );
};
