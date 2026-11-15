import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full p-8 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center text-cyan-glow shadow-[0_0_20px_rgba(50,230,224,0.2)]">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-holo-blue/15 text-holo-blue border border-holo-blue/30 font-semibold">
            TELEMETRY SECTOR 404
          </span>
          <h1 className="text-2xl font-orbitron font-bold text-white mt-2">
            Orbit Coordinate Undefined
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-2">
            The requested mission telemetry endpoint does not exist or has been redirected to another orbital station.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-glow to-holo-blue text-[#050B16] font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(50,230,224,0.3)] hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
