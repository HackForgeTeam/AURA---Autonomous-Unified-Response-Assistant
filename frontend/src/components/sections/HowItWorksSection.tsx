import React from 'react';
import { ArrowRight, PhoneForwarded, Radio, Cpu, CheckCircle } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenSimulator: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onOpenSimulator }) => {
  const steps = [
    {
      num: '01',
      title: 'Carrier Forwarding or Direct Number',
      icon: <PhoneForwarded className="w-5 h-5 text-cyan-400" />,
      desc: 'Connect your cellular number or VoIP line in 30 seconds with automatic unconditional forwarding or smart forwarding when busy/unanswered.',
    },
    {
      num: '02',
      title: 'Streaming Neural Speech Engine',
      icon: <Radio className="w-5 h-5 text-indigo-400" />,
      desc: 'Incoming audio streams into AURA’s bi-directional voice pipeline with under 150ms round-trip latency, producing seamless human cadence.',
    },
    {
      num: '03',
      title: 'Contextual Grounding & Anti-Hallucination',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      desc: 'The reasoning core queries your approved schedule, representations, and emergency rules. It never guesses or accepts terms without policy match.',
    },
    {
      num: '04',
      title: 'Executive Summary & Task Execution',
      icon: <CheckCircle className="w-5 h-5 text-teal-400" />,
      desc: 'Within 5 seconds of hang-up, receive an executive audio brief, full searchable transcript, sentiment score, and scheduled calendar invites.',
    },
  ];

  return (
    <section id="how-it-works" className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 py-16 select-none">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-indigo-400">
          ARCHITECTURE & WORKFLOW
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-4">
          How AURA Handles Every Call
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          From the instant your phone rings to final task execution, here is how AURA acts as your autonomous executive gatekeeper.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className="relative rounded-3xl p-6 bg-[#070c1a]/80 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-cyan-400/40">
                  {s.num}
                </span>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {s.icon}
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {s.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                <ArrowRight className="w-5 h-5 text-cyan-500/40" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interactive Call-Out */}
      <div className="mt-12 text-center">
        <button
          onClick={onOpenSimulator}
          className="px-7 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all"
        >
          Experience the Workflow in Real Time →
        </button>
      </div>
    </section>
  );
};
