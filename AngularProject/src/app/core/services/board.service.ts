import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Board,
  BoardDetail,
  CreateBoardRequest,
  UpdateBoardRequest,
  Collaborator,
  AddCollaboratorRequest
} from '../models/board.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private apiUrl = `${environment.apiUrl}/boards`;

  constructor(private http: HttpClient) {}

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(this.apiUrl);
  }

  getSharedBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.apiUrl}/shared`);
  }

  getBoardById(id: string): Observable<BoardDetail> {
    return this.http.get<BoardDetail>(`${this.apiUrl}/${id}`);
  }

  createBoard(request: CreateBoardRequest): Observable<Board> {
    return this.http.post<Board>(this.apiUrl, request);
  }

  updateBoard(id: string, request: UpdateBoardRequest): Observable<Board> {
    return this.http.put<Board>(`${this.apiUrl}/${id}`, request);
  }

  deleteBoard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCollaborators(boardId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.apiUrl}/${boardId}/collaborators`);
  }

  addCollaborator(boardId: string, request: AddCollaboratorRequest): Observable<Collaborator> {
    return this.http.post<Collaborator>(`${this.apiUrl}/${boardId}/collaborators`, request);
  }

  removeCollaborator(boardId: string, collaboratorId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${boardId}/collaborators/${collaboratorId}`);
  }
}
