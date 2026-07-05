'use client';

import React from 'react';
import { useTxStore } from '../state/txStore';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X } from 'lucide-react';

export default function TransactionCenterToast() {
  const { status, txHash, error, description, resetTx } = useTxStore();

  if (status === 'idle') return null;

  const explorerLink = txHash ? `https://stellar.expert/explorer/testnet/tx/${txHash}` : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl border border-[var(--glass-border)] bg-[rgba(10,10,12,0.92)] p-4 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {/* Status Icons */}
            {(status === 'pending' || status === 'processing') && (
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            )}
            {status === 'confirmed' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
            {status === 'failed' && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            
            <h4 className="text-sm font-semibold capitalize text-white">
              {status === 'pending' && 'Submitting...'}
              {status === 'processing' && 'Processing...'}
              {status === 'confirmed' && 'Transaction Confirmed!'}
              {status === 'failed' && 'Transaction Failed'}
            </h4>
          </div>

          <p className="mt-1 text-xs text-zinc-400">
            {description}
          </p>

          {error && (
            <p className="mt-2 rounded bg-red-950/30 p-2 text-2xs font-mono text-red-400 border border-red-900/20">
              {error}
            </p>
          )}

          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-2xs text-cyan-400 hover:underline"
            >
              View on StellarExpert
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <button
          onClick={resetTx}
          className="text-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
