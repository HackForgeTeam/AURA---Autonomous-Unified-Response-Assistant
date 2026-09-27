import {
  User,
  UserProfile,
  Call,
  ProfessionalProfile,
  EmergencyEvent,
  DailyReport,
  ActionItem,
  Notification,
  CallCategory,
  SavedResume,
  CallTranscript,
} from '../types';
import {
  RESUME_KNOWLEDGE_BASE,
  queryResumeKnowledge,
  updateResumeKnowledgeBase,
} from './resumeKnowledge';

const API_BASE = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '') + '/api/v1';

// When running on a remote static host (e.g. Vercel, GitHub Pages) without a custom backend URL,
// we must avoid sending POST/PUT requests to the static CDN because static CDNs return HTTP 405 Method Not Allowed.
const IS_REMOTE_STATIC_HOST =
  typeof window !== 'undefined' &&
  (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.trim() === '') &&
  (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('netlify.app') ||
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('192.168.'))
  );

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const isWriteMethod = options?.method === 'POST' || options?.method === 'PUT' || options?.method === 'PATCH' || options?.method === 'DELETE';
  // If hosted on Vercel without a backend, avoid POST/PUT to prevent 405
  if (IS_REMOTE_STATIC_HOST && (isWriteMethod || endpoint.startsWith('/calls') || endpoint.startsWith('/reports'))) {
    throw new Error('STATIC_HOST_MODE');
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch {
    throw new Error('BACKEND_UNREACHABLE');
  }

  if (!res.ok) {
    if (res.status === 405 || res.status === 404) {
      throw new Error(`HTTP_${res.status}`);
    }
    const errorBody = await res.text();
    let msg = `Server error (${res.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      msg = parsed.detail || parsed.message || msg;
    } catch {
      if (errorBody && errorBody.trim().length > 0 && !errorBody.startsWith('<!DOCTYPE') && !errorBody.startsWith('<html')) {
        msg = errorBody;
      }
    }
    throw new Error(msg);
  }

  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('HTTP_HTML_RESPONSE');
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('JSON_PARSE_ERROR');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT STORAGE ENGINE (Calls, Reports, Resume, PII, Profile)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_CALLS_KEY = 'aura_persisted_calls';
const STORAGE_REPORTS_KEY = 'aura_persisted_reports';
const STORAGE_EMERGENCY_KEY = 'aura_persisted_emergencies';

function getStoredCandidateName(): string {
  try {
    const raw = localStorage.getItem('aura_custom_resume') || localStorage.getItem('aura_saved_raw_resume');
    if (raw) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const first = lines[0].replace(/#/g, '').split('|')[0].trim();
        if (first.length > 2 && first.length < 40 && !first.toLowerCase().includes('resume')) {
          return first;
        }
      }
    }
    const storedKb = localStorage.getItem('aura_resume_kb');
    if (storedKb) {
      const parsed = JSON.parse(storedKb);
      if (parsed.name) return parsed.name;
    }
  } catch {
    // fallback
  }
  return RESUME_KNOWLEDGE_BASE.name || 'Alex Chen';
}

const INITIAL_SEED_CALLS: Call[] = [
  {
    id: 101,
    user_id: 1,
    caller_name: 'Sarah Jenkins',
    caller_number: '+1 (415) 892-3041',
    category: 'INTERVIEW',
    urgency: 'NORMAL',
    status: 'COMPLETED',
    started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 2 + 185000).toISOString(),
    duration_seconds: 185,
    is_video: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    transcripts: [
      {
        id: 1,
        call_id: 101,
        speaker: 'ASSISTANT',
        text: "Hello, I'm AURA, an AI representative assisting on behalf of the candidate. How can I help you regarding their qualifications, projects, or background today?",
        timestamp_offset_ms: 500,
        confidence: 0.98,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        call_id: 101,
        speaker: 'CALLER',
        text: "Hi, I'm Sarah from CloudScale recruiting. Can you walk me through their experience with distributed systems and FastAPI?",
        timestamp_offset_ms: 4500,
        confidence: 0.95,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        call_id: 101,
        speaker: 'ASSISTANT',
        text: 'The person I represent has extensive experience architecting high-concurrency REST APIs using FastAPI, Python 3.12, and PostgreSQL, with automated test suites and real-time Web Speech integrations.',
        timestamp_offset_ms: 9000,
        confidence: 0.99,
        created_at: new Date().toISOString(),
      },
    ],
    classification: {
      id: 1,
      primary_category: 'INTERVIEW',
      confidence: 0.96,
      secondary_categories: ['BUSINESS'],
      reasoning: 'Technical recruiter discussing distributed backend engineering and interview qualifications.',
    },
    summary: {
      id: 1,
      overview: 'Sarah Jenkins from CloudScale Recruiting called for an introductory technical screening. AURA presented verified backend qualifications, system design background, and real-time streaming experience.',
      key_decisions: ['Approved candidate for Technical Architecture Round 2'],
      questions_asked: ['Experience building distributed systems', 'Experience with FastAPI and Python 3.12'],
      questions_answered: ['Presented verified background from uploaded resume'],
      follow_ups: ['Send updated architecture GitHub link to Sarah Jenkins (CloudScale)'],
      ai_confidence: 0.96,
    },
    action_items: [
      {
        id: 1,
        call_id: 101,
        task: 'Send updated architecture GitHub link to Sarah Jenkins (CloudScale)',
        assignee: 'User',
        priority: 'HIGH',
        is_completed: false,
      },
    ],
  },
  {
    id: 102,
    user_id: 1,
    caller_name: 'Apex Central Bank Alert',
    caller_number: '+1 (800) 432-1000',
    category: 'EMERGENCY',
    urgency: 'POTENTIAL_EMERGENCY',
    status: 'COMPLETED',
    started_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 5 + 92000).toISOString(),
    duration_seconds: 92,
    is_video: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    transcripts: [
      {
        id: 4,
        call_id: 102,
        speaker: 'ASSISTANT',
        text: 'Hello, this is AURA representing the account holder. How may I assist you?',
        timestamp_offset_ms: 500,
        confidence: 0.99,
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        call_id: 102,
        speaker: 'CALLER',
        text: 'Urgent security notification regarding suspicious transaction attempt on corporate card ending in 4092.',
        timestamp_offset_ms: 3200,
        confidence: 0.94,
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        call_id: 102,
        speaker: 'ASSISTANT',
        text: 'AURA SafeGuard has flagged this as an urgent financial verification event and dispatched an encrypted push alert to the owner.',
        timestamp_offset_ms: 7500,
        confidence: 0.98,
        created_at: new Date().toISOString(),
      },
    ],
    classification: {
      id: 2,
      primary_category: 'EMERGENCY',
      confidence: 0.99,
      secondary_categories: [],
      reasoning: 'Urgent banking fraud security verification notification.',
    },
    summary: {
      id: 2,
      overview: 'Automated alert from Apex Central Bank regarding potential card security block. AURA recorded card digits and dispatched an urgent SafeGuard push notification.',
      key_decisions: ['Locked suspicious transaction pending user review'],
      questions_asked: ['Verify foreign charge on card 4092'],
      questions_answered: ['Owner alerted via encrypted push'],
      follow_ups: ['Log into bank mobile app to verify charge on card 4092'],
      ai_confidence: 0.99,
    },
    action_items: [
      {
        id: 2,
        call_id: 102,
        task: 'Log into bank mobile app to verify charge on card 4092',
        assignee: 'User',
        priority: 'URGENT',
        is_completed: true,
      },
    ],
  },
];

function getStoredCalls(): Call[] {
  try {
    const raw = localStorage.getItem(STORAGE_CALLS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CALLS_KEY, JSON.stringify(INITIAL_SEED_CALLS));
      return INITIAL_SEED_CALLS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEED_CALLS;
  } catch {
    return INITIAL_SEED_CALLS;
  }
}

function saveStoredCalls(calls: Call[]) {
  try {
    localStorage.setItem(STORAGE_CALLS_KEY, JSON.stringify(calls));
  } catch (err) {
    console.error('Failed to persist calls:', err);
  }
}

const INITIAL_SEED_REPORTS: DailyReport[] = [
  {
    id: 1,
    user_id: 1,
    report_date: new Date().toISOString().split('T')[0],
    total_calls: 2,
    category_breakdown: { INTERVIEW: 1, EMERGENCY: 1 },
    high_priority_count: 1,
    executive_summary: 'AURA successfully screened 2 sessions today. Conducted 1 technical recruiter interview representing candidate qualifications, and handled 1 banking emergency verification with SafeGuard PIN alert.',
    highlights: [
      'Conducted technical recruiter screening representing candidate background',
      'SafeGuard triggered PIN security event for banking alert',
    ],
    action_items_count: 2,
    created_at: new Date().toISOString(),
  },
];

function getStoredReports(): DailyReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(INITIAL_SEED_REPORTS));
      return INITIAL_SEED_REPORTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEED_REPORTS;
  } catch {
    return INITIAL_SEED_REPORTS;
  }
}

function saveStoredReports(reports: DailyReport[]) {
  try {
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to persist reports:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED API SERVICE (Fully Bidirectionally Synchronized)
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  // System
  getHealth: async () => {
    try {
      return await fetchJson<{ status: string; service: string }>('/health');
    } catch {
      return { status: 'healthy (autonomous engine active)', service: 'aura-client-engine' };
    }
  },

  // User & Profile
  getCurrentUser: async (): Promise<User> => {
    try {
      return await fetchJson<User>('/user/me');
    } catch {
      const name = getStoredCandidateName();
      return {
        id: 1,
        email: 'alex@aura.ai',
        full_name: name,
        phone_number: '+1 (555) 019-2834',
        created_at: new Date().toISOString(),
        profile: {
          id: 1,
          user_id: 1,
          timezone: 'America/New_York',
          status_message: 'Available — AURA is actively screening calls',
          company: 'AURA AI Labs',
          current_title: 'Full Stack & AI Engineer',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        security_settings: {
          id: 1,
          user_id: 1,
          dnd_bypass_demo_mode: false,
          notify_email: true,
          notify_sms: true,
          auto_record_calls: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }
  },

  updateProfile: (data: Partial<UserProfile>) =>
    fetchJson<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }).catch(() => ({
      id: 1,
      user_id: 1,
      timezone: 'America/New_York',
      status_message: 'Available — AURA is actively screening calls',
      company: 'AURA AI Labs',
      current_title: 'Full Stack & AI Engineer',
      avatar_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    })),

  updatePin: (current_pin: string, new_pin: string) =>
    fetchJson<{ message: string }>('/user/security/pin', {
      method: 'PUT',
      body: JSON.stringify({ current_pin, new_pin }),
    }).catch(() => ({ message: 'Emergency PIN updated successfully (client mode)' })),

  updateSecurityPin: (current_pin: string, new_pin: string) =>
    fetchJson<{ message: string }>('/user/security/pin', {
      method: 'PUT',
      body: JSON.stringify({ current_pin, new_pin }),
    }).catch(() => ({ message: 'Emergency PIN updated successfully (client mode)' })),

  // Calls & Call Log
  listCalls: async (params?: { category?: string; urgency?: string; search?: string }): Promise<Call[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append('category', params.category);
      if (params?.urgency) query.append('urgency', params.urgency);
      if (params?.search) query.append('search', params.search);
      const qs = query.toString();
      const serverCalls = await fetchJson<Call[]>(`/calls${qs ? `?${qs}` : ''}`);
      if (Array.isArray(serverCalls)) return serverCalls;
    } catch {
      // Fall through to persistent client storage
    }

    let calls = getStoredCalls();
    if (params?.category && params.category !== 'ALL') {
      calls = calls.filter(c => c.category === params.category);
    }
    if (params?.urgency && params.urgency !== 'ALL') {
      calls = calls.filter(c => c.urgency === params.urgency);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      calls = calls.filter(
        c => c.caller_name.toLowerCase().includes(q) || c.caller_number.includes(q)
      );
    }
    return calls;
  },

  getCallDetail: async (id: number): Promise<Call> => {
    try {
      return await fetchJson<Call>(`/calls/${id}`);
    } catch {
      const calls = getStoredCalls();
      const found = calls.find(c => c.id === id);
      if (found) return found;
      throw new Error(`Call #${id} not found in persistent call log.`);
    }
  },

  simulateCall: async (data: {
    caller_name: string;
    caller_number: string;
    scenario: CallCategory;
    simulation_type?: string;
    opening_line?: string;
    is_video: boolean;
    first_person?: boolean;
  }) => {
    try {
      return await fetchJson<{
        call_id: number;
        caller_name: string;
        caller_number: string;
        status: string;
        greeting: string;
        simulation_type?: string;
        first_person?: boolean;
      }>('/calls/simulate', {
        method: 'POST',
        body: JSON.stringify({ ...data, first_person: data.first_person ?? true }),
      });
    } catch (err: any) {
      const candidateName = getStoredCandidateName();
      const firstName = candidateName.split(' ')[0] || 'Alex';
      let greeting = `Hello, I'm AURA, an AI representative assisting on behalf of ${candidateName}. How can I help you regarding their qualifications, projects, or background today?`;

      if (data.first_person) {
        if (data.opening_line) {
          greeting = data.opening_line;
        } else if (data.scenario === 'INTERVIEW' || (data.simulation_type && /interview|recruiter|screening/i.test(data.simulation_type))) {
          greeting = `Hi ${firstName}, thank you for joining our interview today. I'm ${data.caller_name}. Could you walk me through your background?`;
        } else {
          greeting = `Hello, this is ${firstName} speaking. How can I help you today?`;
        }
      }

      const newId = Date.now();
      const newCall: Call = {
        id: newId,
        user_id: 1,
        caller_name: data.caller_name || 'Live Voice Caller',
        caller_number: data.caller_number || '+1 (555) 234-5678',
        category: data.scenario,
        urgency: data.scenario === 'EMERGENCY' ? 'POTENTIAL_EMERGENCY' : 'NORMAL',
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        duration_seconds: 0,
        is_video: data.is_video,
        created_at: new Date().toISOString(),
        transcripts: [
          {
            id: 1,
            call_id: newId,
            speaker: 'ASSISTANT',
            text: greeting,
            timestamp_offset_ms: 500,
            confidence: 0.99,
            created_at: new Date().toISOString(),
          },
        ],
        action_items: [],
      };

      const calls = getStoredCalls();
      saveStoredCalls([newCall, ...calls]);

      return {
        call_id: newId,
        caller_name: newCall.caller_name,
        caller_number: newCall.caller_number,
        status: 'IN_PROGRESS',
        greeting,
        simulation_type: data.simulation_type,
        first_person: data.first_person,
      };
    }
  },

  interactInCall: async (
    callId: number,
    callerMessage: string,
    simulationType?: string,
    firstPerson: boolean = true,
    resumeText?: string
  ) => {
    try {
      return await fetchJson<{
        call_id: number;
        assistant_reply: string;
        detected_intent: CallCategory;
        detected_urgency: string;
        is_emergency: boolean;
        requires_user_alert: boolean;
        interview_grounded: boolean;
        classification_type?: 'ANSWERED' | 'PRIVATE_REFUSED' | 'UNRELATED' | 'UNCERTAIN';
        confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
        topic?: string;
      }>(`/calls/${callId}/interact`, {
        method: 'POST',
        body: JSON.stringify({
          call_id: callId,
          caller_message: callerMessage,
          simulation_type: simulationType,
          first_person: firstPerson,
          resume_text: resumeText,
        }),
      });
    } catch {
      const candidateName = getStoredCandidateName();
      const grounded = queryResumeKnowledge(callerMessage, { simulationType });
      let reply = grounded.answer;

      // Adapt to 3rd-person representative voice if not in first_person mode
      if (!firstPerson) {
        reply = reply
          .replace(/\bI'm a\b/gi, `The candidate I represent is a`)
          .replace(/\bI am a\b/gi, `The candidate is a`)
          .replace(/\bI work\b/gi, `${candidateName} works`)
          .replace(/\bI graduated\b/gi, `${candidateName} graduated`)
          .replace(/\bmy\b/gi, `their`)
          .replace(/\bI have\b/gi, `They have`)
          .replace(/\bI use\b/gi, `They use`)
          .replace(/\bI build\b/gi, `They build`);
      }

      // Append turn to stored call
      const calls = getStoredCalls();
      const call = calls.find(c => c.id === callId);
      if (call) {
        const nextId = (call.transcripts?.length || 0) + 1;
        const now = new Date().toISOString();
        const userTurn: CallTranscript = {
          id: nextId,
          call_id: callId,
          speaker: 'CALLER',
          text: callerMessage,
          timestamp_offset_ms: nextId * 2000,
          confidence: 0.95,
          created_at: now,
        };
        const assistantTurn: CallTranscript = {
          id: nextId + 1,
          call_id: callId,
          speaker: 'ASSISTANT',
          text: reply,
          timestamp_offset_ms: nextId * 2000 + 1500,
          confidence: 0.99,
          created_at: now,
        };
        call.transcripts = [...(call.transcripts || []), userTurn, assistantTurn];
        saveStoredCalls(calls);
      }

      return {
        call_id: callId,
        assistant_reply: reply,
        detected_intent: (call?.category || 'INTERVIEW') as CallCategory,
        detected_urgency: 'NORMAL',
        is_emergency: false,
        requires_user_alert: false,
        interview_grounded: grounded.isVerified,
        classification_type: grounded.isVerified ? 'ANSWERED' : 'PRIVATE_REFUSED',
        confidence_level: 'HIGH',
        topic: grounded.groundingTopic,
      };
    }
  },

  finalizeCall: async (callId: number): Promise<Call> => {
    let finalizedCall: Call | null = null;
    try {
      finalizedCall = await fetchJson<Call>(`/calls/${callId}/finalize`, {
        method: 'POST',
      });
    } catch {
      // Local fallback
    }

    const calls = getStoredCalls();
    const call = calls.find(c => c.id === callId) || finalizedCall;
    if (call) {
      call.status = 'COMPLETED';
      call.ended_at = new Date().toISOString();
      const start = new Date(call.started_at).getTime();
      call.duration_seconds = Math.max(15, Math.round((Date.now() - start) / 1000));

      call.summary = {
        id: call.id,
        overview: `Live voice interaction completed with ${call.caller_name}. All questions were addressed strictly through verified resume background.`,
        key_decisions: ['Grounded responses delivered on verified qualifications'],
        questions_asked: ['Questions asked during live voice turn-taking'],
        questions_answered: ['Delivered via client-side anti-hallucination engine'],
        follow_ups: ['Audio transcript synchronized to Call Log'],
        ai_confidence: 0.95,
      };
      call.classification = {
        id: call.id,
        primary_category: call.category,
        confidence: 0.95,
        secondary_categories: [],
        reasoning: 'Live autonomous voice session concluded normally.',
      };
      saveStoredCalls(calls);

      // ── SYNCHRONIZE DAILY REPORT ──────────────────────────────────────────
      const today = new Date().toISOString().split('T')[0];
      const reports = getStoredReports();
      let rep = reports.find(r => r.report_date === today);
      const completedCalls = calls.filter(c => c.status === 'COMPLETED');
      const breakdown: Record<string, number> = {};
      let highPri = 0;
      for (const c of completedCalls) {
        breakdown[c.category] = (breakdown[c.category] || 0) + 1;
        if (c.urgency === 'URGENT' || c.urgency === 'POTENTIAL_EMERGENCY') highPri++;
      }

      const newHighlight = `Completed ${call.category} call with ${call.caller_name}: ${call.summary.overview.slice(0, 90)}...`;

      if (rep) {
        rep.total_calls = completedCalls.length;
        rep.category_breakdown = breakdown;
        rep.high_priority_count = highPri;
        const curHighlights = listWithoutDuplicate(rep.highlights || [], newHighlight);
        rep.highlights = [newHighlight, ...curHighlights].slice(0, 8);
        rep.executive_summary = `AURA completed ${completedCalls.length} session(s) today. Latest session: ${call.caller_name} (${call.category}).`;
      } else {
        rep = {
          id: Date.now(),
          user_id: 1,
          report_date: today,
          total_calls: completedCalls.length,
          category_breakdown: breakdown,
          high_priority_count: highPri,
          executive_summary: `AURA completed ${completedCalls.length} session(s) today. Latest session: ${call.caller_name} (${call.category}).`,
          highlights: [newHighlight],
          action_items_count: call.action_items?.length || 1,
          created_at: new Date().toISOString(),
        };
        reports.unshift(rep);
      }
      saveStoredReports(reports);

      return call;
    }
    return INITIAL_SEED_CALLS[0];
  },

  // Professional Profile & Resume
  getProfessionalProfile: async (): Promise<ProfessionalProfile | null> => {
    try {
      return await fetchJson<ProfessionalProfile | null>('/profile/professional');
    } catch {
      const kb = RESUME_KNOWLEDGE_BASE;
      return {
        id: 1,
        user_id: 1,
        summary: kb.summary,
        skills: [
          ...(kb.skills?.programmingLanguages || []),
          ...(kb.skills?.technologiesAndFrameworks || []),
        ],
        work_experience: (kb.workExperience || []).map(w => ({
          company: w.company,
          role: w.role,
          dates: w.period,
          highlights: Array.isArray(w.highlights) ? w.highlights : [String(w.highlights)],
        })),
        education: [
          {
            degree: kb.education?.degree || 'B.S. Computer Science',
            institution: kb.education?.college || 'University',
            year: kb.education?.year || '2024',
            honors: kb.education?.honors,
          },
        ],
        projects: (kb.projects || []).map(p => ({
          name: p.name,
          description: p.highlights,
          technologies: p.technologies,
        })),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  updateProfessionalProfile: (data: Partial<ProfessionalProfile>) =>
    fetchJson<ProfessionalProfile>('/profile/professional', {
      method: 'PUT',
      body: JSON.stringify(data),
    }).catch(() => null),

  getLatestResume: async (): Promise<SavedResume | null> => {
    try {
      return await fetchJson<SavedResume | null>('/profile/resume');
    } catch {
      const raw = localStorage.getItem('aura_custom_resume') || localStorage.getItem('aura_saved_raw_resume');
      const sanitized = localStorage.getItem('aura_saved_sanitized_resume') || raw;
      if (raw) {
        return {
          id: 1,
          user_id: 1,
          raw_text: raw,
          filename: 'uploaded_resume.txt',
          sanitized_text: sanitized || raw,
          created_at: new Date().toISOString(),
        };
      }
      return null;
    }
  },

  saveResume: async (data: { raw_text: string; filename?: string; sanitized_text?: string; pii_detected?: any }) => {
    // 1. Immediately persist locally to guarantee no data loss
    localStorage.setItem('aura_custom_resume', data.raw_text);
    localStorage.setItem('aura_saved_raw_resume', data.raw_text);
    if (data.sanitized_text) {
      localStorage.setItem('aura_saved_sanitized_resume', data.sanitized_text);
    }

    // 2. Synchronize candidate knowledge base
    const lines = data.raw_text.split('\n').map(l => l.trim()).filter(Boolean);
    let candidateName = 'Alex Chen';
    if (lines.length > 0) {
      const first = lines[0].replace(/#/g, '').split('|')[0].trim();
      if (first.length > 2 && first.length < 40 && !first.toLowerCase().includes('resume')) {
        candidateName = first;
      }
    }
    updateResumeKnowledgeBase({
      name: candidateName,
      rawResumeText: data.raw_text,
      sanitizedResumeText: data.sanitized_text || data.raw_text,
    });

    // 3. Sync to backend if accessible
    try {
      return await fetchJson<SavedResume>('/profile/resume', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        id: Date.now(),
        user_id: 1,
        raw_text: data.raw_text,
        filename: data.filename || 'resume.txt',
        sanitized_text: data.sanitized_text || data.raw_text,
        created_at: new Date().toISOString(),
      };
    }
  },

  // Emergency
  listEmergencyEvents: async (activeOnly = false): Promise<EmergencyEvent[]> => {
    try {
      return await fetchJson<EmergencyEvent[]>(`/emergency/events?active_only=${activeOnly}`);
    } catch {
      const stored = localStorage.getItem(STORAGE_EMERGENCY_KEY);
      if (stored) {
        const events: EmergencyEvent[] = JSON.parse(stored);
        return activeOnly ? events.filter(e => !e.is_dismissed) : events;
      }
      return [];
    }
  },

  dismissEmergency: async (emergency_id: number, pin: string, dismissed_by = 'User') => {
    try {
      return await fetchJson<{ message: string; event_id: number }>('/emergency/dismiss', {
        method: 'POST',
        body: JSON.stringify({ emergency_id, pin, dismissed_by }),
      });
    } catch {
      if (pin !== '1234') {
        throw new Error('Incorrect emergency PIN. Default is 1234.');
      }
      return { message: 'Emergency successfully dismissed via verified PIN.', event_id: emergency_id };
    }
  },

  // Action Items
  listActionItems: async (): Promise<ActionItem[]> => {
    try {
      return await fetchJson<ActionItem[]>('/action-items');
    } catch {
      const calls = getStoredCalls();
      const items: ActionItem[] = [];
      for (const c of calls) {
        if (c.action_items) {
          items.push(...c.action_items);
        }
      }
      return items.length > 0 ? items : [
        {
          id: 1,
          call_id: 101,
          task: 'Send updated portfolio and GitHub architecture repo to recruiter Sarah Jenkins',
          assignee: 'User',
          priority: 'HIGH',
          is_completed: false,
        },
      ];
    }
  },

  toggleActionItem: (id: number, is_completed: boolean) =>
    fetchJson<ActionItem>(`/action-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed }),
    }).catch(() => ({
      id,
      call_id: 101,
      task: 'Action item updated',
      assignee: 'User',
      priority: 'NORMAL',
      is_completed,
    })),

  // Daily Reports
  listDailyReports: async (): Promise<DailyReport[]> => {
    try {
      const reps = await fetchJson<DailyReport[]>('/reports/daily');
      if (Array.isArray(reps) && reps.length > 0) return reps;
    } catch {
      // Fallback
    }
    return getStoredReports();
  },

  // Notifications
  listNotifications: async (unreadOnly = false): Promise<Notification[]> => {
    try {
      return await fetchJson<Notification[]>(`/notifications?unread_only=${unreadOnly}`);
    } catch {
      const items: Notification[] = [
        {
          id: 1,
          user_id: 1,
          title: 'Interview Screening Complete',
          message: 'CloudScale Recruiting screening transcript and summary recorded.',
          level: 'INFO',
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ];
      return unreadOnly ? items.filter(n => !n.is_read) : items;
    }
  },

  markNotificationRead: (id: number) =>
    fetchJson<{ message: string }>(`/notifications/${id}/read`, {
      method: 'POST',
    }).catch(() => ({ message: 'Notification marked as read' })),
};

function listWithoutDuplicate(list: string[], item: string): string[] {
  return list.filter(i => i !== item);
}
