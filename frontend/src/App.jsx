import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TelemetryProvider } from './context/TelemetryContext';
import ErrorBoundary from './components/common/ErrorBoundary';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import AlertBanner from './components/layout/AlertBanner';
import StarfieldBackground from './components/layout/StarfieldBackground';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AstronautMonitor from './pages/AstronautMonitor';
import AnatomyExplorer from './pages/AnatomyExplorer';
import HealthAnalytics from './pages/HealthAnalytics';
import AIAnalysis from './pages/AIAnalysis';
import RadiationMonitor from './pages/RadiationMonitor';
import WellnessMonitor from './pages/WellnessMonitor';
import EnvironmentMonitor from './pages/EnvironmentMonitor';
import Alerts from './pages/Alerts';
import NASADataExplorer from './pages/NASADataExplorer';
import Reports from './pages/Reports';
import Demonstration from './pages/Demonstration';
import Settings from './pages/Settings';
import EmergencyAssistant from './pages/EmergencyAssistant';
import NotFound from './pages/NotFound';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050B16] text-cyan-glow font-mono text-sm relative">
        <StarfieldBackground />
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-space-surface/90 border border-cyan-glow/30 shadow-[0_0_40px_rgba(50,230,224,0.2)] backdrop-blur-xl z-10">
          <div className="w-10 h-10 border-2 border-cyan-glow border-t-transparent rounded-full animate-spin" />
          <div className="text-center space-y-1">
            <span className="font-orbitron font-bold tracking-wider text-white text-base">ASTROCARE 3D</span>
            <p className="text-xs text-cyan-glow/80">CONNECTING TO LUNAR GATEWAY TELEMETRY...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050B16] text-slate-100 relative">
      <StarfieldBackground />
      <Navbar />
      <AlertBanner />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/twin" element={<AstronautMonitor />} />
                <Route path="/anatomy" element={<AnatomyExplorer />} />
                <Route path="/health" element={<HealthAnalytics />} />
                <Route path="/ai" element={<AIAnalysis />} />
                <Route path="/radiation" element={<RadiationMonitor />} />
                <Route path="/wellness" element={<WellnessMonitor />} />
                <Route path="/environment" element={<EnvironmentMonitor />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/assistant" element={<EmergencyAssistant />} />
                <Route path="/nasa" element={<NASADataExplorer />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/demo" element={<Demonstration />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <TelemetryProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </TelemetryProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
