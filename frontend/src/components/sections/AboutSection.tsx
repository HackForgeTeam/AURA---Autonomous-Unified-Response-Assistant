import React from 'react';
import { ShieldCheck, Zap, Lock, HeartHandshake } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const pillars = [
    {
      icon: <Lock className="w-5 h-5 text-cyan-400" />,
      title: 'Zero-Knowledge Privacy',
      desc: 'We believe your phone calls belong exclusively to you. AURA does not monetize your conversations, sell audio samples, or train public models on your private data.',
    },
    {
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      title: 'Sub-150ms Speed',
      desc: 'Conversations feel human because the latency matches biological auditory reflexes. Streaming synthesis ensures no awkward pauses or robot delays.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      title: 'Sovereign Representation',
      desc: 'AURA represents you according to your exact boundaries. It never invents credentials, never over-promises, and strictly safeguards your reputation.',
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-teal-400" />,
      title: 'Human-First Architecture',
      desc: 'Technology should serve your attention, not fragment it. AURA operates quietly in the background so you can spend your days in unbroken, joyful flow.',
    },
  ];

  return (
    <section id="about" className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 py-16 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Narrative */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-400 mb-3">
            OUR PURPOSE & ETHOS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-6">
            Building the Sovereign Personal Gatekeeper for the Modern Age
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            Every day, millions of high-performing executives, engineers, creators, and professionals are pulled out of deep work by unsolicited phone calls, recruiter pitches, and routine scheduling requests.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-8">
            AURA was born out of a simple conviction: you should never have to trade your peace of mind or productivity just to stay connected. By pairing cutting-edge neural voice synthesis with deterministic security guardrails, AURA provides an intelligent digital counterpart that protects your time with uncompromising loyalty.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 w-full pt-6 border-t border-white/10">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-sans">
                10k+
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Hours of Focus Saved
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-sans">
                &lt;150ms
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Voice Roundtrip Latency
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-400 font-sans">
                99.8%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Triage Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 4 Pillars */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-[#080d1c]/80 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 transition-all duration-300 shadow-lg flex flex-col"
            >
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-fit mb-3">
                {p.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">
                {p.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
