import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { AlertTriangle, CheckCircle, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertBanner = () => {
  const { activeEmergencyAlert, acknowledgeEmergencyAlert, setSelectedOrgan } = useTelemetry();

  if (!activeEmergencyAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-16 left-0 right-0 z-50 px-4 md:px-8 py-3 bg-gradient-to-r from-red-950/95 via-[#3b0a13]/95 to-red-950/95 border-b-2 border-emergency-red shadow-[0_4px_30px_rgba(255,82,107,0.45)] backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emergency-red/20 border border-emergency-red rounded-lg animate-pulse">
              <ShieldAlert className="w-6 h-6 text-emergency-red" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emergency-red text-white rounded">
                  {activeEmergencyAlert.severity}
                </span>
                <span className="text-xs font-mono text-emergency-glow">
                  SIMULATED ABNORMAL TELEMETRY • {activeEmergencyAlert.timestamp}
                </span>
              </div>
              <h4 className="text-sm md:text-base font-bold text-white tracking-wide">
                {activeEmergencyAlert.title}
              </h4>
              <p className="text-xs text-rose-200/90 line-clamp-1">
                {activeEmergencyAlert.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSelectedOrgan(activeEmergencyAlert.organ)}
              className="px-3 py-1.5 text-xs font-mono font-semibold text-cyan-glow bg-cyan-950/60 border border-cyan-glow/40 hover:bg-cyan-900/60 rounded transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              INSPECT 3D {activeEmergencyAlert.organ.toUpperCase()}
            </button>
            <button
              onClick={acknowledgeEmergencyAlert}
              className="px-4 py-1.5 text-xs font-mono font-bold text-white bg-emergency-red hover:bg-rose-600 rounded transition-all shadow-[0_0_12px_rgba(255,82,107,0.5)] flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
