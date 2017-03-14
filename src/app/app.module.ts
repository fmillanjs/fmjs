import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import 'hammerjs';
import { D3Service } from 'd3-ng2-service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileComponent } from './profile.component';
import { WorkComponent } from './work.component';
import { BlogComponent } from './blog.component';
import { ContactComponent } from './contact.component';
import { WorkDetailComponent } from './work-detail.component';
import { BlogDetailComponent } from './blog-detail.component';
import { Beerd3Component } from './beerd3.component';


@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    WorkComponent,
    BlogComponent,
    ContactComponent,
    WorkDetailComponent,
    BlogDetailComponent,
    Beerd3Component
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    MaterialModule,
  ],
  providers: [D3Service],
  bootstrap: [AppComponent]
})
export class AppModule { }
