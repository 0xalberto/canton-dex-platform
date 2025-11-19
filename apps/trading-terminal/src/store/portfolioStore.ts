import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Asset {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  price: number;
}

export interface Transaction {
  id: string;
  asset: string;
  type: 'Deposit' | 'Withdraw' | 'Trade' | 'Buy' | 'Sell';
  amount: string;
  timestamp: number;
  status: 'Completed' | 'Pending' | 'Failed';
  txHash?: string;
}

interface PortfolioState {
  assets: Record<string, Asset>;
  transactions: Transaction[];
  totalValue: number;

  // Actions
  deposit: (asset: string, amount: number) => void;
  withdraw: (asset: string, amount: number) => void;
  updateBalance: (asset: string, newBalance: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  calculateTotalValue: () => void;
}

const initialAssets: Record<string, Asset> = {
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: '0.5',
    value: '$22,617',
    change: '+12.5%',
    trend: 'up',
    price: 92500
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '2.0',
    value: '$5,668',
    change: '+8.3%',
    trend: 'up',
    price: 2834
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    balance: '10',
    value: '$1,085',
    change: '-3.2%',
    trend: 'down',
    price: 108.5
  },
  'USDT': {
    symbol: 'USDT',
    name: 'Tether',
    balance: '5000',
    value: '$5,000',
    change: '0%',
    trend: 'neutral',
    price: 1
  },
  'tTBILL': {
    symbol: 'tTBILL',
    name: 'Tokenized T-Bill',
    balance: '0',
    value: '$0',
    change: '0%',
    trend: 'neutral',
    price: 10000
  }
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      assets: initialAssets,
      transactions: [],
      totalValue: 34370,

      deposit: (asset: string, amount: number) => {
        const assets = get().assets;
        const currentAsset = assets[asset];

        if (!currentAsset) return;

        const currentBalance = parseFloat(currentAsset.balance.replace(',', ''));
        const newBalance = currentBalance + amount;
        const newValue = newBalance * currentAsset.price;

        set((state) => ({
          assets: {
            ...state.assets,
            [asset]: {
              ...currentAsset,
              balance: newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
              value: `$${newValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            }
          }
        }));

        get().addTransaction({
          asset,
          type: 'Deposit',
          amount: `+${amount}`,
          status: 'Completed'
        });

        get().calculateTotalValue();
      },

      withdraw: (asset: string, amount: number) => {
        const assets = get().assets;
        const currentAsset = assets[asset];

        if (!currentAsset) return;

        const currentBalance = parseFloat(currentAsset.balance.replace(',', ''));

        if (currentBalance < amount) {
          console.error('Insufficient balance');
          return;
        }

        const newBalance = currentBalance - amount;
        const newValue = newBalance * currentAsset.price;

        set((state) => ({
          assets: {
            ...state.assets,
            [asset]: {
              ...currentAsset,
              balance: newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
              value: `$${newValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            }
          }
        }));

        get().addTransaction({
          asset,
          type: 'Withdraw',
          amount: `-${amount}`,
          status: 'Completed'
        });

        get().calculateTotalValue();
      },

      updateBalance: (asset: string, newBalance: number) => {
        const assets = get().assets;
        const currentAsset = assets[asset];

        if (!currentAsset) return;

        const newValue = newBalance * currentAsset.price;

        set((state) => ({
          assets: {
            ...state.assets,
            [asset]: {
              ...currentAsset,
              balance: newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
              value: `$${newValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            }
          }
        }));

        get().calculateTotalValue();
      },

      addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
        const newTx: Transaction = {
          ...tx,
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 100) // Keep last 100
        }));
      },

      calculateTotalValue: () => {
        const assets = get().assets;
        const total = Object.values(assets).reduce((sum, asset) => {
          const value = parseFloat(asset.value.replace('$', '').replace(',', ''));
          return sum + value;
        }, 0);

        set({ totalValue: total });
      }
    }),
    {
      name: 'cantondex-portfolio-storage',
    }
  )
);
