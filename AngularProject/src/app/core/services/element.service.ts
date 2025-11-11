import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BoardElement, CreateElementRequest, UpdateElementRequest } from '../models/board.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ElementService {
  constructor(private http: HttpClient) {}

  private getElementsUrl(boardId: string): string {
    return `${environment.apiUrl}/boards/${boardId}/elements`;
  }

  getElements(boardId: string): Observable<BoardElement[]> {
    return this.http.get<BoardElement[]>(this.getElementsUrl(boardId));
  }

  getElementById(boardId: string, elementId: string): Observable<BoardElement> {
    return this.http.get<BoardElement>(`${this.getElementsUrl(boardId)}/${elementId}`);
  }

  createElement(boardId: string, request: CreateElementRequest): Observable<BoardElement> {
    return this.http.post<BoardElement>(this.getElementsUrl(boardId), request);
  }

  updateElement(boardId: string, elementId: string, request: UpdateElementRequest): Observable<BoardElement> {
    return this.http.put<BoardElement>(`${this.getElementsUrl(boardId)}/${elementId}`, request);
  }

  deleteElement(boardId: string, elementId: string): Observable<void> {
    return this.http.delete<void>(`${this.getElementsUrl(boardId)}/${elementId}`);
  }

  batchUpdateElements(boardId: string, elements: { id: string; x: number; y: number }[]): Observable<void> {
    return this.http.post<void>(`${this.getElementsUrl(boardId)}/batch-update`, { elements });
  }

  bringToFront(boardId: string, elementId: string): Observable<void> {
    return this.http.post<void>(`${this.getElementsUrl(boardId)}/${elementId}/bring-to-front`, {});
  }

  sendToBack(boardId: string, elementId: string): Observable<void> {
    return this.http.post<void>(`${this.getElementsUrl(boardId)}/${elementId}/send-to-back`, {});
  }
}
