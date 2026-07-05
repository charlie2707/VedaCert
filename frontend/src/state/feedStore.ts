import { create } from 'zustand';

export interface FeedEvent {
  id: string; // txHash or combined key
  timestamp: number;
  type: 'mint' | 'revoke' | 'authority_add' | 'authority_status';
  txHash: string;
  details: {
    certId?: string;
    recipient?: string;
    issuer?: string;
    institution?: string;
    name?: string;
    role?: string;
    active?: boolean;
  };
}

interface FeedState {
  events: FeedEvent[];
  addEvent: (event: FeedEvent) => void;
  setEvents: (events: FeedEvent[]) => void;
  clearEvents: () => void;
}

// Prepopulate with some mock events for high-fidelity feel prior to live transactions
const mockEvents: FeedEvent[] = [
  {
    id: 'mock-1',
    timestamp: Date.now() - 3600000 * 2,
    type: 'mint',
    txHash: 'a5c7b8d8...e831',
    details: {
      certId: '0x42f88...71e',
      recipient: 'David Miller',
      issuer: 'Stellar Academy',
    },
  },
  {
    id: 'mock-2',
    timestamp: Date.now() - 3600000 * 5,
    type: 'authority_add',
    txHash: 'f49ea28...a003',
    details: {
      institution: 'GBD23...PLX',
      name: 'Global Tech Institute',
      role: 'Issuer',
    },
  },
  {
    id: 'mock-3',
    timestamp: Date.now() - 3600000 * 12,
    type: 'revoke',
    txHash: 'bb928ca...187d',
    details: {
      certId: '0x77d12...90a',
      recipient: 'Invalid User',
      issuer: 'Stellar Academy',
    },
  },
];

export const useFeedStore = create<FeedState>((set) => ({
  events: mockEvents,
  
  addEvent: (event) => {
    set((state) => {
      // Avoid duplicate events
      if (state.events.some((e) => e.id === event.id)) return state;
      return {
        events: [event, ...state.events].slice(0, 50), // keep last 50 events
      };
    });
  },

  setEvents: (events) => set({ events }),
  
  clearEvents: () => set({ events: [] }),
}));
