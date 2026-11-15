import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { astronautsApi, healthApi, demoApi, emergencyApi } from '../services/api';
import { wsClient } from '../services/websocket';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [astronauts, setAstronauts] = useState([
    {
      astronaut_id: 'AST-001',
      name: 'Commander Alex Chen',
      role: 'Mission Commander',
      mission_name: 'Artemis IV – Lunar Gateway',
      blood_type: 'O+',
      avatar_initials: 'AC',
    },
    {
      astronaut_id: 'AST-002',
      name: 'Dr. Sarah Lindqvist',
      role: 'Flight Surgeon',
      mission_name: 'Artemis IV – Lunar Gateway',
      blood_type: 'A+',
      avatar_initials: 'SL',
    },
    {
      astronaut_id: 'AST-003',
      name: 'Marcus Vance',
      role: 'Systems Engineer',
      mission_name: 'Artemis IV – Lunar Gateway',
      blood_type: 'B+',
      avatar_initials: 'MV',
    },
    {
      astronaut_id: 'AST-004',
      name: 'Elena Rostova',
      role: 'Payload Specialist',
      mission_name: 'Artemis IV – Lunar Gateway',
      blood_type: 'AB-',
      avatar_initials: 'ER',
    },
  ]);

  const [selectedAstronautId, setSelectedAstronautId] = useState('AST-001');
  const [selectedOrgan, setSelectedOrgan] = useState('heart'); // 'heart' | 'lungs' | 'brain' | 'skeleton' | null
  const [selectedOrganViewMode, setSelectedOrganViewMode] = useState('standard'); // 'standard' | 'xray' | 'hologram'

  // Live physiological telemetry values (animated & updated via WS)
  const [telemetry, setTelemetry] = useState({
    heart_rate: 72.0,
    oxygen_saturation: 98.4,
    systolic_bp: 120.0,
    diastolic_bp: 78.0,
    respiratory_rate: 14.5,
    body_temperature: 36.7,
    sleep_duration: 7.4,
    stress_index: 3.2,
    fatigue_level: 3.5,
    bone_load_pct: 92.0,
    is_simulated: true,
    last_updated: new Date().toLocaleTimeString(),
  });

  const [environment, setEnvironment] = useState({
    cabin_o2: 21.0,
    cabin_co2: 2.2,
    cabin_pressure: 101.3,
    cabin_temp: 22.4,
    humidity: 48.0,
    status: 'nominal',
  });

  const [radiation, setRadiation] = useState({
    current_rate: 25.2,
    cumulative_dose: 14.8,
    status: 'normal',
    spe_active: false,
  });

  // Emergency Decision Support state
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Guided Demonstration state
  const [demoState, setDemoState] = useState({
    is_active: false,
    current_step: 1,
    status: 'idle',
    last_event: null,
  });

  const fetchActiveEmergencies = useCallback(async (shouldPopupAlert = false) => {
    try {
      const res = await emergencyApi.getActiveAlerts();
      if (res.data && res.data.alerts) {
        setActiveEmergencies(res.data.alerts);
        // Only trigger banner pop-up if explicitly instructed (e.g. following an emergency drill or user action)
        if (shouldPopupAlert && res.data.alerts.length > 0) {
          const top = res.data.alerts[0];
          setActiveEmergencyAlert({
            id: top.id,
            title: top.title,
            severity: top.severity,
            organ: top.organ_affected || 'heart',
            explanation: top.ai_explanation,
            recommendation: top.protocol?.response_steps?.[0]?.action || 'Clinical evaluation required',
            timestamp: top.created_at ? new Date(top.created_at).toLocaleTimeString() : 'NOW',
          });
          if (top.organ_affected) {
            setSelectedOrgan(top.organ_affected);
          }
        }
      }
    } catch (e) {
      console.info('Emergency alerts check complete.');
    }
  }, []);

  // Fetch astronauts and initial emergencies from backend
  useEffect(() => {
    const fetchAstronauts = async () => {
      try {
        const res = await astronautsApi.getAll();
        if (res.data && res.data.length > 0) {
          setAstronauts(res.data);
        }
      } catch (e) {
        console.info('Using default crew catalog');
      }
    };
    fetchAstronauts();
    fetchActiveEmergencies();
  }, [fetchActiveEmergencies]);

  // Initialize WebSockets
  useEffect(() => {
    wsClient.connect();

    const handleEmergencyPacket = (packet) => {
      fetchActiveEmergencies();
      const organ = packet.organ_affected || packet.alert?.organ_affected || 'heart';
      setSelectedOrgan(organ);

      const title = packet.alert?.title || packet.alert?.message || 'CRITICAL PHYSIOLOGICAL ALERT DETECTED';
      const severity = packet.risk_category || packet.alert?.severity || 'CRITICAL';
      const explanation = packet.alert?.ai_explanation || packet.alert?.details?.ai_explanation || 'Acute vital sign deviation detected.';
      const recommendation =
        packet.alert?.protocol?.response_steps?.[0]?.action ||
        packet.alert?.details?.ai_recommendation ||
        'Immediate flight surgeon assessment mandatory.';

      setActiveEmergencyAlert({
        id: packet.alert?.id || Date.now(),
        title,
        severity,
        organ,
        explanation,
        recommendation,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const unsubTelemetry = wsClient.subscribeTelemetry((packet) => {
      if (packet.event === 'TELEMETRY_TICK' && packet.metrics) {
        setTelemetry((prev) => ({
          ...prev,
          heart_rate: packet.metrics.heart_rate,
          oxygen_saturation: packet.metrics.oxygen_saturation,
          respiratory_rate: packet.metrics.respiratory_rate,
          body_temperature: packet.metrics.body_temperature,
          systolic_bp: packet.metrics.systolic_bp || prev.systolic_bp,
          diastolic_bp: packet.metrics.diastolic_bp || prev.diastolic_bp,
          last_updated: new Date().toLocaleTimeString(),
        }));

        // AI Anomaly Surveillance: trigger critical alert ONLY when AI detects vital sign crisis
        const m = packet.metrics;
        const isAcuteCardiac = m.heart_rate > 130 || m.heart_rate < 45;
        const isAcuteHypoxia = m.oxygen_saturation < 90.0;
        const isAcuteHyperthermia = m.body_temperature > 39.0;

        if (isAcuteCardiac || isAcuteHypoxia || isAcuteHyperthermia) {
          const organ = isAcuteCardiac ? 'heart' : isAcuteHypoxia ? 'lungs' : 'brain';
          setSelectedOrgan(organ);
          setActiveEmergencyAlert({
            id: Date.now(),
            title: isAcuteCardiac
              ? `AI CRITICAL ALERT: Tachycardia (${m.heart_rate} bpm)`
              : isAcuteHypoxia
              ? `AI CRITICAL ALERT: Severe Hypoxia (SpO2 ${m.oxygen_saturation}%)`
              : `AI CRITICAL ALERT: Hyperthermia (${m.body_temperature}°C)`,
            severity: 'CRITICAL',
            organ,
            explanation: 'Autonomous telemetry AI identified critical divergence from astronaut clinical baseline.',
            recommendation: 'Immediate Flight Surgeon consultation and vital sign verification mandatory.',
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } else if (packet.event === 'ABNORMAL_READING_TRIGGERED') {
        const rec = packet.health_record;
        if (rec) {
          setTelemetry((prev) => ({
            ...prev,
            heart_rate: rec.heart_rate || prev.heart_rate,
            oxygen_saturation: rec.oxygen_saturation || prev.oxygen_saturation,
            systolic_bp: rec.systolic_bp || prev.systolic_bp,
            diastolic_bp: rec.diastolic_bp || prev.diastolic_bp,
            body_temperature: rec.body_temperature || prev.body_temperature,
            last_updated: new Date().toLocaleTimeString(),
          }));
        }
        handleEmergencyPacket(packet);
      }
    });

    const unsubAlerts = wsClient.subscribeAlerts((alertPacket) => {
      if (
        alertPacket.event === 'ABNORMAL_READING_TRIGGERED' ||
        alertPacket.event?.startsWith('EMERGENCY_')
      ) {
        handleEmergencyPacket(alertPacket);
      }
    });

    const unsubStatus = wsClient.subscribeStatus((connected) => {
      setWsConnected(connected);
    });

    return () => {
      unsubTelemetry();
      unsubAlerts();
      unsubStatus();
    };
  }, [fetchActiveEmergencies]);

  const acknowledgeEmergencyAlert = () => {
    setActiveEmergencyAlert(null);
  };

  const selectedAstronaut = astronauts.find((a) => a.astronaut_id === selectedAstronautId) || astronauts[0];

  return (
    <TelemetryContext.Provider
      value={{
        astronauts,
        selectedAstronautId,
        setSelectedAstronautId,
        selectedAstronaut,
        selectedOrgan,
        setSelectedOrgan,
        selectedOrganViewMode,
        setSelectedOrganViewMode,
        telemetry,
        setTelemetry,
        environment,
        radiation,
        activeEmergencyAlert,
        setActiveEmergencyAlert,
        acknowledgeEmergencyAlert,
        activeEmergencies,
        fetchActiveEmergencies,
        wsConnected,
        demoState,
        setDemoState,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within a TelemetryProvider');
  return ctx;
};
