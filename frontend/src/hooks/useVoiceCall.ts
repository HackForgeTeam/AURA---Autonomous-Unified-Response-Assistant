import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceInterviewState =
  | 'IDLE'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'PROCESSING'
  | 'AI_SPEAKING'
  | 'ERROR';

// Legacy lowercase type support for existing code
export type VoiceCallState =
  | VoiceInterviewState
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'searching_resume'
  | 'generating_response'
  | 'speaking'
  | 'ended'
  | 'error';

interface UseVoiceCallOptions {
  onUserSpoke: (transcript: string) => Promise<string | void>;
  onStateChange?: (state: VoiceInterviewState) => void;
  lang?: string;
}

export function useVoiceCall({
  onUserSpoke,
  onStateChange,
  lang = 'en-US',
}: UseVoiceCallOptions) {
  // Voice State Machine
  const [voiceState, setVoiceState] = useState<VoiceInterviewState>('IDLE');
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [currentAiSpeech, setCurrentAiSpeech] = useState<string>('');
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check microphone permissions on mount and listen to changes
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((status) => {
          setMicPermissionState(status.state as any);
          status.onchange = () => {
            setMicPermissionState(status.state as any);
          };
        })
        .catch(() => {
          // Permissions API query not supported for microphone on some browsers
        });
    }
  }, []);


  // References to guarantee lifecycle stability and prevent React re-render teardown bugs
  const onUserSpokeRef = useRef(onUserSpoke);
  onUserSpokeRef.current = onUserSpoke;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const voiceStateRef = useRef<VoiceInterviewState>('IDLE');
  const callActiveRef = useRef<boolean>(false);
  const lastSpokenAiTextRef = useRef<string>('');
  const isMutedRef = useRef<boolean>(false);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isRecognitionActiveRef = useRef<boolean>(false);

  // Speech Recognition & Timers
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const ttsKeepAliveTimerRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastCommittedTextRef = useRef<string>('');
  const activeUtteranceTextRef = useRef<string>('');
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speakTimeoutRef = useRef<any>(null);

  // Cache and listen for speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const populateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          voicesRef.current = available;
          console.log(`[TTS] ${available.length} speech synthesis voices loaded`);
        }
      } catch {}
    };
    populateVoices();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    } else {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    return () => {
      if (typeof window.speechSynthesis.removeEventListener === 'function') {
        window.speechSynthesis.removeEventListener('voiceschanged', populateVoices);
      }
    };
  }, []);

  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // API Support Checks
  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const isSpeechSynthesisSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Unified State Machine Transition Helper
  const transitionState = useCallback((newState: VoiceInterviewState) => {
    console.log(`[VOICE STATE] Transition: ${voiceStateRef.current} → ${newState}`);
    voiceStateRef.current = newState;
    setVoiceState(newState);
    onStateChangeRef.current?.(newState);
  }, []);

  // Safely stop microphone listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
      isRecognitionActiveRef.current = false;
    }
  }, []);

  // Safely start microphone listening
  const startListening = useCallback(() => {
    if (
      !isSpeechRecognitionSupported ||
      isAiSpeakingRef.current ||
      isMutedRef.current ||
      !callActiveRef.current
    ) {
      return;
    }

    if (recognitionRef.current && !isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.start();
        isRecognitionActiveRef.current = true;
        console.log('[VOICE] Speech recognition actively listening for user audio');
      } catch (err: any) {
        if (err.name !== 'InvalidStateError') {
          console.warn('[VOICE] Recognition start notice:', err);
        }
      }
    }
  }, [isSpeechRecognitionSupported]);

  const userBargeInFramesRef = useRef<number>(0);
  const interruptSpeechRef = useRef<() => void>(() => {});
  // Stable ref for commitUserSpeech so the SpeechRecognition onresult closure
  // always calls the latest version without needing it in the useEffect dep array.
  const commitUserSpeechRef = useRef<(text: string) => void>(() => {});

  // Audio chime for speaker activation — always reuses the shared AudioContext to avoid
  // creating multiple concurrent contexts (browser limits to ~6 simultaneous instances).
  const playSoftChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      // Reuse existing context; only create one if it doesn't exist yet
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio context might be restricted
    }
  }, []);

  // Web Audio Metering — initialises the microphone stream and AnalyserNode for VU
  // metering and barge-in detection. MediaRecorder has been removed: it served no
  // functional purpose but competed with SpeechRecognition for the audio track.
  const startAudioMetering = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[VOICE] getUserMedia not supported in this browser environment');
        return;
      }

      // If the stream is already open, do nothing
      if (mediaStreamRef.current) {
        return;
      }

      console.log('[VOICE] Requesting microphone access with echo cancellation...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicPermissionState('granted');
      console.log('[VOICE] Microphone stream ready');

      // Initialize Web Audio API Analyser — reuse existing AudioContext if available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current || voiceStateRef.current === 'IDLE') {
          setMicAudioLevel(0);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        // Natural interruption / turn-taking detection:
        // If AURA is currently speaking and user begins speaking audibly into the mic
        if (isAiSpeakingRef.current && !isMutedRef.current && normalized > 28) {
          userBargeInFramesRef.current += 1;
          if (userBargeInFramesRef.current >= 4) {
            console.log('[VOICE] User speech detected during speech synthesis - interrupting AURA');
            userBargeInFramesRef.current = 0;
            interruptSpeechRef.current();
          }
        } else {
          userBargeInFramesRef.current = 0;
        }

        if (isMutedRef.current || isAiSpeakingRef.current) {
          setMicAudioLevel(0);
        } else {
          setMicAudioLevel(normalized);
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (err: any) {
      console.error('[ERROR] Microphone access error:', err);
      setMicPermissionState('denied');
      setErrorMessage('Please allow microphone access to start the live call.');
      transitionState('ERROR');
    }

  }, [transitionState]);

  const stopAudioMetering = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setMicAudioLevel(0);
  }, []);

  // Barge-In / Interrupt Speech
  const interruptSpeech = useCallback(() => {
    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }
    if (ttsKeepAliveTimerRef.current) {
      clearInterval(ttsKeepAliveTimerRef.current);
      ttsKeepAliveTimerRef.current = null;
    }
    currentUtteranceRef.current = null;
    isAiSpeakingRef.current = false;
    setCurrentAiSpeech('');

    if (voiceStateRef.current !== 'IDLE') {
      transitionState('LISTENING');
      if (!isMutedRef.current) {
        startListening();
      }
    }
  }, [isSpeechSynthesisSupported, transitionState, startListening]);
  interruptSpeechRef.current = interruptSpeech;

  // Split text into sentence-boundary chunks of at most maxLen characters.
  // Chrome's SpeechSynthesis engine reliably truncates single utterances that are
  // too long (the "15-second bug"). Speaking short sequential chunks avoids this.
  const splitIntoChunks = (rawText: string, maxLen = 180): string[] => {
    // Normalise whitespace first
    const t = rawText.replace(/\s+/g, ' ').trim();
    if (t.length <= maxLen) return [t];

    const chunks: string[] = [];
    // Split on sentence-ending punctuation followed by a space or end of string
    const sentences = t.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if (!sentence) continue;
      // If a single sentence itself exceeds maxLen, break on comma/semicolon/colon
      if (sentence.length > maxLen) {
        // Flush whatever we had
        if (current) { chunks.push(current.trim()); current = ''; }
        // Split the long sentence on clause boundaries
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        for (const clause of clauses) {
          if ((current + ' ' + clause).trim().length > maxLen && current) {
            chunks.push(current.trim());
            current = clause;
          } else {
            current = current ? current + ' ' + clause : clause;
          }
        }
      } else if ((current + ' ' + sentence).trim().length > maxLen) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = current ? current + ' ' + sentence : sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(Boolean);
  };

  // Text-To-Speech — splits the response into sentence chunks and speaks them
  // sequentially to work around Chrome's SpeechSynthesis truncation bug.
  const speak = useCallback((text: string) => {
    if (!isSpeechSynthesisSupported || !text) {
      return;
    }

    console.log('[TTS] Starting speech synthesis:', text);
    lastSpokenAiTextRef.current = text;

    // Stop recognition while speaking so mic does not capture speaker output
    stopListening();
    setLiveTranscript('');
    activeUtteranceTextRef.current = '';

    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    if (ttsKeepAliveTimerRef.current) {
      clearInterval(ttsKeepAliveTimerRef.current);
      ttsKeepAliveTimerRef.current = null;
    }

    playSoftChime();

    // Resolve the best available English voice, preferring high-quality named voices.
    const resolveVoice = (): SpeechSynthesisVoice | null => {
      const voices = voicesRef.current.length > 0
        ? voicesRef.current
        : window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;
      return (
        voices.find(
          (v) =>
            (v.lang === lang || v.lang.startsWith('en')) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Microsoft') ||
              v.name.includes('David') ||
              v.name.includes('Guy') ||
              v.name.includes('Samantha') ||
              v.name.includes('Jenny') ||
              v.name.includes('Aria'))
        ) ||
        voices.find((v) => v.lang === lang || v.lang.startsWith('en')) ||
        voices[0]
      );
    };

    const doSpeak = () => {
      if (!callActiveRef.current) return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      try { window.speechSynthesis.resume(); } catch {}

      isAiSpeakingRef.current = true;
      transitionState('AI_SPEAKING');
      setCurrentAiSpeech(text);

      const chunks = splitIntoChunks(text, 180);
      let chunkIndex = 0;

      // Called after ALL chunks have been spoken (or on fatal error).
      const handleAllDone = () => {
        if (ttsKeepAliveTimerRef.current) {
          clearInterval(ttsKeepAliveTimerRef.current);
          ttsKeepAliveTimerRef.current = null;
        }
        currentUtteranceRef.current = null;

        // 300ms acoustic cooldown before reopening the microphone.
        setTimeout(() => {
          isAiSpeakingRef.current = false;
          setCurrentAiSpeech('');
          if (callActiveRef.current && voiceStateRef.current !== 'PROCESSING') {
            console.log('[VOICE] All chunks spoken — returning to listening');
            transitionState('LISTENING');
            if (!isMutedRef.current) {
              startListening();
            }
          }
        }, 300);
      };

      const speakNextChunk = () => {
        if (!callActiveRef.current) { handleAllDone(); return; }
        if (chunkIndex >= chunks.length) { handleAllDone(); return; }

        const chunk = chunks[chunkIndex];
        chunkIndex += 1;

        console.log(`[TTS] Chunk ${chunkIndex}/${chunks.length}:`, chunk.slice(0, 60));

        const utterance = new SpeechSynthesisUtterance(chunk);
        currentUtteranceRef.current = utterance; // Keep strong reference — prevents GC in Chromium
        utterance.lang = lang;
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voice = resolveVoice();
        if (voice) utterance.voice = voice;

        let chunkDone = false;
        let chunkWatchdog: any = null;

        const handleChunkDone = () => {
          if (chunkDone) return;
          chunkDone = true;
          if (chunkWatchdog) { clearTimeout(chunkWatchdog); chunkWatchdog = null; }
          speakNextChunk();
        };

        utterance.onstart = () => {
          isAiSpeakingRef.current = true;
          if (chunkIndex === 1) {
            console.log('[TTS] First chunk started speaking:', chunk.slice(0, 40));
          }
        };
        utterance.onend = handleChunkDone;
        utterance.onerror = (e: any) => {
          // 'interrupted' fires when we cancel mid-speech (e.g. barge-in) — not a real error
          if (e?.error !== 'interrupted') {
            console.warn('[TTS] Chunk speech notice:', e?.error);
          }
          handleChunkDone();
        };

        // Per-chunk watchdog: 2.5 words/sec average + 4s buffer
        const wordCount = chunk.split(/\s+/).length;
        const maxChunkMs = Math.max(4000, Math.round((wordCount / 2.5) * 1000) + 4000);
        chunkWatchdog = setTimeout(() => {
          if (!chunkDone) {
            console.warn('[TTS] Chunk watchdog fired — advancing to next chunk');
            handleChunkDone();
          }
        }, maxChunkMs);

        try {
          window.speechSynthesis.speak(utterance);
          window.speechSynthesis.resume(); // Chromium immediate-resume safeguard
        } catch (err) {
          console.error('[ERROR] TTS chunk speak error:', err);
          handleChunkDone();
        }
      };

      // Keep-alive for the overall TTS session (Chrome pauses after ~15s)
      ttsKeepAliveTimerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.pending) {
          clearInterval(ttsKeepAliveTimerRef.current);
          ttsKeepAliveTimerRef.current = null;
        }
      }, 8000);

      speakNextChunk();
    };

    // Voice-loading guard: Chrome returns an empty voices list on first call.
    // If voices aren't available yet, defer doSpeak until the voiceschanged event
    // fires (max one tick after the browser loads them).
    const trySpeak = () => {
      // If browser is already speaking/pending, cancel it and give Chromium 80ms to flush.
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        speakTimeoutRef.current = setTimeout(doSpeak, 80);
        return;
      }
      // Voices not loaded yet — wait for voiceschanged then dispatch
      if (voicesRef.current.length === 0 && window.speechSynthesis.getVoices().length === 0) {
        const onVoicesReady = () => {
          const available = window.speechSynthesis.getVoices();
          if (available.length > 0) voicesRef.current = available;
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesReady);
          doSpeak();
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesReady);
        // Safety fallback: if voiceschanged never fires (e.g. Firefox), proceed anyway after 300ms
        speakTimeoutRef.current = setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesReady);
          doSpeak();
        }, 300);
        return;
      }
      // Voices are ready and nothing is speaking — dispatch immediately (stays in user-gesture context)
      doSpeak();
    };

    trySpeak();
  }, [isSpeechSynthesisSupported, lang, transitionState, stopListening, startListening, playSoftChime]);

  // Commit Candidate Utterance to Backend AI
  const commitUserSpeech = useCallback(async (finalTranscript: string) => {
    const trimmed = finalTranscript.trim();
    if (!trimmed || !callActiveRef.current) {
      return;
    }

    // Deduplication check: do not resend identical utterance
    if (trimmed === lastCommittedTextRef.current) {
      console.log('[STT] Ignoring duplicate transcript submission:', trimmed);
      return;
    }
    lastCommittedTextRef.current = trimmed;

    // Cancel any pending silence timer immediately to prevent a second fire
    // while we are already processing this utterance.
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop recognition while processing
    stopListening();
    setLiveTranscript('');
    activeUtteranceTextRef.current = '';

    console.log('[VOICE] Sending transcript to backend:', trimmed);
    transitionState('PROCESSING');

    try {
      console.log('[API] Request started');
      const aiReply = await onUserSpokeRef.current(trimmed);
      console.log('[API] Response received:', aiReply);

      if (!callActiveRef.current) return;

      if (aiReply && typeof aiReply === 'string' && aiReply.trim()) {
        console.log('[VOICE] Backend response:', aiReply);
        speak(aiReply);
      } else {
        console.log('[VOICE] Returning to listening (no text reply)');
        transitionState('LISTENING');
        startListening();
      }
    } catch (err: any) {
      console.error('[ERROR] Candidate response processing error:', err);
      setErrorMessage(`Error processing response: ${err?.message || 'Server error'}`);
      if (callActiveRef.current) {
        transitionState('LISTENING');
        startListening();
      }
    }
  }, [stopListening, transitionState, speak, startListening]);
  // Keep the ref in sync with the latest commitUserSpeech on every render
  commitUserSpeechRef.current = commitUserSpeech;

  // Setup SpeechRecognition singleton instance
  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn('[VOICE] Web Speech Recognition is not supported in this browser');
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
      if (voiceStateRef.current === 'IDLE') {
        transitionState('LISTENING');
      }
    };

    recognition.onresult = (event: any) => {
      if (isMutedRef.current || isAiSpeakingRef.current) {
        return;
      }

      // Read only new results starting from event.resultIndex so we never
      // accumulate text from previous results in a continuous session. Also
      // collect any already-final results before resultIndex for the full
      // in-session picture.
      let finalPart = '';
      let interimPart = '';

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalPart += item[0].transcript + ' ';
        } else {
          // Only non-final (interim) results at or after resultIndex
          if (i >= event.resultIndex) {
            interimPart += item[0].transcript + ' ';
          }
        }
      }

      finalPart = finalPart.trim();
      interimPart = interimPart.trim();
      const currentFullText = (finalPart + (interimPart ? (finalPart ? ' ' : '') + interimPart : '')).trim();

      if (!currentFullText) return;

      // Barge-in check: if AI is somehow speaking and user speaks loud enough, interrupt.
      // Uses interruptSpeechRef to avoid closing over a stale reference.
      if (isAiSpeakingRef.current && currentFullText.length > 3) {
        interruptSpeechRef.current();
        return;
      }

      // Update live interim transcript
      activeUtteranceTextRef.current = currentFullText;
      setLiveTranscript(currentFullText);

      // Transition to USER_SPEAKING state from LISTENING or even PROCESSING
      // (user may start speaking before the previous AI turn is fully displayed).
      if (voiceStateRef.current === 'LISTENING' || voiceStateRef.current === 'PROCESSING') {
        transitionState('USER_SPEAKING');
      }

      console.log('[STT] Interim transcript:', currentFullText);

      // Reset End-of-Speech silence detection timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // When user pauses for 1100ms, lock final transcript and send to backend.
      // commitUserSpeechRef is used (not commitUserSpeech directly) so this closure
      // always calls the latest version without being in the useEffect dep array.
      silenceTimerRef.current = setTimeout(() => {
        const finalizedUtterance = activeUtteranceTextRef.current || currentFullText;
        if (finalizedUtterance.length >= 2) {
          console.log('[STT] Final transcript:', finalizedUtterance);
          commitUserSpeechRef.current(finalizedUtterance);
        }
      }, 1100);
    };

    recognition.onerror = (event: any) => {
      // no-speech and aborted are normal operational events, not errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.warn('[VOICE] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        setMicPermissionState('denied');
        transitionState('ERROR');
      } else if (event.error === 'audio-capture') {
        setErrorMessage('No microphone was found. Please connect a microphone and try again.');
        transitionState('ERROR');
      } else if (event.error === 'network') {
        setErrorMessage('Speech recognition requires a network connection. Please check your internet.');
        transitionState('ERROR');
      } else if (event.error === 'service-not-allowed') {
        setErrorMessage('Speech recognition is not permitted in this browser context. Try Chrome or Edge.');
        transitionState('ERROR');
      }
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;
      // Auto-restart recognition only when the call is still active and in a
      // listening or speaking state. Do NOT restart during PROCESSING or AI_SPEAKING
      // — recognition will be restarted explicitly by speak()/commitUserSpeech().
      if (
        callActiveRef.current &&
        (voiceStateRef.current === 'LISTENING' || voiceStateRef.current === 'USER_SPEAKING') &&
        !isMutedRef.current &&
        !isAiSpeakingRef.current
      ) {
        setTimeout(() => {
          startListening();
        }, 150);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  // Only recreate the recognition instance when the language changes or on mount/unmount.
  // commitUserSpeech and startListening are accessed through stable refs inside the handlers,
  // so they must NOT be in this dep array — including them would destroy and rebuild the
  // recognition instance on every state change, breaking the audio pipeline mid-call.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeechRecognitionSupported, lang]);

  // Start Call lifecycle — microphone must be ready before TTS or listening begins.
  // startAudioMetering() is awaited so getUserMedia resolves (and the AudioContext is
  // initialised) before speak() or startListening() are ever called.
  const startCall = useCallback(
    async (initialGreeting?: string) => {
      console.log('[VOICE] Starting live call session...');
      setErrorMessage(null);
      callActiveRef.current = true;
      setIsCallActive(true);
      lastCommittedTextRef.current = '';
      activeUtteranceTextRef.current = '';
      setLiveTranscript('');
      setCurrentAiSpeech('');
      setIsMuted(false);
      isMutedRef.current = false;

      // Unlock speech synthesis on this user gesture.
      // Chrome/Safari require a SpeechSynthesisUtterance to be spoken (even
      // a silent one) directly inside a user-interaction handler before any
      // subsequent programmatic speak() calls will produce audible output.
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          // Fire a zero-length utterance to satisfy the autoplay policy.
          const unlock = new SpeechSynthesisUtterance('');
          unlock.volume = 0;
          window.speechSynthesis.speak(unlock);
        } catch {}
      }

      // Transition immediately so the UI shows the active call state
      transitionState('LISTENING');

      // Wait for the microphone stream and AudioContext to be fully ready FIRST,
      // then start TTS greeting or begin listening. This prevents the race condition
      // where speak() or startListening() ran before getUserMedia() resolved.
      try {
        await startAudioMetering();
      } catch (err) {
        console.warn('[VOICE] Audio metering start notice:', err);
        // Even if metering fails, continue — SpeechRecognition still works without it
      }

      if (!callActiveRef.current) return; // call was ended during await

      if (initialGreeting) {
        speak(initialGreeting);
      } else {
        if (!isAiSpeakingRef.current && !isMutedRef.current) {
          startListening();
        }
      }
    },
    [startAudioMetering, speak, transitionState, startListening]
  );

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        stopListening();
        setLiveTranscript('');
        activeUtteranceTextRef.current = '';
      } else {
        if (!isAiSpeakingRef.current && callActiveRef.current) {
          transitionState('LISTENING');
          startListening();
        }
      }
      return next;
    });
  }, [stopListening, transitionState, startListening]);

  // End Call lifecycle
  const endCall = useCallback(() => {
    callActiveRef.current = false;
    setIsCallActive(false);
    transitionState('IDLE');
    isAiSpeakingRef.current = false;
    isMutedRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (ttsKeepAliveTimerRef.current) {
      clearInterval(ttsKeepAliveTimerRef.current);
      ttsKeepAliveTimerRef.current = null;
    }

    stopListening();
    stopAudioMetering();

    if (isSpeechSynthesisSupported) {
      window.speechSynthesis.cancel();
    }

    currentUtteranceRef.current = null;
    setLiveTranscript('');
    activeUtteranceTextRef.current = '';
    setCurrentAiSpeech('');
  }, [transitionState, stopListening, stopAudioMetering, isSpeechSynthesisSupported]);

  // Replay whatever AURA just said (or opening greeting)
  const replayLastAiSpeech = useCallback(() => {
    const textToReplay =
      lastSpokenAiTextRef.current ||
      "Hello, I'm AURA, an AI representative assisting on behalf of Arjun Sharma. How can I help you regarding their qualifications and experience today?";
    speak(textToReplay);
  }, [speak]);

  // Manual request / retry for microphone access
  const requestMicPermission = useCallback(async () => {
    try {
      await startAudioMetering();
      if (callActiveRef.current && !isAiSpeakingRef.current) {
        transitionState('LISTENING');
        startListening();
      }
    } catch (e) {
      console.warn('[VOICE] Mic permission request notice:', e);
    }
  }, [startAudioMetering, transitionState, startListening]);

  // Manual text submission fallback
  const sendTextMessage = useCallback(
    (text: string) => {
      commitUserSpeech(text);
    },
    [commitUserSpeech]
  );

  // Test Speaker Output — temporarily sets callActiveRef so speak() can fire
  // even when no call is active (e.g. speaker test before starting a call).
  const testSpeakerAudio = useCallback(() => {
    const wasActive = callActiveRef.current;
    callActiveRef.current = true;
    speak('AURA voice audio channel is active and playing loud and clear.');
    if (!wasActive) {
      // Restore after the speak timeout fires (10ms + safety margin)
      setTimeout(() => {
        if (!callActiveRef.current || voiceStateRef.current === 'IDLE') {
          callActiveRef.current = wasActive;
        }
      }, 200);
    }
  }, [speak]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // Map voiceState to legacy callState string: while call is active, it is NEVER 'ended'
  const callState: VoiceCallState =
    !isCallActive
      ? 'ended'
      : voiceState === 'AI_SPEAKING'
      ? 'speaking'
      : voiceState === 'PROCESSING'
      ? 'thinking'
      : voiceState === 'USER_SPEAKING'
      ? 'listening'
      : 'listening';

  return {
    voiceState,
    callState,
    isMuted,
    isCallActive,
    micPermissionState,
    liveTranscript,
    currentAiSpeech,
    micAudioLevel,
    errorMessage,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    startCall,
    speak,
    replayLastAiSpeech,
    requestMicPermission,
    interruptSpeech,
    toggleMute,
    endCall,
    sendTextMessage,
    testSpeakerAudio,
  };
}

