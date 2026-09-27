import React from 'react';
import { ExtendedNavTab, FloatingNavDock } from './FloatingNavDock';
import { AuraNavbar } from './AuraNavbar';
import { LiveAuraBackground } from '../3d/LiveAuraBackground';
import { useAuraState } from '../../context/AuraStateContext';
import { User, Notification } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface AppLayoutProps {
  currentTab: ExtendedNavTab;
  onSelectTab: (tab: ExtendedNavTab) => void;
  user: User | null;
  notifications: Notification[];
  activeEmergencyCount: number;
  onMarkNotificationRead: (id: number) => void;
  onOpenSimulator: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  activeEmergencyCount,
  onOpenSimulator,
  title,
  subtitle,
  children,
}) => {
  const { isAmbientMode } = useAuraState();

  const handleNavClick = () => {
    onSelectTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f0f4ff] text-slate-800 overflow-x-hidden select-none font-sans">
      {/* 1. Global Live 3D Futuristic Background with Particles, Light Ribbons & Large Holographic AURA Logo */}
      <LiveAuraBackground />

      {/* 2. Top AURA Navigation Bar */}
      <AuraNavbar
        onNavigate={handleNavClick}
        onGetStarted={onOpenSimulator}
      />

      {/* Sub-page Breadcrumb when inside dedicated management tabs (calls, emergency, interview, etc.) */}
      {currentTab !== 'dashboard' && (
        <div className="relative z-20 max-w-7xl mx-auto px-6 pt-2 pb-4 flex items-center justify-between border-b border-slate-200 mb-6">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors py-1.5 px-3 rounded-xl bg-white/80 border border-cyan-200 backdrop-blur-md cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <div className="text-right">
            <h2 className="text-sm font-bold text-slate-800 tracking-wide">{title}</h2>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
      )}

      {/* 4. Spatial Main Content Area */}
      <main
        className={`relative z-10 w-full ${
          currentTab !== 'dashboard' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32' : ''
        } transition-all duration-700 ${
          isAmbientMode ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {children}
      </main>

      {/* Ambient Mode Overlay Indicator */}
      {isAmbientMode && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col items-center justify-end pb-28 text-center animate-fade-in">
          <div className="px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200 shadow-2xl">
            <p className="text-xs font-semibold text-slate-600">
              <span className="text-cyan-600 font-bold">Ambient AI Core Mode</span> • Visualizing neural telemetry and audio reactivity
            </p>
          </div>
        </div>
      )}

      {/* 5. Floating Navigation Dock */}
      <FloatingNavDock
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activeEmergencyCount={activeEmergencyCount}
        onOpenSimulator={onOpenSimulator}
      />
    </div>
  );
};
