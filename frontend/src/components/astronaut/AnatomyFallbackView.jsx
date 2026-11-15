import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Heart, Wind, Brain, Bone, AlertCircle, Info, RefreshCw } from 'lucide-react';

const AnatomyFallbackView = ({ error, onRetry }) => {
  const {
    selectedOrgan,
    setSelectedOrgan,
    telemetry,
  } = useTelemetry();

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#09152b] to-[#050B16] rounded-2xl border border-space-border/80 overflow-hidden font-sans">
      {/* Background Holographic Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[450px] h-[450px] rounded-full border border-cyan-glow animate-[spin_24s_linear_infinite]" />
        <div className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-holo-blue animate-[spin_18s_linear_infinite_reverse]" />
      </div>

      {/* Header Info Banner */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="px-3 py-1.5 rounded-lg bg-space-surface/90 border border-cyan-glow/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-glow animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-glow tracking-wider">
              2D HOLOGRAPHIC ANATOMY FALLBACK
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            WebGL Acceleration Offline • Interactive Sensor Telemetry Active
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-glow/15 hover:bg-cyan-glow/25 text-cyan-glow border border-cyan-glow/40 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RETRY 3D CANVAS</span>
          </button>
        )}
      </div>

      {/* Central Interactive Holographic Anatomical Silhouette */}
      <div className="relative my-4 flex items-center justify-center z-10">
        <svg viewBox="0 0 300 480" className="w-64 h-[380px] drop-shadow-[0_0_25px_rgba(50,230,224,0.3)]">
          {/* Astronaut Silhouette */}
          <path
            d="M 150 40 C 130 40 120 55 120 75 C 120 95 130 110 150 110 C 170 110 180 95 180 75 C 180 55 170 40 150 40 Z
               M 115 115 C 95 125 80 150 75 190 L 60 280 L 80 285 L 95 205 L 105 210 L 105 320 L 115 450 L 140 450 L 145 330 L 155 330 L 160 450 L 185 450 L 195 320 L 195 210 L 205 205 L 220 285 L 240 280 L 225 190 C 220 150 205 125 185 115 Z"
            fill="none"
            stroke="#278BFF"
            strokeWidth="2"
            strokeDasharray="4 2"
            opacity="0.4"
          />

          {/* Brain Target */}
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => setSelectedOrgan('brain')}
          >
            <circle
              cx="150"
              cy="75"
              r="22"
              fill={selectedOrgan === 'brain' ? '#9275FF' : '#278BFF'}
              fillOpacity={selectedOrgan === 'brain' ? '0.8' : '0.35'}
              stroke={selectedOrgan === 'brain' ? '#FFFFFF' : '#9275FF'}
              strokeWidth={selectedOrgan === 'brain' ? '3' : '1.5'}
            />
            <text x="150" y="80" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="monospace">
              BRAIN
            </text>
          </g>

          {/* Lungs Target */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedOrgan('lungs')}
          >
            {/* Left lobe */}
            <ellipse
              cx="128"
              cy="165"
              rx="18"
              ry="32"
              fill={selectedOrgan === 'lungs' ? '#32E6E0' : '#278BFF'}
              fillOpacity={selectedOrgan === 'lungs' ? '0.75' : '0.3'}
              stroke="#32E6E0"
              strokeWidth="1.5"
            />
            {/* Right lobe */}
            <ellipse
              cx="172"
              cy="165"
              rx="18"
              ry="32"
              fill={selectedOrgan === 'lungs' ? '#32E6E0' : '#278BFF'}
              fillOpacity={selectedOrgan === 'lungs' ? '0.75' : '0.3'}
              stroke="#32E6E0"
              strokeWidth="1.5"
            />
            <text x="150" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="monospace">
              LUNGS
            </text>
          </g>

          {/* Heart Target */}
          <g
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => setSelectedOrgan('heart')}
          >
            <circle
              cx="145"
              cy="180"
              r="17"
              fill={selectedOrgan === 'heart' ? '#32E6E0' : '#FF526B'}
              fillOpacity={selectedOrgan === 'heart' ? '0.9' : '0.6'}
              stroke="#FFFFFF"
              strokeWidth="2"
              className={telemetry.heart_rate > 100 ? 'animate-pulse' : ''}
            />
            <text x="145" y="184" textAnchor="middle" fill="#050B16" fontSize="9" fontWeight="bold" fontFamily="monospace">
              HR
            </text>
          </g>

          {/* Skeleton / Vertebrae Target */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedOrgan('skeleton')}
          >
            <rect
              x="146"
              y="215"
              width="8"
              height="70"
              rx="4"
              fill={selectedOrgan === 'skeleton' ? '#FFFFFF' : '#278BFF'}
              fillOpacity={selectedOrgan === 'skeleton' ? '0.9' : '0.4'}
              stroke="#32E6E0"
              strokeWidth="1"
            />
            <text x="150" y="300" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
              SKELETON
            </text>
          </g>
        </svg>
      </div>

      {/* Organ Selector Buttons */}
      <div className="w-full flex items-center justify-center gap-2 z-10 flex-wrap">
        {[
          { id: 'heart', label: 'Heart', icon: Heart, val: `${telemetry.heart_rate} BPM` },
          { id: 'lungs', label: 'Lungs', icon: Wind, val: `${telemetry.oxygen_saturation}% SpO2` },
          { id: 'brain', label: 'Brain', icon: Brain, val: `${telemetry.stress_index}/10 Stress` },
          { id: 'skeleton', label: 'Skeleton', icon: Bone, val: `${telemetry.bone_load_pct}% Load` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedOrgan(item.id)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition-all ${
              selectedOrgan === item.id
                ? 'bg-cyan-glow/20 border-cyan-glow text-cyan-glow shadow-[0_0_15px_rgba(50,230,224,0.3)]'
                : 'bg-space-surface/80 border-space-border/60 text-slate-300 hover:bg-space-card'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            <div className="text-left">
              <div className="font-bold">{item.label}</div>
              <div className="text-[10px] text-slate-400">{item.val}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Diagnostics / Model Install instructions box */}
      <div className="w-full mt-3 p-3 rounded-xl bg-space-surface/90 border border-space-border/70 text-[11px] font-mono text-slate-400 flex items-start gap-2.5 z-10">
        <Info className="w-4 h-4 text-holo-blue shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-200 font-semibold">WebGL Diagnostics: </span>
          The interactive anatomical digital twin has switched to the 2D precision telemetry fallback layer.
          To re-enable hardware-accelerated 3D WebGL, verify that hardware acceleration is enabled in your browser settings (Chrome: <code className="text-cyan-glow">chrome://settings/system</code>) and reload the page. Custom Blender GLB models can be placed in <code className="text-cyan-glow">/public/models/astronaut.glb</code>.
        </div>
      </div>
    </div>
  );
};

export default AnatomyFallbackView;
