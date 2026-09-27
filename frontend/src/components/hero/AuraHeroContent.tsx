import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface AuraHeroContentProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

export const AuraHeroContent: React.FC<AuraHeroContentProps> = ({
  onGetStarted,
  onWatchDemo,
}) => {
  return (
    <div className="flex flex-col items-start text-left max-w-xl select-none">
      {/* 1. Pre-header Tag */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-cyan-600/90">
          LISTENS &nbsp; UNDERSTANDS &nbsp; HANDLES
        </span>
      </div>

      {/* 2. Bold Hero Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 leading-[1.08] tracking-tight font-sans mb-5">
        Smarter <br />
        <span className="bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(8,145,178,0.4)]">
          Conversations
        </span> <br />
        Brighter Days
      </h1>

      {/* 3. Subtitle Description */}
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mb-8 font-normal">
        AURA answers, understands, and handles your calls so you can focus on what truly matters.
      </p>

      {/* 4. Action Buttons */}
      <div className="flex flex-wrap items-center gap-4 mb-10">
        {/* Primary CTA: Get Started */}
        <button
          onClick={onGetStarted}
          className="group px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:shadow-[0_0_40px_rgba(56,189,248,0.8)] flex items-center gap-2.5 active:scale-95"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary CTA: Watch Demo */}
        <button
          onClick={onWatchDemo}
          className="px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-cyan-400/70 font-semibold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow flex items-center gap-2.5 active:scale-95 group"
        >
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
            <Play className="w-2.5 h-2.5 fill-slate-600 text-slate-600 ml-0.5" />
          </div>
          <span>Watch Demo</span>
        </button>
      </div>

      {/* 5. Metrics & Stat Badges */}
      <div className="flex items-center gap-6 sm:gap-8 pt-4 border-t border-slate-200 w-full mb-8">
        {/* Metric 1 */}
        <div>
          <div className="text-xl sm:text-2xl font-black text-cyan-600 font-sans tracking-tight">
            24/7
          </div>
          <div className="text-[11px] text-slate-500 font-medium tracking-wide">
            Always Available
          </div>
        </div>

        <div className="h-8 w-px bg-slate-300" />

        {/* Metric 2 */}
        <div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-sans tracking-tight">
            AI
          </div>
          <div className="text-[11px] text-slate-500 font-medium tracking-wide">
            Powered
          </div>
        </div>

        <div className="h-8 w-px bg-slate-300" />

        {/* Metric 3 */}
        <div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 font-sans tracking-tight">
            100%
          </div>
          <div className="text-[11px] text-slate-500 font-medium tracking-wide">
            Privacy Focused
          </div>
        </div>
      </div>

      {/* 6. Scroll Indicator */}
      <div className="flex items-center gap-3 text-slate-500 select-none">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
        <span className="text-[9.5px] font-bold tracking-[0.25em] uppercase text-slate-500">
          SCROLL TO EXPLORE
        </span>
      </div>
    </div>
  );
};
