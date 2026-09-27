import React, { useState } from 'react';
import {
  FileBarChart,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone,
  Video,
  Clock,
  AlertTriangle,
  Mic,
  ShieldAlert,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { DailyReport, Call } from '../types';

interface DailyReportsPageProps {
  reports: DailyReport[];
  calls?: Call[];
  onSelectCall?: (callId: number) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const categoryColor: Record<string, string> = {
  INTERVIEW:  'bg-violet-50 text-violet-700 border-violet-200',
  EMERGENCY:  'bg-rose-50 text-rose-700 border-rose-200',
  SPAM:       'bg-amber-50 text-amber-700 border-amber-200',
  BUSINESS:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  PERSONAL:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  NORMAL:     'bg-slate-50 text-slate-600 border-slate-200',
  UNKNOWN:    'bg-slate-50 text-slate-500 border-slate-200',
};

const urgencyDot: Record<string, string> = {
  POTENTIAL_EMERGENCY: 'bg-rose-500',
  URGENT:              'bg-orange-500',
  IMPORTANT:           'bg-indigo-500',
  NORMAL:              'bg-emerald-400',
  LOW_PRIORITY:        'bg-slate-400',
};

function fmt(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Call History Card ─────────────────────────────────────────────────────────

interface CallCardProps {
  call: Call;
  onClick?: () => void;
}

const CallHistoryCard: React.FC<CallCardProps> = ({ call, onClick }) => {
  const [expanded, setExpanded] = useState(false);

  const catClass = categoryColor[call.category] || categoryColor['NORMAL'];
  const dot = urgencyDot[call.urgency] || urgencyDot['NORMAL'];

  const transcripts = call.transcripts ?? [];
  const summary = call.summary;

  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* ── Header row ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon */}
          <div className={`flex-shrink-0 p-2.5 rounded-xl border ${catClass}`}>
            {call.is_video ? (
              <Video className="h-4 w-4" />
            ) : call.category === 'EMERGENCY' ? (
              <ShieldAlert className="h-4 w-4" />
            ) : call.category === 'INTERVIEW' ? (
              <Mic className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
          </div>
          {/* Caller info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                {call.caller_name}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catClass}`}>
                {call.category}
              </span>
              {call.urgency !== 'NORMAL' && (
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} title={call.urgency} />
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{call.caller_number}</span>
              <span>•</span>
              <span>{new Date(call.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span className="font-mono">{fmt(call.duration_seconds)}</span>
              {call.is_video && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 border border-cyan-200">
                  Video
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {onClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-cyan-50 transition"
            >
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* ── Expandable body ── */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">

          {/* AI Summary overview */}
          {summary?.overview && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                AI Summary
              </span>
              {summary.overview}
            </div>
          )}

          {/* Transcript */}
          {transcripts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Conversation ({transcripts.length} turns)
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {transcripts.map((t, i) => {
                  const isAura = t.speaker === 'ASSISTANT';
                  return (
                    <div key={i} className={`flex gap-2 ${isAura ? 'justify-start' : 'justify-end'}`}>
                      {isAura && (
                        <div className="h-6 w-6 rounded-lg bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700 shrink-0 text-[8px] font-black mt-0.5">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-sm px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                          isAura
                            ? 'bg-cyan-50 border border-cyan-200 text-slate-800 rounded-tl-sm'
                            : 'bg-blue-50 border border-blue-200 text-slate-800 rounded-tr-sm'
                        }`}
                      >
                        <span className="block text-[9px] font-mono text-slate-400 mb-0.5">
                          {isAura ? 'AURA' : t.speaker === 'USER' ? 'User' : 'Caller'}
                        </span>
                        {t.text}
                      </div>
                      {!isAura && (
                        <div className="h-6 w-6 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 text-[8px] font-black mt-0.5">
                          {t.speaker === 'USER' ? 'U' : 'C'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key decisions & Follow-ups */}
          {((summary?.key_decisions?.length ?? 0) > 0 || (summary?.follow_ups?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(summary?.key_decisions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Key Decisions
                  </p>
                  <ul className="space-y-1">
                    {summary!.key_decisions.map((d, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(summary?.follow_ups?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    Follow-ups
                  </p>
                  <ul className="space-y-1">
                    {summary!.follow_ups.map((f, i) => (
                      <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action items */}
          {(call.action_items?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Action Items
              </p>
              <ul className="space-y-1">
                {call.action_items.map((ai, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                    <span className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      ai.is_completed
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-600'
                        : 'bg-white border-slate-300'
                    }`}>
                      {ai.is_completed && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    <span className={ai.is_completed ? 'line-through text-slate-400' : ''}>
                      {ai.task}
                    </span>
                    <span className={`ml-auto text-[9px] font-bold px-1.5 rounded flex-shrink-0 ${
                      ai.priority === 'Critical' ? 'text-rose-600 bg-rose-50' :
                      ai.priority === 'High' ? 'text-orange-600 bg-orange-50' :
                      'text-slate-500 bg-slate-100'
                    }`}>
                      {ai.priority}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const DailyReportsPage: React.FC<DailyReportsPageProps> = ({ reports, calls = [], onSelectCall }) => {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(reports[0]?.id ?? null);

  const activeReport = reports.find((r) => r.id === selectedReportId) ?? reports[0] ?? null;

  // Show recent calls (last 20), most recent first
  const recentCalls = [...calls]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 20);

  if (reports.length === 0 && calls.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
        <FileBarChart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">No daily reports generated yet.</p>
        <p className="text-xs text-slate-500 mt-1">Reports are synthesized automatically after call sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Report selector tabs ── */}
      {reports.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReportId(r.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                selectedReportId === r.id
                  ? 'bg-cyan-500 text-slate-950 border-transparent shadow-md shadow-cyan-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r.report_date}
            </button>
          ))}
        </div>
      )}

      {/* ── Active Report Feature Banner ── */}
      {activeReport && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-200 text-cyan-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Daily Intelligence Briefing</h3>
                <p className="text-xs text-slate-400">{activeReport.report_date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 font-bold">
                {activeReport.total_calls} Total Calls
              </span>
              <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 font-bold">
                {activeReport.high_priority_count} High Priority
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-500" />
              AI Executive Summary
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {activeReport.executive_summary}
            </p>
          </div>

          {/* Call Distribution */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Call Distribution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(activeReport.category_breakdown).map(([cat, count]) => (
                <div
                  key={cat}
                  className={`p-3 rounded-xl border flex items-center justify-between ${categoryColor[cat] || 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  <span className="text-xs font-semibold">{cat}</span>
                  <span className="text-xs font-mono font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          {activeReport.highlights.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Key Accomplishments & Outcomes
              </h4>
              <div className="space-y-2">
                {activeReport.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Call History with Transcripts ── */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Phone className="h-4 w-4 text-cyan-500" />
            Previous Call Histories
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600">
              {recentCalls.length}
            </span>
          </h4>
          <span className="text-[11px] text-slate-400">Click any call to expand transcript &amp; summary</span>
        </div>

        {recentCalls.length === 0 ? (
          <div className="py-10 text-center">
            <Phone className="h-6 w-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No call history yet. Start a simulated or live call to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCalls.map((call) => (
              <CallHistoryCard
                key={call.id}
                call={call}
                onClick={onSelectCall ? () => onSelectCall(call.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Example Calls Section ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/30 border border-slate-200 p-6 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Example Call Scenarios Handled by AURA
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: '🎙️ Recruiter Interview Screening',
              desc: 'AURA answers technical questions about your skills, projects, and experience — strictly grounded on your uploaded resume with zero hallucination.',
              cat: 'INTERVIEW',
              example: '"Can you walk me through Alex\'s experience with FastAPI and real-time systems?" → AURA answers with verified resume facts only.',
            },
            {
              title: '🚨 Medical Emergency Bypass',
              desc: 'AURA instantly escalates calls containing emergency keywords (hospital, accident, cardiac) with a PIN-secured alert dispatched to your device.',
              cat: 'EMERGENCY',
              example: '"Dr. Gomez from Stanford ER — family member admitted, need authorization immediately." → Emergency alert triggered.',
            },
            {
              title: '🤖 Spam & Robocall Filtering',
              desc: 'Unsolicited marketing calls are terminated politely and the number is flagged automatically for future blocking.',
              cat: 'SPAM',
              example: '"Your vehicle warranty has expired…" → AURA responds: "We do not accept unsolicited offers. Please remove this number."',
            },
            {
              title: '💼 Business & Vendor Coordination',
              desc: 'AURA handles routine business inquiries, captures key decisions, and generates follow-up action items automatically.',
              cat: 'BUSINESS',
              example: '"Marcus from CloudScale — checking on the Kafka rollout readiness." → AURA notes the discussion and creates an action item.',
            },
          ].map((ex, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 hover:shadow-sm transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{ex.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryColor[ex.cat] || ''}`}>
                  {ex.cat}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{ex.desc}</p>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 italic leading-relaxed">
                {ex.example}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
