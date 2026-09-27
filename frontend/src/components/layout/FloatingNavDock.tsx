import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  FileText,
  Briefcase,
  AlertTriangle,
  FileBarChart,
  Settings,
  Bot,
  Radio,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from './Sidebar';

export type ExtendedNavTab = NavTab | 'video' | 'simulator' | 'safeguard' | 'livecall';

interface FloatingNavDockProps {
  currentTab: ExtendedNavTab;
  onSelectTab: (tab: ExtendedNavTab) => void;
  activeEmergencyCount: number;
  onOpenSimulator: () => void;  // kept for API compatibility — still used by other callers
  className?: string;
}

export const FloatingNavDock: React.FC<FloatingNavDockProps> = ({
  currentTab,
  onSelectTab,
  activeEmergencyCount,
  onOpenSimulator: _onOpenSimulator,  // aliased to suppress unused warning
  className = '',
}) => {
  const navItems: Array<{
    id: ExtendedNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calls', label: 'Call Log', icon: PhoneCall },
    { id: 'interview', label: 'Interview', icon: Briefcase },
    { id: 'resume', label: 'Privacy & PII', icon: FileText },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertTriangle,
      badge: activeEmergencyCount > 0 ? activeEmergencyCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    { id: 'safeguard', label: 'SafeGuard', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'video', label: 'Video AI', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-2 rounded-full bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-300/60 transition-all duration-300 hover:border-slate-300 ${className}`}
      style={{
        boxShadow:
          '0 8px 32px -4px rgba(100, 116, 139, 0.18), 0 2px 8px -2px rgba(100, 116, 139, 0.10)',
      }}
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Brand Icon Mini-badge */}
      <div
        onClick={() => onSelectTab('dashboard')}
        className="hidden sm:flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/25 cursor-pointer mr-1 hover:scale-105 transition"
        title="AURA Spatial AI"
      >
        <Sparkles className="h-4 w-4" />
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative group flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 via-violet-500/10 to-cyan-500/15 text-cyan-700 border border-cyan-300/60 shadow-sm shadow-cyan-200/40'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                }`}
            >
              <Icon
                className={`h-4 w-4 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-cyan-600' : 'group-hover:scale-110'
                }`}
              />
              <span className={`hidden md:inline ${isActive ? 'text-cyan-700' : ''}`}>
                {item.label}
              </span>

              {/* Alert Badge */}
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black tracking-tight ${
                    item.badgeColor || 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-cyan-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="h-6 w-[1px] bg-slate-200 mx-1" />

      {/* Live Call CTA Pill — opens the dedicated ChatGPT-style voice interface */}
      <button
        id="live-call-nav-button"
        onClick={() => onSelectTab('livecall')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 whitespace-nowrap cursor-pointer ${
          currentTab === 'livecall'
            ? 'bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-400/40 ring-2 ring-cyan-300 scale-105'
            : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95'
        } text-xs`}
      >
        <Radio className="h-3.5 w-3.5 fill-current animate-pulse text-slate-950" />
        <span className="font-extrabold tracking-wide">Live Call</span>
      </button>
    </nav>
  );
};
