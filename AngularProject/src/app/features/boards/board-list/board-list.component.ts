import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Board, CreateBoardRequest } from '../../../core/models/board.model';
import { BoardService } from '../../../core/services/board.service';

@Component({
  selector: 'app-board-list',
  templateUrl: './board-list.component.html',
  styleUrls: ['./board-list.component.css']
})
export class BoardListComponent implements OnInit {
  myBoards: Board[] = [];
  sharedBoards: Board[] = [];
  showCreateDialog = false;
  newBoardName = '';
  newBoardDescription = '';
  loading = false;

  constructor(
    private boardService: BoardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.loading = true;

    this.boardService.getBoards().subscribe({
      next: boards => {
        this.myBoards = boards;
        this.loading = false;
      },
      error: error => {
        console.error('Error loading boards:', error);
        this.loading = false;
      }
    });

    this.boardService.getSharedBoards().subscribe({
      next: boards => {
        this.sharedBoards = boards;
      },
      error: error => {
        console.error('Error loading shared boards:', error);
      }
    });
  }

  openBoard(boardId: string): void {
    this.router.navigate(['/whiteboard', boardId]);
  }

  createBoard(): void {
    if (!this.newBoardName.trim()) {
      return;
    }

    const request: CreateBoardRequest = {
      name: this.newBoardName,
      description: this.newBoardDescription,
      isPublic: false
    };

    this.boardService.createBoard(request).subscribe({
      next: board => {
        this.myBoards.unshift(board);
        this.showCreateDialog = false;
        this.newBoardName = '';
        this.newBoardDescription = '';
        this.openBoard(board.id);
      },
      error: error => {
        console.error('Error creating board:', error);
      }
    });
  }

  deleteBoard(board: Board, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete board "${board.name}"?`)) {
      return;
    }

    this.boardService.deleteBoard(board.id).subscribe({
      next: () => {
        this.myBoards = this.myBoards.filter(b => b.id !== board.id);
      },
      error: error => {
        console.error('Error deleting board:', error);
      }
    });
  }
}
