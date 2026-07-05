'use client';

import React, { useState, useEffect } from 'react';
import { useTxStore, TxStatus } from '../../state/txStore';
import { ShieldCheck, Loader2, AlertCircle, RefreshCw, ExternalLink, Database, Trash2 } from 'lucide-react';

interface LocalTxLog {
  id: string;
  description: string;
  txHash: string | null;
  status: TxStatus;
  timestamp: number;
  error?: string;
}

export default function TransactionCenter() {
  const { status: activeStatus, txHash: activeHash, error: activeError, description: activeDesc, resetTx } = useTxStore();
  const [logs, setLogs] = useState<LocalTxLog[]>([]);

  useEffect(() => {
    // Sync active state from txStore to local logs
    const saved = localStorage.getItem('vedacert_tx_logs');
    let parsed: LocalTxLog[] = saved ? JSON.parse(saved) : [];

    // Seed mock data if empty
    if (parsed.length === 0) {
      parsed = [
        {
          id: 'tx-seed-1',
          description: 'Minted certificate for Alice Vance (Hash: 0xabc123...)',
          txHash: 'a5c7b8d8e831...e831',
          status: 'confirmed',
          timestamp: Date.now() - 3600000 * 2,
        },
        {
          id: 'tx-seed-2',
          description: 'Revoked certificate (Hash: 0x77d12...)',
          txHash: 'bb928ca9f187d...187d',
          status: 'confirmed',
          timestamp: Date.now() - 3600000 * 5,
        },
        {
          id: 'tx-seed-3',
          description: 'Add new authority: Global Tech Institute',
          txHash: null,
          status: 'failed',
          timestamp: Date.now() - 3600000 * 8,
          error: 'Transaction simulation failed: Host error: unauthorized administrator signature',
        },
      ];
      localStorage.setItem('vedacert_tx_logs', JSON.stringify(parsed));
    }

    if (activeStatus !== 'idle') {
      const activeLogId = 'tx-active';
      const existingIdx = parsed.findIndex(l => l.id === activeLogId);

      const logEntry: LocalTxLog = {
        id: activeLogId,
        description: activeDesc || 'Contract invocation',
        txHash: activeHash,
        status: activeStatus,
        timestamp: Date.now(),
        error: activeError || undefined,
      };

      if (existingIdx >= 0) {
        parsed[existingIdx] = logEntry;
      } else {
        parsed = [logEntry, ...parsed];
      }
    }

    setLogs(parsed);
  }, [activeStatus, activeHash, activeError, activeDesc]);

  const clearHistory = () => {
    localStorage.removeItem('vedacert_tx_logs');
    setLogs([]);
    resetTx();
  };

  const handleRetry = (log: LocalTxLog) => {
    alert(`Re-initiating: ${log.description}. Please confirm transaction sign request in your wallet.`);
    // Triggers active Tx store lifecycle simulate
    const { startTx } = useTxStore.getState();
    startTx(log.description);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
            <Database className="h-6 w-6 text-zinc-500" />
            Transaction Center
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Audit logs and verify lifecycle status of all contract write transactions.
          </p>
        </div>

        <button
          onClick={clearHistory}
          className="text-3xs text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1.5 border border-[var(--glass-border)] px-3 py-1.5 rounded-lg"
        >
          <Trash2 className="h-3 w-3" />
          RESET LEDGER HISTORY
        </button>
      </div>

      <div className="space-y-4">
        {logs.map((log) => {
          const explorerLink = log.txHash ? `https://stellar.expert/explorer/testnet/tx/${log.txHash}` : null;
          
          return (
            <div 
              key={log.id} 
              className={`glass-panel p-5 bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
                log.status === 'confirmed' 
                  ? 'border-emerald-500/10' 
                  : log.status === 'failed' 
                  ? 'border-red-500/10' 
                  : 'border-cyan-500/10'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {log.status === 'confirmed' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(16,185,129,0.1)] px-2.5 py-0.5 text-2xs font-semibold text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      CONFIRMED
                    </span>
                  )}
                  {log.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.1)] px-2.5 py-0.5 text-2xs font-semibold text-amber-500 border border-amber-500/20">
                      <AlertCircle className="h-3.5 w-3.5" />
                      FAILED
                    </span>
                  )}
                  {(log.status === 'pending' || log.status === 'processing') && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(6,182,212,0.1)] px-2.5 py-0.5 text-2xs font-semibold text-cyan-400 border border-cyan-500/20">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      PROCESSING
                    </span>
                  )}
                  
                  <span className="text-3xs text-zinc-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white tracking-wide">
                  {log.description}
                </h3>

                {log.error && (
                  <p className="mt-2 text-2xs font-mono text-zinc-400 bg-red-950/10 border border-red-900/10 p-2 rounded">
                    {log.error}
                  </p>
                )}

                {explorerLink && (
                  <div className="mt-3 flex items-center gap-4">
                    <a
                      href={explorerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-3xs text-cyan-400 hover:underline font-mono"
                    >
                      Tx Hash: {log.txHash?.slice(0, 16)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {log.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(log)}
                    className="glass-button px-4 py-2 text-2xs gap-1.5 border border-zinc-500/20 text-zinc-300 hover:text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    RETRY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
