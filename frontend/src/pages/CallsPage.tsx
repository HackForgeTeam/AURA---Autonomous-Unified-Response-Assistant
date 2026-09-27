import React, { useState } from 'react';
import {
  Search,
  PhoneCall,
  Clock,
  ArrowRight,
  Filter,
  Video,
  Phone,
} from 'lucide-react';
import { Call, CallCategory, UrgencyLevel } from '../types';

interface CallsPageProps {
  calls: Call[];
  onSelectCall: (callId: number) => void;
  onRefreshCalls: () => void;
}

export const CallsPage: React.FC<CallsPageProps> = ({ calls, onSelectCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');

  const categories: (CallCategory | 'ALL')[] = [
    'ALL',
    'NORMAL',
    'INTERVIEW',
    'BUSINESS',
    'PERSONAL',
    'SPAM',
    'EMERGENCY',
    'UNKNOWN',
  ];

  const urgencies: (UrgencyLevel | 'ALL')[] = [
    'ALL',
    'NORMAL',
    'LOW_PRIORITY',
    'IMPORTANT',
    'URGENT',
    'POTENTIAL_EMERGENCY',
  ];

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.caller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.caller_number.includes(searchTerm);
    const matchesCategory = selectedCategory === 'ALL' || call.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'ALL' || call.urgency === selectedUrgency;
    return matchesSearch && matchesCategory && matchesUrgency;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by caller name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills & Urgency Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-semibold px-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-semibold px-1">Urgency:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
            >
              {urgencies.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calls Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Showing {filteredCalls.length} of {calls.length} total calls
          </span>
          <span className="text-xs text-slate-500">Autonomous transcript & summaries available</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredCalls.length === 0 ? (
            <div className="p-12 text-center">
              <PhoneCall className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No calls found matching filters</p>
              <p className="text-xs text-slate-400 mt-1">Try changing category filter or search query</p>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <div
                key={call.id}
                onClick={() => onSelectCall(call.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition group"
              >
                {/* Caller & Info */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl border ${
                    call.category === 'EMERGENCY'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : call.category === 'INTERVIEW'
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                      : call.category === 'SPAM'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  }`}>
                    {call.is_video ? (
                      <Video className="h-5 w-5" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-cyan-600 transition">
                        {call.caller_name}
                      </h4>
                      {call.is_video && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 border border-cyan-200">
                          Video AI Avatar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{call.caller_number}</span>
                      <span>•</span>
                      <span>{new Date(call.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {call.duration_seconds}s
                      </span>
                    </p>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-3">
                  {/* Urgency Badge */}
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${
                    call.urgency === 'POTENTIAL_EMERGENCY'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : call.urgency === 'URGENT'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : call.urgency === 'IMPORTANT'
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {call.urgency}
                  </span>

                  {/* Category Pill */}
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    call.category === 'EMERGENCY'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : call.category === 'INTERVIEW'
                      ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                      : call.category === 'SPAM'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                  }`}>
                    {call.category}
                  </span>

                  <button className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 group-hover:text-cyan-600 group-hover:border-cyan-300 transition">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
