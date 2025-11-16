import { io, Socket } from 'socket.io-client'
import { WSEventType, WSMessage } from '@types/index'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<WSEventType, Function[]> = new Map()
  private isConnected = false

  constructor() {
    this.initializeListeners()
  }

  private initializeListeners() {
    const eventTypes: WSEventType[] = [
      'order_created',
      'order_filled',
      'order_cancelled',
      'trade_executed',
      'ticker_update',
      'orderbook_update',
      'position_update',
    ]

    eventTypes.forEach((event) => {
      this.listeners.set(event, [])
    })
  }

  connect(url?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = url || import.meta.env.VITE_WS_URL || 'http://localhost:3001'

      this.socket = io(wsUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        this.isConnected = true
        console.log('WebSocket connected')
        resolve()
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
        console.log('WebSocket disconnected')
      })

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      })

      // Listen for all events
      this.socket.onAny((event: string, data: any) => {
        this.handleEvent(event, data)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  subscribe(event: WSEventType, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  unsubscribe(event: WSEventType, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private handleEvent(event: string, data: any): void {
    const callbacks = this.listeners.get(event as WSEventType) || []
    callbacks.forEach((callback) => callback(data))
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected
  }
}

export const wsService = new WebSocketService()
