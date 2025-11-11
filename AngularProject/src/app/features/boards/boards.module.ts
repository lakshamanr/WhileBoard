import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { BoardListComponent } from './board-list/board-list.component';

const routes: Routes = [
  { path: '', component: BoardListComponent }
];

@NgModule({
  declarations: [
    BoardListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class BoardsModule { }
