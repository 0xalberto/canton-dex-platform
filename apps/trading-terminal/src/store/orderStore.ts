import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderStatus = 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Order {
  id: string;
  pair: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  filledQuantity: number;
  status: OrderStatus;
  timestamp: number;
  expiryTime?: number;
}

export interface Trade {
  id: string;
  orderId: string;
  pair: string;
  side: OrderSide;
  quantity: number;
  price: number;
  timestamp: number;
  status: 'PENDING' | 'FILLED' | 'FAILED';
}

interface OrderState {
  orders: Order[];
  trades: Trade[];
  
  // Actions
  createOrder: (order: Omit<Order, 'id' | 'timestamp' | 'filledQuantity' | 'status'>) => Order;
  cancelOrder: (orderId: string) => void;
  fillOrder: (orderId: string, quantity: number, price: number) => void;
  getActiveOrders: () => Order[];
  getOrderHistory: () => Order[];
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      trades: [],

      createOrder: (orderData) => {
        const newOrder: Order = {
          ...orderData,
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          filledQuantity: 0,
          status: 'OPEN'
        };

        set((state) => ({
          orders: [newOrder, ...state.orders]
        }));

        // Simulate matching for demo (50% chance)
        if (Math.random() > 0.5) {
          setTimeout(() => {
            get().fillOrder(newOrder.id, newOrder.quantity, newOrder.price || 0);
          }, 2000 + Math.random() * 3000);
        }

        return newOrder;
      },

      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status: 'CANCELLED' as OrderStatus }
              : order
          )
        }));
      },

      fillOrder: (orderId, quantity, price) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        const newFilledQty = order.filledQuantity + quantity;
        const isFullyFilled = newFilledQty >= order.quantity;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  filledQuantity: newFilledQty,
                  status: isFullyFilled ? 'FILLED' : 'PARTIALLY_FILLED'
                }
              : o
          ),
          trades: [
            {
              id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              orderId,
              pair: order.pair,
              side: order.side,
              quantity,
              price,
              timestamp: Date.now(),
              status: 'FILLED'
            },
            ...state.trades
          ]
        }));
      },

      getActiveOrders: () => {
        return get().orders.filter(
          (order) => order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED'
        );
      },

      getOrderHistory: () => {
        return get().orders.filter(
          (order) => order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED'
        );
      }
    }),
    {
      name: 'cantondex-orders-storage'
    }
  )
);
