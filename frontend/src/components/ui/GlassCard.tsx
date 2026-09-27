import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glow' | 'accent' | 'emergency';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverEffect = true,
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emergency':
        return 'bg-gradient-to-b from-rose-950/40 via-slate-950/60 to-slate-950/70 border-rose-500/40 shadow-rose-950/30';
      case 'accent':
        return 'bg-gradient-to-b from-cyan-950/30 via-slate-950/60 to-slate-950/70 border-cyan-500/30 shadow-cyan-950/20';
      case 'glow':
        return 'bg-gradient-to-b from-violet-950/30 via-slate-950/60 to-slate-950/70 border-violet-500/30 shadow-violet-950/20';
      default:
        return 'bg-slate-950/45 border-white/[0.08] shadow-black/40';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-xl overflow-hidden ${getVariantStyles()} ${
        hoverEffect ? 'hover:border-white/20 hover:shadow-2xl hover:-translate-y-0.5' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        boxShadow:
          '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
      }}
    >
      {/* Top Specular Rim */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {children}
    </div>
  );
};
