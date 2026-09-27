import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { AuraSparkCursor } from './components/ui/AuraSparkCursor';
import { ExtendedNavTab } from './components/layout/FloatingNavDock';
import { DashboardPage } from './pages/DashboardPage';
import { CallsPage } from './pages/CallsPage';
import { CallDetailsPage } from './pages/CallDetailsPage';
import { ResumePage } from './pages/ResumePage';
import { InterviewAssistantPage } from './pages/InterviewAssistantPage';
import { EmergencyCenterPage } from './pages/EmergencyCenterPage';
import { DailyReportsPage } from './pages/DailyReportsPage';
import { VideoAssistantPage } from './pages/VideoAssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import { CallSimulatorPage } from './pages/CallSimulatorPage';
import { SafeGuardPage } from './pages/SafeGuardPage';
import { LiveCallPage } from './pages/LiveCallPage';
import { AuraStateProvider, useAuraState } from './context/AuraStateContext';
import { api } from './services/api';
import {
  User,
  Call,
  ActionItem,
  EmergencyEvent,
  DailyReport,
  Notification,
  ProfessionalProfile,
} from './types';

const AuraMainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ExtendedNavTab>('dashboard');
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [simulatorScenarioIdx, setSimulatorScenarioIdx] = useState<number | undefined>(undefined);



  // App Data State
  const [user, setUser] = useState<User | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [emergencyEvents, setEmergencyEvents] = useState<EmergencyEvent[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { setVisualState, addActivity } = useAuraState();

  // Load all initial state
  const loadData = async () => {
    try {
      const [
        userData,
        callsData,
        actionsData,
        emergenciesData,
        reportsData,
        notifsData,
        profData,
      ] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.listCalls().catch(() => []),
        api.listActionItems().catch(() => []),
        api.listEmergencyEvents().catch(() => []),
        api.listDailyReports().catch(() => []),
        api.listNotifications().catch(() => []),
        api.getProfessionalProfile().catch(() => null),
      ]);

      if (userData) setUser(userData);
      setCalls(callsData);
      setActionItems(actionsData);
      setEmergencyEvents(emergenciesData);
      setDailyReports(reportsData);
      setNotifications(notifsData);
      setProfessionalProfile(profData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTab = (tab: ExtendedNavTab) => {
    setCurrentTab(tab);
    if (tab === 'emergency') {
      const unDismissed = emergencyEvents.filter((e) => !e.is_dismissed);
      if (unDismissed.length > 0) {
        setVisualState('EMERGENCY');
      }
    } else if (tab === 'interview') {
      setVisualState('INTERVIEW');
    } else {
      setVisualState('IDLE');
    }
  };

  const handleSelectCall = (callId: number) => {
    setSelectedCallId(callId);
    setCurrentTab('call-details');
  };

  const handleOpenSimulator = (scenarioIdx?: number) => {
    if (scenarioIdx !== undefined) {
      setSimulatorScenarioIdx(scenarioIdx);
    }
    setCurrentTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActionItem = async (id: number, currentStatus: boolean) => {
    try {
      await api.toggleActionItem(id, !currentStatus);
      setActionItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !currentStatus } : item
        )
      );
      if (calls.length > 0) {
        setCalls((prev) =>
          prev.map((c) => ({
            ...c,
            action_items: c.action_items.map((ai) =>
              ai.id === id ? { ...ai, is_completed: !currentStatus } : ai
            ),
          }))
        );
      }
      addActivity(`Action item updated: #${id} marked ${!currentStatus ? 'completed' : 'pending'}`);
    } catch (err) {
      console.error('Failed to toggle action item', err);
    }
  };

  const handleDismissEmergency = async (id: number, pin: string) => {
    await api.dismissEmergency(id, pin, user?.full_name || 'Alex Chen');
    addActivity(`Emergency event #${id} verified and dismissed with security PIN`, 'IDLE');
    await loadData();
    setVisualState('IDLE');
  };

  const handleUpdateProfile = async (data: any) => {
    const updated = await api.updateProfile(data);
    setUser((prev) => (prev ? { ...prev, profile: updated } : prev));
    addActivity('Representation profile updated');
  };

  const handleUpdatePin = async (currentPin: string, newPin: string) => {
    await api.updatePin(currentPin, newPin);
    addActivity('Security PIN code updated');
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallCompleted = async (newCallId?: number) => {
    await loadData();
    if (newCallId) {
      setSelectedCallId(newCallId);
      setCurrentTab('call-details');
    }
  };

  // Header Titles Mapping matching reference UI
  const titles: Record<ExtendedNavTab, { title: string; subtitle: string }> = {
    livecall: {
      title: 'AURA Live Call',
      subtitle: 'Real-time voice conversation grounded on your resume',
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: "AURA handles important calls when you can't",
    },
    calls: {
      title: 'Call Log',
      subtitle: 'Complete searchable call logs with AI transcriptions and category detection',
    },
    'call-details': {
      title: 'Call Intelligence & Transcript',
      subtitle: 'Multi-turn dialogue exchange, decision audit, and extracted items',
    },
    resume: {
      title: 'Resume Privacy & PII Redaction',
      subtitle: 'Mask personal credentials and generate safe sanitized profiles for Interview AI',
    },
    interview: {
      title: 'Interview Assistant Configuration',
      subtitle: 'Strict profile grounding and anti-hallucination policy testing',
    },
    emergency: {
      title: 'Emergency Center & DND Bypass',
      subtitle: 'High-urgency contextual detection and PIN-secured alert dismissal',
    },
    reports: {
      title: 'Daily Call Intelligence',
      subtitle: 'Aggregated analytics, executive summaries, and action item follow-ups',
    },
    video: {
      title: 'Video Assistant',
      subtitle: 'Autonomous video screening and call representation',
    },
    settings: {
      title: 'System & Security Settings',
      subtitle: 'Manage representation profile, emergency PIN, and preferences',
    },
    safeguard: {
      title: 'AURA SafeGuard — AI Call Protection',
      subtitle: 'Real-time heuristic threat detection, sensitive data firewall, and scam defense',
    },
    simulator: {
      title: 'AURA Real-Time Telephony',
      subtitle: 'Experience live two-way AI voice calls, first-person representation, and real-time transcripts',
    },
  };

  const activeEmergenciesCount = emergencyEvents.filter((e) => !e.is_dismissed).length;
  const currentCall = calls.find((c) => c.id === selectedCallId) || calls[0] || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 animate-pulse">
            <span className="h-3.5 w-3.5 rounded-full bg-white animate-ping" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Loading AURA Call Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    {/* AuraSparkCursor lives at root level so it renders above ALL overlays (AppLayout z-50, LiveCallPage z-50) */}
    <AuraSparkCursor />
    <AppLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      user={user}
      notifications={notifications}
      activeEmergencyCount={activeEmergenciesCount}
      onMarkNotificationRead={handleMarkNotificationRead}
      onOpenSimulator={() => handleOpenSimulator()}
      title={titles[currentTab]?.title || 'AURA'}
      subtitle={titles[currentTab]?.subtitle || ''}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          calls={calls}
          actionItems={actionItems}
          emergencyEvents={emergencyEvents}
          onSelectTab={handleSelectTab}
          onSelectCall={handleSelectCall}
          onToggleActionItem={handleToggleActionItem}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {currentTab === 'calls' && (
        <CallsPage
          calls={calls}
          onSelectCall={handleSelectCall}
          onRefreshCalls={loadData}
        />
      )}

      {currentTab === 'call-details' && (
        <CallDetailsPage
          call={currentCall}
          onBack={() => setCurrentTab('calls')}
          onToggleActionItem={handleToggleActionItem}
        />
      )}

      {currentTab === 'resume' && (
        <ResumePage
          professionalProfile={professionalProfile}
          onRefreshProfile={loadData}
        />
      )}

      {currentTab === 'interview' && (
        <InterviewAssistantPage
          professionalProfile={professionalProfile}
          onRefreshProfile={loadData}
        />
      )}

      {currentTab === 'emergency' && (
        <EmergencyCenterPage
          emergencyEvents={emergencyEvents}
          onDismissEmergency={handleDismissEmergency}
          onSelectCall={handleSelectCall}
        />
      )}

      {currentTab === 'reports' && (
        <DailyReportsPage
          reports={dailyReports}
          calls={calls}
          onSelectCall={handleSelectCall}
        />
      )}

      {currentTab === 'video' && (
        <VideoAssistantPage onOpenSimulator={() => handleOpenSimulator(0)} />
      )}

      {currentTab === 'settings' && (
        <SettingsPage
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onUpdatePin={handleUpdatePin}
        />
      )}

      {currentTab === 'safeguard' && (
        <SafeGuardPage onOpenLiveSimulator={handleOpenSimulator} />
      )}

      {/* Dedicated Next Page: Live Call Simulator */}
      {currentTab === 'simulator' && (
        <CallSimulatorPage
          initialScenarioIndex={simulatorScenarioIdx}
          onCallCompleted={handleCallCompleted}
          onBackToHome={() => handleSelectTab('dashboard')}
          onViewCallDetails={handleSelectCall}
        />
      )}
    </AppLayout>

    {/* ChatGPT-style Live Call overlay — rendered outside AppLayout so it
        covers the full screen. Closes by navigating back to the dashboard. */}
    {currentTab === 'livecall' && (
      <LiveCallPage
        onClose={() => {
          loadData();
          handleSelectTab('dashboard');
        }}
        onCallCompleted={handleCallCompleted}
      />
    )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuraStateProvider>
      <AuraMainApp />
    </AuraStateProvider>
  );
};

export default App;
