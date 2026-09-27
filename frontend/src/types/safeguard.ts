export type RiskLevel = 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'CRITICAL';

export type ThreatCategory =
  | 'SCAM_FRAUD'
  | 'SOCIAL_ENGINEERING'
  | 'IMPERSONATION'
  | 'URGENCY_COERCION'
  | 'SENSITIVE_DATA_EXFILTRATION'
  | 'FINANCIAL_EXTRACTION'
  | 'MALICIOUS_DOWNLOAD'
  | 'REMOTE_ACCESS'
  | 'PROMPT_INJECTION'
  | 'BEHAVIORAL_ANOMALY';

export interface SecurityDetection {
  id: string;
  timestamp: string;
  category: ThreatCategory;
  label: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  triggerPhrase?: string;
  riskPoints: number;
}

export interface SafeGuardTimelineEvent {
  id: string;
  timestamp: string;
  timeDisplay: string;
  title: string;
  description: string;
  riskDelta?: number;
  currentScore: number;
  scoreDisplay?: string;
  severity: 'INFO' | 'CAUTION' | 'WARNING' | 'CRITICAL';
  iconType: 'CALL' | 'DETECT' | 'SHIELD' | 'RESTRICT' | 'TERMINATE' | 'REPORT';
}

export interface DeviceSafetyCheckItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  priority: 'RECOMMENDED' | 'CRITICAL' | 'OPTIONAL';
}

export interface SafeGuardIncidentReport {
  id: string;
  timestamp: string;
  riskLevel: RiskLevel;
  riskScore: number;
  callerName: string;
  callerNumber: string;
  callDurationSeconds: number;
  detectedThreats: SecurityDetection[];
  protectedAssets: string[];
  actionTaken: 'CALL_TERMINATED' | 'RESTRICTED_MODE_ENFORCED' | 'WARNING_LOGGED' | 'CLEARED_SAFE';
  actionDescription: string;
  recommendations: string[];
  deviceSafetyChecks: DeviceSafetyCheckItem[];
}

export interface SafeGuardState {
  riskScore: number;
  riskLevel: RiskLevel;
  securityStatus: string;
  isRestrictedMode: boolean;
  isTerminated: boolean;
  hasDeviceSecurityRisk: boolean;
  deviceSecurityNotice?: string;
  detections: SecurityDetection[];
  timeline: SafeGuardTimelineEvent[];
  protectedAssets: string[];
  incidentReport: SafeGuardIncidentReport | null;
}

export interface SafeGuardDemoScenario {
  id: string;
  title: string;
  subtitle: string;
  callerName: string;
  callerNumber: string;
  category: ThreatCategory | 'NORMAL';
  simulatedDurationSeconds: number;
  expectedRiskScore: number;
  expectedRiskLevel: RiskLevel;
  dialogueScript: Array<{
    speaker: 'CALLER' | 'ASSISTANT';
    text: string;
    delayMs: number;
    triggers?: SecurityDetection[];
  }>;
  expectedDetections: string[];
  expectedAction: string;
  notes: string;
}
