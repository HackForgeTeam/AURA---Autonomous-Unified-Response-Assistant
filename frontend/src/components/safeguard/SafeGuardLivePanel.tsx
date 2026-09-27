import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Info,
} from 'lucide-react';
import { SafeGuardState } from '../../types/safeguard';

interface SafeGuardLivePanelProps {
  state: SafeGuardState;
  className?: string;
  onViewReport?: () => void;
}

export const SafeGuardLivePanel: React.FC<SafeGuardLivePanelProps> = ({
  state,
  className = '',
  onViewReport,
}) => {
  const {
    riskScore,
    riskLevel,
    securityStatus,
    isRestrictedMode,
    isTerminated,
    hasDeviceSecurityRisk,
    deviceSecurityNotice,
    detections,
    protectedAssets,
  } = state;

  // Gauge colors and styling based on risk level
  const getRiskTheme = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return {
          color: 'text-rose-400',
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/40',
          shadow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
          badgeBg: 'bg-rose-500 text-white font-black',
          strokeColor: '#f43f5e',
          icon: AlertOctagon,
        };
      case 'HIGH_RISK':
        return {
          color: 'text-orange-400',
          bg: 'bg-orange-500/15',
          border: 'border-orange-500/40',
          shadow: 'shadow-[0_0_25px_rgba(249,115,22,0.3)]',
          badgeBg: 'bg-orange-500 text-slate-950 font-black',
          strokeColor: '#f97316',
          icon: ShieldAlert,
        };
      case 'CAUTION':
        return {
          color: 'text-amber-400',
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
          strokeColor: '#f59e0b',
          icon: AlertTriangle,
        };
      default:
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold',
          strokeColor: '#10b981',
          icon: ShieldCheck,
        };
    }
  };

  const theme = getRiskTheme();
  const IconComponent = theme.icon;

  // Circular gauge calculations (0-100 scale)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  return (
    <div
      className={`rounded-3xl bg-white border ${theme.border} p-5 sm:p-6 transition-all duration-300 shadow-sm ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${theme.bg} ${theme.color} border ${theme.border}`}>
            <IconComponent className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600">
                AURA SAFEGUARD
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
                Real-Time AI Call Protection
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">Security Status:</span>
              <span className={`text-xs font-bold ${theme.color} flex items-center gap-1.5`}>
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      riskLevel === 'CRITICAL' ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      riskLevel === 'CRITICAL'
                        ? 'bg-rose-500'
                        : riskLevel === 'HIGH_RISK'
                        ? 'bg-orange-500'
                        : riskLevel === 'CAUTION'
                        ? 'bg-amber-500'
                        : 'bg-emerald-400'
                    }`}
                  />
                </span>
                ● {securityStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Risk Level
          </span>
          <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider mt-1 ${theme.badgeBg}`}>
            {riskLevel.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Metrics: Circular Risk Gauge + Dynamic Analysis */}
      <div className="py-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center border-b border-slate-100">
        {/* Left: Dynamic Circular Gauge (4 cols) */}
        <div className="sm:col-span-4 flex items-center justify-center sm:justify-start gap-4">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
              {/* Background ring */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-slate-200"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress ring */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={theme.strokeColor}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Center score readout on 0-100 scale */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 leading-none font-mono">
                {riskScore}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Dynamic Risk Score
            </span>
            <span className={`text-sm font-black ${theme.color} capitalize`}>
              {riskScore < 40
                ? 'Safe Environment'
                : riskScore < 70
                ? 'Cautionary Patterns'
                : riskScore < 90
                ? 'High Exploitation Risk'
                : 'Critical Attack Detected'}
            </span>
            <span className="text-[10.5px] text-slate-400 mt-0.5">
              Zero-Trust continuous heuristic telemetry (0–100 scale)
            </span>
          </div>
        </div>

        {/* Right: Live Detections Stream (8 cols) */}
        <div className="sm:col-span-8 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Live Real-Time Detection</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {detections.length} threat signals evaluated
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {detections.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>✓ No suspicious behavior detected</span>
              </div>
            ) : (
              detections.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                    d.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                      : d.severity === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span>✓</span>
                  <span>{d.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RESTRICTED MODE NOTIFICATION (Level 3 - Triggered when score >= 70) */}
      {isRestrictedMode && (
        <div className="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-300 text-orange-700 animate-fadeIn space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 border border-orange-400/40 text-orange-300 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-300">
                  🔒 AURA RESTRICTED MODE ACTIVE
                </h4>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-orange-500 text-slate-950">
                  FIREWALL ENGAGED
                </span>
              </div>
              <p className="text-xs text-orange-100/90 mt-1">
                Potentially suspicious behavior detected. AURA has restricted access to protected
                information and will strictly refuse disclosure.
              </p>
            </div>
          </div>

          {/* Protected items checklist */}
          <div className="pt-2 border-t border-orange-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block mb-1.5">
              Protected Information Locked:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-orange-200/90 font-medium">
              {protectedAssets.map((asset, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">{asset}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DANGEROUS ACTION / DEVICE SECURITY RISK NOTICE */}
      {hasDeviceSecurityRisk && (
        <div className="mt-3 p-4 rounded-2xl bg-rose-950/50 border border-rose-500/60 text-rose-200 animate-pulse space-y-2">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 block">
                🚨 POTENTIAL DEVICE SECURITY RISK
              </span>
              <p className="text-xs text-rose-100 mt-1">
                {deviceSecurityNotice ||
                  'The caller is asking you to perform an action that could expose your device or information.'}
              </p>
              <div className="mt-2 p-2 rounded-xl bg-black/40 border border-rose-500/30 text-[11px] text-rose-200 font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  Recommended Action: Do NOT install unknown applications, APKs, or provide remote
                  screen access.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRITICAL CALL TERMINATION ALERT (Level 4 - Triggered when score >= 90) */}
      {isTerminated && (
        <div className="mt-3 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-white shadow-xl shadow-rose-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="h-6 w-6 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-400">
                🚨 CRITICAL SECURITY THREAT
              </span>
              <p className="text-xs text-slate-200">
                AURA safely terminated the call session to prevent financial/credential exploitation.
              </p>
            </div>
          </div>

          {onViewReport && (
            <button
              onClick={onViewReport}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition shrink-0 cursor-pointer"
            >
              View Incident Report
            </button>
          )}
        </div>
      )}
    </div>
  );
};
