import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/boards',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'boards',
    loadChildren: () => import('./features/boards/boards.module').then(m => m.BoardsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'whiteboard/:id',
    loadChildren: () => import('./features/whiteboard/whiteboard.module').then(m => m.WhiteboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/boards'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
