import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, Cpu, Mic, FileText, Sparkles } from 'lucide-react';

interface IncomingCallHUDProps {
  onOpenSimulator: () => void;
  callerName?: string;
  callerNumber?: string;
  isActiveCall?: boolean;
}

export const IncomingCallHUD: React.FC<IncomingCallHUDProps> = ({
  onOpenSimulator,
  callerName = 'Unknown Caller',
  callerNumber = '+91 98765 43210',
  isActiveCall = true,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cycle through step animations for realistic AI feel
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2800);
    return () => clearInterval(stepTimer);
  }, []);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const steps = [
    {
      id: 0,
      label: 'AURA is answering...',
      icon: (
        <span className="flex items-center gap-0.5 text-cyan-400">
          <span className="w-1 h-3 bg-cyan-400 rounded-full animate-eq-1" />
          <span className="w-1 h-4 bg-cyan-400 rounded-full animate-eq-2" />
          <span className="w-1 h-2 bg-cyan-400 rounded-full animate-eq-3" />
        </span>
      ),
    },
    { id: 1, label: 'Listening...', icon: <Mic className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 2, label: 'Understanding...', icon: <Cpu className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 3, label: 'Classifying...', icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> },
    { id: 4, label: 'Handling the call...', icon: <FileText className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <div className="relative group select-none">
      {/* HUD Container Card — light theme */}
      <div
        onClick={onOpenSimulator}
        className="w-[290px] sm:w-[320px] rounded-3xl bg-white border border-cyan-200 p-5 shadow-[0_8px_32px_-8px_rgba(8,145,178,0.2),0_2px_8px_rgba(0,0,0,0.06)] hover:border-cyan-400 hover:shadow-[0_12px_40px_-8px_rgba(8,145,178,0.3)] transition-all duration-300 cursor-pointer"
      >
        {/* Card Header: Incoming Status & Time */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[11px] font-semibold text-cyan-700 tracking-wide">
              {isActiveCall ? 'Incoming Call' : 'Call Active'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 tracking-wider">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Acoustic Waveform Visualizer & Center Call Icon */}
        <div className="py-6 flex items-center justify-center gap-3">
          {/* Left Equalizer Soundwave */}
          <div className="flex items-center gap-1 h-8">
            <span className="w-1 rounded-full bg-cyan-500 animate-eq-1" />
            <span className="w-1 rounded-full bg-cyan-400 animate-eq-2" />
            <span className="w-1 rounded-full bg-blue-500 animate-eq-3" />
            <span className="w-1 rounded-full bg-indigo-500 animate-eq-4" />
            <span className="w-1 rounded-full bg-cyan-500 animate-eq-5" />
          </div>

          {/* Center Glowing Phone Icon */}
          <div className="relative group-hover:scale-105 transition-transform">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 opacity-30 blur-md animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border border-cyan-300/40">
              <Phone className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Right Equalizer Soundwave */}
          <div className="flex items-center gap-1 h-8">
            <span className="w-1 rounded-full bg-cyan-500 animate-eq-5" />
            <span className="w-1 rounded-full bg-indigo-500 animate-eq-4" />
            <span className="w-1 rounded-full bg-blue-500 animate-eq-3" />
            <span className="w-1 rounded-full bg-cyan-400 animate-eq-2" />
            <span className="w-1 rounded-full bg-cyan-500 animate-eq-1" />
          </div>
        </div>

        {/* Caller Information */}
        <div className="text-center pb-4">
          <h4 className="text-base font-bold text-slate-800 tracking-wide">
            {callerName}
          </h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {callerNumber}
          </p>
        </div>

        {/* AI Action Processing Checklist */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-2.5">
          {steps.map((step, idx) => {
            const isCurrent = activeStep === idx;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2.5 px-2 py-1 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    : 'text-slate-500 opacity-70'
                }`}
              >
                <div className="w-5 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-xs font-medium tracking-wide">
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_4px_rgba(8,145,178,0.6)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Prompt to Interact */}
        <div className="mt-3 pt-2 text-center">
          <span className="text-[10px] text-cyan-600 font-semibold tracking-wider flex items-center justify-center gap-1 group-hover:text-cyan-700 transition-colors">
            <Sparkles className="w-3 h-3" /> Click to launch full simulator
          </span>
        </div>
      </div>

      {/* Micro-text to the right of HUD */}
      <div className="hidden lg:flex absolute -right-24 top-1/2 -translate-y-1/2 items-center gap-2 pl-3 border-l border-cyan-400/40 text-left select-none pointer-events-none">
        <div className="flex flex-col text-[8.5px] font-extrabold tracking-[0.2em] text-slate-500 leading-[13px] uppercase">
          <span>MORE TIME</span>
          <span>FOR WHAT</span>
          <span className="text-cyan-600">MATTERS</span>
        </div>
      </div>
    </div>
  );
};
