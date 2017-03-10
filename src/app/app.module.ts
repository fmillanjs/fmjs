import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import 'hammerjs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileComponent } from './profile.component';
import { WorkComponent } from './work.component';
import { BlogComponent } from './blog.component';
import { ContactComponent } from './contact.component';
import { WorkDetailComponent } from './work-detail.component';
import { BlogDetailComponent } from './blog-detail.component';
import { Beerd3Component } from './beerd3.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    WorkComponent,
    BlogComponent,
    ContactComponent,
    WorkDetailComponent,
    BlogDetailComponent,
<<<<<<< HEAD
=======
    Beerd3Component
>>>>>>> beerD3
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    MaterialModule,
    NgxChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
