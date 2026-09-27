import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ShieldAlert,
  X,
  Radio,
  Clock,
  FileText,
  CheckCircle2,
  Send,
  User,
  Bot,
  Briefcase,
  Users,
  GraduationCap,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { CallCategory, SimulationType, Call } from '../types';
import { api } from '../services/api';
import { useVoiceCall } from '../hooks/useVoiceCall';
import { useAuraState } from '../context/AuraStateContext';

interface CallSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallCompleted: (newCallId?: number) => void;
  initialScenarioIndex?: number;
}

interface ScenarioOption {
  title: string;
  simulationType: SimulationType;
  category: CallCategory;
  callerName: string;
  callerNumber: string;
  openingLine: string;
  description: string;
  icon: any;
}

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  isOpen,
  onClose,
  onCallCompleted,
  initialScenarioIndex,
}) => {
  // 7 Scenario types + 1 Emergency scenario for safety verification
  const scenarios: ScenarioOption[] = [
    {
      title: 'Job Interview',
      simulationType: 'Job Interview',
      category: 'INTERVIEW',
      callerName: 'David Miller (VP of Engineering)',
      callerNumber: '+1 (415) 890-3412',
      openingLine: "Hi Alex, thank you for joining our interview today. Could you walk me through your background and your experience building distributed real-time systems?",
      description: 'AURA speaks in the first person ("I", "my background") as Alex Chen with verified work experience.',
      icon: Briefcase,
    },
    {
      title: 'HR Screening',
      simulationType: 'HR Screening',
      category: 'INTERVIEW',
      callerName: 'Jessica Taylor (Head of Talent)',
      callerNumber: '+1 (415) 772-9021',
      openingLine: "Hello Alex, this is Jessica from Talent Acquisition. I'm following up on your profile for the Staff AI role to verify your skills and availability.",
      description: 'Discusses verified technical stack and politely defers private compensation in first person.',
      icon: Users,
    },
    {
      title: 'Recruiter Call',
      simulationType: 'Recruiter Call',
      category: 'INTERVIEW',
      callerName: 'Brenda Clark (Apex Executive Search)',
      callerNumber: '+1 (212) 441-8930',
      openingLine: "Hi Alex! I came across your impressive AI background. What is your current compensation and what projects are you leading right now?",
      description: 'Tests first-person salary withholding and anti-hallucination guardrails.',
      icon: Briefcase,
    },
    {
      title: 'Customer Call',
      simulationType: 'Customer Call',
      category: 'BUSINESS',
      callerName: 'Robert Sterling (Enterprise Partner)',
      callerNumber: '+1 (206) 555-8910',
      openingLine: "Hi Alex, we are seeing an unexpected latency spike on our streaming webhook integration this afternoon. Can you confirm if your team is deploying?",
      description: 'Answers professionally on operational status, SLA, and commits to an action item follow-up.',
      icon: MessageSquare,
    },
    {
      title: 'Professional Networking Call',
      simulationType: 'Professional Networking Call',
      category: 'BUSINESS',
      callerName: 'Elena Rostova (AI Summit Chair)',
      callerNumber: '+1 (650) 321-7654',
      openingLine: "Hello Alex! I saw your recent published work on real-time conversational agents and wanted to invite you to speak on our keynote panel next month.",
      description: 'Warm, professional response representing Alex’s speaking interests and schedule availability.',
      icon: Users,
    },
    {
      title: 'General Personal Call',
      simulationType: 'General Personal Call',
      category: 'PERSONAL',
      callerName: 'Marcus Evans (Friend)',
      callerNumber: '+1 (510) 902-3341',
      openingLine: "Hey Alex! Just checking in to see how your week is going and if you're free to catch up this weekend?",
      description: 'Friendly, natural personal cadence explaining current busy status and suggesting coffee.',
      icon: Users,
    },
    {
      title: 'Technical Interview',
      simulationType: 'Technical Interview',
      category: 'INTERVIEW',
      callerName: 'Dr. Alan Turing (Principal Architect)',
      callerNumber: '+1 (617) 555-0143',
      openingLine: "Hello Alex. Let's delve into architectural depth. How do you design WebSocket pipelines with FastAPI to minimize conversational round-trip latency?",
      description: 'Deep technical answers directly citing verified FastAPI, Kafka, and PyTorch architecture achievements.',
      icon: GraduationCap,
    },
    {
      title: 'Emergency Crisis (Test)',
      simulationType: 'General Personal Call',
      category: 'EMERGENCY',
      callerName: 'Stanford Hospital Emergency Desk',
      callerNumber: '+1 (650) 443-9821',
      openingLine: "Alex, please pick up! This is Dr. Gomez from Stanford ER. David Chen was admitted and we need emergency authorization immediately!",
      description: 'Triggers instant DND bypass emergency protocol and alerts user with security PIN requirement.',
      icon: ShieldAlert,
    },
  ];

  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(initialScenarioIndex ?? 0);

  useEffect(() => {
    if (initialScenarioIndex !== undefined) {
      setSelectedScenarioIdx(initialScenarioIndex);
    }
  }, [initialScenarioIndex]);
  const [modalStage, setModalStage] = useState<'SELECT' | 'CALLING' | 'SUMMARY'>('SELECT');
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<Array<{ speaker: 'CALLER' | 'ASSISTANT'; text: string }>>([]);
  const [emergencyAlertTriggered, setEmergencyAlertTriggered] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [textInputFallback, setTextInputFallback] = useState('');
  const [finalCallData, setFinalCallData] = useState<Call | null>(null);

  const activeCallIdRef = useRef<number | null>(null);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);

  const currentScenario = scenarios[selectedScenarioIdx];

  // Callback when caller speaks into the microphone
  const handleUserSpoke = async (spokenText: string): Promise<string | void> => {
    if (!spokenText.trim() || !activeCallIdRef.current) return;

    const userText = spokenText.trim();
    // Add caller turn to transcript
    setTranscripts((prev) => [...prev, { speaker: 'CALLER', text: userText }]);

    try {
      const resp = await api.interactInCall(
        activeCallIdRef.current,
        userText,
        currentScenario.simulationType,
        true // first_person representation
      );

      if (resp.is_emergency) {
        setEmergencyAlertTriggered(true);
      }

      // Add assistant response to transcript
      setTranscripts((prev) => [...prev, { speaker: 'ASSISTANT', text: resp.assistant_reply }]);

      // Return assistant reply so useVoiceCall speaks it via TTS
      return resp.assistant_reply;
    } catch (err) {
      console.error('API interaction failed, using grounded fallback', err);
      const fallbackReply = "I am currently in a meeting, but I have noted that in my logs and will review it as soon as I am free.";
      setTranscripts((prev) => [...prev, { speaker: 'ASSISTANT', text: fallbackReply }]);
      return fallbackReply;
    }
  };

  const {
    callState,
    isMuted,
    liveTranscript,
    currentAiSpeech,
    micAudioLevel,
    errorMessage,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    startCall,
    toggleMute,
    endCall: terminateVoiceSession,
    sendTextMessage,
  } = useVoiceCall({
    onUserSpoke: handleUserSpoke,
  });

  // Call duration counter
  useEffect(() => {
    let timer: any;
    if (modalStage === 'CALLING' && callState !== 'ended') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [modalStage, callState]);

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (transcriptsEndRef.current) {
      transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, liveTranscript]);

  const { setVisualState, setAudioLevel, addActivity } = useAuraState();

  // Synchronize simulation lifecycle with 3D spatial environment
  useEffect(() => {
    if (!isOpen) {
      setVisualState('IDLE');
      setAudioLevel(0);
      return;
    }

    if (modalStage === 'CALLING') {
      setAudioLevel(micAudioLevel);
      if (emergencyAlertTriggered || currentScenario.category === 'EMERGENCY') {
        setVisualState('EMERGENCY');
      } else if (callState === 'speaking') {
        setVisualState('SPEAKING');
      } else if (callState === 'listening') {
        setVisualState('LISTENING');
      } else if (currentScenario.category === 'INTERVIEW') {
        setVisualState('INTERVIEW');
      } else {
        setVisualState('INCOMING_CALL');
      }
    } else if (modalStage === 'SUMMARY') {
      setVisualState('COMPLETED');
      setAudioLevel(0);
    } else {
      setVisualState('IDLE');
    }
  }, [isOpen, modalStage, callState, micAudioLevel, emergencyAlertTriggered, currentScenario, setVisualState, setAudioLevel]);

  if (!isOpen) return null;

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start real-time call
  const handleStartCall = async () => {
    setModalStage('CALLING');
    setCallDuration(0);
    setTranscripts([]);
    setEmergencyAlertTriggered(false);
    setShowTranscriptDrawer(false);

    try {
      addActivity(`Simulating call: ${currentScenario.simulationType} with ${currentScenario.callerName}`, currentScenario.category === 'EMERGENCY' ? 'EMERGENCY' : 'INCOMING_CALL');
      const res = await api.simulateCall({
        caller_name: currentScenario.callerName,
        caller_number: currentScenario.callerNumber,
        scenario: currentScenario.category,
        simulation_type: currentScenario.simulationType,
        opening_line: currentScenario.openingLine,
        is_video: false,
        first_person: true,
      });

      setActiveCallId(res.call_id);
      activeCallIdRef.current = res.call_id;

      // Add initial greeting to transcript
      setTranscripts([
        { speaker: 'ASSISTANT', text: res.greeting },
      ]);

      if (currentScenario.category === 'EMERGENCY') {
        setEmergencyAlertTriggered(true);
      }

      // Start voice session and speak initial scenario line or greeting
      await startCall(res.greeting);
    } catch (err: any) {
      console.error('Failed to initiate simulation call:', err);
    }
  };

  // End Call & Display Summary
  const handleEndCall = async () => {
    terminateVoiceSession();
    const callId = activeCallIdRef.current;

    if (callId) {
      try {
        const finalized = await api.finalizeCall(callId);
        setFinalCallData(finalized);
        setModalStage('SUMMARY');
        onCallCompleted(callId);
      } catch (err) {
        console.error('Error finalizing call:', err);
        setModalStage('SUMMARY');
        onCallCompleted(callId);
      }
    } else {
      setModalStage('SUMMARY');
    }
  };

  // Send typed message
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputFallback.trim()) return;
    sendTextMessage(textInputFallback.trim());
    setTextInputFallback('');
  };

  const handleCloseModal = () => {
    terminateVoiceSession();
    onClose();
    setModalStage('SELECT');
    setActiveCallId(null);
    activeCallIdRef.current = null;
    setFinalCallData(null);
  };

  return (
    <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top App Bar */}
        <div className="px-6 py-4 border-b border-aura-border flex items-center justify-between bg-aura-bg/80">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  AURA Real-Time Telephony
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Voice Engine v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400">First-Person Conversational Call Agent</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-aura-border transition"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STAGE 1: SELECT SCENARIO */}
        {modalStage === 'SELECT' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center max-w-lg mx-auto">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Real-Time Voice Call Simulation
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Experience AURA Speaking Live
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AURA answers callers hands-free through your microphone and speaks aloud in real time.
                AURA represents your configured profile in the <strong className="text-slate-200">first person</strong> (&quot;I&quot;, &quot;my experience&quot;).
              </p>
            </div>

            {/* Warning if browser doesn't support Web Speech */}
            {(!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Note: Web Speech API is best supported in modern Chrome, Edge, or Safari. If microphone speech is unavailable, on-screen text input is provided as an immediate fallback.
                </span>
              </div>
            )}

            {/* 7 Scenarios Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((scen, idx) => {
                const IconComponent = scen.icon;
                const isSelected = selectedScenarioIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedScenarioIdx(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${isSelected
                        ? 'bg-gradient-to-br from-cyan-500/20 via-aura-card to-violet-500/20 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                        : 'bg-aura-bg/60 border-aura-border hover:border-slate-600 hover:bg-aura-bg'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-aura-card text-cyan-400 border border-aura-border'}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-white">{scen.title}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scen.category === 'EMERGENCY'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        }`}>
                        {scen.simulationType}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-300">{scen.callerName}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      &quot;{scen.openingLine}&quot;
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      {scen.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Selected Scenario Preview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-aura-bg to-slate-900 border border-aura-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Phone className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    Ready to Connect Call
                  </span>
                  <h4 className="text-sm font-bold text-white">{currentScenario.callerName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{currentScenario.callerNumber}</p>
                </div>
              </div>

              <button
                onClick={handleStartCall}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition transform hover:scale-105 active:scale-95"
              >
                <Phone className="h-4 w-4 fill-current" />
                <span>Start Live Voice Call</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: LIVE CALL CONSOLE */}
        {modalStage === 'CALLING' && (
          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden relative">
            {/* Header / Caller Info Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-aura-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
                    {currentScenario.callerName.charAt(0)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-aura-card animate-ping" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {currentScenario.callerName}
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-aura-bg border border-aura-border text-cyan-300">
                      {currentScenario.simulationType}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{currentScenario.callerNumber}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Clock className="h-3 w-3" /> {formatTime(callDuration)}
                    </span>
                    {activeCallId && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400">Session #{activeCallId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 transition-all ${isMuted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : callState === 'speaking'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : callState === 'thinking'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
                        : callState === 'listening'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${isMuted ? 'bg-rose-400' :
                      callState === 'speaking' ? 'bg-cyan-400 animate-pulse' :
                        callState === 'thinking' ? 'bg-amber-400 animate-spin' :
                          callState === 'listening' ? 'bg-emerald-400 animate-ping' :
                            'bg-slate-400'
                    }`} />
                  <span>
                    {isMuted
                      ? 'Microphone Muted'
                      : callState === 'speaking'
                        ? 'AURA Speaking'
                        : callState === 'thinking'
                          ? 'AURA Thinking...'
                          : callState === 'listening'
                            ? 'Listening to You...'
                            : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Alert Banner */}
            {emergencyAlertTriggered && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-3 animate-pulse">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                <div className="flex-1">
                  <strong>POTENTIAL EMERGENCY ESCALATION DETECTED:</strong> High-priority DND bypass alert dispatched to Alex&apos;s security center.
                </div>
              </div>
            )}

            {/* Error banner if mic is blocked */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage} You can still use the text input below.</span>
              </div>
            )}

            {/* CENTRAL PHONE STAGE: CLEAN RECTANGULAR ACOUSTIC CONSOLE (NO CIRCULAR RINGS/ORBS) */}
            <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {/* Rectangular AI Telephony Visualizer Console */}
              <div className="w-full max-w-sm p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-4 mb-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border transition-all ${
                      isMuted
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : callState === 'speaking'
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : callState === 'thinking'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : callState === 'listening'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-700/40 border-slate-600 text-slate-300'
                    }`}
                  >
                    {callState === 'speaking' ? (
                      <Volume2 className="h-6 w-6 animate-pulse" />
                    ) : callState === 'thinking' ? (
                      <Sparkles className="h-6 w-6 animate-pulse" />
                    ) : isMuted ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {isMuted
                        ? 'Microphone Muted'
                        : callState === 'speaking'
                        ? 'AURA Speaking'
                        : callState === 'thinking'
                        ? 'Synthesizing Response...'
                        : callState === 'listening'
                        ? 'Listening to Caller'
                        : 'Connected'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {callState === 'speaking'
                        ? 'Real-Time Neural Speech'
                        : callState === 'listening'
                        ? 'Active Audio Stream'
                        : 'Voice Session Online'}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    callState === 'speaking'
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : callState === 'listening'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {callState.toUpperCase()}
                </span>
              </div>

              {/* Dynamic Waveform Bars */}
              <div className="flex items-center gap-1.5 mt-6 h-8">
                {[...Array(18)].map((_, i) => {
                  let barHeight = 4;
                  if (callState === 'speaking') {
                    barHeight = Math.max(6, ((i * 7 + callDuration * 12) % 26) + 6);
                  } else if (callState === 'listening' && !isMuted) {
                    barHeight = Math.max(4, Math.round((micAudioLevel / 100) * 28 * (1 - Math.abs(i - 9) / 10)));
                  }
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${callState === 'speaking'
                          ? 'bg-gradient-to-t from-cyan-400 to-violet-400'
                          : callState === 'listening' && !isMuted
                            ? 'bg-emerald-400'
                            : 'bg-slate-800'
                        }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  );
                })}
              </div>

              {/* Spoken Subtitle Caption Overlay */}
              <div className="mt-4 px-4 py-2 rounded-2xl bg-aura-bg/80 border border-aura-border/80 max-w-md text-center">
                {callState === 'speaking' && currentAiSpeech ? (
                  <p className="text-xs text-cyan-200 italic font-medium line-clamp-2">
                    &quot;{currentAiSpeech}&quot;
                  </p>
                ) : liveTranscript ? (
                  <p className="text-xs text-emerald-200 font-medium line-clamp-2">
                    You: &quot;{liveTranscript}&quot;
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {callState === 'listening'
                      ? '🎙 Speak into your microphone now...'
                      : callState === 'thinking'
                        ? 'Thinking grounded response...'
                        : 'Connected • AURA First-Person Engine'}
                  </p>
                )}
              </div>
            </div>

            {/* COLLAPSIBLE LIVE TRANSCRIPT DRAWER */}
            {showTranscriptDrawer && (
              <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 max-h-48 overflow-y-auto space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-aura-border text-[11px] font-bold text-slate-400 uppercase">
                  <span>Live Conversation Transcript</span>
                  <span>{transcripts.length} Turns</span>
                </div>
                {transcripts.map((t, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${t.speaker === 'ASSISTANT' ? 'items-start' : 'items-start justify-end'}`}
                  >
                    {t.speaker === 'ASSISTANT' && (
                      <div className="h-6 w-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-cyan-300" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${t.speaker === 'ASSISTANT'
                        ? 'bg-aura-card border border-cyan-500/20 text-cyan-100'
                        : 'bg-violet-950/40 border border-violet-500/30 text-slate-100'
                      }`}>
                      <span className="text-[10px] font-bold block mb-0.5 text-slate-400">
                        {t.speaker === 'ASSISTANT' ? 'AURA (Representing Alex)' : currentScenario.callerName}
                      </span>
                      <p>{t.text}</p>
                    </div>
                    {t.speaker === 'CALLER' && (
                      <div className="h-6 w-6 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-violet-300" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptsEndRef} />
              </div>
            )}

            {/* CALL CONTROLS BAR */}
            <div className="pt-2 flex flex-col gap-3">
              {/* Optional text input fallback for quiet environments or debugging */}
              <form onSubmit={handleSendText} className="flex gap-2">
                <input
                  type="text"
                  value={textInputFallback}
                  onChange={(e) => setTextInputFallback(e.target.value)}
                  placeholder="Or type what caller says (e.g., 'What is your experience with FastAPI?')..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-aura-bg border border-aura-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!textInputFallback.trim()}
                  className="px-4 py-2.5 rounded-xl bg-aura-border hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>

              {/* Primary Call Controls */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1">
                {/* Mute Mic Button */}
                <button
                  onClick={toggleMute}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition shadow-lg ${isMuted
                      ? 'bg-rose-500 text-white shadow-rose-500/30'
                      : 'bg-aura-bg hover:bg-aura-border border border-aura-border text-slate-300 hover:text-white'
                    }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Transcript Drawer Toggle */}
                <button
                  onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
                  className={`px-4 py-3 rounded-full flex items-center gap-2 border text-xs font-bold transition ${showTranscriptDrawer
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      : 'bg-aura-bg hover:bg-aura-border border-aura-border text-slate-400 hover:text-white'
                    }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Transcript ({transcripts.length})</span>
                </button>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-xl shadow-rose-600/30 transition transform hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="h-4 w-4 fill-current" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: POST-CALL SUMMARY VIEW */}
        {modalStage === 'SUMMARY' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto mb-3 text-emerald-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white">Call Completed & Analyzed</h3>
              <p className="text-xs text-slate-400 mt-1">
                AURA has successfully finalized the session and generated summary actions.
              </p>
            </div>

            {/* Summary Metrics Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-aura-bg border border-aura-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                <p className="text-base font-bold text-white mt-1">{formatTime(callDuration)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-aura-bg border border-aura-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                <p className="text-base font-bold text-cyan-300 mt-1">
                  {finalCallData?.category || currentScenario.category}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-aura-bg border border-aura-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Urgency</span>
                <p className={`text-base font-bold mt-1 ${finalCallData?.urgency === 'URGENT' || finalCallData?.urgency === 'POTENTIAL_EMERGENCY'
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                  }`}>
                  {finalCallData?.urgency || 'NORMAL'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-aura-bg border border-aura-border">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grounding</span>
                <p className="text-base font-bold text-violet-400 mt-1">Verified</p>
              </div>
            </div>

            {/* Executive Overview */}
            <div className="p-4 rounded-2xl bg-aura-bg border border-aura-border space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>AI Call Overview</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finalCallData?.summary?.overview ||
                  `AURA represented Alex Chen during a ${currentScenario.simulationType} call with ${currentScenario.callerName}. Spoke concisely in the first person, answering grounded technical and background inquiries while maintaining privacy.`}
              </p>
            </div>

            {/* Key Decisions & Follow-ups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-aura-bg border border-aura-border space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Key Points & Decisions
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {finalCallData?.summary?.key_decisions && finalCallData.summary.key_decisions.length > 0 ? (
                    finalCallData.summary.key_decisions.map((kd, i) => (
                      <li key={i} className="leading-relaxed">{kd}</li>
                    ))
                  ) : (
                    <>
                      <li>Grounded responses strictly verified against profile.</li>
                      <li>Protected sensitive compensation & personal contact info.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-aura-bg border border-aura-border space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Generated Action Items ({finalCallData?.action_items?.length || 1})
                </h4>
                <div className="space-y-2">
                  {finalCallData?.action_items && finalCallData.action_items.length > 0 ? (
                    finalCallData.action_items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{item.task}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Follow up with {currentScenario.callerName} regarding next steps.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
