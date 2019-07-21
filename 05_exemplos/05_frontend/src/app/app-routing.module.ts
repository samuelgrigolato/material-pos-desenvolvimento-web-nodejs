import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { OutraPaginaComponent } from './outra-pagina/outra-pagina.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'outra',
    component: OutraPaginaComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
