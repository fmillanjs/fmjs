import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfileComponent } from './profile.component';
import { WorkComponent } from './work.component';
import { BlogComponent } from './blog.component';
import { ContactComponent } from './contact.component';

const routes: Routes = [
  // { path: '',   redirectTo: '/profile', pathMatch: 'full' },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'work',
    component: WorkComponent
  },
  {
    path: 'blog',
    component: BlogComponent
  },
  {
    path: 'contact',
    component: ContactComponent,
    outlet: 'popup'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
