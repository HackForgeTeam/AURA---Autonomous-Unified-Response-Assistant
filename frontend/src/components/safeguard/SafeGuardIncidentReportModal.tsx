import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Info,
} from 'lucide-react';
import { SafeGuardIncidentReport } from '../../types/safeguard';

interface SafeGuardIncidentReportModalProps {
  report: SafeGuardIncidentReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SafeGuardIncidentReportModal: React.FC<SafeGuardIncidentReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [completedChecks, setCompletedChecks] = useState<Record<string, boolean>>({});

  if (!isOpen || !report) return null;

  const toggleCheck = (id: string) => {
    setCompletedChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isCritical = report.riskLevel === 'CRITICAL';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn select-none">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-cyan-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isCritical
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-cyan-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl border ${
                isCritical
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
              }`}
            >
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                  AURA SAFEGUARD
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  INCIDENT REPORT
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Security Incident Summary
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Close Report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Risk Level
              </span>
              <span
                className={`text-base font-black ${
                  isCritical ? 'text-rose-400' : 'text-orange-400'
                }`}
              >
                {report.riskLevel.replace('_', ' ')}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Autonomous classification</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Risk Score
              </span>
              <span className="text-base font-black text-white font-mono">
                {report.riskScore} <span className="text-slate-400 text-xs font-normal">/ 100</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Weighted heuristic score</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Mitigation Action
              </span>
              <span className="text-base font-black text-emerald-400">
                {report.actionTaken === 'CALL_TERMINATED'
                  ? 'Call Terminated'
                  : 'Restricted Mode'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Zero-Trust protection</p>
            </div>
          </div>

          {/* Caller Details & Action Description */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Caller:</span>{' '}
              <span className="font-bold text-white">{report.callerName}</span>{' '}
              <span className="text-slate-400 font-mono">({report.callerNumber})</span>
            </div>
            <div className="text-slate-300 italic">
              &quot;{report.actionDescription}&quot;
            </div>
          </div>

          {/* Detected Threats */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Detected Threat Indicators ({report.detectedThreats.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.detectedThreats.map((threat) => (
                <div
                  key={threat.id}
                  className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{threat.label}</span>
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      {threat.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{threat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Protected Information */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-cyan-200 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4 text-cyan-500" />
              <span>Information Protected by AURA Firewall</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
              {report.protectedAssets.map((asset, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{asset}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              AURA Security Recommendations
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DEVICE SAFETY CHECKLIST */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1224] to-[#121b33] border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  📱 DEVICE SAFETY CHECK
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 italic">
                AURA does not claim device compromise; follow safe precautions below:
              </span>
            </div>

            <div className="space-y-2">
              {report.deviceSafetyChecks.map((check) => {
                const isChecked = !!completedChecks[check.id];
                return (
                  <div
                    key={check.id}
                    onClick={() => toggleCheck(check.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 text-xs ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-300 line-through opacity-75'
                        : 'bg-white/5 border-white/10 hover:border-cyan-500/40 text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(check.id)}
                      className="mt-0.5 rounded border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{check.label}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            check.priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {check.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{check.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 bg-[#070b16] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Incident report logged to AURA SafeGuard historical audit trail</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
