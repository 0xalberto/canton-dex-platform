import { create } from 'zustand'
import { Ticker, OrderBook, MarketPair, CandleData } from '@types/index'

interface MarketState {
  currentPair: string
  pairs: MarketPair[]
  tickers: Map<string, Ticker>
  orderBook: OrderBook | null
  candleData: Record<string, CandleData[]>
  isLoading: boolean
  error: string | null

  setCurrentPair: (pair: string) => void
  setPairs: (pairs: MarketPair[]) => void
  setTicker: (symbol: string, ticker: Ticker) => void
  setOrderBook: (book: OrderBook) => void
  setCandleData: (pair: string, data: CandleData[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  currentPair: 'BTC/USD',
  pairs: [],
  tickers: new Map(),
  orderBook: null,
  candleData: {},
  isLoading: false,
  error: null,

  setCurrentPair: (pair) => set({ currentPair: pair }),

  setPairs: (pairs) => set({ pairs }),

  setTicker: (symbol, ticker) =>
    set((state) => ({
      tickers: new Map(state.tickers).set(symbol, ticker),
    })),

  setOrderBook: (book) => set({ orderBook: book }),

  setCandleData: (pair, data) =>
    set((state) => ({
      candleData: {
        ...state.candleData,
        [pair]: data,
      },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}))
