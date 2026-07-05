import { create } from 'zustand';

export type TxStatus = 'idle' | 'pending' | 'processing' | 'confirmed' | 'failed';

interface TxState {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  description: string | null;
  startTx: (description: string) => void;
  setProcessing: (txHash: string) => void;
  confirmTx: (txHash: string) => void;
  failTx: (error: string) => void;
  resetTx: () => void;
}

export const useTxStore = create<TxState>((set) => ({
  status: 'idle',
  txHash: null,
  error: null,
  description: null,

  startTx: (description) => {
    set({
      status: 'pending',
      txHash: null,
      error: null,
      description,
    });
  },

  setProcessing: (txHash) => {
    set({
      status: 'processing',
      txHash,
      error: null,
    });
  },

  confirmTx: (txHash) => {
    set({
      status: 'confirmed',
      txHash,
      error: null,
    });
  },

  failTx: (error) => {
    set({
      status: 'failed',
      error,
    });
  },

  resetTx: () => {
    set({
      status: 'idle',
      txHash: null,
      error: null,
      description: null,
    });
  },
}));
