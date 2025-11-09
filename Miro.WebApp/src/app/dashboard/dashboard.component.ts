import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  boards: any[] = [];
  newBoardName = '';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getBoards().subscribe(boards => {
      this.boards = boards;
    });
  }

  createBoard(): void {
    this.apiService.createBoard(this.newBoardName).subscribe(board => {
      this.boards.push(board);
      this.newBoardName = '';
    });
  }
}
