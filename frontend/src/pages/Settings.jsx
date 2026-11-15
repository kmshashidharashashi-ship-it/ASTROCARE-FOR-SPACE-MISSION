import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Settings as SettingsIcon,
  Sliders,
  Bell,
  Cpu,
  Radio,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  HardDrive,
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { telemetry } = useTelemetry();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [config, setConfig] = useState({
    telemetryTickRate: '4.0',
    ecgSamplingRate: '250',
    alertChime: true,
    anomalySensitivity: 'medium',
    offlineMode: false,
    orbitronThemeGlow: true,
    highContrastMode: false,
    nasaMirrorServer: 'primary_hq',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/30 font-semibold">
              MISSION SYSTEM CONFIGURATION
            </span>
            <span className="text-xs font-mono text-slate-400">TELEMETRY SUITE v1.0.0</span>
          </div>
          <h1 className="text-2xl font-orbitron font-bold text-white mt-1">
            System & Mission Settings
          </h1>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>CONFIGURATION PERSISTED TO GATEWAY</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Stream Settings */}
        <div className="p-6 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-glow/15 border border-cyan-glow/30 text-cyan-glow">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-orbitron font-bold text-white">Telemetry & Ingestion</h2>
              <p className="text-xs font-mono text-slate-400">WebSockets and sensor data streams</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">Telemetry Polling Rate</label>
              <select
                value={config.telemetryTickRate}
                onChange={(e) => setConfig({ ...config, telemetryTickRate: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="1.0">1.0s • High Frequency Emergency Mode</option>
                <option value="4.0">4.0s • Standard Mission Cruise (Nominal)</option>
                <option value="10.0">10.0s • Low Bandwidth Deep Space Mode</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">ECG Oscilloscope Resolution</label>
              <select
                value={config.ecgSamplingRate}
                onChange={(e) => setConfig({ ...config, ecgSamplingRate: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="125">125 Hz • Standard Telemetry Band</option>
                <option value="250">250 Hz • Clinical Precision Diagnostic</option>
                <option value="500">500 Hz • Full Research Lead II Array</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold">AI Anomaly Sensitivity</label>
              <select
                value={config.anomalySensitivity}
                onChange={(e) => setConfig({ ...config, anomalySensitivity: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="low">Conservative (Z &gt; 3.0, Contamination 0.02)</option>
                <option value="medium">Balanced (Z &gt; 2.5, Contamination 0.05)</option>
                <option value="high">High Sensitivity (Z &gt; 2.0, Contamination 0.08)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interface & Safety Controls */}
        <div className="p-6 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-holo-blue/15 border border-holo-blue/30 text-holo-blue">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-orbitron font-bold text-white">Visual & Audio Interface</h2>
              <p className="text-xs font-mono text-slate-400">Display HUD and notification cues</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <label className="flex items-center justify-between p-3 rounded-xl bg-space-dark/80 border border-space-border cursor-pointer">
              <div>
                <span className="text-white block font-semibold">Critical Alert Audio Chime</span>
                <span className="text-[11px] text-slate-400">Play auditory cue when physiological risk is CRITICAL</span>
              </div>
              <input
                type="checkbox"
                checked={config.alertChime}
                onChange={(e) => setConfig({ ...config, alertChime: e.target.checked })}
                className="w-4 h-4 accent-cyan-glow"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-space-dark/80 border border-space-border cursor-pointer">
              <div>
                <span className="text-white block font-semibold">Holographic Glow &amp; Starfield Animation</span>
                <span className="text-[11px] text-slate-400">Enable canvas particle animation in deep space theme</span>
              </div>
              <input
                type="checkbox"
                checked={config.orbitronThemeGlow}
                onChange={(e) => setConfig({ ...config, orbitronThemeGlow: e.target.checked })}
                className="w-4 h-4 accent-cyan-glow"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-space-dark/80 border border-space-border cursor-pointer">
              <div>
                <span className="text-white block font-semibold">High-Contrast Medical Mode</span>
                <span className="text-[11px] text-slate-400">Maximize contrast for sunlight or high-glare environments</span>
              </div>
              <input
                type="checkbox"
                checked={config.highContrastMode}
                onChange={(e) => setConfig({ ...config, highContrastMode: e.target.checked })}
                className="w-4 h-4 accent-cyan-glow"
              />
            </label>
          </div>
        </div>

        {/* User Session & Role Info */}
        <div className="p-6 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-space/20 border border-violet-space/40 text-violet-glow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-orbitron font-bold text-white">Active Personnel Authorization</h2>
              <p className="text-xs font-mono text-slate-400">Role permissions and session details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-space-dark border border-space-border">
              <span className="text-slate-400 block text-[10px]">AUTHENTICATED IDENTITY</span>
              <span className="text-white font-bold">{user?.full_name || 'Commander Alex Chen'}</span>
            </div>
            <div className="p-3 rounded-xl bg-space-dark border border-space-border">
              <span className="text-slate-400 block text-[10px]">ASSIGNED ROLE</span>
              <span className="text-cyan-glow font-bold">{user?.role || 'Mission Commander'}</span>
            </div>
            <div className="p-3 rounded-xl bg-space-dark border border-space-border">
              <span className="text-slate-400 block text-[10px]">SECURITY LEVEL</span>
              <span className="text-emerald-400 font-bold">LEVEL 4 • FLIGHT SURGEON OVERRIDE</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-glow to-holo-blue text-[#050B16] font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(50,230,224,0.3)] hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              <span>SAVE CONFIGURATION</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
