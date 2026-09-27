import * as THREE from 'three';
import { AuraVisualState } from '../../types';

export interface StatePalette {
  primary: THREE.Color;
  secondary: THREE.Color;
  accent: THREE.Color;
  speedMultiplier: number;
  attractorStrength: number;
}

export const STATE_PALETTES: Record<AuraVisualState, StatePalette> = {
  IDLE: {
    primary: new THREE.Color(0x06b6d4), // Cyan
    secondary: new THREE.Color(0x8b5cf6), // Violet
    accent: new THREE.Color(0x3b82f6), // Blue
    speedMultiplier: 0.5,
    attractorStrength: 0.05,
  },
  INCOMING_CALL: {
    primary: new THREE.Color(0xf59e0b), // Amber
    secondary: new THREE.Color(0x06b6d4), // Cyan
    accent: new THREE.Color(0xfbbf24), // Gold
    speedMultiplier: 1.2,
    attractorStrength: 0.45,
  },
  LISTENING: {
    primary: new THREE.Color(0x14b8a6), // Teal
    secondary: new THREE.Color(0x38bdf8), // Sky
    accent: new THREE.Color(0x06b6d4), // Cyan
    speedMultiplier: 0.7,
    attractorStrength: 0.2,
  },
  SPEAKING: {
    primary: new THREE.Color(0x2563eb), // Electric Blue
    secondary: new THREE.Color(0x10b981), // Emerald
    accent: new THREE.Color(0x06b6d4), // Cyan
    speedMultiplier: 1.4,
    attractorStrength: -0.15, // Wave ripple outwards
  },
  INTERVIEW: {
    primary: new THREE.Color(0x9333ea), // Royal Purple
    secondary: new THREE.Color(0x6366f1), // Indigo
    accent: new THREE.Color(0xc084fc), // Lavender
    speedMultiplier: 0.6,
    attractorStrength: 0.1,
  },
  EMERGENCY: {
    primary: new THREE.Color(0xef4444), // Crimson
    secondary: new THREE.Color(0xf43f5e), // Rose Flare
    accent: new THREE.Color(0xff0055), // Bright Red
    speedMultiplier: 2.4,
    attractorStrength: 0.35,
  },
  COMPLETED: {
    primary: new THREE.Color(0x10b981), // Mint Emerald
    secondary: new THREE.Color(0x06b6d4), // Cyan
    accent: new THREE.Color(0x34d399), // Green
    speedMultiplier: 0.6,
    attractorStrength: -0.08,
  },
};

export class NeuralParticleField {
  public group: THREE.Group;
  private particleCount: number = 1400;
  private particleGeo: THREE.BufferGeometry;
  private particleMaterial: THREE.PointsMaterial;
  private points: THREE.Points;

  // Synaptic Lines
  private lineGeo: THREE.BufferGeometry;
  private lineMaterial: THREE.LineBasicMaterial;
  private lines: THREE.LineSegments;
  private maxLineConnections: number = 350;

  // Simulation buffers
  private positions: Float32Array;
  private velocities: Float32Array;
  private originalPositions: Float32Array;
  private colors: Float32Array;
  private linePositions: Float32Array;
  private lineColors: Float32Array;

  // Color lerping
  private currentPrimary: THREE.Color;
  private currentSecondary: THREE.Color;

  constructor() {
    this.group = new THREE.Group();

    this.currentPrimary = STATE_PALETTES.IDLE.primary.clone();
    this.currentSecondary = STATE_PALETTES.IDLE.secondary.clone();

    // 1. Initialize Particle Buffers
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.originalPositions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);

    const radius = 18;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      // Spherical distribution with density gradient
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * radius + 1.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = (r * Math.cos(phi)) * 0.7; // Slightly flattened spatial disk

      this.positions[idx] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;

      this.originalPositions[idx] = x;
      this.originalPositions[idx + 1] = y;
      this.originalPositions[idx + 2] = z;

      this.velocities[idx] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 1] = (Math.random() - 0.5) * 0.02;
      this.velocities[idx + 2] = (Math.random() - 0.5) * 0.02;

      // Initial color mix
      const mixRatio = Math.random();
      const c = this.currentPrimary.clone().lerp(this.currentSecondary, mixRatio);
      this.colors[idx] = c.r;
      this.colors[idx + 1] = c.g;
      this.colors[idx + 2] = c.b;
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Circle texture for soft glowing particles
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
      gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.particleGeo, this.particleMaterial);
    this.group.add(this.points);

    // 2. Synaptic Line Segments
    this.linePositions = new Float32Array(this.maxLineConnections * 2 * 3);
    this.lineColors = new Float32Array(this.maxLineConnections * 2 * 3);

    this.lineGeo = new THREE.BufferGeometry();
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
    this.lineGeo.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lines = new THREE.LineSegments(this.lineGeo, this.lineMaterial);
    this.group.add(this.lines);
  }

  public update(
    time: number,
    state: AuraVisualState,
    audioLevel: number,
    mouseParallax: { x: number; y: number }
  ) {
    const palette = STATE_PALETTES[state] || STATE_PALETTES.IDLE;
    const speed = palette.speedMultiplier;
    const attractor = palette.attractorStrength;
    const normalizedAudio = (audioLevel / 100) * 1.5;

    // Smoothly lerp colors
    this.currentPrimary.lerp(palette.primary, 0.05);
    this.currentSecondary.lerp(palette.secondary, 0.05);

    const posAttr = this.particleGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = this.particleGeo.attributes.color as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const colors = colAttr.array as Float32Array;

    let lineVertexIndex = 0;
    const linePos = this.lineGeo.attributes.position.array as Float32Array;
    const lineCol = this.lineGeo.attributes.color.array as Float32Array;

    // Update particles
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      let px = positions[idx];
      let py = positions[idx + 1];
      let pz = positions[idx + 2];

      const ox = this.originalPositions[idx];
      const oy = this.originalPositions[idx + 1];
      const oz = this.originalPositions[idx + 2];

      // Subtle orbital flow + oscillation
      const angle = 0.001 * speed;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const nx = px * cosA - pz * sinA;
      const nz = px * sinA + pz * cosA;
      px = nx;
      pz = nz;

      // Wave pulsation driven by audio
      const distFromCenter = Math.sqrt(px * px + py * py + pz * pz);
      if (normalizedAudio > 0.05) {
        const wave = Math.sin(distFromCenter * 0.8 - time * 6.0) * normalizedAudio * 0.15;
        px += (px / (distFromCenter || 1)) * wave;
        py += (py / (distFromCenter || 1)) * wave;
        pz += (pz / (distFromCenter || 1)) * wave;
      }

      // Attractor towards center during call events
      if (Math.abs(attractor) > 0.01) {
        px += -px * attractor * 0.004;
        py += -py * attractor * 0.004;
        pz += -pz * attractor * 0.004;
      }

      // Restore boundary limits
      const maxR = 22;
      if (distFromCenter > maxR || distFromCenter < 1.0) {
        px = ox * (0.8 + Math.random() * 0.4);
        py = oy * (0.8 + Math.random() * 0.4);
        pz = oz * (0.8 + Math.random() * 0.4);
      }

      positions[idx] = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;

      // Update particle colors
      const mixRatio = Math.sin(time * 0.5 + i * 0.01) * 0.5 + 0.5;
      const c = this.currentPrimary.clone().lerp(this.currentSecondary, mixRatio);
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;

      // Connect neighbor lines (sampled for high performance)
      if (lineVertexIndex < this.maxLineConnections * 6 && i % 4 === 0) {
        for (let j = i + 1; j < Math.min(i + 12, this.particleCount); j++) {
          const jdx = j * 3;
          const dx = px - positions[jdx];
          const dy = py - positions[jdx + 1];
          const dz = pz - positions[jdx + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < 3.2 && lineVertexIndex < this.maxLineConnections * 6) {
            linePos[lineVertexIndex] = px;
            linePos[lineVertexIndex + 1] = py;
            linePos[lineVertexIndex + 2] = pz;

            lineCol[lineVertexIndex] = c.r * 0.8;
            lineCol[lineVertexIndex + 1] = c.g * 0.8;
            lineCol[lineVertexIndex + 2] = c.b * 0.8;
            lineVertexIndex += 3;

            linePos[lineVertexIndex] = positions[jdx];
            linePos[lineVertexIndex + 1] = positions[jdx + 1];
            linePos[lineVertexIndex + 2] = positions[jdx + 2];

            lineCol[lineVertexIndex] = c.r * 0.4;
            lineCol[lineVertexIndex + 1] = c.g * 0.4;
            lineCol[lineVertexIndex + 2] = c.b * 0.4;
            lineVertexIndex += 3;
          }
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    this.lineGeo.setDrawRange(0, lineVertexIndex / 3);
    (this.lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.lineGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    // Gentle camera parallax
    this.group.rotation.y = mouseParallax.x * 0.2 + time * 0.03 * speed;
    this.group.rotation.x = -mouseParallax.y * 0.15;
  }

  public dispose() {
    this.particleGeo.dispose();
    this.particleMaterial.dispose();
    this.lineGeo.dispose();
    this.lineMaterial.dispose();
  }
}
