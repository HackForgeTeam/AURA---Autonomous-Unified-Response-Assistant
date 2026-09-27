export type CallCategory = 
  | 'NORMAL'
  | 'INTERVIEW'
  | 'BUSINESS'
  | 'PERSONAL'
  | 'SPAM'
  | 'EMERGENCY'
  | 'UNKNOWN';

export type SimulationType =
  | 'Job Interview'
  | 'HR Screening'
  | 'Recruiter Call'
  | 'Customer Call'
  | 'Professional Networking Call'
  | 'General Personal Call'
  | 'Technical Interview';

export type UrgencyLevel = 
  | 'NORMAL'
  | 'LOW_PRIORITY'
  | 'IMPORTANT'
  | 'URGENT'
  | 'POTENTIAL_EMERGENCY';

export type CallStatus = 
  | 'RINGING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'MISSED';

export type Speaker = 'CALLER' | 'ASSISTANT' | 'USER';

export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string;
  current_title?: string;
  company?: string;
  timezone: string;
  status_message: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SecuritySettings {
  id: number;
  user_id: number;
  dnd_bypass_demo_mode: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  auto_record_calls: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  created_at: string;
  profile?: UserProfile;
  security_settings?: SecuritySettings;
}

export interface CallTranscript {
  id: number;
  call_id: number;
  speaker: Speaker;
  text: string;
  timestamp_offset_ms: number;
  confidence: number;
  created_at: string;
}

export interface CallClassification {
  id: number;
  primary_category: CallCategory;
  confidence: number;
  secondary_categories: string[];
  reasoning?: string;
}

export interface CallSummary {
  id: number;
  overview: string;
  key_decisions: string[];
  questions_asked: string[];
  questions_answered?: string[];
  questions_private?: string[];
  questions_unrelated?: string[];
  questions_uncertain?: string[];
  follow_ups: string[];
  ai_confidence: number;
}

export interface ActionItem {
  id: number;
  call_id: number;
  task: string;
  assignee: string;
  due_date?: string;
  priority: string;
  is_completed: boolean;
}

export interface EmergencyEvent {
  id: number;
  call_id: number;
  severity: UrgencyLevel;
  trigger_reason: string;
  caller_claimed_emergency: boolean;
  is_dismissed: boolean;
  dismissed_at?: string;
  dismissed_by?: string;
  created_at: string;
}

export interface Call {
  id: number;
  user_id: number;
  caller_number: string;
  caller_name: string;
  category: CallCategory;
  urgency: UrgencyLevel;
  status: CallStatus;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  is_video: boolean;
  created_at: string;
  transcripts: CallTranscript[];
  classification?: CallClassification;
  summary?: CallSummary;
  action_items: ActionItem[];
  emergency_event?: EmergencyEvent;
}

export interface ProfessionalProfile {
  id: number;
  user_id: number;
  resume_id?: number;
  summary?: string;
  skills: string[];
  work_experience: Array<{
    company: string;
    role: string;
    dates: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    honors?: string;
  }>;
  projects: Array<{
    name: string;
    technologies: string[];
    description: string;
  }>;
  internships?: any[];
  certifications?: Array<{
    title: string;
    year?: string;
  }>;
  achievements?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedResume {
  id: number;
  user_id: number;
  filename: string;
  raw_text: string;
  sanitized_text?: string;
  pii_detected?: Record<string, any>;
  created_at: string;
}

export interface DailyReport {
  id: number;
  user_id: number;
  report_date: string;
  total_calls: number;
  category_breakdown: Record<string, number>;
  high_priority_count: number;
  executive_summary: string;
  highlights: string[];
  action_items_count: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  call_id?: number;
  title: string;
  message: string;
  level: string;
  is_read: boolean;
  created_at: string;
}

export type AuraVisualState =
  | 'IDLE'
  | 'INCOMING_CALL'
  | 'LISTENING'
  | 'SPEAKING'
  | 'INTERVIEW'
  | 'EMERGENCY'
  | 'COMPLETED';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  text: string;
  state: AuraVisualState;
  badge?: string;
}
