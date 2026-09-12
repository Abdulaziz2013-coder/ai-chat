import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarMood, ModelStyle } from '../types';
import { Sparkles, RefreshCw, Layers, Volume2, ShieldCheck } from 'lucide-react';

interface ThreeAvatarProps {
  mood: AvatarMood;
  isSpeaking: boolean;
  modelStyle: ModelStyle;
  onModelStyleChange: (style: ModelStyle) => void;
}

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({
  mood,
  isSpeaking,
  modelStyle,
  onModelStyleChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);

  // References for mutable animation objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const eyesGroupRef = useRef<THREE.Group | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const ringsRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse tracking
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const manualRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 2.5);
    fillLight.position.set(-5, -2, 2);
    scene.add(fillLight);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 4, 15);
    cyanPoint.position.set(0, 0, 2);
    scene.add(cyanPoint);

    const goldPoint = new THREE.PointLight(0xf59e0b, 2, 10);
    goldPoint.position.set(0, -2, 3);
    scene.add(goldPoint);

    lightsRef.current = [cyanPoint, goldPoint];

    // 5. Build Model
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    mainGroupRef.current = rootGroup;

    // Create 3D particles background vortex
    const particleCount = 650;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePositions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const color = new THREE.Color(Math.random() > 0.4 ? 0x38bdf8 : 0x818cf8);
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Build specific Avatar geometry based on style
    buildAvatarModel(rootGroup, modelStyle);

    // 6. ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Mouse and Pointer tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePos.current.targetX = x;
      mousePos.current.targetY = y;

      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        manualRotation.current.y += deltaX * 0.008;
        manualRotation.current.x += deltaY * 0.008;
        manualRotation.current.x = Math.max(-0.6, Math.min(0.6, manualRotation.current.x));
      }
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Touch support
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
        mousePos.current.targetX = x;
        mousePos.current.targetY = y;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('touchmove', handleTouchMove);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Smooth mouse interpolation
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.06;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.06;

      // Rotate particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.08;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.04) * 0.1;
      }

      // Animate main avatar root
      if (rootGroup) {
        // Floating / levitation oscillation
        const floatY = Math.sin(elapsedTime * 1.8) * 0.12;
        rootGroup.position.y = floatY;

        // Head tracking mouse + manual drag
        const targetRotY = manualRotation.current.y + mousePos.current.x * 0.45;
        const targetRotX = manualRotation.current.x - mousePos.current.y * 0.35;
        rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
        rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;

        // Dynamic tilt based on mood
        if (mood === 'thinking') {
          rootGroup.rotation.z = Math.sin(elapsedTime * 3) * 0.08 + 0.1;
        } else if (mood === 'proud') {
          rootGroup.position.y = floatY + 0.15;
          rootGroup.rotation.z = Math.sin(elapsedTime * 2.5) * 0.03;
        } else {
          rootGroup.rotation.z = Math.sin(elapsedTime * 1.2) * 0.02;
        }
      }

      // Orbiting gyroscopic rings
      if (ringsRef.current) {
        ringsRef.current.children.forEach((ring, idx) => {
          const speedMultiplier = mood === 'thinking' ? 3.2 : mood === 'speaking' ? 2.0 : 1.0;
          ring.rotation.x += 0.012 * (idx + 1) * speedMultiplier;
          ring.rotation.y += 0.016 * (idx + 1) * speedMultiplier;
          ring.rotation.z += 0.009 * (idx + 1) * speedMultiplier;
        });
      }

      // Blinking eyes animation
      blinkTimer += 0.016;
      if (blinkTimer > 3.8) {
        isBlinking = true;
        if (blinkTimer > 4.0) {
          isBlinking = false;
          blinkTimer = Math.random() * 1.5; // randomize interval
        }
      }

      if (eyesGroupRef.current) {
        const eyeScaleY = isBlinking ? 0.08 : 1.0;
        eyesGroupRef.current.scale.y += (eyeScaleY - eyesGroupRef.current.scale.y) * 0.35;
      }

      // Mouth animation when speaking
      if (mouthRef.current) {
        if (isSpeaking) {
          const mouthOpen = 0.2 + Math.abs(Math.sin(elapsedTime * 16)) * 0.9;
          mouthRef.current.scale.y = mouthOpen;
          mouthRef.current.scale.x = 1.0 + Math.sin(elapsedTime * 12) * 0.2;
        } else {
          mouthRef.current.scale.y = 0.15;
          mouthRef.current.scale.x = 1.0;
        }
      }

      // Dynamic light pulsing according to mood
      if (lightsRef.current[0]) {
        if (mood === 'speaking') {
          lightsRef.current[0].intensity = 4.5 + Math.sin(elapsedTime * 14) * 2.0;
          lightsRef.current[0].color.setHex(0x00f0ff);
        } else if (mood === 'thinking') {
          lightsRef.current[0].intensity = 3.5 + Math.sin(elapsedTime * 6) * 1.5;
          lightsRef.current[0].color.setHex(0xa855f7); // purple
        } else if (mood === 'proud') {
          lightsRef.current[0].intensity = 5.5 + Math.sin(elapsedTime * 8) * 2.0;
          lightsRef.current[0].color.setHex(0xf59e0b); // gold
        } else {
          lightsRef.current[0].intensity = 3.2 + Math.sin(elapsedTime * 2) * 0.6;
          lightsRef.current[0].color.setHex(0x38bdf8);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('touchmove', handleTouchMove);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [modelStyle]);

  // Helper to build 3D mesh based on current style
  const buildAvatarModel = (group: THREE.Group, style: ModelStyle) => {
    // Clear existing children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (style === 'cyber_robot') {
      buildCyberRobot(group);
    } else if (style === 'quantum_core') {
      buildQuantumCore(group);
    } else {
      buildHoloOrb(group);
    }
  };

  // 1. Cyber Robot Head Model
  const buildCyberRobot = (root: THREE.Group) => {
    // Head base (sleek rounded chamfered cybernetic helmet)
    const headGeo = new THREE.SphereGeometry(1.2, 32, 32);
    headGeo.scale(1, 1.15, 0.95);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    root.add(headMesh);

    // Visor Glass
    const visorGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.45, 32, 1, false, -Math.PI / 2.3, Math.PI / 1.15);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.18, 0.45);
    visor.rotation.x = 0.05;
    root.add(visor);

    // Expressive glowing robotic eyes
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.2, 1.0);

    const eyeGeo = new THREE.PlaneGeometry(0.28, 0.14);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.x = -0.38;
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.x = 0.38;

    // Pupil core points
    const pupilGeo = new THREE.CircleGeometry(0.06, 16);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.z = 0.01;
    leftEye.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.z = 0.01;
    rightEye.add(rightPupil);

    eyesGroup.add(leftEye, rightEye);
    root.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    // Audio-reactive mouth aperture
    const mouthGeo = new THREE.BoxGeometry(0.5, 0.08, 0.08);
    const mouthMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.42, 0.95);
    root.add(mouth);
    mouthRef.current = mouth;

    // Cyber crown / holographic halo
    const haloGeo = new THREE.TorusGeometry(1.4, 0.025, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.2;
    halo.position.y = 0.85;
    root.add(halo);

    // Floating side ear nodes / antennas
    const earGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 16);
    const earMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-1.25, 0.1, 0);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.rotation.z = -Math.PI / 2;
    rightEar.position.set(1.25, 0.1, 0);

    // Glowing antenna lights
    const glowRingGeo = new THREE.TorusGeometry(0.18, 0.02, 12, 24);
    const glowRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const leftGlow = new THREE.Mesh(glowRingGeo, glowRingMat);
    leftGlow.rotation.y = Math.PI / 2;
    leftEar.add(leftGlow);
    const rightGlow = new THREE.Mesh(glowRingGeo, glowRingMat);
    rightGlow.rotation.y = Math.PI / 2;
    rightEar.add(rightGlow);

    root.add(leftEar, rightEar);

    // Orbiting holographic data rings
    const ringsGroup = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(1.65 + i * 0.25, 0.015, 8, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00f0ff : 0x818cf8,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringsGroup.add(ringMesh);
    }
    root.add(ringsGroup);
    ringsRef.current = ringsGroup;
  };

  // 2. Quantum Core Avatar
  const buildQuantumCore = (root: THREE.Group) => {
    // Inner crystalline core
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.7,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    // Glowing inner sphere
    const innerGeo = new THREE.SphereGeometry(0.75, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    root.add(innerSphere);

    // Quantum Eyes (energy nodes)
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.15, 0.8);
    const eyeGeo = new THREE.OctahedronGeometry(0.16, 0);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.x = -0.35;
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.x = 0.35;
    eyesGroup.add(leftEye, rightEye);
    root.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    // Mouth pulse ring
    const mouthGeo = new THREE.TorusGeometry(0.2, 0.03, 12, 24);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.38, 0.8);
    root.add(mouth);
    mouthRef.current = mouth as any;

    // Gyroscopic rings
    const ringsGroup = new THREE.Group();
    const ringRadii = [1.5, 1.85, 2.2];
    ringRadii.forEach((rad, idx) => {
      const ringGeo = new THREE.TorusGeometry(rad, 0.02, 12, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x38bdf8 : idx === 1 ? 0xa855f7 : 0x06b6d4,
        metalness: 0.8,
        roughness: 0.2,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ringsGroup.add(ring);
    });
    root.add(ringsGroup);
    ringsRef.current = ringsGroup;
  };

  // 3. Holo Orb Avatar
  const buildHoloOrb = (root: THREE.Group) => {
    // Concentric latitude lattice
    const orbGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    root.add(orb);

    // Glowing core nucleus
    const nucleusGeo = new THREE.DodecahedronGeometry(0.7, 1);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    root.add(nucleus);

    // Eyes
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.2, 1.0);
    const eyeGeo = new THREE.RingGeometry(0.06, 0.16, 24);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.x = -0.38;
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.x = 0.38;
    eyesGroup.add(leftEye, rightEye);
    root.add(eyesGroup);
    eyesGroupRef.current = eyesGroup;

    // Mouth
    const mouthGeo = new THREE.PlaneGeometry(0.4, 0.08);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.35, 1.0);
    root.add(mouth);
    mouthRef.current = mouth as any;

    // Orbiting rings
    const ringsGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(1.7, 0.015, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 4;
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 3;
    ringsGroup.add(ring1, ring2);
    root.add(ringsGroup);
    ringsRef.current = ringsGroup;
  };

  const handleResetCamera = () => {
    manualRotation.current = { x: 0, y: 0 };
    mousePos.current = { x: 0, y: 0, targetX: 0, targetY: 0 };
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
        title="3D modelni aylantirish uchun sichqoncha bilan bosing va suring"
      />

      {/* Futuristic Status Badge on 3D viewport */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 text-xs text-slate-200">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSpeaking ? 'bg-cyan-400' : mood === 'thinking' ? 'bg-purple-400' : mood === 'proud' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isSpeaking ? 'bg-cyan-500' : mood === 'thinking' ? 'bg-purple-500' : mood === 'proud' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </span>
        <span className="font-mono font-medium tracking-wide uppercase text-[10px]">
          {isSpeaking ? 'GAPIRMOQDA' : mood === 'thinking' ? 'O\'YLAMOQDA' : mood === 'proud' ? 'FAXR TUYG\'USI' : 'TAYYOR'}
        </span>
      </div>

      {/* Interactive Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <button
          id="btn-reset-3d-cam"
          onClick={handleResetCamera}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-700/60"
          title="Kamerani bosh holatga qaytarish"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Model Style Switcher Pills at bottom of 3D stage */}
      <div className="absolute bottom-3 z-20 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-800/80 shadow-lg">
        <button
          id="btn-style-robot"
          onClick={() => onModelStyleChange('cyber_robot')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            modelStyle === 'cyber_robot'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cyber Robot
        </button>
        <button
          id="btn-style-core"
          onClick={() => onModelStyleChange('quantum_core')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            modelStyle === 'quantum_core'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Quantum Core
        </button>
        <button
          id="btn-style-orb"
          onClick={() => onModelStyleChange('holo_orb')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            modelStyle === 'holo_orb'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Holo Orb
        </button>
      </div>

      {/* Ambient glowing radial backdrop */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12)_0%,rgba(15,23,42,0)_70%)]" />
    </div>
  );
};
