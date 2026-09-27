import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAuraState } from '../../context/AuraStateContext';
import { NeuralParticleField } from './NeuralParticleField';

interface AuraUniverseCanvasProps {
  className?: string;
}

export const AuraUniverseCanvas: React.FC<AuraUniverseCanvasProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { visualState, audioLevel } = useAuraState();

  // Keep state refs updated for requestAnimationFrame loop
  const stateRef = useRef(visualState);
  stateRef.current = visualState;

  const audioLevelRef = useRef(audioLevel);
  audioLevelRef.current = audioLevel;

  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.025);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 12;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0d14, 1);
    container.appendChild(renderer.domElement);

    // 3. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 2.5, 25);
    pointLight1.position.set(5, 5, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 2, 25);
    pointLight2.position.set(-5, -4, 4);
    scene.add(pointLight2);

    // 4. Live Moving Neural Particle Field (Active live moving dots)
    const particleField = new NeuralParticleField();
    scene.add(particleField.group);

    // 5. Mouse Parallax Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        clock.getDelta();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const currentParallax = {
        x: mouseRef.current.x,
        y: mouseRef.current.y,
      };

      // Update live moving dots (particles & synaptic connections)
      particleField.update(
        elapsedTime,
        stateRef.current,
        audioLevelRef.current,
        currentParallax
      );

      // Camera gentle dynamic breathing
      camera.position.x = currentParallax.x * 0.4;
      camera.position.y = -currentParallax.y * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      particleField.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
