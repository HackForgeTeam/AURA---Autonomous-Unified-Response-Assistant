import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuraHeroVisualProps {
  onBadgeClick?: () => void;
}

export const AuraHeroVisual: React.FC<AuraHeroVisualProps> = ({ onBadgeClick }) => {
  return (
    <div className="relative w-full max-w-[560px] lg:max-w-[640px] aspect-square flex items-center justify-center select-none pointer-events-none">
      {/* 1. Volumetric Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl opacity-70 animate-pulse-slow" />
      <div className="absolute w-3/4 h-3/4 bg-blue-600/15 rounded-full blur-[90px] animate-pulse" />

      {/* 2. Watermark Text Behind Lower Section of Ribbon */}
      <div className="absolute bottom-16 inset-x-0 flex flex-col items-center justify-center opacity-25 tracking-[0.25em] z-0 pointer-events-none">
        <span className="text-4xl sm:text-5xl font-black text-slate-400 font-sans tracking-[0.3em]">
          AURA
        </span>
        <span className="text-[10px] sm:text-[11px] font-bold text-cyan-300 uppercase tracking-[0.35em] mt-1">
          YOUR AI CALL ASSISTANT
        </span>
      </div>

      {/* 3. Central Iridescent Ribbon "A" Graphic */}
      <div className="relative z-10 w-full h-full flex items-center justify-center animate-ribbon-float">
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-[0_0_40px_rgba(56,189,248,0.45)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Main Iridescent Gradient */}
            <linearGradient id="ribbonMainGrad" x1="120" y1="60" x2="380" y2="440" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#60a5fa" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.75" />
              <stop offset="75%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
            </linearGradient>

            {/* Specular Highlight Gradient */}
            <linearGradient id="specularGrad" x1="250" y1="50" x2="250" y2="350" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#bae6fd" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>

            {/* Inner Ribbon Shade */}
            <linearGradient id="innerRibbonGrad" x1="180" y1="280" x2="320" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.8" />
            </linearGradient>

            {/* Radiant Star Flare */}
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="30%" stopColor="#67e8f9" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#a855f7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Fluid Cosmic Waves */}
          <path
            d="M 50 300 C 140 220, 320 230, 450 310 C 370 260, 210 240, 50 300 Z"
            fill="url(#ribbonMainGrad)"
            opacity="0.3"
            filter="blur(4px)"
          />

          {/* 3D Iridescent Loop Body of "A" */}
          {/* Left Arch to Apex */}
          <path
            d="M250 70 
               C 210 130, 140 270, 110 345 
               C 95 385, 115 415, 160 395 
               C 200 375, 230 320, 250 265 
               C 270 320, 300 375, 340 395 
               C 385 415, 405 385, 390 345 
               C 360 270, 290 130, 250 70 Z"
            fill="url(#ribbonMainGrad)"
            stroke="url(#specularGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Negative Space Curvature */}
          <path
            d="M250 145 
               C 230 200, 195 285, 175 325 
               C 215 305, 285 305, 325 325 
               C 305 285, 270 200, 250 145 Z"
            fill="#080c1a"
            opacity="0.9"
          />

          {/* Glowing Translucent Crossbar Ribbon */}
          <path
            d="M 175 315 
               C 215 285, 285 285, 325 315 
               C 295 338, 205 338, 175 315 Z"
            fill="url(#innerRibbonGrad)"
            stroke="#67e8f9"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Specular Rim Sheen on Apex */}
          <path
            d="M 235 95 C 245 75, 255 75, 265 95 C 255 110, 245 110, 235 95 Z"
            fill="#ffffff"
            opacity="0.9"
            filter="blur(1px)"
          />

          {/* Central Radiant 4-Pointed Sparkle Star */}
          <g className="animate-star-sparkle">
            {/* Halo Glow */}
            <circle cx="250" cy="235" r="45" fill="url(#starGlow)" />

            {/* Sparkle 4-point Diamond Star */}
            <path
              d="M 250 190 
                 L 256 226 
                 L 295 235 
                 L 256 244 
                 L 250 280 
                 L 244 244 
                 L 205 235 
                 L 244 226 Z"
              fill="#ffffff"
              filter="drop-shadow(0 0 10px #38bdf8)"
            />

            {/* Secondary diagonal sparkle glints */}
            <path
              d="M 250 215 
                 L 253 232 
                 L 270 235 
                 L 253 238 
                 L 250 255 
                 L 247 238 
                 L 230 235 
                 L 247 232 Z"
              fill="#bae6fd"
              opacity="0.75"
            />
          </g>

          {/* Small Ambient Sparkles */}
          <path
            d="M 120 180 L 122 186 L 128 188 L 122 190 L 120 196 L 118 190 L 112 188 L 118 186 Z"
            fill="#38bdf8"
            opacity="0.8"
            className="animate-pulse"
          />
          <path
            d="M 390 190 L 392 195 L 397 197 L 392 199 L 390 204 L 388 199 L 383 197 L 388 195 Z"
            fill="#ec4899"
            opacity="0.85"
            className="animate-pulse"
          />
          <path
            d="M 320 410 L 322 415 L 327 417 L 322 419 L 320 424 L 318 419 L 313 417 L 318 415 Z"
            fill="#67e8f9"
            opacity="0.9"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* 4. Floating Badge: "Let AURA handle it" */}
      <div
        onClick={onBadgeClick}
        className="absolute bottom-16 right-4 sm:right-8 z-20 pointer-events-auto cursor-pointer group"
      >
        <div className="px-4 py-2 rounded-full bg-[#0d152c]/85 border border-cyan-400/40 backdrop-blur-xl shadow-[0_0_20px_rgba(56,189,248,0.35)] flex items-center gap-2 group-hover:border-cyan-300 group-hover:scale-105 transition-all duration-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-semibold text-cyan-100 tracking-wide">
            Let AURA handle it
          </span>
        </div>
      </div>
    </div>
  );
};
