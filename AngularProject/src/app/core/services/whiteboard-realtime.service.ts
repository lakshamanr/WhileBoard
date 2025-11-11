import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { BoardElement } from '../models/board.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CursorPosition {
  userId: string;
  username: string;
  x: number;
  y: number;
}

export interface UserPresence {
  userId: string;
  username: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WhiteboardRealtimeService {
  private hubConnection?: signalR.HubConnection;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  // Real-time events
  private elementCreatedSubject = new BehaviorSubject<BoardElement | null>(null);
  public elementCreated$ = this.elementCreatedSubject.asObservable();

  private elementUpdatedSubject = new BehaviorSubject<BoardElement | null>(null);
  public elementUpdated$ = this.elementUpdatedSubject.asObservable();

  private elementDeletedSubject = new BehaviorSubject<string | null>(null);
  public elementDeleted$ = this.elementDeletedSubject.asObservable();

  private cursorMovedSubject = new BehaviorSubject<CursorPosition | null>(null);
  public cursorMoved$ = this.cursorMovedSubject.asObservable();

  private userJoinedSubject = new BehaviorSubject<UserPresence | null>(null);
  public userJoined$ = this.userJoinedSubject.asObservable();

  private userLeftSubject = new BehaviorSubject<UserPresence | null>(null);
  public userLeft$ = this.userLeftSubject.asObservable();

  constructor(private authService: AuthService) {}

  async connect(boardId: string): Promise<void> {
    const token = this.authService.token;
    if (!token) {
      throw new Error('No authentication token available');
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/whiteboard`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.setupEventHandlers();

    try {
      await this.hubConnection.start();
      console.log('SignalR Connected');
      this.connectedSubject.next(true);
      await this.joinBoard(boardId);
    } catch (error) {
      console.error('Error connecting to SignalR:', error);
      this.connectedSubject.next(false);
      throw error;
    }
  }

  async disconnect(boardId: string): Promise<void> {
    if (this.hubConnection) {
      await this.leaveBoard(boardId);
      await this.hubConnection.stop();
      this.connectedSubject.next(false);
      console.log('SignalR Disconnected');
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ElementCreated', (element: BoardElement) => {
      this.elementCreatedSubject.next(element);
    });

    this.hubConnection.on('ElementUpdated', (element: BoardElement) => {
      this.elementUpdatedSubject.next(element);
    });

    this.hubConnection.on('ElementDeleted', (elementId: string) => {
      this.elementDeletedSubject.next(elementId);
    });

    this.hubConnection.on('CursorMoved', (data: CursorPosition) => {
      this.cursorMovedSubject.next(data);
    });

    this.hubConnection.on('UserJoined', (data: UserPresence) => {
      this.userJoinedSubject.next(data);
    });

    this.hubConnection.on('UserLeft', (data: UserPresence) => {
      this.userLeftSubject.next(data);
    });
  }

  async joinBoard(boardId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinBoard', boardId);
    }
  }

  async leaveBoard(boardId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveBoard', boardId);
    }
  }

  async notifyElementCreated(boardId: string, element: BoardElement): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('ElementCreated', boardId, element);
    }
  }

  async notifyElementUpdated(boardId: string, element: BoardElement): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('ElementUpdated', boardId, element);
    }
  }

  async notifyElementDeleted(boardId: string, elementId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('ElementDeleted', boardId, elementId);
    }
  }

  async sendCursorPosition(boardId: string, x: number, y: number): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('CursorMoved', boardId, x, y);
    }
  }
}
