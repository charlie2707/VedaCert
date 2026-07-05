'use client';

import React, { useState } from 'react';
import { useFeedStore, FeedEvent } from '../../state/feedStore';
import { Activity, Clock, ShieldAlert, Award, UserPlus, Play, ExternalLink } from 'lucide-react';

export default function ActivityFeed() {
  const { events, addEvent, clearEvents } = useFeedStore();
  const [simulationActive, setSimulationActive] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const toggleSimulation = () => {
    if (simulationActive) {
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      setSimulationActive(false);
    } else {
      const id = setInterval(() => {
        // Generate simulated event
        const types: Array<'mint' | 'revoke' | 'authority_add'> = ['mint', 'revoke', 'authority_add'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const idVal = 'sim-' + Math.floor(Math.random() * 1000000);
        
        let newEv: FeedEvent;
        if (randomType === 'mint') {
          const names = ['Clara Oswald', 'John Watson', 'Bruce Wayne', 'Diana Prince'];
          const randomName = names[Math.floor(Math.random() * names.length)];
          newEv = {
            id: idVal,
            timestamp: Date.now(),
            type: 'mint',
            txHash: '0x' + Math.floor(Math.random() * 1000000).toString(16) + '...f0ea',
            details: {
              certId: '0x' + Math.floor(Math.random() * 100000).toString(16) + '...ae88',
              recipient: randomName,
              issuer: 'Stellar Academy',
            },
          };
        } else if (randomType === 'revoke') {
          newEv = {
            id: idVal,
            timestamp: Date.now(),
            type: 'revoke',
            txHash: '0x' + Math.floor(Math.random() * 1000000).toString(16) + '...8c92',
            details: {
              certId: '0x' + Math.floor(Math.random() * 100000).toString(16) + '...44b1',
              recipient: 'Revoked Recipient',
              issuer: 'Global Tech Institute',
            },
          };
        } else {
          const insts = ['University of Europe', 'Stellar Devs Labs', 'VeriCorp Org'];
          const randomInst = insts[Math.floor(Math.random() * insts.length)];
          newEv = {
            id: idVal,
            timestamp: Date.now(),
            type: 'authority_add',
            txHash: '0x' + Math.floor(Math.random() * 1000000).toString(16) + '...bb8c',
            details: {
              institution: 'GB' + Math.floor(Math.random() * 100000).toString(36).toUpperCase() + '...XYZ',
              name: randomInst,
              role: 'Issuer',
            },
          };
        }

        addEvent(newEv);
      }, 4000);
      
      setTimerId(id);
      setSimulationActive(true);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
            <Activity className="h-6 w-6 text-cyan-400 glow-text" />
            Live Activity Feed
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time chronological events logs emitted by VedaCert smart contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleSimulation}
            className={`glass-button px-3.5 py-1.5 text-2xs font-semibold gap-2 border ${
              simulationActive 
                ? 'text-cyan-400 border-cyan-400/20 bg-cyan-950/10' 
                : 'text-zinc-400 border-[var(--glass-border)]'
            }`}
          >
            <Play className={`h-3 w-3 ${simulationActive ? 'animate-pulse text-cyan-400' : ''}`} />
            {simulationActive ? 'SIMULATION ACTIVE' : 'SIMULATE FEEDS'}
          </button>
          
          <button
            onClick={clearEvents}
            className="text-3xs text-zinc-600 hover:text-zinc-400 font-mono transition-colors border border-[var(--glass-border)] px-2 py-1.5 rounded-lg"
          >
            CLEAR LOGS
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="glass-panel p-16 text-center border-dashed border-[var(--glass-border)]">
          <Clock className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-xs">Waiting for contract events to stream...</p>
        </div>
      ) : (
        <div className="relative border-l border-zinc-900 ml-4 pl-6 space-y-6">
          {events.map((ev) => {
            const dateStr = new Date(ev.timestamp).toLocaleTimeString();
            return (
              <div 
                key={ev.id} 
                className="relative group transition-all duration-300 animate-in slide-in-from-top-3 duration-250"
              >
                {/* Visual node on timeline */}
                <div 
                  className={`absolute -left-10 top-1 h-8 w-8 rounded-full flex items-center justify-center border bg-[var(--background)] transition-all group-hover:scale-110 ${
                    ev.type === 'mint'
                      ? 'border-emerald-500/20 text-emerald-400'
                      : ev.type === 'revoke'
                      ? 'border-red-500/20 text-red-400'
                      : 'border-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {ev.type === 'mint' && <Award className="h-4 w-4" />}
                  {ev.type === 'revoke' && <ShieldAlert className="h-4 w-4" />}
                  {ev.type === 'authority_add' && <UserPlus className="h-4 w-4" />}
                  {ev.type === 'authority_status' && <Clock className="h-4 w-4" />}
                </div>

                <div className="glass-panel p-4 bg-zinc-950/20 group-hover:bg-zinc-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className={`text-3xs font-mono font-bold uppercase tracking-wider ${
                        ev.type === 'mint'
                          ? 'text-emerald-400'
                          : ev.type === 'revoke'
                          ? 'text-red-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {ev.type === 'mint' && 'CREDENTIAL MINTED'}
                      {ev.type === 'revoke' && 'CREDENTIAL REVOKED'}
                      {ev.type === 'authority_add' && 'AUTHORITY REGISTERED'}
                      {ev.type === 'authority_status' && 'STATUS CHANGED'}
                    </span>
                    <span className="text-3xs text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 leading-normal">
                    {ev.type === 'mint' && (
                      <>
                        Certificate minted for <strong className="text-white font-medium">{ev.details.recipient}</strong>. 
                        <div className="mt-2 text-3xs text-zinc-500 font-mono">Cert ID: {ev.details.certId}</div>
                      </>
                    )}
                    {ev.type === 'revoke' && (
                      <>
                        Credential <strong className="text-white font-medium">{ev.details.certId}</strong> has been cancelled by issuer.
                      </>
                    )}
                    {ev.type === 'authority_add' && (
                      <>
                        Institution <strong className="text-white font-medium">{ev.details.name}</strong> ({ev.details.role}) onboarded to registry.
                      </>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between text-3xs text-zinc-500">
                    <span>Issuer: {ev.details.issuer || ev.details.institution}</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      Hash: {ev.txHash.slice(0, 10)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
