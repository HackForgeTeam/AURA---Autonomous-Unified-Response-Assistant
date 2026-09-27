import React, { useState } from 'react';
import { Sparkles, Radio, ShieldAlert, Mic, Bot, History, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuraState } from '../../context/AuraStateContext';
import { AuraVisualState } from '../../types';

export const LiveActivityTicker: React.FC = () => {
  const { currentActivity, visualState, activityLog } = useAuraState();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStateIndicator = (state: AuraVisualState) => {
    switch (state) {
      case 'SPEAKING':
        return {
          icon: Radio,
          dotColor: 'bg-emerald-400',
          textColor: 'text-emerald-300',
          pulse: true,
        };
      case 'LISTENING':
        return {
          icon: Mic,
          dotColor: 'bg-cyan-400',
          textColor: 'text-cyan-300',
          pulse: true,
        };
      case 'INCOMING_CALL':
        return {
          icon: Radio,
          dotColor: 'bg-amber-400',
          textColor: 'text-amber-300',
          pulse: true,
        };
      case 'INTERVIEW':
        return {
          icon: Sparkles,
          dotColor: 'bg-purple-400',
          textColor: 'text-purple-300',
          pulse: false,
        };
      case 'EMERGENCY':
        return {
          icon: ShieldAlert,
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-300',
          pulse: true,
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle2,
          dotColor: 'bg-emerald-400',
          textColor: 'text-emerald-300',
          pulse: false,
        };
      default:
        return {
          icon: Bot,
          dotColor: 'bg-cyan-500',
          textColor: 'text-slate-300',
          pulse: false,
        };
    }
  };

  const indicator = getStateIndicator(visualState);
  const Icon = indicator.icon;

  return (
    <div className="relative z-30">
      {/* Floating Pill */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group cursor-pointer flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/70 backdrop-blur-2xl border border-white/10 hover:border-white/20 shadow-lg shadow-black/40 transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {indicator.pulse && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${indicator.dotColor}`}
              />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${indicator.dotColor}`} />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            AURA Live
          </span>
        </div>

        <div className="h-3 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2 max-w-sm truncate">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${indicator.textColor}`} />
          <span className={`text-xs font-medium truncate ${indicator.textColor}`}>
            {currentActivity}
          </span>
        </div>

        <div className="flex items-center text-slate-500 group-hover:text-slate-300 transition">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Expanded Activity History Drawer */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-80 max-h-72 overflow-y-auto rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl p-3 space-y-2 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-cyan-400" />
              Live Cognitive Feed
            </span>
            <span className="text-[10px] font-semibold text-slate-500">{activityLog.length} events</span>
          </div>

          <div className="space-y-1.5">
            {activityLog.map((act) => {
              const itemInd = getStateIndicator(act.state);
              return (
                <div
                  key={act.id}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition flex items-start gap-2 text-left"
                >
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${itemInd.dotColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug">{act.text}</p>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                      {act.timestamp} {act.badge ? `• ${act.badge}` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
