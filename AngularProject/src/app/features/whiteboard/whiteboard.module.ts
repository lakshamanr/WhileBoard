import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WhiteboardCanvasComponent } from './components/whiteboard-canvas.component';

const routes: Routes = [
  { path: '', component: WhiteboardCanvasComponent }
];

@NgModule({
  declarations: [
    WhiteboardCanvasComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class WhiteboardModule { }
