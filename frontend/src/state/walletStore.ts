import { create } from 'zustand';
import {
  StellarWalletsKit,
  WalletNetwork,
  WalletType,
  SUPPORTED_WALLETS,
} from '@creit.tech/stellar-wallets-kit';

interface WalletState {
  address: string | null;
  walletType: WalletType | null;
  network: WalletNetwork;
  kit: StellarWalletsKit | null;
  isConnecting: boolean;
  error: string | null;
  initializeKit: () => void;
  connect: (type: WalletType) => Promise<string | null>;
  disconnect: () => void;
  switchNetwork: (network: WalletNetwork) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  walletType: null,
  network: WalletNetwork.TESTNET,
  kit: null,
  isConnecting: false,
  error: null,

  initializeKit: () => {
    if (get().kit) return;

    const kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWallet: WalletType.FREIGHTER,
      modules: SUPPORTED_WALLETS,
    });

    set({ kit });
  },

  connect: async (type: WalletType) => {
    set({ isConnecting: true, error: null });
    let { kit } = get();
    
    if (!kit) {
      kit = new StellarWalletsKit({
        network: get().network,
        selectedWallet: type,
        modules: SUPPORTED_WALLETS,
      });
      set({ kit });
    } else {
      kit.setWallet(type);
    }

    try {
      const { address } = await kit.getAddress();
      set({
        address,
        walletType: type,
        isConnecting: false,
      });
      return address;
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      const errMsg = err?.message || 'Connection request rejected by user';
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

  switchNetwork: (network: WalletNetwork) => {
    const { kit } = get();
    if (kit) {
      // Re-instantiate kit for the new network
      const newKit = new StellarWalletsKit({
        network,
        selectedWallet: get().walletType || WalletType.FREIGHTER,
        modules: SUPPORTED_WALLETS,
      });
      set({ network, kit: newKit });
    } else {
      set({ network });
    }
  },
}));
