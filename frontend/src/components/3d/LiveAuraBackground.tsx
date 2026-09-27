import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  z: number; // 0 = background, 1 = midground, 2 = foreground
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  vx: number;
  vy: number;
  twinkleSpeed: number;
  twinklePhase: number;
}


export const LiveAuraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates and smooth lerp targets
    const mouse = {
      x: width * 0.5,
      y: height * 0.4,
      targetX: width * 0.5,
      targetY: height * 0.4,
      normX: 0, // -1 to 1
      normY: 0,
      targetNormX: 0,
      targetNormY: 0,
    };

    // Scroll parallax tracking
    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.targetNormX = (e.clientX / width) * 2 - 1;
      mouse.targetNormY = (e.clientY / height) * 2 - 1;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Determine particle count based on screen size
    // Desktop: 80-140 | Tablet: 40-80 | Mobile: 20-40
    const getParticleCount = () => {
      if (width < 640) return 32;
      if (width < 1024) return 65;
      return 110;
    };

    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const count = getParticleCount();
      const colors = [
          'rgba(8, 145, 178, ',   // cyan-600 — readable on light bg
          'rgba(8, 145, 178, ',
          'rgba(99, 102, 241, ',  // indigo-500
          'rgba(59, 130, 246, ',  // blue-500
          'rgba(124, 58, 237, ',  // violet-600
        ];

      for (let i = 0; i < count; i++) {
        // Distribute across 3 depth layers: 0: bg (50%), 1: mid (35%), 2: fg (15%)
        const rand = Math.random();
        const z = rand < 0.5 ? 0 : rand < 0.85 ? 1 : 2;

        let size: number;
        let baseAlpha: number;
        let speedMult: number;

        if (z === 0) {
          // Tiny stars, almost no movement
          size = Math.random() * 1.0 + 0.6;
          baseAlpha = Math.random() * 0.45 + 0.25;
          speedMult = 0.08;
        } else if (z === 1) {
          // Midground: slightly larger, slow movement
          size = Math.random() * 1.4 + 1.1;
          baseAlpha = Math.random() * 0.5 + 0.35;
          speedMult = 0.18;
        } else {
          // Foreground: brighter, responsive to parallax
          size = Math.random() * 1.8 + 1.6;
          baseAlpha = Math.random() * 0.4 + 0.55;
          speedMult = 0.32;
        }

        const x = Math.random() * width;
        const y = Math.random() * height;
        const colorPrefix = colors[Math.floor(Math.random() * colors.length)];

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          z,
          size,
          alpha: baseAlpha,
          baseAlpha,
          color: colorPrefix,
          vx: (Math.random() - 0.5) * speedMult,
          vy: (Math.random() - 0.5) * speedMult - 0.05 * speedMult,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    // Time tracker
    let time = 0;
    let animationFrameId: number;

    // Helper: Draw the Large 3D Holographic AURA Logo Emblem in Background
    const drawLargeAuraLogo = (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      scale: number,
      tiltX: number,
      tiltY: number,
      t: number
    ) => {
      ctx.save();
      ctx.translate(centerX, centerY);

      // Subtle slow floating & 3D tilt
      const floatY = Math.sin(t * 0.3) * 12;
      const floatX = Math.cos(t * 0.2) * 6;
      ctx.translate(floatX, floatY);

      // Mouse Parallax tilt (subtle perspective skew & rotation)
      const rot = Math.sin(t * 0.15) * 0.02 + tiltX * 0.04;
      ctx.rotate(rot);
      ctx.scale(scale * (1 + tiltY * 0.02), scale);

      // Logo bounds: ~400 x 400
      ctx.translate(-200, -200);

      // 1. Soft Ambient Outer Holographic Glow (breathing)
      const breathe = (Math.sin(t * 0.4) + 1) * 0.5;
      const outerGlow = ctx.createRadialGradient(200, 200, 30, 200, 200, 260);
      outerGlow.addColorStop(0, `rgba(8, 145, 178, ${0.06 + breathe * 0.03})`);
      outerGlow.addColorStop(0.5, `rgba(124, 58, 237, ${0.04 + breathe * 0.02})`);
      outerGlow.addColorStop(1, 'rgba(240, 244, 255, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(200, 200, 260, 0, Math.PI * 2);
      ctx.fill();

      // 2. Large Iridescent Ribbon "A" Outline Path
      ctx.save();
      ctx.beginPath();
      // Outer Arch of "A"
      ctx.moveTo(200, 40);
      ctx.bezierCurveTo(165, 95, 105, 220, 80, 285);
      ctx.bezierCurveTo(68, 320, 85, 345, 125, 330);
      ctx.bezierCurveTo(160, 312, 185, 265, 200, 220);
      ctx.bezierCurveTo(215, 265, 240, 312, 275, 330);
      ctx.bezierCurveTo(315, 345, 332, 320, 320, 285);
      ctx.bezierCurveTo(295, 220, 235, 95, 200, 40);
      ctx.closePath();

      // Iridescent Holographic Linear Gradient
      const grad = ctx.createLinearGradient(80, 40, 320, 340);
      grad.addColorStop(0, `rgba(0, 217, 255, ${0.12 + breathe * 0.03})`);
      grad.addColorStop(0.35, `rgba(59, 130, 246, ${0.09 + breathe * 0.02})`);
      grad.addColorStop(0.7, `rgba(139, 92, 246, ${0.11 + breathe * 0.03})`);
      grad.addColorStop(1, `rgba(217, 70, 239, ${0.10 + breathe * 0.02})`);

      ctx.fillStyle = grad;
      ctx.fill();

      // Specular Glass Edge Reflection
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.14 + breathe * 0.04})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner Negative Space Arch
      ctx.beginPath();
      ctx.moveTo(200, 105);
      ctx.bezierCurveTo(185, 150, 155, 225, 140, 260);
      ctx.bezierCurveTo(175, 242, 225, 242, 260, 260);
      ctx.bezierCurveTo(245, 225, 215, 150, 200, 105);
      ctx.closePath();
      ctx.fillStyle = 'rgba(240, 244, 255, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(8, 145, 178, 0.10)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner Ribbon Crossbar
      ctx.beginPath();
      ctx.moveTo(140, 252);
      ctx.bezierCurveTo(175, 230, 225, 230, 260, 252);
      ctx.bezierCurveTo(235, 270, 165, 270, 140, 252);
      ctx.closePath();
      const barGrad = ctx.createLinearGradient(140, 240, 260, 260);
      barGrad.addColorStop(0, 'rgba(0, 217, 255, 0.18)');
      barGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.18)');
      barGrad.addColorStop(1, 'rgba(217, 70, 239, 0.15)');
      ctx.fillStyle = barGrad;
      ctx.fill();

      // 3. Central 4-Point Radiant Sparkle Star at Core
      const starX = 200;
      const starY = 185;
      const starSize = 24 + breathe * 4;

      ctx.beginPath();
      ctx.moveTo(starX, starY - starSize);
      ctx.quadraticCurveTo(starX, starY, starX + starSize, starY);
      ctx.quadraticCurveTo(starX, starY, starX, starY + starSize);
      ctx.quadraticCurveTo(starX, starY, starX - starSize, starY);
      ctx.quadraticCurveTo(starX, starY, starX, starY - starSize);
      ctx.closePath();

      const starGrad = ctx.createRadialGradient(starX, starY, 2, starX, starY, starSize);
      starGrad.addColorStop(0, `rgba(255, 255, 255, ${0.28 + breathe * 0.08})`);
      starGrad.addColorStop(0.5, `rgba(0, 217, 255, ${0.16 + breathe * 0.05})`);
      starGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = starGrad;
      ctx.fill();

      ctx.restore();
      ctx.restore();
    };

    // Helper: Draw Flowing 3D AURA Light Ribbons
    const drawLightRibbons = (
      ctx: CanvasRenderingContext2D,
      t: number,
      tiltX: number,
      scrollYOffset: number
    ) => {
      ctx.save();

      // Ribbon 1: Cyan-Blue Main Diagonal Flow
      const yBase1 = height * 0.45 - scrollYOffset * 0.3;
      ctx.beginPath();
      ctx.moveTo(-100, yBase1 + Math.sin(t * 0.4) * 40);

      ctx.bezierCurveTo(
        width * 0.25 + tiltX * 40,
        yBase1 - 80 + Math.cos(t * 0.3) * 60,
        width * 0.65 - tiltX * 40,
        yBase1 + 70 + Math.sin(t * 0.35 + 1) * 70,
        width + 100,
        yBase1 - 30 + Math.cos(t * 0.4 + 2) * 50
      );

      const ribbonGrad1 = ctx.createLinearGradient(0, yBase1 - 100, width, yBase1 + 100);
      ribbonGrad1.addColorStop(0, 'rgba(0, 217, 255, 0)');
      ribbonGrad1.addColorStop(0.3, 'rgba(0, 217, 255, 0.07)');
      ribbonGrad1.addColorStop(0.65, 'rgba(59, 130, 246, 0.06)');
      ribbonGrad1.addColorStop(0.9, 'rgba(139, 92, 246, 0.05)');
      ribbonGrad1.addColorStop(1, 'rgba(139, 92, 246, 0)');

      ctx.strokeStyle = ribbonGrad1;
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Subtle thin core stream inside ribbon 1
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.12)';
      ctx.stroke();

      // Ribbon 2: Violet-Pink Secondary Counter-Flow
      const yBase2 = height * 0.65 - scrollYOffset * 0.25;
      ctx.beginPath();
      ctx.moveTo(-80, yBase2 + Math.cos(t * 0.35) * 50);

      ctx.bezierCurveTo(
        width * 0.35 - tiltX * 30,
        yBase2 + 60 + Math.sin(t * 0.25) * 50,
        width * 0.7 + tiltX * 30,
        yBase2 - 70 + Math.cos(t * 0.3 + 1.5) * 60,
        width + 80,
        yBase2 + 40 + Math.sin(t * 0.35 + 3) * 40
      );

      const ribbonGrad2 = ctx.createLinearGradient(0, yBase2 - 80, width, yBase2 + 80);
      ribbonGrad2.addColorStop(0, 'rgba(139, 92, 246, 0)');
      ribbonGrad2.addColorStop(0.35, 'rgba(139, 92, 246, 0.06)');
      ribbonGrad2.addColorStop(0.7, 'rgba(217, 70, 239, 0.05)');
      ribbonGrad2.addColorStop(1, 'rgba(0, 217, 255, 0)');

      ctx.strokeStyle = ribbonGrad2;
      ctx.lineWidth = 45;
      ctx.stroke();

      ctx.restore();
    };

    // Main Render Loop
    const render = () => {
      // Smooth interpolation (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;
      mouse.normX += (mouse.targetNormX - mouse.normX) * 0.05;
      mouse.normY += (mouse.targetNormY - mouse.normY) * 0.05;
      scrollY += (targetScrollY - scrollY) * 0.08;

      if (!prefersReducedMotion) {
        time += 0.016;
      }

      // 1. Light Base Background
      ctx.fillStyle = '#f0f4ff';
      ctx.fillRect(0, 0, width, height);

      // 2. Atmospheric Ambient Light Pools (subtle on light bg)
      const glow1X = width * 0.3 + mouse.normX * 50;
      const glow1Y = height * 0.35 + mouse.normY * 40;
      const radGlow1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, width * 0.65);
      radGlow1.addColorStop(0, 'rgba(8, 145, 178, 0.06)');
      radGlow1.addColorStop(0.4, 'rgba(99, 102, 241, 0.04)');
      radGlow1.addColorStop(0.8, 'rgba(124, 58, 237, 0.02)');
      radGlow1.addColorStop(1, 'rgba(240, 244, 255, 0)');
      ctx.fillStyle = radGlow1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = width * 0.7 - mouse.normX * 40;
      const glow2Y = height * 0.6 - mouse.normY * 30;
      const radGlow2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, width * 0.55);
      radGlow2.addColorStop(0, 'rgba(124, 58, 237, 0.05)');
      radGlow2.addColorStop(0.5, 'rgba(217, 70, 239, 0.03)');
      radGlow2.addColorStop(1, 'rgba(240, 244, 255, 0)');
      ctx.fillStyle = radGlow2;
      ctx.fillRect(0, 0, width, height);

      // 3. Large 3D Holographic AURA Logo Emblem in Background
      // Positioned around center/right of the hero section
      const logoCenterX = width > 1024 ? width * 0.64 + mouse.normX * 25 : width * 0.5 + mouse.normX * 15;
      const logoCenterY = height * 0.42 - scrollY * 0.1 + mouse.normY * 20;
      const logoScale = width < 640 ? 0.75 : width < 1024 ? 1.0 : 1.35;

      drawLargeAuraLogo(
        ctx,
        logoCenterX,
        logoCenterY,
        logoScale,
        mouse.normX,
        mouse.normY,
        time
      );

      // 4. Flowing 3D AURA Light Ribbons
      drawLightRibbons(ctx, time, mouse.normX, scrollY);

      // 5. Live Particle & Star System (with 3-layer depth parallax and cursor reactivity)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Parallax offset based on depth layer z
        const parallaxFactor = p.z === 0 ? 0.08 : p.z === 1 ? 0.2 : 0.35;
        const scrollOffset = scrollY * (p.z === 0 ? 0.05 : p.z === 1 ? 0.15 : 0.25);
        const drawX = p.x + mouse.normX * 35 * parallaxFactor;
        const drawY = ((p.y - scrollOffset) % height + height) % height + mouse.normY * 25 * parallaxFactor;

        // Cursor interaction: nearby particles gently react
        const dx = drawX - mouse.x;
        const dy = drawY - mouse.y;
        const dist = Math.hypot(dx, dy);

        let finalAlpha = p.baseAlpha;
        let finalSize = p.size;
        let reactiveOffsetX = 0;
        let reactiveOffsetY = 0;

        if (dist < 90) {
          const force = (1 - dist / 90) * 8;
          reactiveOffsetX = (dx / (dist || 1)) * force;
          reactiveOffsetY = (dy / (dist || 1)) * force;
          finalAlpha = Math.min(1, p.baseAlpha + 0.35 * (1 - dist / 90));
          finalSize = p.size * (1 + 0.3 * (1 - dist / 90));
        }

        // Soft twinkle
        if (!prefersReducedMotion) {
          const twinkle = Math.sin(time * 2 + p.twinklePhase) * 0.2;
          finalAlpha = Math.max(0.1, Math.min(1, finalAlpha + twinkle));
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(drawX + reactiveOffsetX, drawY + reactiveOffsetY, finalSize, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${finalAlpha})`;
        ctx.fill();

        // Subtle soft glow on foreground particles
        if (p.z === 2 && finalAlpha > 0.4) {
          ctx.beginPath();
          ctx.arc(drawX + reactiveOffsetX, drawY + reactiveOffsetY, finalSize * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${finalAlpha * 0.2})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none -z-10 block"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f0f4ff',
      }}
    />
  );
};
