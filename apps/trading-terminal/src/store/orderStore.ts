import { create } from 'zustand'
import { Order, Trade } from '@types/index'

interface OrderState {
  orders: Order[]
  trades: Trade[]
  selectedOrder: Order | null
  isLoading: boolean
  error: string | null

  addOrder: (order: Order) => void
  updateOrder: (id: string, update: Partial<Order>) => void
  removeOrder: (id: string) => void
  setOrders: (orders: Order[]) => void
  setTrades: (trades: Trade[]) => void
  addTrade: (trade: Trade) => void
  setSelectedOrder: (order: Order | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearOrders: () => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  trades: [],
  selectedOrder: null,
  isLoading: false,
  error: null,

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrder: (id, update) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, ...update } : order
      ),
    })),

  removeOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== id),
    })),

  setOrders: (orders) => set({ orders }),

  setTrades: (trades) => set({ trades }),

  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades],
    })),

  setSelectedOrder: (order) => set({ selectedOrder: order }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearOrders: () =>
    set({
      orders: [],
      trades: [],
      selectedOrder: null,
      error: null,
    }),
}))
