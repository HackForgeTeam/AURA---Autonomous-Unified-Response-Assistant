import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Enterprise Telephony',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', type: 'Enterprise Telephony', message: '' });
    }, 4000);
  };

  return (
    <section id="contact" className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 py-16 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Direct Coordinates */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-cyan-400 mb-3 block">
              GET IN TOUCH
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
              Connect with the AURA Team
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Have questions about enterprise carrier onboarding, custom voice fine-tuning, or high-security deployments? Our engineering team is here 24/7.
            </p>

            {/* Direct Contact Points */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#080d1c]/70 border border-white/10">
                <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Direct Email</div>
                  <div className="text-sm font-bold text-white font-mono">contact@aura-ai.internal</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#080d1c]/70 border border-white/10">
                <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Direct Voice Line</div>
                  <div className="text-sm font-bold text-white font-mono">+1 (800) 287-2247 (AURA)</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#080d1c]/70 border border-white/10">
                <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Global Hub</div>
                  <div className="text-sm font-bold text-white">San Francisco, CA • Distributed Core</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-xs text-slate-400">
            Protected by sovereign 256-bit encryption. We never share or sell contact details.
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl p-8 bg-[#090f22]/85 backdrop-blur-2xl border border-cyan-500/20 shadow-[0_15px_45px_rgba(0,0,0,0.7)]">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Send a Message or Request a Pilot
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Fill in your details below and an AURA specialist will respond within 2 hours.
            </p>

            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Message Transmitted</h4>
                <p className="text-xs text-slate-300 max-w-sm">
                  Thank you! Your inquiry has been dispatched to our priority queue. You will receive an encrypted dispatch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#060a16] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Business or Personal Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@company.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#060a16] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Inquiry Category
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#060a16] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition"
                  >
                    <option>Enterprise Telephony Deployment</option>
                    <option>Developer & API Webhook Access</option>
                    <option>Emergency Bypass Hardware Integration</option>
                    <option>Interview Assistant Grounding</option>
                    <option>General Inquiries & Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Message or Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your call volume, desired voice representation, or specific integration requirements..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#060a16] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Inquiry to AURA</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
