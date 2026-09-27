import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Bell,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';
import { User, Notification } from '../../types';
import { useAuraState } from '../../context/AuraStateContext';
import { LiveActivityTicker } from './LiveActivityTicker';

interface FloatingHeaderHUDProps {
  user: User | null;
  notifications: Notification[];
  activeEmergencyCount: number;
  onMarkNotificationRead: (id: number) => void;
  onOpenSimulator: () => void;
  title: string;
  subtitle: string;
}

export const FloatingHeaderHUD: React.FC<FloatingHeaderHUDProps> = ({
  user,
  notifications,
  activeEmergencyCount,
  onMarkNotificationRead,
  onOpenSimulator,
  title,
  subtitle,
}) => {
  const { isAmbientMode, toggleAmbientMode } = useAuraState();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between pointer-events-none">
      {/* Left: Brand & Representation Capsule */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-950/70 backdrop-blur-2xl border border-white/10 shadow-lg shadow-black/40">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-violet-300 to-white bg-clip-text text-transparent">
                AURA
              </h1>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Representing <span className="text-slate-200 font-semibold">{user?.full_name || 'Alex Chen'}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Title / Context Tag */}
        <div className="hidden lg:flex flex-col">
          <h2 className="text-xs font-bold text-white tracking-wide">{title}</h2>
          <p className="text-[10px] text-slate-400 max-w-sm truncate">{subtitle}</p>
        </div>
      </div>

      {/* Center: Live AI Activity Ticker */}
      <div className="pointer-events-auto">
        <LiveActivityTicker />
      </div>

      {/* Right: Controls & Toggles */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Quick Live Call Launcher */}
        <button
          id="header-live-call-button"
          onClick={onOpenSimulator}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-cyan-500/15 hover:from-cyan-500/25 hover:to-violet-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg transition"
        >
          <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>Live Call</span>
        </button>

        {/* Ambient / Focus Mode Toggle */}
        <button
          onClick={toggleAmbientMode}
          title={isAmbientMode ? 'Exit Ambient Mode' : 'Enter Ambient 3D Mode'}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-2xl border text-xs font-semibold transition-all duration-300 shadow-lg ${
            isAmbientMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-cyan-500/20'
              : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          {isAmbientMode ? <Eye className="h-4 w-4 text-cyan-400" /> : <EyeOff className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {isAmbientMode ? 'Show Panels' : 'Ambient 3D'}
          </span>
        </button>

        {/* Emergency Beacon (If active emergencies exist) */}
        {activeEmergencyCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold animate-pulse shadow-lg shadow-rose-950/50">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>{activeEmergencyCount} Critical</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-2xl bg-slate-950/70 backdrop-blur-2xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition shadow-lg relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 space-y-2 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 mt-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        n.is_read
                          ? 'bg-white/[0.02] border-transparent opacity-60'
                          : 'bg-white/[0.06] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-white">{n.title}</h5>
                        {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
