import React from 'react';
import { AuraHeroContent } from '../components/hero/AuraHeroContent';
import { AuraHeroVisual } from '../components/3d/AuraHeroVisual';
import { IncomingCallHUD } from '../components/hud/IncomingCallHUD';
import { FeatureCardsRow } from '../components/features/FeatureCardsRow';
import { AuraCosmicFooter } from '../components/layout/AuraCosmicFooter';
import { ExtendedNavTab } from '../components/layout/FloatingNavDock';
import { Call, EmergencyEvent } from '../types';

interface AuraCosmicLandingPageProps {
  calls: Call[];
  emergencyEvents: EmergencyEvent[];
  onSelectTab: (tab: ExtendedNavTab) => void;
  onSelectCall: (callId: number) => void;
  onOpenSimulator: (scenarioIdx?: number) => void;
}

export const AuraCosmicLandingPage: React.FC<AuraCosmicLandingPageProps> = ({
  calls,
  emergencyEvents,
  onSelectTab,
  onOpenSimulator,
}) => {
  const activeEmergencies = emergencyEvents.filter((e) => !e.is_dismissed);
  const latestCall = calls[0];

  return (
    <div className="relative w-full min-h-screen text-slate-800 flex flex-col justify-between select-none">
      {/* 1. Main Hero Grid: Left Content + Center 3D Iridescent 'A' + Right HUD */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center min-h-[560px]">
          {/* Left Column (5 Cols): Headline, Paragraph, CTAs, Metrics */}
          <div className="lg:col-span-5 z-20 flex flex-col items-start">
            <AuraHeroContent
              onGetStarted={() => onOpenSimulator(0)}
              onWatchDemo={() => onOpenSimulator(1)}
            />
          </div>

          {/* Center Column (4 Cols): Iridescent Ribbon 'A' with Glowing Core Star */}
          <div className="lg:col-span-4 z-10 flex items-center justify-center relative my-6 lg:my-0">
            <AuraHeroVisual
              onBadgeClick={() => onOpenSimulator(0)}
            />
          </div>

          {/* Right Column (3 Cols): Floating Incoming Call HUD Card */}
          <div className="lg:col-span-3 z-20 flex items-center justify-center lg:justify-end">
            <IncomingCallHUD
              onOpenSimulator={() => onOpenSimulator(0)}
              callerName={latestCall ? latestCall.caller_name : 'Unknown Caller'}
              callerNumber={latestCall ? latestCall.caller_number : '+91 98765 43210'}
            />
          </div>
        </div>
      </section>

      {/* 2. Four Bottom Glass Feature Cards */}
      <section className="relative z-20 w-full my-6">
        <FeatureCardsRow
          onCardClick={() => onOpenSimulator(0)}
        />
      </section>

      {/* 3. Cosmic Terrain Horizon & Bottom Micro-Copy */}
      <AuraCosmicFooter
        onSelectTab={onSelectTab}
        activeEmergencyCount={activeEmergencies.length}
      />
    </div>
  );
};
