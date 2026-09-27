import React, { useState } from 'react';
import { Bell, ShieldCheck, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Notification } from '../../types';

interface HeaderProps {
  user: User | null;
  notifications: Notification[];
  onMarkNotificationRead: (id: number) => void;
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  onMarkNotificationRead,
  title,
  subtitle,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* DND Assistant Mode Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>DND Guard Active (Auto-Answering)</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-sm font-semibold text-slate-700">Alerts & Notifications</span>
                <span className="text-xs text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${notif.is_read
                          ? 'bg-slate-50 border-slate-100 text-slate-500'
                          : 'bg-cyan-50 border-cyan-200 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold flex items-center gap-1">
                          {notif.level === 'EMERGENCY' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                          )}
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center font-bold text-xs text-white border border-cyan-400/40">
            {user ? user.full_name.split(' ').map((n) => n[0]).join('') : 'AC'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-700">{user?.full_name || 'Alex Chen'}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-cyan-500" />
              {user?.profile?.current_title || 'Staff AI Engineer'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
