import { create } from 'zustand'
import { Account, Asset } from '@types/index'

interface AccountState {
  account: Account | null
  assets: Asset[]
  isLoading: boolean
  error: string | null

  setAccount: (account: Account) => void
  setAssets: (assets: Asset[]) => void
  updateAsset: (symbol: string, asset: Partial<Asset>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearAccount: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  account: null,
  assets: [],
  isLoading: false,
  error: null,

  setAccount: (account) => set({ account }),

  setAssets: (assets) => set({ assets }),

  updateAsset: (symbol, update) =>
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.symbol === symbol ? { ...asset, ...update } : asset
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearAccount: () =>
    set({
      account: null,
      assets: [],
      error: null,
    }),
}))
