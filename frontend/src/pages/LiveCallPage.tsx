/**
 * LiveCallPage — ChatGPT-style real-time voice conversation with AURA.
 *
 * Flow:
 *   User clicks "Start Live Call"
 *   → Mic permission requested
 *   → AURA speaks a greeting
 *   → User speaks naturally
 *   → Speech-to-text (Web Speech API)
 *   → Question sent to backend /interact endpoint
 *   → Backend runs through existing AI/resume pipeline
 *   → Answer spoken back via browser TTS
 *   → Microphone resumes listening
 *   → Repeat until user clicks End Call
 *
 * Resume grounding:
 *   The sanitized resume text is read from localStorage (set by InterviewAssistantPage)
 *   and passed to every /interact request as `resume_text`. The backend's
 *   MockLLMProvider / CloudLLMProvider grounds all answers exclusively to that
 *   resume — it will not invent information.
 *
 * Multi-turn context:
 *   The backend stores every CALLER/ASSISTANT transcript for the active call_id
 *   and rebuilds the full conversation history on each /interact call, so follow-up
 *   questions ("which one used Python?") work correctly.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Radio,
  RotateCcw,
  Send,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { useVoiceCall } from '../hooks/useVoiceCall';
import { useAuraState } from '../context/AuraStateContext';

interface LiveCallPageProps {
  onClose: () => void;
}

interface TranscriptLine {
  speaker: 'USER' | 'AURA';
  text: string;
  ts: number;
}

// ─── Orbital ring animation component ─────────────────────────────────────────
const OrbitalRing: React.FC<{
  active: boolean;
  color: string;
  size: number;
  speed: string;
  opacity?: number;
}> = ({ active, color, size, speed, opacity = 0.4 }) => (
  <div
    className={`absolute rounded-full border-2 transition-opacity duration-700 ${active ? '' : 'opacity-0'}`}
    style={{
      width: size,
      height: size,
      borderColor: color,
      opacity: active ? opacity : 0,
      animation: active ? `spin ${speed} linear infinite` : 'none',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  />
);

// ─── Live audio waveform bars ──────────────────────────────────────────────────
const WaveformBars: React.FC<{
  level: number;
  state: 'listening' | 'speaking' | 'idle';
}> = ({ level, state }) => {
  const bars = 20;
  const baseHeights = [8, 12, 18, 22, 28, 32, 36, 30, 24, 18, 14, 18, 24, 30, 36, 32, 28, 22, 16, 10];

  return (
    <div className="flex items-center justify-center gap-1 h-10">
      {Array.from({ length: bars }).map((_, i) => {
        const base = baseHeights[i % baseHeights.length];
        let height = 4;
        if (state === 'listening' && level > 2) {
          const reactivity = Math.sin(i * 1.2) * 0.4 + 0.6;
          height = Math.max(4, Math.round(4 + (level / 100) * base * reactivity));
        } else if (state === 'speaking') {
          const wave = Math.sin((Date.now() / 200) + i * 0.8) * 0.4 + 0.6;
          height = Math.max(4, Math.round(base * wave * 0.8 + 6));
        }
        const clamped = Math.min(38, height);
        const color =
          state === 'speaking'
            ? 'bg-gradient-to-t from-cyan-500 to-violet-400'
            : state === 'listening' && level > 5
            ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
            : 'bg-slate-300';
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${color}`}
            style={{ height: `${clamped}px` }}
          />
        );
      })}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export const LiveCallPage: React.FC<LiveCallPageProps> = ({ onClose }) => {
  const { setVisualState, setAudioLevel, addActivity } = useAuraState();

  // Call session state
  const [phase, setPhase] = useState<'idle' | 'starting' | 'active' | 'ended'>('idle');
  const [callId, setCallId] = useState<number | null>(null);
  const callIdRef = useRef<number | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Keep callDuration accessible inside callbacks via a ref
  const durationRef = useRef(0);
  durationRef.current = callDuration;

  // ── Scroll transcript to bottom whenever it updates
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // ── Preload latest resume into localStorage if not already cached
  useEffect(() => {
    if (!localStorage.getItem('aura_saved_sanitized_resume') && !localStorage.getItem('aura_saved_raw_resume')) {
      api.getLatestResume().then((saved) => {
        if (saved?.sanitized_text) {
          localStorage.setItem('aura_saved_sanitized_resume', saved.sanitized_text);
        } else if (saved?.raw_text) {
          localStorage.setItem('aura_saved_raw_resume', saved.raw_text);
        }
      }).catch(() => {});
    }
  }, []);

  // ── Call duration timer
  useEffect(() => {
    if (phase !== 'active') return;
    const id = setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Format mm:ss
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── onUserSpoke: the bridge from STT → backend AI → TTS
  // Returns the assistant reply text so useVoiceCall can speak it.
  const handleUserSpoke = useCallback(
    async (spokenText: string): Promise<string | void> => {
      const userText = spokenText.trim();
      if (!userText || !callIdRef.current) return;

      setTranscript((prev) => [
        ...prev,
        { speaker: 'USER', text: userText, ts: Date.now() },
      ]);

      try {
        // Read sanitized resume from localStorage (set by Interview Assistant page).
        // Falls back to raw resume if sanitized is unavailable.
        const resumeText =
          localStorage.getItem('aura_saved_sanitized_resume') ||
          localStorage.getItem('aura_saved_raw_resume') ||
          undefined;

        const resp = await api.interactInCall(
          callIdRef.current,
          userText,
          'Job Interview',   // simulation_type — triggers interview grounding
          false,             // first_person = false → AURA speaks as representative
          resumeText
        );

        const reply = resp.assistant_reply;
        setTranscript((prev) => [
          ...prev,
          { speaker: 'AURA', text: reply, ts: Date.now() },
        ]);
        return reply;
      } catch (err: any) {
        console.error('[LiveCall] Backend error:', err);
        const msg = err?.message || 'Backend unavailable';
        setBackendError(msg);
        const fallback =
          "I'm having trouble connecting right now. Please try again in a moment.";
        setTranscript((prev) => [
          ...prev,
          { speaker: 'AURA', text: fallback, ts: Date.now() },
        ]);
        return fallback;
      }
    },
    []  // no deps — reads everything through refs and stable functions
  );

  // ── useVoiceCall hook: all microphone + TTS logic lives here
  const {
    voiceState,
    isMuted,
    micPermissionState,
    liveTranscript,
    micAudioLevel,
    errorMessage: voiceError,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    startCall,
    speak,
    replayLastAiSpeech,
    requestMicPermission,
    toggleMute,
    interruptSpeech,
    endCall: endVoiceSession,
    sendTextMessage,
    testSpeakerAudio,
  } = useVoiceCall({ onUserSpoke: handleUserSpoke });

  // ── Sync AURA global visual state with voice state
  useEffect(() => {
    if (phase !== 'active') return;
    if (voiceState === 'AI_SPEAKING') {
      setVisualState('SPEAKING');
    } else if (voiceState === 'USER_SPEAKING' || voiceState === 'LISTENING') {
      setVisualState('LISTENING');
    } else {
      setVisualState('INTERVIEW');
    }
    setAudioLevel(micAudioLevel);
  }, [voiceState, micAudioLevel, phase, setVisualState, setAudioLevel]);

  // ── START CALL ─────────────────────────────────────────────────────────────
  const handleStartCall = useCallback(async () => {
    setBackendError(null);
    setCallDuration(0);
    setTranscript([]);
    setPhase('starting');

    try {
      // Create a backend call session so transcripts and AI context are persisted.
      const res = await api.simulateCall({
        caller_name: 'Live Voice User',
        caller_number: '+1 (000) 000-0000',
        scenario: 'INTERVIEW',
        simulation_type: 'Job Interview',
        opening_line: undefined,
        is_video: false,
        first_person: false,  // AURA acts as representative
      });

      setCallId(res.call_id);
      callIdRef.current = res.call_id;

      // Add greeting to transcript before going active so it renders immediately
      const greeting = res.greeting;
      setTranscript([{ speaker: 'AURA', text: greeting, ts: Date.now() }]);

      addActivity('Live voice call started — resume grounding active', 'INTERVIEW', 'LIVE');

      // Transition to active BEFORE calling startCall so the active UI is
      // visible while the mic permission dialog appears.
      setPhase('active');

      // startCall: awaits getUserMedia + AudioContext, speaks greeting, then listens.
      // The call to startCall happens inside the click handler (user gesture context)
      // which satisfies browser autoplay policy for both AudioContext and speechSynthesis.
      await startCall(greeting);
    } catch (err: any) {
      console.error('[LiveCall] Start error:', err);
      setPhase('idle');
      setBackendError(
        err?.message ||
          'Could not start call. Make sure the backend is running on port 8000.'
      );
    }
  }, [startCall, addActivity]);

  // ── END CALL ───────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    endVoiceSession();
    setPhase('ended');
    setVisualState('COMPLETED');
    setAudioLevel(0);

    const cid = callIdRef.current;
    callIdRef.current = null;
    if (cid) {
      try {
        await api.finalizeCall(cid);
      } catch {
        // Finalization is best-effort; don't block the UI
      }
    }
    addActivity(`Live voice call ended — ${fmt(durationRef.current)} duration`, 'COMPLETED', 'CALL');
  }, [endVoiceSession, setVisualState, setAudioLevel, addActivity]);

  // ── Text fallback submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendTextMessage(textInput.trim());
    setTextInput('');
  };

  // ── Derive UI state labels
  const stateLabel = isMuted
    ? 'Microphone Muted'
    : voiceState === 'AI_SPEAKING'
    ? 'AURA Speaking'
    : voiceState === 'PROCESSING'
    ? 'Thinking…'
    : voiceState === 'USER_SPEAKING'
    ? 'Listening…'
    : voiceState === 'LISTENING'
    ? 'Ready — Speak Now'
    : voiceState === 'ERROR'
    ? 'Error'
    : 'Idle';

  const stateColor =
    voiceState === 'AI_SPEAKING'
      ? 'text-cyan-600'
      : voiceState === 'PROCESSING'
      ? 'text-amber-600'
      : voiceState === 'USER_SPEAKING'
      ? 'text-blue-600'
      : voiceState === 'ERROR'
      ? 'text-rose-600'
      : 'text-emerald-600';

  const ringActive = phase === 'active';
  const orbColor1 =
    voiceState === 'AI_SPEAKING'
      ? '#22d3ee'
      : voiceState === 'USER_SPEAKING'
      ? '#60a5fa'
      : voiceState === 'PROCESSING'
      ? '#fbbf24'
      : '#34d399';
  const orbColor2 = voiceState === 'AI_SPEAKING' ? '#818cf8' : '#6366f1';

  return (
    <div className="fixed inset-0 z-50 bg-white/98 backdrop-blur-2xl flex flex-col items-center justify-start overflow-y-auto">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Radio className="h-4 w-4 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cyan-600">
              AURA Live Call
            </span>
            {phase === 'active' && (
              <p className="text-[11px] text-slate-500 font-mono">
                Session {callId} &nbsp;•&nbsp; {fmt(callDuration)}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={phase === 'active' ? handleEndCall : onClose}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Browser capability warning ──────────────────────────────────────── */}
      {(!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) && (
        <div className="w-full max-w-3xl mx-auto px-6 mb-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {!isSpeechRecognitionSupported
                ? 'Speech recognition is not supported in this browser. Please use Chrome or Edge. You can still use the text input below.'
                : 'Text-to-speech is not available in this browser. AI replies will appear as text only.'}
            </span>
          </div>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {(backendError || voiceError) && (
        <div className="w-full max-w-3xl mx-auto px-6 mb-4">
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-700 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="font-semibold">{voiceError || backendError}</span>
            </div>
            {/* Backend-offline hint */}
            {(backendError || '').includes('port 8000') && (
              <div className="ml-6 mt-1 text-[11px] text-rose-600 bg-rose-100/70 rounded-xl px-3 py-2 font-mono leading-relaxed">
                <p className="font-bold mb-1">Start the backend:</p>
                <p>cd AURA_11/backend</p>
                <p>python -m uvicorn app.main:app --port 8000</p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 mt-1">
              {phase === 'idle' && (
                <button
                  onClick={handleStartCall}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => setBackendError(null)}
                className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* IDLE — Before call starts                                               */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {(phase === 'idle' || phase === 'starting') && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-6 py-12 gap-10">

          {/* Pulsing orb */}
          <div className="relative flex items-center justify-center w-52 h-52">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-600/20 blur-2xl" />
            <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 border border-cyan-500/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
              {phase === 'starting' ? (
                <Loader2 className="h-12 w-12 text-cyan-300 animate-spin" />
              ) : (
                <Phone className="h-12 w-12 text-cyan-300" />
              )}
            </div>
            {/* Decorative rings */}
            {[160, 200, 240].map((s, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-cyan-500/20 animate-ping"
                style={{
                  width: s,
                  height: s,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: '2.4s',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {phase === 'starting' ? 'Connecting…' : 'AURA Live Call'}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              {phase === 'starting'
                ? 'Setting up your session and requesting microphone access…'
                : 'Speak naturally. AURA answers using only the information from your uploaded resume — grounded, accurate, and private.'}
            </p>
            {phase === 'idle' && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {['Resume grounded', 'No hallucination', 'Multi-turn context', 'Privacy shielded'].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleStartCall}
            disabled={phase === 'starting'}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {phase === 'starting' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <Phone className="h-5 w-5 fill-current" />
                <span>Start Live Call</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ACTIVE — Live conversation                                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {phase === 'active' && (
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-5 pb-8">

          {/* ── Central orb with orbital rings ──────────────────────────────── */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
              {/* Background glow */}
              <div
                className="absolute inset-0 rounded-full blur-3xl transition-all duration-700"
                style={{
                  background:
                    voiceState === 'AI_SPEAKING'
                      ? 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)'
                      : voiceState === 'USER_SPEAKING'
                      ? 'radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%)'
                      : voiceState === 'PROCESSING'
                      ? 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)',
                }}
              />

              {/* Orbital rings */}
              <style>{`@keyframes spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>
              <OrbitalRing active={ringActive} color={orbColor1} size={190} speed="4s" opacity={0.35} />
              <OrbitalRing active={ringActive} color={orbColor2} size={155} speed="6s" opacity={0.25} />
              <OrbitalRing active={ringActive && voiceState === 'USER_SPEAKING'} color="#60a5fa" size={130} speed="2.5s" opacity={0.45} />

              {/* Core */}
              <div
                className="relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background:
                    voiceState === 'AI_SPEAKING'
                      ? 'linear-gradient(135deg, #0e7490 0%, #4f46e5 100%)'
                      : voiceState === 'USER_SPEAKING'
                      ? 'linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)'
                      : voiceState === 'PROCESSING'
                      ? 'linear-gradient(135deg, #92400e 0%, #4f46e5 100%)'
                      : 'linear-gradient(135deg, #065f46 0%, #0e7490 100%)',
                  boxShadow:
                    voiceState === 'AI_SPEAKING'
                      ? '0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(99,102,241,0.3)'
                      : voiceState === 'USER_SPEAKING'
                      ? '0 0 40px rgba(96,165,250,0.5)'
                      : '0 0 30px rgba(52,211,153,0.3)',
                }}
              >
                {isMuted ? (
                  <MicOff className="h-8 w-8 text-rose-300" />
                ) : voiceState === 'AI_SPEAKING' ? (
                  <Volume2 className="h-8 w-8 text-cyan-200 animate-bounce" />
                ) : voiceState === 'PROCESSING' ? (
                  <Sparkles className="h-8 w-8 text-amber-300 animate-spin" />
                ) : voiceState === 'USER_SPEAKING' ? (
                  <Mic className="h-8 w-8 text-blue-200 animate-pulse" />
                ) : (
                  <Mic className="h-8 w-8 text-emerald-200 animate-pulse" />
                )}
              </div>
            </div>

            {/* State label */}
            <div className={`text-sm font-bold tracking-wide ${stateColor} flex items-center gap-2`}>
              <span
                className={`h-2 w-2 rounded-full inline-block ${
                  voiceState === 'AI_SPEAKING'
                    ? 'bg-cyan-400 animate-ping'
                    : voiceState === 'USER_SPEAKING'
                    ? 'bg-blue-400 animate-ping'
                    : voiceState === 'PROCESSING'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              {stateLabel}
            </div>

            {/* Waveform */}
            <WaveformBars
              level={micAudioLevel}
              state={
                voiceState === 'AI_SPEAKING'
                  ? 'speaking'
                  : voiceState === 'USER_SPEAKING' || voiceState === 'LISTENING'
                  ? 'listening'
                  : 'idle'
              }
            />

            {/* Mic permission warning */}
            {micPermissionState === 'denied' && (
              <div className="flex items-center gap-2 text-xs text-rose-700 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Microphone blocked — use the text input below or allow microphone access</span>
              </div>
            )}
          </div>

          {/* ── Call controls ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute toggle */}
            <button
              onClick={toggleMute}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition cursor-pointer text-xs font-bold ${
                isMuted
                  ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 animate-pulse" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            {/* Interrupt AURA */}
            {voiceState === 'AI_SPEAKING' && (
              <button
                onClick={interruptSpeech}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-700 text-xs font-bold transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Interrupt
              </button>
            )}

            {/* Replay */}
            {voiceState !== 'AI_SPEAKING' && (
              <button
                onClick={replayLastAiSpeech}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <Volume2 className="h-4 w-4" />
                Replay
              </button>
            )}

            {/* Mic permission retry */}
            {micPermissionState !== 'granted' && (
              <button
                onClick={requestMicPermission}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-700 text-xs font-bold transition cursor-pointer animate-pulse"
              >
                <Mic className="h-4 w-4" />
                Enable Mic
              </button>
            )}

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PhoneOff className="h-4 w-4" />
              End Call
            </button>
          </div>

          {/* ── Conversation transcript ───────────────────────────────────────── */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Conversation
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {transcript.length} turn{transcript.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
              {transcript.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  AURA is listening — speak your first question
                </p>
              )}

              {transcript.map((line, i) => {
                const isAura = line.speaker === 'AURA';
                return (
                  <div key={i} className={`flex gap-3 ${isAura ? 'justify-start' : 'justify-end'}`}>
                    {isAura && (
                      <div className="h-7 w-7 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shrink-0 text-[9px] font-black">
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isAura
                          ? 'bg-cyan-50 border border-cyan-200 text-slate-800 rounded-tl-sm'
                          : 'bg-blue-50 border border-blue-200 text-slate-800 rounded-tr-sm'
                      }`}
                    >
                      <span className="block text-[10px] font-mono text-slate-400 mb-1">
                        {isAura ? 'AURA' : 'You'}
                      </span>
                      {line.text}
                      {isAura && (
                        <button
                          onClick={() => speak(line.text)}
                          className="mt-1.5 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-700 border border-cyan-200 transition cursor-pointer"
                        >
                          <Volume2 className="h-2.5 w-2.5" />
                          Play
                        </button>
                      )}
                    </div>
                    {!isAura && (
                      <div className="h-7 w-7 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 text-[9px] font-black">
                        You
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live interim speech */}
              {liveTranscript && (
                <div className="flex gap-3 justify-end opacity-80">
                  <div className="max-w-md px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-slate-600 text-xs italic rounded-tr-sm">
                    <span className="block text-[10px] font-mono text-slate-400 mb-1">You (speaking…)</span>
                    {liveTranscript}
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {voiceState === 'PROCESSING' && (
                <div className="flex gap-3 justify-start animate-pulse">
                  <div className="h-7 w-7 rounded-xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shrink-0 text-[9px] font-black">
                    AI
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-slate-600 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                    Consulting resume…
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* ── Text fallback input ─────────────────────────────────────────── */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a question here — AURA will answer in voice…"
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-sm"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-cyan-500/20 shrink-0"
            >
              Ask
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* ── Test speaker button ───────────────────────────────────────────── */}
          <div className="flex items-center justify-center">
            <button
              onClick={testSpeakerAudio}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="h-3 w-3" />
              Test speaker audio
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ENDED — Summary screen                                                  */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {phase === 'ended' && (
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-6 py-12 gap-8">

          <div className="h-20 w-20 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shadow-xl shadow-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-slate-800">Call Ended</h2>
            <p className="text-sm text-slate-500">
              Duration: {fmt(callDuration)} &nbsp;•&nbsp; {transcript.filter((t) => t.speaker === 'USER').length} question{transcript.filter((t) => t.speaker === 'USER').length !== 1 ? 's' : ''} answered
            </p>
          </div>

          {/* Transcript summary */}
          {transcript.length > 0 && (
            <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Call Summary
              </div>
              <div className="max-h-60 overflow-y-auto px-4 py-3 space-y-2">
                {transcript.map((line, i) => (
                  <div key={i} className="text-xs">
                    <span className={`font-bold mr-2 ${line.speaker === 'AURA' ? 'text-cyan-600' : 'text-blue-600'}`}>
                      {line.speaker === 'AURA' ? 'AURA:' : 'You:'}
                    </span>
                    <span className="text-slate-700">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setPhase('idle');
                setTranscript([]);
                setCallDuration(0);
                setCallId(null);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-black text-xs transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Start Another Call
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveCallPage;
