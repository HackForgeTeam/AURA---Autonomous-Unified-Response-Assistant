import React, { useState } from 'react';
import { Bot, Shield, Camera, Sliders, Activity } from 'lucide-react';
import { AvatarAnchor } from '../components/3d/AvatarAnchor';
import { useAuraState } from '../context/AuraStateContext';

interface VideoAssistantPageProps {
  onOpenSimulator: () => void;
}

export const VideoAssistantPage: React.FC<VideoAssistantPageProps> = ({ onOpenSimulator }) => {
  const { visualState, audioLevel, setVisualState } = useAuraState();
  const [cameraActive, setCameraActive] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<'hologram' | 'synthetic' | 'neural'>('hologram');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">Video Assistant</h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                AURA’s video avatar represents you during incoming video interviews, executive screenings, and high-urgency calls with synchronized audio animation.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSimulator}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:scale-105 transition"
          >
            Launch Avatar Simulation
          </button>
        </div>
      </div>

      {/* Main Grid: Avatar Stage + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Central Avatar Stage (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <AvatarAnchor className="min-h-[380px]" />

          {/* Quick Simulation State Previewer */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Test AI Response Reactions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setVisualState('IDLE')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'IDLE'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                1. Idle State
              </button>
              <button
                onClick={() => setVisualState('INCOMING_CALL')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'INCOMING_CALL'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                2. Incoming Call
              </button>
              <button
                onClick={() => setVisualState('LISTENING')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'LISTENING'
                    ? 'bg-teal-500/20 border-teal-400 text-teal-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                3. Listening
              </button>
              <button
                onClick={() => setVisualState('SPEAKING')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'SPEAKING'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                4. Speaking
              </button>
              <button
                onClick={() => setVisualState('INTERVIEW')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'INTERVIEW'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                5. Interview
              </button>
              <button
                onClick={() => setVisualState('EMERGENCY')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'EMERGENCY'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                6. Emergency
              </button>
              <button
                onClick={() => setVisualState('COMPLETED')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition ${
                  visualState === 'COMPLETED'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                7. Completed
              </button>
              <button
                onClick={() => setVisualState('IDLE')}
                className="p-2.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Deck (1 Column) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Avatar Preferences
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Rendering Aesthetic</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['hologram', 'synthetic', 'neural'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAvatarStyle(mode)}
                      className={`p-2 rounded-xl text-xs font-bold capitalize transition border ${
                        avatarStyle === mode
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-600'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Camera Passthrough (Preview)</label>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                    cameraActive
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  {cameraActive ? 'Disable Local Camera' : 'Enable Local Camera Mirror'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Audio Reaction Sensitivity</span>
                  <span className="font-mono text-cyan-600">{audioLevel || 35}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-150"
                    style={{ width: `${Math.max(10, audioLevel || 35)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              AI Transparency Notice
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with AI safety principles, AURA always identifies itself as an autonomous AI assistant representing the user, and never falsely claims to be a live human video feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
