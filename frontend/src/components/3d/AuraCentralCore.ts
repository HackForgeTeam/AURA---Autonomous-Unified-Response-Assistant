import * as THREE from 'three';
import { AuraVisualState } from '../../types';
import { STATE_PALETTES } from './NeuralParticleField';

export class AuraCentralCore {
  public group: THREE.Group;

  // Meshes
  private innerCoreMesh: THREE.Mesh;
  private coreWireframeMesh: THREE.Mesh;
  private outerHaloMesh: THREE.Mesh;
  private ring1: THREE.Mesh;
  private ring2: THREE.Mesh;
  private ring3: THREE.Mesh;
  private shockwaveRings: THREE.Mesh[] = [];

  // Geometries & Materials
  private innerGeo: THREE.IcosahedronGeometry;
  private innerMat: THREE.MeshPhysicalMaterial;
  private wireGeo: THREE.IcosahedronGeometry;
  private wireMat: THREE.MeshBasicMaterial;
  private ringGeo1: THREE.TorusGeometry;
  private ringGeo2: THREE.TorusGeometry;
  private ringGeo3: THREE.TorusGeometry;
  private ringMat1: THREE.MeshBasicMaterial;
  private ringMat2: THREE.MeshBasicMaterial;
  private ringMat3: THREE.MeshBasicMaterial;

  // Target colors for smooth transitions
  private currentPrimary: THREE.Color;
  private currentSecondary: THREE.Color;

  constructor() {
    this.group = new THREE.Group();

    this.currentPrimary = STATE_PALETTES.IDLE.primary.clone();
    this.currentSecondary = STATE_PALETTES.IDLE.secondary.clone();

    // 1. Inner Luminous Core
    this.innerGeo = new THREE.IcosahedronGeometry(1.5, 4);
    this.innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.75,
      ior: 1.5,
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
      wireframe: false,
    });
    this.innerCoreMesh = new THREE.Mesh(this.innerGeo, this.innerMat);
    this.group.add(this.innerCoreMesh);

    // 2. Wireframe Lattice Overlay
    this.wireGeo = new THREE.IcosahedronGeometry(1.54, 2);
    this.wireMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.coreWireframeMesh = new THREE.Mesh(this.wireGeo, this.wireMat);
    this.group.add(this.coreWireframeMesh);

    // 3. Volumetric Glow Halo
    const haloGeo = new THREE.SphereGeometry(2.1, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 uColor;
        uniform float uIntensity;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(uColor, intensity * uIntensity);
        }
      `,
      uniforms: {
        uColor: { value: new THREE.Color(0x06b6d4) },
        uIntensity: { value: 0.6 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.outerHaloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.group.add(this.outerHaloMesh);

    // 4. Concentric Orbital Gimbal Rings
    this.ringGeo1 = new THREE.TorusGeometry(2.4, 0.022, 16, 120);
    this.ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.ring1 = new THREE.Mesh(this.ringGeo1, this.ringMat1);
    this.group.add(this.ring1);

    this.ringGeo2 = new THREE.TorusGeometry(2.7, 0.018, 16, 120);
    this.ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.ring2 = new THREE.Mesh(this.ringGeo2, this.ringMat2);
    this.ring2.rotation.x = Math.PI / 3;
    this.group.add(this.ring2);

    this.ringGeo3 = new THREE.TorusGeometry(3.1, 0.015, 16, 120);
    this.ringMat3 = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.ring3 = new THREE.Mesh(this.ringGeo3, this.ringMat3);
    this.ring3.rotation.y = Math.PI / 4;
    this.group.add(this.ring3);

    // 5. Expandable Acoustic Shockwave Rings
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.8, 1.86, 64),
        new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.rotation.x = Math.PI / 2;
      this.shockwaveRings.push(ring);
      this.group.add(ring);
    }
  }

  public update(
    time: number,
    state: AuraVisualState,
    audioLevel: number,
    mouseParallax: { x: number; y: number }
  ) {
    const palette = STATE_PALETTES[state] || STATE_PALETTES.IDLE;
    const normAudio = Math.min(1.0, audioLevel / 75);

    // Smooth color transitions
    this.currentPrimary.lerp(palette.primary, 0.08);
    this.currentSecondary.lerp(palette.secondary, 0.08);

    // Update material colors
    this.innerMat.color.copy(this.currentPrimary);
    this.innerMat.emissive.copy(this.currentPrimary);
    this.wireMat.color.copy(this.currentSecondary);
    this.ringMat1.color.copy(this.currentPrimary);
    this.ringMat2.color.copy(this.currentSecondary);
    this.ringMat3.color.copy(palette.accent);

    const haloUniforms = (this.outerHaloMesh.material as THREE.ShaderMaterial).uniforms;
    haloUniforms.uColor.value.copy(this.currentPrimary);

    // Pulsation based on state & audio
    let pulseBase = 0.08;
    let pulseSpeed = 2.0;

    if (state === 'EMERGENCY') {
      pulseSpeed = 6.0; // Rapid alert pulse
      pulseBase = 0.16;
    } else if (state === 'SPEAKING') {
      pulseSpeed = 4.0;
      pulseBase = 0.12;
    } else if (state === 'LISTENING') {
      pulseSpeed = 3.0;
      pulseBase = 0.1;
    }

    const breathing = Math.sin(time * pulseSpeed) * pulseBase + (normAudio * 0.2);
    const coreScale = 1.0 + breathing;

    this.innerCoreMesh.scale.set(coreScale, coreScale, coreScale);
    this.coreWireframeMesh.scale.set(coreScale * 1.02, coreScale * 1.02, coreScale * 1.02);

    // Halo intensity reacts to audio & emergency
    haloUniforms.uIntensity.value = 0.45 + (normAudio * 0.5) + (state === 'EMERGENCY' ? 0.4 : 0);

    // Ring orbital rotations
    const spinFactor = state === 'EMERGENCY' ? 2.5 : state === 'SPEAKING' ? 1.8 : 1.0;
    this.ring1.rotation.z += 0.008 * spinFactor;
    this.ring1.rotation.y += 0.005 * spinFactor;

    this.ring2.rotation.x += 0.007 * spinFactor;
    this.ring2.rotation.z -= 0.006 * spinFactor;

    this.ring3.rotation.y -= 0.009 * spinFactor;
    this.ring3.rotation.x += 0.004 * spinFactor;

    // Core rotational drift
    this.innerCoreMesh.rotation.y += 0.004;
    this.innerCoreMesh.rotation.x += 0.002;
    this.coreWireframeMesh.rotation.y -= 0.003;
    this.coreWireframeMesh.rotation.z += 0.002;

    // Shockwave ripple emission
    const rippleSpeed = 1.6;
    for (let i = 0; i < this.shockwaveRings.length; i++) {
      const ring = this.shockwaveRings[i];
      const offset = (i / this.shockwaveRings.length);
      const progress = ((time * rippleSpeed + offset) % 1.0);

      const rScale = 1.0 + progress * 3.5;
      ring.scale.set(rScale, rScale, rScale);

      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.color.copy(this.currentPrimary);
      // Fade out as it expands
      const triggerStrength = (state === 'SPEAKING' || state === 'INCOMING_CALL' || normAudio > 0.1 || state === 'EMERGENCY') ? 0.7 : 0.15;
      mat.opacity = (1.0 - progress) * triggerStrength;
    }

    // Parallax reaction to mouse
    this.group.position.x = mouseParallax.x * 0.4;
    this.group.position.y = -mouseParallax.y * 0.3;
  }

  public setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  public dispose() {
    this.innerGeo.dispose();
    this.innerMat.dispose();
    this.wireGeo.dispose();
    this.wireMat.dispose();
    this.ringGeo1.dispose();
    this.ringGeo2.dispose();
    this.ringGeo3.dispose();
    this.ringMat1.dispose();
    this.ringMat2.dispose();
    this.ringMat3.dispose();
    for (const r of this.shockwaveRings) {
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    }
  }
}
