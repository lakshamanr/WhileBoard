import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection!: HubConnection;
  public newElementReceived = new Subject<any>();
  public updatedElementReceived = new Subject<any>();
  public deletedElementReceived = new Subject<string>();
  public undoReceived = new Subject<void>();
  public redoReceived = new Subject<void>();

  constructor() { }

  public startConnection(boardId: string): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/boardhub')
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('Connection started');
        this.joinBoard(boardId);
        this.addReceiveListeners();
      })
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public joinBoard(boardId: string): void {
    this.hubConnection.invoke('JoinBoard', boardId)
      .catch(err => console.error(err));
  }

  public createElement(element: any, boardId: string): void {
    this.hubConnection.invoke('CreateElement', element, boardId)
      .catch(err => console.error(err));
  }

  public updateElement(element: any, boardId: string): void {
    this.hubConnection.invoke('UpdateElement', element, boardId)
      .catch(err => console.error(err));
  }

  public deleteElement(elementId: string, boardId: string): void {
    this.hubConnection.invoke('DeleteElement', elementId, boardId)
      .catch(err => console.error(err));
  }

  public undo(boardId: string): void {
    this.hubConnection.invoke('Undo', boardId)
      .catch(err => console.error(err));
  }

  public redo(boardId: string): void {
    this.hubConnection.invoke('Redo', boardId)
      .catch(err => console.error(err));
  }

  private addReceiveListeners(): void {
    this.hubConnection.on('ReceiveNewElement', (element) => {
      this.newElementReceived.next(element);
    });
    this.hubConnection.on('ReceiveUpdatedElement', (element) => {
      this.updatedElementReceived.next(element);
    });
    this.hubConnection.on('ReceiveDeletedElement', (elementId) => {
      this.deletedElementReceived.next(elementId);
    });
    this.hubConnection.on('ReceiveUndo', () => {
      this.undoReceived.next();
    });
    this.hubConnection.on('ReceiveRedo', () => {
      this.redoReceived.next();
    });
  }
}
