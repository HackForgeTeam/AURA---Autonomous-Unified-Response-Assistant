import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Info,
  KeyRound,
} from 'lucide-react';
import { EmergencyEvent } from '../types';

interface EmergencyCenterPageProps {
  emergencyEvents: EmergencyEvent[];
  onDismissEmergency: (id: number, pin: string) => Promise<void>;
  onSelectCall: (callId: number) => void;
}

export const EmergencyCenterPage: React.FC<EmergencyCenterPageProps> = ({
  emergencyEvents,
  onDismissEmergency,
  onSelectCall,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [dismissError, setDismissError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeEvents = emergencyEvents.filter((e) => !e.is_dismissed);
  const dismissedEvents = emergencyEvents.filter((e) => e.is_dismissed);

  const handleDismiss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    setDismissError(null);
    setIsSubmitting(true);
    try {
      await onDismissEmergency(selectedEventId, pinInput);
      setSelectedEventId(null);
      setPinInput('');
    } catch (err: any) {
      setDismissError(err.message || 'Incorrect PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Disclaimer / Browser Abstraction Banner */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-amber-600">Hackathon Demo Notice: </span>
          Emergency DND bypass is simulated as a high-priority browser alert & audio chime. Standard web browsers cannot physically alter native iOS/Android hardware silent switches or OS-level DND profiles; in production, this triggers automated push notifications and emergency telephony override webhooks.
        </div>
      </div>

      {/* Active Emergencies List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
            Active Critical Emergency Alerts ({activeEvents.length})
          </h3>
          {activeEvents.length > 0 && (
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
              Requires Secure PIN Unlock
            </span>
          )}
        </div>

        {activeEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">All Clear — No Active Emergencies</h4>
            <p className="text-xs text-slate-400 mt-1">
              AURA will alert you immediately and bypass quiet hours if a crisis or medical emergency is detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-2xl bg-gradient-to-r from-rose-50 via-white to-white border-2 border-rose-400 p-6 shadow-sm relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <AlertTriangle className="h-7 w-7 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500 text-white">
                          {evt.severity}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(evt.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mt-1">
                        {evt.trigger_reason}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Contextual reasoning: Caller claimed emergency & medical authorization required.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectCall(evt.call_id)}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 hover:text-slate-800 font-semibold transition"
                    >
                      View Call
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setDismissError(null);
                        setPinInput('');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Dismiss with PIN</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dismissal PIN Modal */}
      {selectedEventId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-rose-300 p-6 shadow-lg">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <KeyRound className="h-6 w-6" />
              <h4 className="text-base font-bold text-slate-800">Enter Emergency PIN</h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              To verify user identity and dismiss this critical alert, please enter your security PIN. (Default: <code className="text-cyan-600 font-mono font-bold">1234</code>)
            </p>

            <form onSubmit={handleDismiss} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (e.g. 1234)"
                autoFocus
                className="w-full text-center text-xl tracking-widest font-mono p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-rose-500"
              />

              {dismissError && (
                <p className="text-xs text-rose-400 text-center font-semibold">{dismissError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !pinInput}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
                >
                  {isSubmitting ? 'Verifying...' : 'Unlock & Dismiss'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Dismissed Emergencies */}
      {dismissedEvents.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Dismissed / Resolved Emergency History
          </h3>
          <div className="divide-y divide-slate-100">
            {dismissedEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700">{evt.trigger_reason}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dismissed by {evt.dismissed_by || 'User'} at {evt.dismissed_at ? new Date(evt.dismissed_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                  RESOLVED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
