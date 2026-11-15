import React from 'react';
import AstronautDigitalTwin from '../components/astronaut/AstronautDigitalTwin';
import OrganTelemetryPanel from '../components/astronaut/OrganTelemetryPanel';
import { useTelemetry } from '../context/TelemetryContext';
import { UserCheck, Shield, Radio, Activity } from 'lucide-react';

const AstronautMonitor = () => {
  const { selectedAstronaut, telemetry } = useTelemetry();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              3D ASTRONAUT DIGITAL TWIN MONITOR
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              {selectedAstronaut?.name} ({selectedAstronaut?.astronaut_id}) • {selectedAstronaut?.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1 rounded bg-space-card border border-space-border text-slate-300">
            Blood Type: {selectedAstronaut?.blood_type || 'O+'}
          </span>
          <span className="px-3 py-1 rounded bg-holo-blue/15 border border-holo-blue/40 text-holo-glow font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            TELEMETRY LINKED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AstronautDigitalTwin />
        </div>
        <div className="lg:col-span-5">
          <OrganTelemetryPanel />
        </div>
      </div>
    </div>
  );
};

export default AstronautMonitor;
