import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetry } from '../../context/TelemetryContext';
import AnatomyFallbackView from './AnatomyFallbackView';
import {
  RotateCcw,
  Eye,
  Maximize2,
  Heart,
  Wind,
  Brain,
  Bone,
  Zap,
} from 'lucide-react';

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('[3D Canvas WebGL fallback triggered]:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <AnatomyFallbackView
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

// ── 3D HEART COMPONENT ────────────────────────────────────────────────────────
const Heart3D = ({ isSelected, heartRate, isAbnormal, onClick }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Dynamic heartbeat frequency tied directly to telemetry heart_rate!
    const frequency = (heartRate / 60) * Math.PI * 2;
    // Dual systolic-diastolic pulse wave
    const beat = Math.sin(t * frequency);
    const scale = 1 + (beat > 0.6 ? 0.14 : beat < -0.6 ? -0.06 : 0);
    meshRef.current.scale.set(scale, scale, scale);
  });

  const glowColor = isAbnormal ? '#FF526B' : isSelected ? '#32E6E0' : '#278BFF';

  return (
    <group position={[-0.08, 0.48, 0.12]} ref={meshRef} onClick={onClick}>
      {/* Ventricles Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.4 : 0.6}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      {/* Aorta Arch */}
      <mesh position={[0.02, 0.12, 0]}>
        <torusGeometry args={[0.07, 0.03, 16, 32, Math.PI]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.6 : 0.7}
        />
      </mesh>
      {/* Vena Cava & Pulmonary Artery Stems */}
      <mesh position={[-0.05, 0.1, 0.02]}>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 16]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.06, 0.08, -0.02]}>
        <cylinderGeometry args={[0.022, 0.022, 0.09, 16]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

// ── 3D LUNGS COMPONENT ────────────────────────────────────────────────────────
const Lungs3D = ({ isSelected, respRate, isAbnormal, onClick }) => {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Respiratory expansion frequency tied directly to respiratory_rate!
    const frequency = (respRate / 60) * Math.PI * 2;
    const expansion = 1 + 0.08 * Math.sin(t * frequency);
    groupRef.current.scale.set(expansion, expansion, expansion * 1.05);
  });

  const glowColor = isAbnormal ? '#FF526B' : isSelected ? '#32E6E0' : '#59A6FF';

  return (
    <group position={[0, 0.50, 0.04]} ref={groupRef} onClick={onClick}>
      {/* Right Lung (anatomical right = viewer's left) */}
      <mesh position={[-0.20, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.24, 16, 16]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.3 : 0.4}
          transparent
          opacity={0.85}
          roughness={0.3}
        />
      </mesh>
      {/* Left Lung */}
      <mesh position={[0.20, -0.02, 0]}>
        <capsuleGeometry args={[0.085, 0.22, 16, 16]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.3 : 0.4}
          transparent
          opacity={0.85}
          roughness={0.3}
        />
      </mesh>
      {/* Trachea & Bronchi */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.15, 16]} />
        <meshStandardMaterial color="#88C0D0" emissive="#88C0D0" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// ── 3D BRAIN COMPONENT ────────────────────────────────────────────────────────
const Brain3D = ({ isSelected, onClick }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = 0.05 * Math.sin(t * 0.8);
  });

  const glowColor = isSelected ? '#32E6E0' : '#9275FF';

  return (
    <group position={[0, 1.48, 0.02]} ref={meshRef} onClick={onClick}>
      {/* Left Hemisphere */}
      <mesh position={[-0.055, 0, 0]}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.5 : 0.6}
          roughness={0.3}
          wireframe={isSelected}
        />
      </mesh>
      {/* Right Hemisphere */}
      <mesh position={[0.055, 0, 0]}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={isSelected ? 1.5 : 0.6}
          roughness={0.3}
          wireframe={isSelected}
        />
      </mesh>
      {/* Cerebellum & Brainstem */}
      <mesh position={[0, -0.07, -0.03]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#B39DFF" emissive="#B39DFF" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

// ── 3D SKELETON COMPONENT ─────────────────────────────────────────────────────
const Skeleton3D = ({ isSelected, onClick }) => {
  const glowColor = isSelected ? '#32E6E0' : '#718096';
  const intensity = isSelected ? 1.4 : 0.25;

  return (
    <group onClick={onClick}>
      {/* Spine / Vertebral Column */}
      <mesh position={[0, 0.35, -0.04]}>
        <cylinderGeometry args={[0.02, 0.025, 0.85, 16]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={intensity} />
      </mesh>
      {/* Ribcage Hoops */}
      {[-0.1, 0, 0.1, 0.2, 0.3].map((y, i) => (
        <mesh key={i} position={[0, 0.35 + y, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22 - i * 0.015, 0.015, 8, 24, Math.PI * 1.5]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={intensity} />
        </mesh>
      ))}
      {/* Pelvis */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.38, 0.12, 0.16]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={intensity} />
      </mesh>
      {/* Clavicles */}
      <mesh position={[0, 0.76, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.52, 12]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={intensity} />
      </mesh>
    </group>
  );
};

// ── 3D ASTRONAUT SUIT & SILHOUETTE ───────────────────────────────────────────
const AstronautSuit = ({ selectedOrgan, viewMode }) => {
  // If an internal organ is selected, suit outer shell becomes semi-transparent glass
  const isOrganSelected = !!selectedOrgan;
  const suitOpacity = viewMode === 'xray' ? 0.08 : isOrganSelected ? 0.22 : 0.75;
  const isWireframe = viewMode === 'hologram';

  return (
    <group>
      {/* Helmet Visor */}
      <mesh position={[0, 1.48, 0.12]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFB700"
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.65}
        />
      </mesh>
      {/* Helmet Outer Dome */}
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          color="#132347"
          emissive="#278BFF"
          emissiveIntensity={0.2}
          transparent
          opacity={suitOpacity}
          wireframe={isWireframe}
        />
      </mesh>
      {/* Torso Suit Armor */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.32, 0.26, 0.95, 24]} />
        <meshStandardMaterial
          color="#0F1D38"
          emissive="#32E6E0"
          emissiveIntensity={0.15}
          transparent
          opacity={suitOpacity}
          wireframe={isWireframe}
        />
      </mesh>
      {/* Life Support Chest Pack */}
      <mesh position={[0, 0.48, 0.20]}>
        <boxGeometry args={[0.28, 0.32, 0.12]} />
        <meshStandardMaterial
          color="#1A2D54"
          emissive="#32E6E0"
          emissiveIntensity={0.3}
          transparent
          opacity={suitOpacity + 0.1}
        />
      </mesh>
      {/* Left & Right Shoulders */}
      <mesh position={[-0.42, 0.72, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#101F3D" transparent opacity={suitOpacity} />
      </mesh>
      <mesh position={[0.42, 0.72, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#101F3D" transparent opacity={suitOpacity} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.46, 0.38, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
        <meshStandardMaterial color="#0F1D38" transparent opacity={suitOpacity} wireframe={isWireframe} />
      </mesh>
      <mesh position={[0.46, 0.38, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
        <meshStandardMaterial color="#0F1D38" transparent opacity={suitOpacity} wireframe={isWireframe} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.18, -0.65, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.9, 16]} />
        <meshStandardMaterial color="#0F1D38" transparent opacity={suitOpacity} wireframe={isWireframe} />
      </mesh>
      <mesh position={[0.18, -0.65, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.9, 16]} />
        <meshStandardMaterial color="#0F1D38" transparent opacity={suitOpacity} wireframe={isWireframe} />
      </mesh>
      {/* Boots */}
      <mesh position={[-0.18, -1.15, 0.06]}>
        <boxGeometry args={[0.16, 0.15, 0.32]} />
        <meshStandardMaterial color="#162A52" emissive="#278BFF" emissiveIntensity={0.2} transparent opacity={suitOpacity + 0.1} />
      </mesh>
      <mesh position={[0.18, -1.15, 0.06]}>
        <boxGeometry args={[0.16, 0.15, 0.32]} />
        <meshStandardMaterial color="#162A52" emissive="#278BFF" emissiveIntensity={0.2} transparent opacity={suitOpacity + 0.1} />
      </mesh>
    </group>
  );
};

// ── HOLOGRAPHIC SCANNING RING ────────────────────────────────────────────────
const ScanningLaserRing = () => {
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    // Moves smoothly up and down across the astronaut body
    ringRef.current.position.y = Math.sin(t * 1.5) * 1.4 + 0.2;
  });

  return (
    <group ref={ringRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.015, 16, 64]} />
        <meshStandardMaterial
          color="#32E6E0"
          emissive="#32E6E0"
          emissiveIntensity={2.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight color="#32E6E0" intensity={0.8} distance={1.2} />
    </group>
  );
};

// ── CAMERA CONTROLLER WITH SMOOTH INTERPOLATION ──────────────────────────────
const CameraController = ({ selectedOrgan }) => {
  useFrame(({ camera }) => {
    let targetPos = new THREE.Vector3(0, 0.5, 3.8); // Default full body view
    let lookAtPos = new THREE.Vector3(0, 0.3, 0);

    if (selectedOrgan === 'heart') {
      targetPos = new THREE.Vector3(-0.08, 0.48, 1.35);
      lookAtPos = new THREE.Vector3(-0.08, 0.48, 0.12);
    } else if (selectedOrgan === 'lungs') {
      targetPos = new THREE.Vector3(0, 0.50, 1.55);
      lookAtPos = new THREE.Vector3(0, 0.50, 0.04);
    } else if (selectedOrgan === 'brain') {
      targetPos = new THREE.Vector3(0, 1.48, 1.15);
      lookAtPos = new THREE.Vector3(0, 1.48, 0.02);
    } else if (selectedOrgan === 'skeleton') {
      targetPos = new THREE.Vector3(0, 0.2, 2.9);
      lookAtPos = new THREE.Vector3(0, 0.2, 0);
    }

    // Smooth camera ease
    camera.position.lerp(targetPos, 0.06);
    camera.lookAt(lookAtPos);
  });

  return null;
};

// ── MAIN ASTRONAUT DIGITAL TWIN COMPONENT ────────────────────────────────────
const AstronautDigitalTwin = () => {
  const {
    selectedOrgan,
    setSelectedOrgan,
    selectedOrganViewMode,
    setSelectedOrganViewMode,
    telemetry,
    activeEmergencyAlert,
  } = useTelemetry();

  const [hasWebGL, setHasWebGL] = useState(() => isWebGLAvailable());

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  const isHeartAbnormal = telemetry.heart_rate > 100;
  const isLungsAbnormal = telemetry.oxygen_saturation < 92;

  if (!hasWebGL) {
    return (
      <div className="relative w-full h-[580px] lg:h-[680px] rounded-2xl overflow-hidden border border-space-border/80 bg-[#050B16] shadow-2xl">
        <AnatomyFallbackView onRetry={() => setHasWebGL(isWebGLAvailable())} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-2xl overflow-hidden border border-space-border/80 bg-gradient-to-b from-[#060E1E] via-[#050B16] to-[#040812] shadow-2xl">
      <CanvasErrorBoundary>
        {/* 3D Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 0.5, 3.8], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
        <color attach="background" args={['#050B16']} />
        <fog attach="fog" args={['#050B16', 3.5, 12]} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 5]} intensity={1.2} castShadow />
        <pointLight position={[-4, 3, -3]} color="#278BFF" intensity={0.8} />
        <pointLight position={[3, -2, 2]} color="#9275FF" intensity={0.5} />

        {/* Dynamic focus camera controller */}
        <CameraController selectedOrgan={selectedOrgan} />

        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
          {/* Internal Organs */}
          <Heart3D
            isSelected={selectedOrgan === 'heart'}
            heartRate={telemetry.heart_rate}
            isAbnormal={isHeartAbnormal}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrgan('heart');
            }}
          />

          <Lungs3D
            isSelected={selectedOrgan === 'lungs'}
            respRate={telemetry.respiratory_rate}
            isAbnormal={isLungsAbnormal}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrgan('lungs');
            }}
          />

          <Brain3D
            isSelected={selectedOrgan === 'brain'}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrgan('brain');
            }}
          />

          <Skeleton3D
            isSelected={selectedOrgan === 'skeleton'}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrgan('skeleton');
            }}
          />

          {/* Semi-transparent astronaut spacesuit shell */}
          <AstronautSuit
            selectedOrgan={selectedOrgan}
            viewMode={selectedOrganViewMode}
          />

          {/* Animated scanning laser ring */}
          <ScanningLaserRing />
        </Float>

        {/* Floor Holographic Pedestal Grid */}
        <Grid
          position={[0, -1.35, 0]}
          args={[10, 10]}
          cellSize={0.4}
          cellThickness={1}
          cellColor="#1B315B"
          sectionSize={1.6}
          sectionThickness={1.5}
          sectionColor="#32E6E0"
          fadeDistance={6}
          fadeStrength={1.5}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={1.0}
          maxDistance={7.0}
          maxPolarAngle={Math.PI / 2 + 0.1}
          makeDefault
        />
      </Canvas>
      </CanvasErrorBoundary>

      {/* Floating Viewport HUD Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-space-surface/80 border border-space-border/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-glow animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-glow tracking-wider">
              3D DIGITAL TWIN • LIVE TELEMETRY
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            Click any organ or use HUD to inspect anatomy
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-space-surface/70 border border-space-border/60 backdrop-blur-md">
          {[
            { id: 'standard', label: 'Composite' },
            { id: 'xray', label: 'X-Ray' },
            { id: 'hologram', label: 'Hologram' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedOrganViewMode(mode.id)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-all ${
                selectedOrganViewMode === mode.id
                  ? 'bg-cyan-glow/20 text-cyan-glow font-bold border border-cyan-glow/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Organ Quick Selector Buttons on 3D Viewport */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {[
          { id: 'heart', label: 'Heart', icon: Heart, alert: isHeartAbnormal },
          { id: 'lungs', label: 'Lungs', icon: Wind, alert: isLungsAbnormal },
          { id: 'brain', label: 'Brain', icon: Brain },
          { id: 'skeleton', label: 'Skeleton', icon: Bone },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedOrgan(btn.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 backdrop-blur-md border transition-all ${
              selectedOrgan === btn.id
                ? 'bg-cyan-glow/25 text-cyan-glow border-cyan-glow shadow-[0_0_12px_rgba(50,230,224,0.3)]'
                : btn.alert
                ? 'bg-emergency-red/30 text-emergency-glow border-emergency-red animate-pulse'
                : 'bg-space-surface/70 text-slate-300 border-space-border/60 hover:bg-space-card'
            }`}
          >
            <btn.icon className="w-3.5 h-3.5" />
            <span>{btn.label}</span>
          </button>
        ))}

        <button
          onClick={() => setSelectedOrgan(null)}
          className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 bg-space-surface/60 hover:bg-space-card border border-space-border/40 flex items-center gap-1.5 justify-center"
          title="Reset camera to full astronaut view"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Full Body</span>
        </button>
      </div>

      {/* Interactive Controls Hint at Bottom */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-space-dark/80 px-3 py-1.5 rounded-lg border border-space-border/50 backdrop-blur-md">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-holo-blue" />
          Left Click + Drag: Rotate • Scroll: Zoom • Right Click: Pan
        </span>
        <span className="text-cyan-glow font-bold hidden sm:inline">
          RAYCASTING TARGET: {selectedOrgan ? selectedOrgan.toUpperCase() : 'FULL ASTRONAUT'}
        </span>
      </div>
    </div>
  );
};

export default AstronautDigitalTwin;
