import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'board',
    loadChildren: () => import('./board/board.module').then(m => m.BoardModule)
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' }
];
