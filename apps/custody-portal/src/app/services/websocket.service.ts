import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, BalanceUpdate, TransactionUpdate } from '../types';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connected$ = new Subject<boolean>();
  private messages$ = new Subject<WebSocketMessage>();

  constructor(private authService: AuthService) {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('Cannot connect to WebSocket: No authentication token');
      return;
    }

    this.socket = io(environment.wsUrl, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Subscribe to balance updates
   */
  onBalanceUpdate(): Observable<BalanceUpdate> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'balance_update'),
      map(msg => msg.payload as BalanceUpdate)
    );
  }

  /**
   * Subscribe to transaction updates
   */
  onTransactionUpdate(): Observable<TransactionUpdate> {
    return this.messages$.pipe(
      filter(msg => msg.type === 'transaction_update'),
      map(msg => msg.payload as TransactionUpdate)
    );
  }

  /**
   * Subscribe to specific message type
   */
  on<T = any>(messageType: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.type === messageType),
      map(msg => msg.payload as T)
    );
  }

  /**
   * Subscribe to asset updates for specific asset
   */
  onAssetUpdate(assetId: string): Observable<BalanceUpdate> {
    return this.onBalanceUpdate().pipe(
      filter(update => update.assetId === assetId)
    );
  }

  /**
   * Subscribe to specific transaction updates
   */
  onTransactionStatus(transactionId: string): Observable<TransactionUpdate> {
    return this.onTransactionUpdate().pipe(
      filter(update => update.transactionId === transactionId)
    );
  }

  /**
   * Send message to server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error('Cannot emit: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Subscribe to custody account updates
   */
  subscribeToCustodyAccount(accountId: string): void {
    this.emit('subscribe', { channel: `custody:${accountId}` });
  }

  /**
   * Unsubscribe from custody account updates
   */
  unsubscribeFromCustodyAccount(accountId: string): void {
    this.emit('unsubscribe', { channel: `custody:${accountId}` });
  }

  /**
   * Subscribe to all asset updates
   */
  subscribeToAssets(): void {
    this.emit('subscribe', { channel: 'assets' });
  }

  /**
   * Unsubscribe from asset updates
   */
  unsubscribeFromAssets(): void {
    this.emit('unsubscribe', { channel: 'assets' });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected$.next(false);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected$.next(false);
    });

    // Handle incoming messages
    this.socket.onAny((eventName, data) => {
      const message: WebSocketMessage = {
        type: eventName,
        payload: data,
        timestamp: new Date()
      };
      this.messages$.next(message);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.connected$.complete();
    this.messages$.complete();
  }
}
