'use client';

import React from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Cpu, Heart, CheckCircle } from 'lucide-react';

export default function Analytics() {
  // Static high-fidelity metric data
  const metrics = [
    { name: 'Total Registered Institutions', value: '14', change: '+2 this month', icon: <Cpu className="h-4 w-4" /> },
    { name: 'On-Chain Verifications Run', value: '1,842', change: '99.9% uptime', icon: <Heart className="h-4 w-4 text-rose-500" /> },
    { name: 'Active Secure Vault Keys', value: '412', change: 'persistent storage', icon: <CheckCircle className="h-4 w-4 text-emerald-400" /> },
    { name: 'Average Block Confirms', value: '5.1s', change: 'instant network feedback', icon: <TrendingUp className="h-4 w-4 text-cyan-400" /> },
  ];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 pb-6 border-b border-[var(--glass-border)]">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
          <BarChart3 className="h-6 w-6 text-cyan-400 glow-text" />
          Network Analytics
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Cryptographic validation metrics, storage footprints, and registry statistics.
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {metrics.map((m, idx) => (
          <div key={idx} className="glass-panel p-5 bg-zinc-950/20">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-3xs uppercase font-mono tracking-wider">{m.name}</span>
              {m.icon}
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{m.value}</div>
            <div className="text-4xs text-zinc-400 mt-1 font-mono">{m.change}</div>
          </div>
        ))}
      </div>

      {/* Main analytics panels */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left metrics panel: Monthly distribution */}
        <div className="lg:col-span-2 glass-panel p-6 bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-white mb-6">Monthly Verification Volume</h3>

          {/* Simple custom flex chart */}
          <div className="h-64 flex items-end justify-between gap-2 pt-4 border-b border-zinc-900 pb-1">
            {[
              { label: 'Jan', val: '40%' },
              { label: 'Feb', val: '25%' },
              { label: 'Mar', val: '65%' },
              { label: 'Apr', val: '50%' },
              { label: 'May', val: '80%' },
              { label: 'Jun', val: '95%' },
              { label: 'Jul', val: '10%' }, // current month start
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Bar */}
                <div 
                  className="w-full bg-zinc-900 group-hover:bg-white border border-[var(--glass-border)] rounded-t-sm transition-all duration-300 relative"
                  style={{ height: col.val }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {col.val}
                  </span>
                </div>
                {/* Label */}
                <span className="text-4xs text-zinc-500 font-mono">{col.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-4xs text-zinc-500 font-mono">
            <span>Query source: Horizon indexing pipeline</span>
            <span>Uptime index: 1.0</span>
          </div>
        </div>

        {/* Right metrics panel: Distribution proportions */}
        <div className="lg:col-span-1 glass-panel p-6 bg-zinc-950/30 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-6">Storage Distribution</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-3xs text-zinc-400 mb-1">
                  <span>PERSISTENT STORAGE (VAULT DATA)</span>
                  <span>78%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-3xs text-zinc-400 mb-1">
                  <span>INSTANCE STORAGE (ACCESS PARADIGMS)</span>
                  <span>15%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[15%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-3xs text-zinc-400 mb-1">
                  <span>TEMPORARY METRICS (LOG ARCHIVES)</span>
                  <span>7%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-500 w-[7%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded bg-zinc-900/40 p-4 border border-[var(--glass-border)] text-3xs leading-relaxed text-zinc-400">
            <strong>State Archival Notice:</strong> Under Soroban protocols, persistent storage requires periodic balance maintenance or validation check-ins. VedaCert manages lease cycles automatically.
          </div>
        </div>

      </div>
    </div>
  );
}
