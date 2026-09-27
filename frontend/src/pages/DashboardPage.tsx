import React from 'react';
import { Call, ActionItem, EmergencyEvent } from '../types';
import { ExtendedNavTab } from '../components/layout/FloatingNavDock';
import { AuraCosmicLandingPage } from './AuraCosmicLandingPage';

interface DashboardPageProps {
  calls: Call[];
  actionItems: ActionItem[];
  emergencyEvents: EmergencyEvent[];
  onSelectTab: (tab: ExtendedNavTab) => void;
  onSelectCall: (callId: number) => void;
  onToggleActionItem: (id: number, current: boolean) => void;
  onOpenSimulator: (scenarioIdx?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  calls,
  emergencyEvents,
  onSelectTab,
  onSelectCall,
  onOpenSimulator,
}) => {
  return (
    <AuraCosmicLandingPage
      calls={calls}
      emergencyEvents={emergencyEvents}
      onSelectTab={onSelectTab}
      onSelectCall={onSelectCall}
      onOpenSimulator={onOpenSimulator}
    />
  );
};
