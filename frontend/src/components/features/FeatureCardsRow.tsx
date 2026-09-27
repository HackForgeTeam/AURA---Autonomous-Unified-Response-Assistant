import React from 'react';
import { Phone, Brain, Settings, ShieldCheck } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  glowColor: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  glowColor,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-5 bg-white border border-slate-200 hover:border-cyan-400/60 transition-all duration-300 shadow-md hover:shadow-[0_8px_24px_rgba(8,145,178,0.15)] cursor-pointer select-none`}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container with glowing background */}
        <div
          className={`p-3 rounded-xl ${glowColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}
        >
          {icon}
        </div>

        {/* Text Details */}
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 tracking-wide group-hover:text-cyan-600 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardsRowProps {
  onCardClick?: (featureId: string) => void;
}

export const FeatureCardsRow: React.FC<FeatureCardsRowProps> = ({ onCardClick }) => {
  const features = [
    {
      id: 'calls',
      title: 'Answers Calls',
      description: 'Never miss an important call again.',
      glowColor: 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      id: 'understands',
      title: 'Understands',
      description: 'Powered by advanced AI models.',
      glowColor: 'bg-purple-500/15 border border-purple-400/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: 'tasks',
      title: 'Handles Tasks',
      description: 'Schedules, filters, and manages calls.',
      glowColor: 'bg-teal-500/15 border border-teal-400/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'focused',
      title: 'Keeps You Focused',
      description: 'So you can do what matters most.',
      glowColor: 'bg-blue-500/15 border border-blue-400/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6">
      {features.map((feat) => (
        <FeatureCard
          key={feat.id}
          icon={feat.icon}
          title={feat.title}
          description={feat.description}
          glowColor={feat.glowColor}
          onClick={() => onCardClick?.(feat.id)}
        />
      ))}
    </div>
  );
};
