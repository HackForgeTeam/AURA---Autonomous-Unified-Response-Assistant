import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  FileText,
  Briefcase,
  AlertTriangle,
  FileBarChart,
  Settings,
  Sparkles,
  Radio,
  ShieldCheck
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'calls'
  | 'call-details'
  | 'resume'
  | 'interview'
  | 'emergency'
  | 'safeguard'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeEmergencyCount: number;
  onOpenSimulator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeEmergencyCount,
  onOpenSimulator,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calls' as NavTab, label: 'Call Log', icon: PhoneCall },
    { id: 'resume' as NavTab, label: 'Resume & PII', icon: FileText },
    { id: 'interview' as NavTab, label: 'Interview Assistant', icon: Briefcase },
    {
      id: 'emergency' as NavTab,
      label: 'Emergency Center',
      icon: AlertTriangle,
      badge: activeEmergencyCount > 0 ? activeEmergencyCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse'
    },
    { id: 'safeguard' as NavTab, label: 'SafeGuard Shield', icon: ShieldCheck },
    { id: 'reports' as NavTab, label: 'Daily Reports', icon: FileBarChart },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed left-0 top-0 z-20">
      <div>
        {/* Brand Logo & Assistant Pill */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                AURA
              </h1>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                AI Call Agent Active
              </p>
            </div>
          </div>
        </div>

        {/* Quick Simulator CTA */}
        <div className="px-4 py-4">
          <button
            onClick={onOpenSimulator}
            className="w-full group relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 hover:from-cyan-600 hover:to-violet-600 transition-all duration-300 shadow-sm hover:shadow-cyan-500/25 font-semibold text-sm"
          >
            <Radio className="h-4 w-4 text-cyan-400 group-hover:text-white animate-pulse" />
            <span>Simulate Incoming Call</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-300 border-l-4 border-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Assistant Mode</span>
            <span className="text-cyan-600 font-semibold">Autonomous</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Representing user when unavailable. Strict verified-profile grounding.
          </p>
        </div>
      </div>
    </aside>
  );
};
