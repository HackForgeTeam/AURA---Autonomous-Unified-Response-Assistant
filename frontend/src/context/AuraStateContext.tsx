import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { AuraVisualState, ActivityEvent } from '../types';

interface AuraStateContextType {
  visualState: AuraVisualState;
  setVisualState: (state: AuraVisualState) => void;
  audioLevel: number;
  setAudioLevel: (level: number) => void;
  currentActivity: string;
  setCurrentActivity: (activity: string) => void;
  isAmbientMode: boolean;
  setIsAmbientMode: (ambient: boolean) => void;
  toggleAmbientMode: () => void;
  activityLog: ActivityEvent[];
  addActivity: (text: string, state?: AuraVisualState, badge?: string) => void;
}

const defaultActivities: ActivityEvent[] = [
  {
    id: '1',
    timestamp: 'Just now',
    text: 'AURA Autonomous Core online • Spatial environment initialized',
    state: 'IDLE',
    badge: 'SYSTEM'
  },
  {
    id: '2',
    timestamp: '2m ago',
    text: 'Telemetry heartbeat verified • Ready for incoming calls',
    state: 'IDLE',
    badge: 'TELEMETRY'
  }
];

const AuraStateContext = createContext<AuraStateContextType | undefined>(undefined);

export const AuraStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visualState, setVisualStateState] = useState<AuraVisualState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [currentActivity, setCurrentActivity] = useState<string>('AURA is on standby • Neural telemetry active');
  const [isAmbientMode, setIsAmbientMode] = useState<boolean>(false);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>(defaultActivities);

  const setVisualState = useCallback((state: AuraVisualState) => {
    setVisualStateState(state);
    let autoActivity = '';
    switch (state) {
      case 'IDLE':
        autoActivity = 'AURA is on standby • Neural telemetry active';
        break;
      case 'INCOMING_CALL':
        autoActivity = 'Incoming call detected • Preparing audio pipeline...';
        break;
      case 'LISTENING':
        autoActivity = 'AURA is listening to caller input...';
        break;
      case 'SPEAKING':
        autoActivity = 'AURA is speaking • Audio waveform synchronized';
        break;
      case 'INTERVIEW':
        autoActivity = 'Interview Mode • Strict PII Grounding Active';
        break;
      case 'EMERGENCY':
        autoActivity = 'CRITICAL: High-priority emergency bypass alert triggered!';
        break;
      case 'COMPLETED':
        autoActivity = 'Call completed • Generating intelligence report & action items';
        break;
    }
    if (autoActivity) {
      setCurrentActivity(autoActivity);
    }
  }, []);

  const toggleAmbientMode = useCallback(() => {
    setIsAmbientMode((prev) => !prev);
  }, []);

  const addActivity = useCallback((text: string, state: AuraVisualState = 'IDLE', badge?: string) => {
    const newEvent: ActivityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
      text,
      state,
      badge
    };
    setActivityLog((prev) => [newEvent, ...prev.slice(0, 19)]);
    setCurrentActivity(text);
  }, []);

  const value = useMemo(
    () => ({
      visualState,
      setVisualState,
      audioLevel,
      setAudioLevel,
      currentActivity,
      setCurrentActivity,
      isAmbientMode,
      setIsAmbientMode,
      toggleAmbientMode,
      activityLog,
      addActivity,
    }),
    [
      visualState,
      setVisualState,
      audioLevel,
      currentActivity,
      isAmbientMode,
      toggleAmbientMode,
      activityLog,
      addActivity,
    ]
  );

  return <AuraStateContext.Provider value={value}>{children}</AuraStateContext.Provider>;
};

export const useAuraState = () => {
  const context = useContext(AuraStateContext);
  if (!context) {
    throw new Error('useAuraState must be used within an AuraStateProvider');
  }
  return context;
};
