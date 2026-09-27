import React, { useEffect, useState, useRef } from 'react';

export type CursorMode = 'auto' | 'normal' | 'moving' | 'hover' | 'click' | 'clicking';

interface TrailParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
}

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export const AuraSparkCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [trail, setTrail] = useState<TrailParticle[]>([]);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  const lastPosRef = useRef({ x: -100, y: -100 });
  const nextId = useRef(0);
  const magneticElemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // 1. Detect touch device or reduced motion
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    if (touch) {
      setIsTouchDevice(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Hide default system cursor
    document.documentElement.classList.add('aura-custom-cursor-active');

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      const { clientX: x, clientY: y } = e;
      setPos({ x, y });

      // Add tiny energy trail (max 3-5 particles)
      if (!prefersReducedMotion) {
        const dist = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
        if (dist > 6) {
          setTrail((prev) => [
            ...prev.slice(-4),
            {
              id: nextId.current++,
              x: x + (Math.random() - 0.5) * 4,
              y: y + (Math.random() - 0.5) * 4,
              size: Math.random() * 2 + 1.5,
              alpha: 0.7,
            },
          ]);
        }
      }
      lastPosRef.current = { x, y };

      // Check for hover state on interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'button, a, input, select, textarea, [role="button"], .cursor-pointer, .interactive-hover'
        ) as HTMLElement | null;

        if (interactive) {
          setIsHovered(true);

          // Magnetic button effect: subtle 2-5px attraction
          if (interactive.tagName === 'BUTTON' || interactive.getAttribute('role') === 'button') {
            magneticElemRef.current = interactive;
            const rect = interactive.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const pullX = Math.max(-4, Math.min(4, (x - centerX) * 0.1));
            const pullY = Math.max(-4, Math.min(4, (y - centerY) * 0.1));
            interactive.style.transform = `translate(${pullX}px, ${pullY}px)`;
            interactive.style.transition = 'transform 0.15s ease-out';
          }
        } else {
          setIsHovered(false);
          if (magneticElemRef.current) {
            magneticElemRef.current.style.transform = '';
            magneticElemRef.current = null;
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      if (!prefersReducedMotion) {
        setRipples((prev) => [
          ...prev.slice(-2),
          { id: nextId.current++, x: e.clientX, y: e.clientY },
        ]);
      }
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      if (magneticElemRef.current) {
        magneticElemRef.current.style.transform = '';
        magneticElemRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.documentElement.classList.remove('aura-custom-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (magneticElemRef.current) {
        magneticElemRef.current.style.transform = '';
      }
    };
  }, []);

  // Trail fade animation loop (60fps)
  useEffect(() => {
    if (trail.length === 0 && ripples.length === 0) return;
    const interval = setInterval(() => {
      setTrail((prev) =>
        prev
          .map((p) => ({ ...p, alpha: p.alpha - 0.14, size: p.size * 0.9 }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 28);
    return () => clearInterval(interval);
  }, [trail.length, ripples.length]);

  // Clean up ripples after 400ms
  useEffect(() => {
    if (ripples.length === 0) return;
    const timeout = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 400);
    return () => clearTimeout(timeout);
  }, [ripples]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* 1. Energy Trail Particles */}
      {trail.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.alpha,
            background: 'radial-gradient(circle, #00D9FF 0%, rgba(139, 92, 246, 0.5) 100%)',
            boxShadow: '0 0 6px rgba(0, 217, 255, 0.8)',
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.1s linear',
          }}
        />
      ))}

      {/* 2. Click Expanding Ripple Rings (300-400ms) */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute rounded-full border border-cyan-400/80 animate-ping pointer-events-none"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: '28px',
            height: '28px',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 12px rgba(0, 217, 255, 0.6)',
          }}
        />
      ))}

      {/* 3. Main ✦ AURA SPARK Cursor */}
      <div
        className="absolute pointer-events-none will-change-transform"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: `translate(-50%, -50%) scale(${isClicking ? 0.85 : isHovered ? 1.25 : 1})`,
          transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* Hover State: Soft Circular Halo Ring */}
          {isHovered && (
            <div
              className="absolute w-8 h-8 rounded-full border border-cyan-400/40 bg-cyan-500/10 backdrop-blur-[1px] animate-pulse"
              style={{
                boxShadow: '0 0 14px rgba(0, 217, 255, 0.5), inset 0 0 8px rgba(139, 92, 246, 0.3)',
              }}
            />
          )}

          {/* Click State Flash Glow */}
          {isClicking && (
            <div className="absolute w-6 h-6 rounded-full bg-white/40 blur-sm" />
          )}

          {/* Four-Point AURA Sparkle SVG (✦) - 14-18px */}
          <svg
            className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,217,255,0.9)]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {/* Elegant curved 4-pointed diamond star */}
            <path
              d="M12 0 C12 7.5 16.5 12 24 12 C16.5 12 12 16.5 12 24 C12 16.5 7.5 12 0 12 C7.5 12 12 7.5 12 0 Z"
              fill="url(#sparkGrad)"
            />
            <defs>
              <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#00D9FF" />
                <stop offset="85%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#D946EF" />
              </radialGradient>
            </defs>
          </svg>

          {/* Bright center core pinhead */}
          <span className="absolute w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
        </div>
      </div>
    </div>
  );
};
