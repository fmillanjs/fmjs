import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule} from '@angular/router';

import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { WorkComponent } from './work/work.component';
import { LabComponent } from './lab/lab.component';
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from './page-not-found.component';

export const router: Routes = [
  { path: 'about', component: AboutComponent },
  { path: 'work', component:  WorkComponent },
  { path: 'lab', component:  LabComponent },
  { path: '', component:  HomeComponent },
  { path: '**', component: PageNotFoundComponent }
];

export const routes: ModuleWithProviders = RouterModule.forRoot(router);