import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: HubConnection;

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/boardhub')
      .build();
  }

  public startConnection = () => {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public joinBoard = (boardId: string) => {
    this.hubConnection.invoke('JoinBoard', boardId)
      .catch(err => console.error(err));
  }

  public sendElement = (element: any, boardId: string) => {
    this.hubConnection.invoke('SendElement', element, boardId)
      .catch(err => console.error(err));
  }

  public addElementListener = (callback: (element: any) => void) => {
    this.hubConnection.on('ReceiveElement', (element) => {
      callback(element);
    });
  }
}
