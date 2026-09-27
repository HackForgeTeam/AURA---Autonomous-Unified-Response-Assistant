import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Cpu,
  User as UserIcon,
  Save,
} from 'lucide-react';
import { User } from '../types';

interface SettingsPageProps {
  user: User | null;
  onUpdateProfile: (data: any) => Promise<void>;
  onUpdatePin: (currentPin: string, newPin: string) => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateProfile,
  onUpdatePin,
}) => {
  // Profile form state
  const [currentTitle, setCurrentTitle] = useState(user?.profile?.current_title || 'Staff AI Engineer');
  const [company, setCompany] = useState(user?.profile?.company || 'Cognitive Dynamics');
  const [statusMessage, setStatusMessage] = useState(
    user?.profile?.status_message || 'In deep work sprint — AURA is answering calls'
  );

  // Security PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Provider state
  const [aiProvider, setAiProvider] = useState('mock');
  const [apiKey, setApiKey] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        current_title: currentTitle,
        company,
        status_message: statusMessage,
      });
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    try {
      await onUpdatePin(currentPin, newPin);
      setPinMessage({ type: 'success', text: 'Emergency PIN updated successfully!' });
      setCurrentPin('');
      setNewPin('');
    } catch (err: any) {
      setPinMessage({ type: 'error', text: err.message || 'Error updating PIN' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile & Assistant Representation */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-cyan-500" />
          Assistant Representation & User Profile
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          AURA introduces itself to callers using your name, title, and active status message.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Full Name</label>
              <input
                type="text"
                disabled
                value={user?.full_name || 'Alex Chen'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Registered Phone</label>
              <input
                type="text"
                disabled
                value={user?.phone_number || '+1 (555) 901-2345'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Professional Title</label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company / Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Active Status Message (Shared with Caller)</label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-md shadow-cyan-500/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>

      {/* Security & Emergency PIN */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
          <Shield className="h-4 w-4 text-rose-400" />
          Emergency Alert Security PIN
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Set a secure numeric PIN required to dismiss critical emergency alarms and confirm user receipt. (Default: <code className="text-cyan-600 font-mono font-bold">1234</code>)
        </p>

        <form onSubmit={handleSavePin} className="space-y-4 max-w-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current PIN</label>
              <input
                type="password"
                maxLength={8}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">New PIN</label>
              <input
                type="password"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="e.g. 5678"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {pinMessage && (
            <p className={`text-xs font-semibold ${pinMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
              {pinMessage.text}
            </p>
          )}

          <button
            type="submit"
            disabled={!currentPin || !newPin}
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-rose-300 text-rose-500 hover:bg-rose-50 font-bold text-xs flex items-center gap-2 transition"
          >
            <KeyRound className="h-4 w-4" />
            <span>Update Security PIN</span>
          </button>
        </form>
      </div>

      {/* Provider-Agnostic AI Adapter Config */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-500" />
          AI Provider Engine & Model Adapters
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          AURA is provider-independent. Switch between offline deterministic demo logic or connect cloud LLMs via API keys.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Active AI Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-violet-500"
            >
              <option value="mock">Local Deterministic Provider (Offline Zero-Key Mode)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
            </select>
          </div>

          {aiProvider !== 'mock' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {aiProvider.toUpperCase()} API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            <span className="font-bold text-cyan-600">Default Mode: </span>
            Local Deterministic Provider is active with full reasoning, category classification, and interview grounding rules enabled. No external API keys required to demonstrate functionality.
          </div>
        </div>
      </div>
    </div>
  );
};
