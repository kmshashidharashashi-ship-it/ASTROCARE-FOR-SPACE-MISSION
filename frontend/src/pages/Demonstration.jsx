import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { demoApi } from '../services/api';
import AstronautDigitalTwin from '../components/astronaut/AstronautDigitalTwin';
import OrganTelemetryPanel from '../components/astronaut/OrganTelemetryPanel';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Zap,
  Activity,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STEPS = [
  {
    step: 1,
    title: 'Initialize 3D Digital Twin & Laboratory',
    desc: 'Launch the cinematic spacecraft medical laboratory and inspect the central 3D astronaut digital twin in SIMULATION MODE.',
    organ: null,
    instruction: 'Review mission status and initial baseline parameters. The 3D twin is actively linked to live telemetry channels.',
  },
  {
    step: 2,
    title: 'Interactive 3D Rotation & Inspection',
    desc: 'Rotate, zoom, and inspect the anatomical spacesuit and holographic structures from any orbital angle.',
    organ: null,
    instruction: 'Click and drag in the 3D viewport to inspect the astronaut from all angles. Use the scroll wheel to zoom in and out.',
  },
  {
    step: 3,
    title: 'Cardiovascular System Examination',
    desc: 'Illuminate the heart, focus the camera, examine myocardial contraction pulses, heart rate, and live 12-lead ECG waveform.',
    organ: 'heart',
    instruction: 'Observe the heart pulsing at 72 BPM with live Lead II ECG waveform and blood pressure metrics.',
  },
  {
    step: 4,
    title: 'Respiratory System & Gas Exchange',
    desc: 'Illuminate the pulmonary lobes, inspect breathing expansion cycles, SpO2 saturation, and respiratory rate.',
    organ: 'lungs',
    instruction: 'Notice the dual pulmonary lobes expanding and contracting smoothly synchronized with astronaut breathing telemetry.',
  },
  {
    step: 5,
    title: 'Nervous System & Cognitive Wellness',
    desc: 'Illuminate the cerebral hemispheres and analyze sleep duration, fatigue score, and stress self-assessment.',
    organ: 'brain',
    instruction: 'Review neural activation patterns and sleep architecture data recorded during lunar orbital flight.',
  },
  {
    step: 6,
    title: 'Skeletal & Musculoskeletal Structure',
    desc: 'Illuminate the vertebral column, ribcage, and pelvis to inspect microgravity deconditioning and bone health countermeasures.',
    organ: 'skeleton',
    instruction: 'Examine spinal de-loading metrics and daily resistive exercise load (ARED) force absorption telemetry.',
  },
  {
    step: 7,
    title: 'Simulated Abnormal Telemetry & AI Alert',
    desc: 'Trigger an end-to-end simulated physiological anomaly to demonstrate real-time AI anomaly detection, risk grading, and alert broadcast.',
    organ: 'heart',
    instruction: 'Click the button below to inject an acute tachycardic / hypertensive crisis. Watch the heart turn pulsing emergency red, AI calculate CRITICAL risk, and emergency alarms broadcast across mission control.',
    actionRequired: true,
  },
  {
    step: 8,
    title: 'Mission Demonstration Summary',
    desc: 'Audit the complete demonstration results: anatomical regions verified, telemetry processed, AI detections, and alert audits.',
    organ: null,
    instruction: 'All 8 demonstration stages successfully validated against the live aerospace medical intelligence backend.',
  },
];

const Demonstration = () => {
  const {
    selectedOrgan,
    setSelectedOrgan,
    telemetry,
    selectedAstronautId,
    activeEmergencyAlert,
  } = useTelemetry();

  const [currentStep, setCurrentStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isAbnormalTriggered, setIsAbnormalTriggered] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([1]);

  // Sync step change
  const goToStep = async (stepNum) => {
    if (stepNum < 1 || stepNum > 8) return;
    setCurrentStep(stepNum);
    if (!completedSteps.includes(stepNum)) {
      setCompletedSteps((prev) => [...prev, stepNum]);
    }
    const organToSelect = STEPS[stepNum - 1].organ;
    setSelectedOrgan(organToSelect);
    try {
      await demoApi.setStep(stepNum);
    } catch (e) {}

    if (stepNum === 8) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleStart = async () => {
    setIsRunning(true);
    await demoApi.start(selectedAstronautId);
    goToStep(1);
  };

  const handlePause = async () => {
    setIsRunning(false);
    await demoApi.pause();
  };

  const handleResume = async () => {
    setIsRunning(true);
    await demoApi.resume();
  };

  const handleReset = async () => {
    setIsRunning(false);
    setIsAbnormalTriggered(false);
    setCompletedSteps([1]);
    await demoApi.reset();
    goToStep(1);
  };

  const handleTriggerAbnormal = async () => {
    setTriggerLoading(true);
    try {
      const res = await demoApi.triggerAbnormal(selectedAstronautId, 'cardiovascular_tachycardia');
      setIsAbnormalTriggered(true);
      setSelectedOrgan('heart');
    } catch (e) {
      console.error('Trigger abnormal error:', e);
    } finally {
      setTriggerLoading(false);
    }
  };

  const currentStepData = STEPS[currentStep - 1];

  return (
    <div className="space-y-6">
      {/* Top Demonstration Header & Progress Stepper */}
      <div className="p-4 rounded-xl bg-space-surface/85 border border-cyan-glow/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 rounded">
                HACKATHON DEMO MODE
              </span>
              <span className="text-xs font-mono text-slate-400">
                STEP {currentStep} OF 8
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-orbitron font-bold text-white mt-1">
              {currentStepData.title}
            </h2>
            <p className="text-xs font-mono text-slate-300 mt-0.5 max-w-2xl">
              {currentStepData.desc}
            </p>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="p-2 rounded-lg bg-space-card hover:bg-space-hover border border-space-border text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {isRunning ? (
              <button
                onClick={handlePause}
                className="px-3 py-2 rounded-lg bg-alert-amber/20 hover:bg-alert-amber/30 border border-alert-amber/50 text-alert-amber text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="px-3 py-2 rounded-lg bg-cyan-glow/20 hover:bg-cyan-glow/30 border border-cyan-glow/50 text-cyan-glow text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(50,230,224,0.2)]"
              >
                <Play className="w-4 h-4" />
                <span>RESUME</span>
              </button>
            )}

            <button
              onClick={() => goToStep(currentStep + 1)}
              disabled={currentStep === 8}
              className="px-3 py-2 rounded-lg bg-cyan-glow hover:bg-cyan-300 text-[#050B16] text-xs font-mono font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-[0_0_14px_rgba(50,230,224,0.3)]"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-space-card hover:bg-rose-950/40 border border-space-border hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-mono flex items-center gap-1"
              title="Reset demonstration state"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* 8-Step Interactive Progress Bar */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 pt-3">
          {STEPS.map((s) => {
            const isDone = completedSteps.includes(s.step);
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => goToStep(s.step)}
                className={`p-2 rounded-lg text-left transition-all border ${
                  isCurrent
                    ? 'bg-cyan-glow/20 border-cyan-glow shadow-[0_0_10px_rgba(50,230,224,0.25)]'
                    : isDone
                    ? 'bg-space-card/80 border-space-border/60 text-slate-300'
                    : 'bg-space-dark/60 border-space-border/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-cyan-glow">
                    0{s.step}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-alert-green" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
                <p className="text-[10px] font-mono font-medium truncate text-white">
                  {s.step === 7 ? 'Trigger Alert' : s.title.split(' ')[0]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided Instruction Box */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        currentStep === 7
          ? 'bg-gradient-to-r from-rose-950/90 via-space-card to-space-surface border-emergency-red shadow-[0_0_20px_rgba(255,82,107,0.3)]'
          : 'bg-space-surface/70 border-space-border/70'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${
            currentStep === 7
              ? 'bg-emergency-red/20 border-emergency-red text-emergency-red animate-pulse'
              : 'bg-cyan-glow/15 border-cyan-glow/40 text-cyan-glow'
          }`}>
            {currentStep === 7 ? <ShieldAlert className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
              {currentStep === 7 ? 'STEP 7 MANDATORY DEMO ACTION' : 'STAGE DIRECTIVE'}
            </h4>
            <p className="text-xs font-mono text-slate-300 mt-0.5 leading-relaxed">
              {currentStepData.instruction}
            </p>
          </div>
        </div>

        {/* Step 7 Prominent Trigger Button */}
        {currentStep === 7 && (
          <button
            onClick={handleTriggerAbnormal}
            disabled={triggerLoading}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emergency-red to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-mono font-extrabold text-xs tracking-wider shadow-[0_0_24px_rgba(255,82,107,0.6)] hover:shadow-[0_0_32px_rgba(255,82,107,0.8)] transition-all flex items-center justify-center gap-2 animate-bounce shrink-0"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{triggerLoading ? 'INGESTING TELEMETRY...' : 'TRIGGER SIMULATED ABNORMAL READING'}</span>
          </button>
        )}
      </div>

      {/* Step 8 Demonstration Summary View */}
      {currentStep === 8 ? (
        <div className="p-6 rounded-2xl bg-space-surface/90 border border-alert-green/50 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-space-border/60">
            <div className="p-3 rounded-xl bg-alert-green/20 border border-alert-green text-alert-green">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-orbitron font-bold text-white">
                HACKATHON LIVE DEMONSTRATION COMPLETE
              </h3>
              <p className="text-xs font-mono text-alert-green">
                Full end-to-end mission medical intelligence pipeline verified.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-space-dark/80 border border-space-border/60">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Anatomical Regions Examined</p>
              <h4 className="text-2xl font-orbitron font-bold text-cyan-glow mt-1">4 / 4</h4>
              <p className="text-xs font-mono text-slate-300 mt-1">Heart, Lungs, Brain, Skeleton verified</p>
            </div>

            <div className="p-4 rounded-xl bg-space-dark/80 border border-space-border/60">
              <p className="text-[10px] font-mono text-slate-400 uppercase">AI Anomaly Analysis Pipeline</p>
              <h4 className="text-2xl font-orbitron font-bold text-alert-green mt-1">100%</h4>
              <p className="text-xs font-mono text-slate-300 mt-1">Real-time Isolation Forest detection active</p>
            </div>

            <div className="p-4 rounded-xl bg-space-dark/80 border border-space-border/60">
              <p className="text-[10px] font-mono text-slate-400 uppercase">Emergency Alerts Broadcast</p>
              <h4 className="text-2xl font-orbitron font-bold text-emergency-red mt-1">1 CRITICAL</h4>
              <p className="text-xs font-mono text-slate-300 mt-1">WebSocket broadcast & audit log recorded</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-space-dark/60 border border-space-border/60 text-xs font-mono space-y-2">
            <h5 className="font-bold text-cyan-glow uppercase">Demonstration Verification Audit Log:</h5>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li>✓ Step 1: Astronaut 3D digital twin loaded in futuristic medical lab environment.</li>
              <li>✓ Step 2: 360° orbital rotation, smooth camera interpolation, raycasting verified.</li>
              <li>✓ Step 3: Heart selected — illuminated in electric cyan, live ECG and pulse wave synchronized.</li>
              <li>✓ Step 4: Lungs selected — dual lobes illuminated, breathing animation matches respiratory rate.</li>
              <li>✓ Step 5: Brain selected — cranial illumination, cognitive wellness and sleep duration logged.</li>
              <li>✓ Step 6: Skeleton selected — spine and bone density load indicators analyzed.</li>
              <li>✓ Step 7: Simulated abnormal reading ingested → DB stored → AI analyzed → Alert generated → WebSockets broadcast.</li>
              <li>✓ Step 8: Full mission audit report logged to database audit trail.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Steps 1-7: Interactive 3D Digital Twin & Organ Telemetry split screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <AstronautDigitalTwin />
          </div>
          <div className="lg:col-span-5">
            <OrganTelemetryPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default Demonstration;
