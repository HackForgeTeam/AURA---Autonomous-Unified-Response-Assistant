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
  SavedResume
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (networkErr: any) {
    // fetch() itself threw — the backend is unreachable (not running / CORS blocked)
    throw new Error(
      'Cannot reach the AURA backend. Make sure it is running on port 8000 ' +
      '(run: uvicorn app.main:app --port 8000 inside AURA_11/backend).'
    );
  }
  if (!res.ok) {
    const errorBody = await res.text();
    let msg = `Server error (${res.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      msg = parsed.detail || parsed.message || msg;
    } catch {
      if (errorBody && errorBody.trim().length > 0 && !errorBody.startsWith('<!DOCTYPE') && !errorBody.startsWith('<html')) {
        msg = errorBody;
      } else if (res.status === 502 || res.status === 503) {
        msg = 'Cannot reach backend server. Ensure it is running on http://127.0.0.1:8000.';
      } else if (res.status === 500) {
        msg = 'Backend server error (500). Please check backend console logs.';
      }
    }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  // System
  getHealth: () => fetchJson<{ status: string; service: string }>('/health'),

  // User
  getCurrentUser: () => fetchJson<User>('/user/me'),
  updateProfile: (data: Partial<UserProfile>) =>
    fetchJson<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePin: (current_pin: string, new_pin: string) =>
    fetchJson<{ message: string }>('/user/security/pin', {
      method: 'PUT',
      body: JSON.stringify({ current_pin, new_pin }),
    }),

  // Calls
  listCalls: (params?: { category?: string; urgency?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.urgency) query.append('urgency', params.urgency);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return fetchJson<Call[]>(`/calls${qs ? `?${qs}` : ''}`);
  },
  getCallDetail: (id: number) => fetchJson<Call>(`/calls/${id}`),
  simulateCall: (data: {
    caller_name: string;
    caller_number: string;
    scenario: CallCategory;
    simulation_type?: string;
    opening_line?: string;
    is_video: boolean;
    first_person?: boolean;
  }) =>
    fetchJson<{
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
    }),
  interactInCall: (
    callId: number,
    callerMessage: string,
    simulationType?: string,
    firstPerson: boolean = true,
    resumeText?: string
  ) =>
    fetchJson<{
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
    }),
  finalizeCall: (callId: number) =>
    fetchJson<Call>(`/calls/${callId}/finalize`, {
      method: 'POST',
    }),

  // Professional Profile
  getProfessionalProfile: () => fetchJson<ProfessionalProfile | null>('/profile/professional'),
  updateProfessionalProfile: (data: Partial<ProfessionalProfile>) =>
    fetchJson<ProfessionalProfile>('/profile/professional', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getLatestResume: () => fetchJson<SavedResume | null>('/profile/resume'),
  saveResume: (data: { raw_text: string; filename?: string; sanitized_text?: string; pii_detected?: any }) =>
    fetchJson<SavedResume>('/profile/resume', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Emergency
  listEmergencyEvents: (activeOnly = false) =>
    fetchJson<EmergencyEvent[]>(`/emergency/events?active_only=${activeOnly}`),
  dismissEmergency: (emergency_id: number, pin: string, dismissed_by = 'User') =>
    fetchJson<{ message: string; event_id: number }>('/emergency/dismiss', {
      method: 'POST',
      body: JSON.stringify({ emergency_id, pin, dismissed_by }),
    }),

  // Action Items
  listActionItems: () => fetchJson<ActionItem[]>('/action-items'),
  toggleActionItem: (id: number, is_completed: boolean) =>
    fetchJson<ActionItem>(`/action-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed }),
    }),

  // Daily Reports
  listDailyReports: () => fetchJson<DailyReport[]>('/reports/daily'),

  // Notifications
  listNotifications: (unreadOnly = false) =>
    fetchJson<Notification[]>(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id: number) =>
    fetchJson<{ message: string }>(`/notifications/${id}/read`, {
      method: 'POST',
    }),
};
