import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { insightsApi } from '../services/api';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Clock,
  Filter,
  CheckCheck,
  User,
  Radio,
} from 'lucide-react';

const Alerts = () => {
  const { activeEmergencyAlert, acknowledgeEmergencyAlert } = useTelemetry();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await insightsApi.getAlerts(50);
      setAlerts(res.data || []);
    } catch (e) {
      console.warn('Could not load historical alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReview = async (alertId) => {
    try {
      await insightsApi.acknowledgeAlert(alertId, user?.full_name || 'Flight Surgeon');
      fetchAlerts();
    } catch (e) {
      console.error('Error reviewing alert:', e);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emergency-red/20 border border-emergency-red/50 text-emergency-red">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              EMERGENCY MEDICAL ALERT & INCIDENT CENTER
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Real-Time Life-Critical Anomaly Broadcasts & Flight Surgeon Acknowledgment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'critical', 'high', 'medium'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
                filterSeverity === sev
                  ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/50 font-bold'
                  : 'bg-space-dark text-slate-400 border border-space-border hover:bg-space-card'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Active Broadcast Banner if active */}
      {activeEmergencyAlert && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-[#3a0812] to-red-950 border-2 border-emergency-red shadow-[0_0_30px_rgba(255,82,107,0.45)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emergency-red animate-ping" />
              <span className="text-xs font-mono font-bold text-emergency-glow uppercase">
                ACTIVE CRITICAL TELEMETRY ALERT • REAL-TIME WEBSOCKET
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{activeEmergencyAlert.timestamp}</span>
          </div>

          <h3 className="text-base font-orbitron font-bold text-white">
            {activeEmergencyAlert.title}
          </h3>
          <p className="text-xs font-mono text-rose-100">
            {activeEmergencyAlert.explanation}
          </p>
          <div className="p-2.5 rounded bg-black/40 border border-emergency-red/40 text-xs font-mono text-rose-200">
            <span className="font-bold text-white">Required Action: </span>
            {activeEmergencyAlert.recommendation}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={acknowledgeEmergencyAlert}
              className="px-5 py-2 rounded-lg bg-emergency-red hover:bg-rose-600 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>ACKNOWLEDGE EMERGENCY</span>
            </button>
          </div>
        </div>
      )}

      {/* Alert Incident Log List */}
      <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-orbitron font-bold text-white uppercase">
            Historical Incident Audit Trail
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Total: {filteredAlerts.length}</span>
        </div>

        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-400 bg-space-dark/40 rounded-xl border border-space-border/40">
              No alerts match the selected filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/30 border-emergency-red/60'
                    : alert.severity === 'high'
                    ? 'bg-amber-950/30 border-alert-amber/50'
                    : 'bg-space-dark/80 border-space-border/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        alert.severity === 'critical'
                          ? 'bg-emergency-red text-white border-white'
                          : alert.severity === 'high'
                          ? 'bg-alert-amber/20 text-alert-amber border-alert-amber'
                          : 'bg-cyan-glow/20 text-cyan-glow border-cyan-glow'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(alert.created_at).toLocaleTimeString()} • {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    {alert.is_reviewed ? (
                      <span className="text-[10px] font-mono text-alert-green flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Reviewed by {alert.reviewed_by}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReview(alert.id)}
                        className="px-3 py-1 rounded bg-space-card hover:bg-cyan-glow/20 border border-space-border hover:border-cyan-glow text-xs font-mono text-cyan-glow transition-all"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-orbitron font-semibold text-white mt-2">
                  {alert.message}
                </h4>

                {alert.details && (
                  <p className="text-xs font-mono text-slate-300 mt-1 line-clamp-2">
                    {alert.details}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
