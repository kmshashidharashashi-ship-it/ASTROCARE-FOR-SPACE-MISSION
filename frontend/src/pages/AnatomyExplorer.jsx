import React, { useState } from 'react';
import AstronautDigitalTwin from '../components/astronaut/AstronautDigitalTwin';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Eye,
  Heart,
  Wind,
  Brain,
  Bone,
  Zap,
  Activity,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const systems = [
  {
    id: 'heart',
    name: 'Cardiovascular System',
    sub: 'Heart, Ventricles, Aorta & Hemodynamics',
    icon: Heart,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    spacePhysiology:
      'In microgravity, ~1.5 to 2.0 Liters of blood and interstitial fluids shift cephalad (headward). The carotid baroreceptors sense elevated blood pressure, triggering reflex diuresis and mild left ventricular myocardial deconditioning.',
    countermeasures: 'Daily aerobic interval training, Lower Body Negative Pressure (LBNP) garment, fluid loading pre-landing.',
    keyMetrics: [
      { label: 'Stroke Volume', val: '74 mL', target: '70 - 90 mL' },
      { label: 'Cardiac Output', val: '5.2 L/min', target: '5.0 L/min' },
      { label: 'Baroreflex Sensitivity', val: '14 ms/mmHg', target: '> 12' },
    ],
  },
  {
    id: 'lungs',
    name: 'Respiratory & Gas Exchange',
    sub: 'Pulmonary Lobes, Bronchi & Alveoli',
    icon: Wind,
    color: 'text-cyan-glow',
    borderColor: 'border-cyan-glow/40',
    spacePhysiology:
      'Absence of gravitational hydrostatic gradients promotes more uniform ventilation-perfusion matching throughout the upper and lower lung lobes, though reduced thoracic cage recoil alters end-expiratory lung volumes.',
    countermeasures: 'Trace gas scrubbing (catalytic oxidizers, LiOH canisters), strict cabin partial pressure regulation (PO2 150 mmHg).',
    keyMetrics: [
      { label: 'SpO2 Saturation', val: '98.4%', target: '96 - 100%' },
      { label: 'Tidal Volume', val: '495 mL', target: '450 - 550 mL' },
      { label: 'Ventilation / Perfusion', val: '0.88', target: '0.80 - 0.90' },
    ],
  },
  {
    id: 'brain',
    name: 'Neurovestibular & Cognitive',
    sub: 'Cerebral Cortex, Vestibular Otoliths & Circadian Pace',
    icon: Brain,
    color: 'text-violet-space',
    borderColor: 'border-violet-space/40',
    spacePhysiology:
      'Mismatch between visual cues and gravitational otolith signaling triggers Space Adaptation Syndrome (SAS / space motion sickness) during first 72 hours. Cephalad venous pressure may contribute to Spaceflight-Associated Neuro-ocular Syndrome (SANS).',
    countermeasures: 'Promethazine / scopolamine acclimatization, 480nm circadian blue-light phase shifting, daily visual acuity OCT scans.',
    keyMetrics: [
      { label: 'Cognitive Speed (PVT)', val: '215 ms', target: '< 250 ms' },
      { label: 'Intracranial Pressure (est.)', val: '14 mmHg', target: '10 - 18 mmHg' },
      { label: 'Sleep Efficiency', val: '88.5%', target: '> 85%' },
    ],
  },
  {
    id: 'skeleton',
    name: 'Skeletal & Bone Matrix',
    sub: 'Vertebral Spine, Trabecular & Cortical Bone',
    icon: Bone,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    spacePhysiology:
      'Unloading of skeletal weight induces up to 1.0% to 1.5% bone mineral density loss per month in weight-bearing bones (calcaneus, femoral neck, lumbar vertebrae) via osteoclastic resorption upregulation.',
    countermeasures: 'Advanced Resistive Exercise Device (ARED) delivering up to 600 lbs equivalent load; dietary Vitamin D and bisphosphonates.',
    keyMetrics: [
      { label: 'Bone Density Index', val: '98.8%', target: '> 98.0%' },
      { label: 'Urinary Calcium Excretion', val: '180 mg/day', target: '< 250 mg/day' },
      { label: 'Vertebral Extension', val: '+3.2 cm', target: '< +4.5 cm' },
    ],
  },
];

const AnatomyExplorer = () => {
  const { selectedOrgan, setSelectedOrgan, telemetry } = useTelemetry();
  const [activeTab, setActiveTab] = useState(selectedOrgan || 'heart');

  const currentSystem = systems.find((s) => s.id === activeTab) || systems[0];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              HUMAN ANATOMY & SPACE PHYSIOLOGY EXPLORER
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Interactive 3D Anatomical Dissection & Aerospace Countermeasure Protocols
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Viewport (7 cols) */}
        <div className="lg:col-span-7">
          <AstronautDigitalTwin />
        </div>

        {/* Detailed Anatomy & Medical Protocols (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Anatomical Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {systems.map((sys) => {
              const Icon = sys.icon;
              const isActive = activeTab === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => {
                    setActiveTab(sys.id);
                    setSelectedOrgan(sys.id);
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    isActive
                      ? `bg-space-card ${sys.borderColor} shadow-[0_0_12px_rgba(50,230,224,0.2)]`
                      : 'bg-space-surface/60 border-space-border/40 hover:bg-space-card'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${sys.color}`} />
                  <span className="text-[10px] font-mono font-bold text-white uppercase">
                    {sys.id}
                  </span>
                </button>
              );
            })}
          </div>

          {/* System Card Details */}
          <div className="p-5 rounded-2xl bg-space-surface/90 border border-space-border/80 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-glow/20 text-cyan-glow rounded">
                  ANATOMICAL STRUCTURE
                </span>
                <span className="text-xs font-mono text-slate-400">STATUS: NOMINAL</span>
              </div>
              <h3 className="text-base font-orbitron font-bold text-white mt-1">
                {currentSystem.name}
              </h3>
              <p className="text-xs font-mono text-slate-400">{currentSystem.sub}</p>
            </div>

            {/* Key Measurements */}
            <div className="grid grid-cols-3 gap-2">
              {currentSystem.keyMetrics.map((m, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-space-dark/80 border border-space-border/50">
                  <p className="text-[9px] font-mono text-slate-400 uppercase">{m.label}</p>
                  <p className="text-sm font-mono font-bold text-white mt-0.5">{m.val}</p>
                  <p className="text-[9px] font-mono text-cyan-glow/70">Nominal: {m.target}</p>
                </div>
              ))}
            </div>

            {/* Space Microgravity Physiological Impact */}
            <div className="p-3.5 rounded-xl bg-space-dark/60 border border-space-border/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-holo-glow">
                <Activity className="w-3.5 h-3.5" />
                <span>MICROGRAVITY PATHOPHYSIOLOGY</span>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {currentSystem.spacePhysiology}
              </p>
            </div>

            {/* Medical Countermeasures */}
            <div className="p-3.5 rounded-xl bg-space-dark/60 border border-space-border/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-alert-green">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>FLIGHT SURGEON COUNTERMEASURES</span>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {currentSystem.countermeasures}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnatomyExplorer;
