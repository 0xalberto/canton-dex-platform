import { io, type Socket } from 'socket.io-client'

class WebSocketService {
  private socket: Socket | null = null
  private readonly url: string

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3000'
  }

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('auth_token')
      }
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      console.warn('WebSocket not connected')
      return
    }
    this.socket.on(event, callback)
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.socket) {
      return
    }
    this.socket.off(event, callback)
  }

  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit - WebSocket not connected')
      return
    }
    this.socket.emit(event, data)
  }

  // Compliance-specific event handlers
  subscribeToAlerts(callback: (alert: any) => void) {
    this.on('alert:new', callback)
  }

  subscribeToAuditLogs(callback: (log: any) => void) {
    this.on('audit:new', callback)
  }

  subscribeToKYCUpdates(callback: (update: any) => void) {
    this.on('kyc:update', callback)
  }

  subscribeToTransactionFlags(callback: (transaction: any) => void) {
    this.on('transaction:flagged', callback)
  }
}

export const ws = new WebSocketService()
export default ws
