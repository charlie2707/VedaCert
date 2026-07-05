import { create } from 'zustand';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';

interface WalletState {
  address: string | null;
  walletType: string | null;
  network: Networks;
  isConnecting: boolean;
  error: string | null;
  initializeKit: () => void;
  connect: (type: string) => Promise<string | null>;
  disconnect: () => void;
  switchNetwork: (network: Networks) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  walletType: null,
  network: Networks.TESTNET,
  isConnecting: false,
  error: null,

  initializeKit: () => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: defaultModules(),
    });
  },

  connect: async (type: string) => {
    set({ isConnecting: true, error: null });
    
    try {
      StellarWalletsKit.setNetwork(get().network);
      StellarWalletsKit.setWallet(type);

      const { address } = await StellarWalletsKit.getAddress();
      set({
        address,
        walletType: type,
        isConnecting: false,
      });
      return address;
    } catch (err) {
      console.error('Wallet connection failed:', err);
      const errMsg = (err as Error)?.message || 'Connection request rejected by user';
      set({
        error: errMsg,
        isConnecting: false,
      });
      return null;
    }
  },

  disconnect: () => {
    set({ address: null, walletType: null });
  },

  switchNetwork: (network: Networks) => {
    StellarWalletsKit.setNetwork(network);
    set({ network });
  },
}));
