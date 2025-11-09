import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) { }

  createBoard(name: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/boards`, { name });
  }

  getBoards(): Observable<any> {
    return this.http.get(`${this.baseUrl}/boards`);
  }

  getBoard(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/boards/${id}`);
  }

  shareBoard(boardId: string, userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/boards/${boardId}/share`, { userId });
  }

  getAssets(): Observable<any> {
    return this.http.get(`${this.baseUrl}/assets`);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { username, password });
  }
}
