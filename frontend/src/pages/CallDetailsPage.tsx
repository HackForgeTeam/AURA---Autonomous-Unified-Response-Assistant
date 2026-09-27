import React from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Bot,
  User,
  ShieldCheck,
  ListTodo,
  FileText,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Call } from '../types';

interface CallDetailsPageProps {
  call: Call | null;
  onBack: () => void;
  onToggleActionItem: (id: number, current: boolean) => void;
}

export const CallDetailsPage: React.FC<CallDetailsPageProps> = ({
  call,
  onBack,
  onToggleActionItem,
}) => {
  if (!call) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-400">Call not found or not selected.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-aura-border text-cyan-400 text-xs font-semibold"
        >
          Return to Calls
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Call summary banner */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">{call.caller_name}</h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              call.category === 'EMERGENCY'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : call.category === 'INTERVIEW'
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              {call.category}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>{call.caller_number}</span>
            <span>•</span>
            <span>{new Date(call.started_at).toLocaleString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> {call.duration_seconds}s
            </span>
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live/Historical Multi-Turn Transcript (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6 flex flex-col h-[700px] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-500" />
              <div>
                <h3 className="font-bold text-slate-700 text-sm">Conversation Transcript</h3>
                <p className="text-[11px] text-slate-400">Full dialogue captured by AURA Voice Assistant</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              {call.transcripts.length} exchanges
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {call.transcripts.map((t) => {
              const isAssistant = t.speaker === 'ASSISTANT';
              return (
                <div
                  key={t.id}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isAssistant
                      ? 'bg-slate-50 border border-cyan-200 text-slate-700 shadow-sm'
                      : 'bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-semibold text-slate-400">
                      <span>{isAssistant ? 'AURA Assistant' : call.caller_name}</span>
                      <span className="font-mono">{Math.round(t.timestamp_offset_ms / 1000)}s</span>
                    </div>
                    <p className="whitespace-pre-wrap">{t.text}</p>
                  </div>

                  {!isAssistant && (
                    <div className="h-8 w-8 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Analysis, Summary, Decisions & Action Items */}
        <div className="space-y-6">
          {/* Classification & Confidence */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-500" />
              AI Intent Classification
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-800">{call.category}</span>
              <span className="text-xs font-mono text-cyan-600 font-bold">
                {Math.round((call.classification?.confidence || 0.95) * 100)}% Confidence
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                style={{ width: `${Math.round((call.classification?.confidence || 0.95) * 100)}%` }}
              />
            </div>
            {call.classification?.reasoning && (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {call.classification.reasoning}
              </p>
            )}
          </div>

          {/* Call Summary & Key Decisions */}
          {call.summary && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-violet-500" />
                  Executive Summary
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {call.summary.overview}
                </p>
              </div>

              {call.summary.key_decisions.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Key Decisions
                  </h5>
                  <ul className="space-y-1.5">
                    {call.summary.key_decisions.map((dec, i) => (
                      <li key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {dec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {call.summary.questions_asked.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                    Caller Questions
                  </h5>
                  <ul className="space-y-1.5">
                    {call.summary.questions_asked.map((q, i) => (
                      <li key={i} className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{q}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Items extracted from this call */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ListTodo className="h-4 w-4 text-emerald-400" />
              Follow-Up Action Items
            </h4>
            {call.action_items.length === 0 ? (
              <p className="text-xs text-slate-500">No action items generated for this call.</p>
            ) : (
              <div className="space-y-2">
                {call.action_items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => onToggleActionItem(item.id, item.is_completed)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-xs ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.task}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">Assignee: {item.assignee}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
