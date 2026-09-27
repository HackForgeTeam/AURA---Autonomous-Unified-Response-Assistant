import React from 'react';
import { Bot, Sparkles, Mic, ShieldAlert, Radio, Video } from 'lucide-react';
import { useAuraState } from '../../context/AuraStateContext';

interface AvatarAnchorProps {
  className?: string;
  isCompact?: boolean;
}

export const AvatarAnchor: React.FC<AvatarAnchorProps> = ({
  className = '',
  isCompact = false,
}) => {
  const { visualState, audioLevel } = useAuraState();

  const getStatusBadge = () => {
    switch (visualState) {
      case 'SPEAKING':
        return { label: 'AURA Speaking', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: Radio };
      case 'LISTENING':
        return { label: 'AURA Listening', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: Mic };
      case 'INCOMING_CALL':
        return { label: 'Incoming Signal', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse', icon: Radio };
      case 'INTERVIEW':
        return { label: 'Interview Persona', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: Sparkles };
      case 'EMERGENCY':
        return { label: 'Emergency Alert', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse', icon: ShieldAlert };
      case 'COMPLETED':
        return { label: 'Call Summary', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: Sparkles };
      default:
        return { label: 'Autonomous Standby', color: 'text-slate-400 bg-slate-800/40 border-slate-700/40', icon: Bot };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  if (isCompact) {
    return (
      <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm ${className}`}>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-200 flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-cyan-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">AURA Video Avatar</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">AI representation active</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center text-center ${className}`}
    >
      {/* Video Monitor Frame */}
      <div className="w-full max-w-md aspect-video rounded-2xl bg-gradient-to-b from-slate-900 via-[#0d131f] to-slate-900 border border-slate-700/60 p-5 flex flex-col items-center justify-between relative shadow-inner mb-5">
        {/* Top bar inside monitor */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-[11px] text-slate-300">AURA_LIVE_FEED</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300">
            <Video className="w-3 h-3 text-cyan-400" />
            <span>HD 1080p</span>
          </div>
        </div>

        {/* Center: Rectangular Avatar Hologram Badge */}
        <div className="my-auto flex flex-col items-center">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-cyan-600/30 via-violet-600/30 to-indigo-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/15 mb-3 relative">
            <Bot className="h-10 w-10 text-cyan-200" />
            {visualState === 'SPEAKING' && (
              <div className="absolute -bottom-2 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-full border border-cyan-500/40">
                <span className="h-1.5 w-1 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2.5 w-1 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="h-1.5 w-1 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
            )}
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold shadow-sm ${status.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{status.label}</span>
          </div>
        </div>

        {/* Bottom: Audio reactive equalizer */}
        <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-500">Audio Sync</span>
          <div className="flex items-center gap-1 h-3.5">
            {[...Array(9)].map((_, i) => {
              const height =
                visualState === 'SPEAKING' || visualState === 'LISTENING'
                  ? Math.max(3, Math.sin((i + 1) * 0.8) * (audioLevel || 25) * 0.3 + 3)
                  : 3;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    visualState === 'EMERGENCY'
                      ? 'bg-rose-500'
                      : visualState === 'SPEAKING'
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-white tracking-tight">
        AURA Autonomous Video Representative
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
        Live viewport for real-time video call representation during interviews, executive screenings, and emergency alerts.
      </p>
    </div>
  );
};
