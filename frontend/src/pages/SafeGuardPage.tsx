import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Radio,
  Terminal,
  User,
} from 'lucide-react';
import { SafeGuardEngine } from '../services/safeguardEngine';
import {
  SafeGuardState,
  SafeGuardDemoScenario,
  SafeGuardIncidentReport,
} from '../types/safeguard';
import { SafeGuardLivePanel } from '../components/safeguard/SafeGuardLivePanel';
import { SafeGuardIncidentReportModal } from '../components/safeguard/SafeGuardIncidentReportModal';

interface SafeGuardPageProps {
  onOpenLiveSimulator?: (scenarioIdx?: number) => void;
}

export const SafeGuardPage: React.FC<SafeGuardPageProps> = ({ onOpenLiveSimulator }) => {
  const demoScenarios = SafeGuardEngine.getDemoScenarios();
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<SafeGuardDemoScenario>(
    demoScenarios[2] // Default to Bank Scam for high-impact demo
  );

  const [activeSimulationState, setActiveSimulationState] = useState<SafeGuardState>(
    SafeGuardEngine.createInitialState()
  );

  const [isSimulating, setIsSimulating] = useState(false);
  const [demoConversation, setDemoConversation] = useState<Array<{ speaker: 'CALLER' | 'ASSISTANT'; text: string }>>([]);
  const [viewingReport, setViewingReport] = useState<SafeGuardIncidentReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Run the selected demo scenario step-by-step
  const handleRunScenario = (scenario: SafeGuardDemoScenario) => {
    setSelectedDemoScenario(scenario);
    setIsSimulating(true);
    setDemoConversation([]);

    // Initialize clean state with scenario caller info
    const baseState = SafeGuardEngine.createInitialState();
    baseState.timeline.push({
      id: `tl-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeDisplay: new Date().toTimeString().split(' ')[0],
      title: `Call Session Connected: ${scenario.callerName}`,
      description: `Inbound telephony connection established from ${scenario.callerNumber}. Heuristic analysis initialized.`,
      currentScore: baseState.riskScore,
      severity: 'INFO',
      iconType: 'CALL',
    });
    setActiveSimulationState(baseState);

    // Play dialogue turns sequentially
    let currentStep = 0;
    let accumulatedState = baseState;

    const playNextTurn = () => {
      if (currentStep >= scenario.dialogueScript.length) {
        setIsSimulating(false);
        // If high risk or critical, open report
        if (accumulatedState.riskScore >= 70 && accumulatedState.incidentReport) {
          setViewingReport(accumulatedState.incidentReport);
        }
        return;
      }

      const turn = scenario.dialogueScript[currentStep];

      setDemoConversation((prev) => [...prev, { speaker: turn.speaker, text: turn.text }]);

      if (turn.speaker === 'CALLER') {
        // Evaluate caller text through SafeGuard risk engine
        accumulatedState = SafeGuardEngine.evaluateTurn(
          turn.text,
          scenario.simulatedDurationSeconds,
          accumulatedState
        );
        setActiveSimulationState({ ...accumulatedState });
      }

      currentStep++;
      if (accumulatedState.isTerminated) {
        setIsSimulating(false);
        if (accumulatedState.incidentReport) {
          setViewingReport(accumulatedState.incidentReport);
        }
      } else {
        setTimeout(playNextTurn, turn.delayMs || 2200);
      }
    };

    setTimeout(playNextTurn, 600);
  };

  const handleResetDemo = () => {
    setIsSimulating(false);
    setDemoConversation([]);
    setActiveSimulationState(SafeGuardEngine.createInitialState());
  };

  return (
    <div className="w-full space-y-8 select-none animate-fadeIn pb-16">
      {/* Top Banner: SafeGuard Global Shield */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border border-cyan-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-500/25">
              <ShieldCheck className="h-8 w-8 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                AURA SafeGuard
              </h1>
              <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 tracking-wider">
                Real-Time AI Call Protection
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                Zero-Trust Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Continuous real-time threat detection analyzing scam patterns, social engineering, OTP theft, and AI prompt injection. AURA enforces Restricted Mode and terminates malicious calls automatically.
            </p>
          </div>
        </div>

        {/* Global Security Metrics */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Firewall</span>
            <span className="text-xs font-black text-emerald-600">7 Protected Credential Types</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Scam Defense</span>
            <span className="text-xs font-black text-cyan-600">0–100 Dynamic Risk Engine</span>
          </div>

          {onOpenLiveSimulator && (
            <button
              onClick={() => onOpenLiveSimulator(7)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              title="Launch interactive two-way live call simulation with SafeGuard HUD"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Test Live Voice Call</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE 5-SCENARIO DEMO LAB (Requested by user)                    */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INTERACTIVE DEMO TESTBED</span>
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Demonstrate AURA SafeGuard Threat Response
            </h2>
          </div>
          <span className="text-xs text-slate-400 italic">
            Select a scenario to witness turn-by-turn heuristic threat detection
          </span>
        </div>

        {/* Scenario Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {demoScenarios.map((scen, idx) => {
            const isSelected = selectedDemoScenario.id === scen.id;
            const isCritical = scen.expectedRiskLevel === 'CRITICAL';
            const isCaution = scen.expectedRiskLevel === 'CAUTION';

            return (
              <button
                key={scen.id}
                onClick={() => {
                  setSelectedDemoScenario(scen);
                  handleResetDemo();
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? isCritical
                      ? 'bg-rose-50 border-rose-400 shadow-sm scale-[1.02]'
                      : isCaution
                      ? 'bg-amber-50 border-amber-400 shadow-sm scale-[1.02]'
                      : 'bg-cyan-50 border-cyan-400 shadow-sm scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Scenario {idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300'
                          : isCaution
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {scen.expectedRiskLevel.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1">{scen.title.split(':')[1]}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{scen.subtitle}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">{scen.simulatedDurationSeconds >= 60 ? `${Math.floor(scen.simulatedDurationSeconds / 60)}m` : `${scen.simulatedDurationSeconds}s`}</span>
                  <span className="font-bold text-cyan-400 font-mono">Score ~{scen.expectedRiskScore}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Demo Stage Console: Left Scenario Info + Center SafeGuard Live Panel + Right Live Transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols): SafeGuard Live Status Panel */}
          <div className="lg:col-span-5 space-y-4">
            <SafeGuardLivePanel
              state={activeSimulationState}
              onViewReport={() => {
                if (activeSimulationState.incidentReport) {
                  setViewingReport(activeSimulationState.incidentReport);
                  setIsReportModalOpen(true);
                }
              }}
            />

            {/* Scenario Info & Controls */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">{selectedDemoScenario.title}</h4>
                  <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    Caller: {selectedDemoScenario.callerName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedDemoScenario.notes}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleRunScenario(selectedDemoScenario)}
                  disabled={isSimulating}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isSimulating ? 'Evaluating In Progress...' : 'Run Simulation'}</span>
                </button>

                <button
                  onClick={handleResetDemo}
                  disabled={isSimulating}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Live Dialogue Exchange Stream */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 flex flex-col justify-between space-y-4 shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Live Telephony Conversation Stream
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {isSimulating ? '● Streaming Audio Dialogue' : 'Ready to Run'}
                </span>
              </div>

              {/* Dialogue History */}
              <div className="space-y-3.5 py-4 min-h-[300px] max-h-[380px] overflow-y-auto pr-1">
                {demoConversation.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                    <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
                    <p className="text-xs">
                      Click <strong className="text-cyan-400">Run Simulation</strong> to initiate live speech analysis for{' '}
                      {selectedDemoScenario.title}.
                    </p>
                  </div>
                ) : (
                  demoConversation.map((msg, idx) => {
                    const isCaller = msg.speaker === 'CALLER';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 animate-fadeIn ${
                          isCaller ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isCaller && (
                          <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 text-xs font-black">
                            AI
                          </div>
                        )}

                        <div
                          className={`max-w-lg p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isCaller
                              ? 'bg-blue-50 border border-blue-200 text-slate-700 rounded-tr-sm'
                              : 'bg-slate-50 border border-cyan-200 text-slate-700 rounded-tl-sm'
                          }`}
                        >
                          <span className="text-[10px] font-mono block opacity-60 mb-1">
                            {isCaller ? selectedDemoScenario.callerName : 'AURA SafeGuard'}
                          </span>
                          {msg.text}
                        </div>

                        {isCaller && (
                          <div className="h-8 w-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-200 shrink-0 text-xs font-black">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Expected Result:</span>
                <span className="font-bold text-cyan-600">
                  {selectedDemoScenario.expectedAction}
                </span>
              </div>

              {activeSimulationState.incidentReport && (
                <button
                  onClick={() => {
                    setViewingReport(activeSimulationState.incidentReport);
                    setIsReportModalOpen(true);
                  }}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  View Generated Incident Report →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE DETECTION TIMELINE (As specified in prompt item 11)               */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>REAL-TIME AUDIT LOG</span>
            </span>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">
              SafeGuard Detection Timeline
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeSimulationState.timeline.length} sequential telemetry events
          </span>
        </div>

        {/* Chronological Event Stepper */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-500 before:via-orange-500 before:to-rose-500">
          {activeSimulationState.timeline.map((event) => {
            const isCritical = event.severity === 'CRITICAL';
            const isWarning = event.severity === 'WARNING';
            const isCaution = event.severity === 'CAUTION';

            return (
              <div key={event.id} className="relative group animate-fadeIn">
                {/* Stepper node circle */}
                <span
                  className={`absolute -left-[27px] sm:-left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    isCritical
                      ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                      : isWarning
                      ? 'bg-orange-500 shadow-[0_0_8px_#f97316]'
                      : isCaution
                      ? 'bg-amber-500'
                      : 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
                  }`}
                />

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:border-cyan-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-cyan-600">
                        {event.timeDisplay}
                      </span>
                      <span className="text-slate-800 text-xs font-bold">— {event.title}</span>
                      {event.riskDelta && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                          +{event.riskDelta} risk
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{event.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
                    <span className="text-slate-400">Score:</span>
                    <span
                      className={`font-black ${
                        event.currentScore >= 90
                          ? 'text-rose-400'
                          : event.currentScore >= 70
                          ? 'text-orange-400'
                          : event.currentScore >= 40
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {event.scoreDisplay || (event.title === 'AURA SafeGuard Initialized' || event.currentScore === 8 ? '8/10' : `${event.currentScore} / 100`)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DEVICE SAFETY GUIDANCE (Checklist as requested in item 10)             */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50 border border-cyan-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📱 Device Safety Checklist</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
                  Preventative Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                Actionable post-call safety steps to verify personal device integrity
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            AURA evaluates behavior and assists you in practicing disciplined digital hygiene.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {[
            {
              title: 'Never Install Remote Software',
              desc: 'Legitimate service organizations will never ask you to install AnyDesk, TeamViewer, or unknown APKs over a phone call.',
            },
            {
              title: 'Verify Caller Identity Out-of-Band',
              desc: 'If a caller claims to represent your bank or law enforcement, hang up and dial the official phone number printed on the back of your card.',
            },
            {
              title: 'Never Share One-Time Passwords',
              desc: 'SMS and email verification codes explicitly state: "Do not share this code with anyone, including bank representatives."',
            },
            {
              title: 'Review Installed Applications',
              desc: 'Regularly audit newly installed software and revoke broad accessibility or device administration permissions.',
            },
            {
              title: 'Zero-Trust AI Guardrails',
              desc: 'AURA treats all caller instructions as untrusted data. External callers cannot modify AURA’s security directives.',
            },
            {
              title: 'Emergency DND Bypass Security',
              desc: 'Emergency bypass triggers require your private emergency PIN before dismissing alerts on your phone.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-slate-100 space-y-1.5 text-xs"
            >
              <div className="flex items-center gap-2 text-cyan-600 font-bold">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11.5px]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Incident Report Modal */}
      <SafeGuardIncidentReportModal
        report={viewingReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
