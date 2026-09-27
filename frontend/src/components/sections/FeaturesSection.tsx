import React, { useState } from 'react';
import { PhoneCall, Cpu, Calendar, ShieldAlert, UserCheck, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface FeaturesSectionProps {
  onOpenSimulator: (scenarioIdx?: number) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenSimulator }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: 'Autonomous Call Answering & Human-Like Voice',
      tag: 'VOICE AI',
      icon: <PhoneCall className="w-5 h-5 text-cyan-400" />,
      color: 'from-cyan-500/20 to-blue-600/10',
      border: 'border-cyan-500/30',
      description:
        'AURA answers unknown, busy, or missed calls within 150ms using low-latency neural voice synthesis. It greets callers with genuine conversational nuance, identifies the caller, assesses urgency, and never sounds like a robotic IVR tree.',
      bullets: [
        'Sub-150ms bi-directional voice streaming',
        'Automatic caller identity and intent extraction',
        'Natural conversational pacing and polite interruptions',
      ],
      scenarioIdx: 0,
    },
    {
      id: 1,
      title: 'Multi-Turn Semantic Understanding & Intent Triage',
      tag: 'NLU ENGINE',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/20 to-indigo-600/10',
      border: 'border-purple-500/30',
      description:
        'Powered by advanced large language models with strict anti-hallucination policies. AURA accurately classifies call categories (Business, Recruiter, Personal, Spam, or Urgent Emergency) and adapts its tone accordingly.',
      bullets: [
        'Strict representation boundaries — never makes unapproved commitments',
        'High-precision intent tagging and sentiment analysis',
        'Instant multi-turn dialogue memory during live calls',
      ],
      scenarioIdx: 1,
    },
    {
      id: 2,
      title: 'Autonomous Task & Calendar Execution',
      tag: 'ACTION ENGINE',
      icon: <Calendar className="w-5 h-5 text-teal-400" />,
      color: 'from-teal-500/20 to-emerald-600/10',
      border: 'border-teal-500/30',
      description:
        'AURA doesn’t just record messages — it takes action. When a caller requests a meeting, AURA checks your availability, negotiates a suitable slot, drafts calendar invitations, and compiles structured task checklists.',
      bullets: [
        'Automated calendar conflict resolution and scheduling',
        'Structured action item extraction directly from call transcripts',
        'Push notifications with actionable executive summaries',
      ],
      scenarioIdx: 2,
    },
    {
      id: 3,
      title: 'Emergency DND Bypass & Security PIN Protection',
      tag: 'CRITICAL SECURITY',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-600/10',
      border: 'border-rose-500/30',
      description:
        'When your phone is on Do Not Disturb or Sleep Mode, AURA acts as an intelligent firewall. If a hospital, family member, or urgent contact calls with a true crisis, AURA bypasses DND and alerts you immediately.',
      bullets: [
        'Context-aware emergency detection (accidents, health, critical escalations)',
        'PIN-secured alert verification and dismissal',
        'Prevents false alarms while guaranteeing critical reachability',
      ],
      scenarioIdx: 3,
    },
    {
      id: 4,
      title: 'Interview Assistant & Profile Grounding',
      tag: 'CAREER DEFENDER',
      icon: <UserCheck className="w-5 h-5 text-indigo-400" />,
      color: 'from-indigo-500/20 to-violet-600/10',
      border: 'border-indigo-500/30',
      description:
        'When recruiters call, AURA can conduct preliminary screening on your behalf based strictly on your sanitized resume and preferences, while keeping sensitive personal identifiers (PII) completely masked.',
      bullets: [
        'Automatic PII redaction (address, salary history, private notes)',
        'Salary expectations and remote/hybrid work preference alignment',
        'Structured interview scoring and recruiter follow-up logging',
      ],
      scenarioIdx: 4,
    },
    {
      id: 5,
      title: '100% Privacy-First Sovereign Telephony',
      tag: 'PRIVACY SHIELD',
      icon: <Lock className="w-5 h-5 text-sky-400" />,
      color: 'from-sky-500/20 to-cyan-600/10',
      border: 'border-sky-500/30',
      description:
        'Your voice and calls are sovereign. AURA operates under strict privacy guarantees: zero third-party advertising, zero voice data sales, end-to-end encrypted telemetry, and full local export or instant deletion at any time.',
      bullets: [
        'End-to-end TLS 1.3 encryption and ephemeral audio buffers',
        'Zero-retention voice model inference',
        'Full GDPR & CCPA sovereign compliance',
      ],
      scenarioIdx: 0,
    },
  ];

  return (
    <section id="features" className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 py-16 select-none">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Sparkles className="w-3.5 h-3.5" /> Core Intelligence Features
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          Engineered for Total Focus and Seamless Telephony
        </h2>
        <p className="text-slate-300/90 text-sm sm:text-base leading-relaxed">
          Explore the deep AI capabilities that allow AURA to listen, understand, negotiate, and execute actions with unprecedented precision.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.id}
            onClick={() => {
              setActiveFeature(f.id);
              onOpenSimulator(f.scenarioIdx);
            }}
            className={`group relative rounded-3xl p-6 bg-[#080d1c]/80 backdrop-blur-xl border ${activeFeature === f.id ? 'border-cyan-400/80' : f.border} hover:border-cyan-400/60 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_45px_rgba(56,189,248,0.25)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
          >
            {/* Top Bar: Icon & Tag */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  {f.tag}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-white mb-2.5 group-hover:text-cyan-200 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                {f.description}
              </p>

              {/* Bullets */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                {f.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Interactive Trigger */}
            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              <span>Test in Simulator</span>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
