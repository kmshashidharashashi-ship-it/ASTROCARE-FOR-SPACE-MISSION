import React, { useState, useEffect } from 'react';
import { nasaApi } from '../services/api';
import {
  Database,
  Search,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

const NASADataExplorer = () => {
  const [datasets, setDatasets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [liveQuery, setLiveQuery] = useState('');
  const [liveResults, setLiveResults] = useState(null);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await nasaApi.getDatasets(selectedCategory, search);
      setDatasets(res.data.datasets || []);
    } catch (e) {
      console.warn('Could not load NASA datasets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDatasets();
  };

  const handleLiveProbe = async (e) => {
    e.preventDefault();
    if (!liveQuery.trim()) return;
    try {
      const res = await nasaApi.searchLive(liveQuery);
      setLiveResults(res.data);
    } catch (e) {
      console.warn('Live NASA search failed');
    }
  };

  const categories = [
    'Genomics & Human Spaceflight',
    'Spaceflight Immunology',
    'Cardiovascular Space Medicine',
    'Space Radiation Biophysics',
    'Spacecraft Environment & Space Weather',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              NASA OPEN-DATA & SPACE LIFE SCIENCES EXPLORER
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              NASA OSDR (GeneLab), NASA POWER & Life Sciences Data Archive (LSDA)
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-space-card border border-space-border text-xs font-mono text-slate-300">
          Source: Official NASA Open APIs
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-space-surface/85 border border-space-border/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search spaceflight studies (e.g. Twins, Radiation)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-2 pl-9 pr-3 rounded-lg bg-space-dark border border-space-border text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-glow focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-glow hover:bg-cyan-200 text-[#050B16] font-mono font-bold text-xs shrink-0 transition-all"
          >
            SEARCH
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              selectedCategory === ''
                ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/50 font-bold'
                : 'bg-space-dark text-slate-400 border border-space-border hover:bg-space-card'
            }`}
          >
            All Fields
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                selectedCategory === c
                  ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/50 font-bold'
                  : 'bg-space-dark text-slate-400 border border-space-border hover:bg-space-card'
              }`}
            >
              {c.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 hover:border-cyan-glow/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="px-2 py-0.5 rounded bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow font-bold">
                  {d.id}
                </span>
                <span className="text-slate-400">{d.mission}</span>
              </div>

              <h3 className="text-sm font-orbitron font-bold text-white hover:text-cyan-glow transition-colors">
                {d.title}
              </h3>

              <p className="text-xs font-mono text-slate-400 mt-1 line-clamp-3">
                {d.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-space-border/50 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Repository:</span>
                <span className="text-white font-medium">{d.source}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Subject Organism:</span>
                <span className="text-cyan-glow">{d.organism}</span>
              </div>
              {d.doi && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>DOI Reference:</span>
                  <span className="text-slate-300">{d.doi}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-alert-green flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" /> OFFICIAL NASA DATASET
                </span>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded bg-space-dark hover:bg-space-card border border-space-border text-xs font-mono text-cyan-glow flex items-center gap-1 transition-colors"
                >
                  <span>Open OSDR</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live NASA API Query Sandbox */}
      <div className="p-5 rounded-2xl bg-space-surface/90 border border-space-border/80 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-glow" />
          <h3 className="text-xs font-orbitron font-bold text-white uppercase">
            Live NASA OSDR Endpoint Query Engine
          </h3>
        </div>
        <p className="text-xs font-mono text-slate-400">
          Query live NASA Open Science Data Repository indices with real-time JSON response inspection.
        </p>

        <form onSubmit={handleLiveProbe} className="flex gap-2">
          <input
            type="text"
            placeholder="Search NASA OSDR live endpoint (e.g. Apollo, Bone, Mitochondria)..."
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            className="flex-1 py-2 px-3 rounded-lg bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-holo-blue hover:bg-blue-600 text-white font-mono font-bold text-xs shrink-0 transition-all shadow-md"
          >
            QUERY OSDR API
          </button>
        </form>

        {liveResults && (
          <div className="p-4 rounded-xl bg-space-dark border border-space-border/60 text-xs font-mono text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-cyan-glow">
              <span>Mode: {liveResults.mode} • Count: {liveResults.count}</span>
              <span>Status: {liveResults.status}</span>
            </div>
            <pre className="p-3 bg-black/60 rounded text-[11px] overflow-x-auto text-emerald-300 max-h-48">
              {JSON.stringify(liveResults.results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default NASADataExplorer;
