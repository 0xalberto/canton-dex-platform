import api from './api'
import { Order, Trade, PlaceOrderRequest } from '@types/index'

export const orderService = {
  async placeOrder(data: PlaceOrderRequest): Promise<Order> {
    const response = await api.post<Order>('/orders', data)
    return response.data
  },

  async getOpenOrders(pair?: string): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/open', {
      params: pair ? { pair } : {},
    })
    return response.data
  },

  async getAllOrders(
    limit: number = 50,
    offset: number = 0,
    pair?: string
  ): Promise<{
    data: Order[]
    total: number
  }> {
    const response = await api.get('/orders', {
      params: { limit, offset, ...(pair && { pair }) },
    })
    return response.data
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  async modifyOrder(
    id: string,
    data: Partial<PlaceOrderRequest>
  ): Promise<Order> {
    const response = await api.put<Order>(`/orders/${id}`, data)
    return response.data
  },

  async cancelOrder(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/orders/${id}`)
    return response.data
  },

  async cancelAllOrders(pair?: string): Promise<{ cancelled: number }> {
    const response = await api.post<{ cancelled: number }>('/orders/cancel-all', {
      ...(pair && { pair }),
    })
    return response.data
  },

  async getTrades(
    pair?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    data: Trade[]
    total: number
  }> {
    const response = await api.get('/trades', {
      params: { limit, offset, ...(pair && { pair }) },
    })
    return response.data
  },

  async getTradeDetails(tradeId: string): Promise<Trade> {
    const response = await api.get<Trade>(`/trades/${tradeId}`)
    return response.data
  },
}
