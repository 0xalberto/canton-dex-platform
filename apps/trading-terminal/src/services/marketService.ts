import api from './api'
import { Ticker, OrderBook, MarketPair, CandleData, Timeframe, Trade } from '@types/index'

export const marketService = {
  async getMarketPairs(): Promise<MarketPair[]> {
    const response = await api.get<MarketPair[]>('/market/pairs')
    return response.data
  },

  async getTicker(symbol: string): Promise<Ticker> {
    const response = await api.get<Ticker>(`/market/ticker/${symbol}`)
    return response.data
  },

  async getAllTickers(): Promise<Ticker[]> {
    const response = await api.get<Ticker[]>('/market/tickers')
    return response.data
  },

  async getOrderBook(
    symbol: string,
    depth: number = 20
  ): Promise<OrderBook> {
    const response = await api.get<OrderBook>(`/market/orderbook/${symbol}`, {
      params: { depth },
    })
    return response.data
  },

  async getTrades(
    symbol: string,
    limit: number = 100
  ): Promise<Trade[]> {
    const response = await api.get<Trade[]>(`/market/trades/${symbol}`, {
      params: { limit },
    })
    return response.data
  },

  async getCandleData(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<CandleData[]> {
    const response = await api.get<CandleData[]>(
      `/market/candles/${symbol}/${timeframe}`,
      {
        params: { limit },
      }
    )
    return response.data
  },

  async getCandleDataByRange(
    symbol: string,
    timeframe: Timeframe,
    startTime: number,
    endTime: number
  ): Promise<CandleData[]> {
    const response = await api.get<CandleData[]>(
      `/market/candles/${symbol}/${timeframe}/range`,
      {
        params: { startTime, endTime },
      }
    )
    return response.data
  },
}
