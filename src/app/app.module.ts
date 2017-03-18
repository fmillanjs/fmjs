import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MaterialModule } from '@angular/material';

import 'hammerjs';
import { D3Service } from 'd3-ng2-service';
import { AuthService } from './auth.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ProfileComponent } from './profile.component';
import { WorkComponent } from './work.component';
// import { BlogComponent } from './blog.component';
import { ContactComponent } from './contact.component';
import { WorkDetailComponent } from './work-detail.component';
// import { BlogDetailComponent } from './blog-detail.component';
import { Beerd3Component } from './beerd3.component';
import { SimpleCMSComponent } from './simple-cms.component';
import { AngularFireModule } from 'angularfire2';
import { firebaseConfig } from '../environments/firebase.config';
import { AdminSimpleCMSComponent } from './admin-simple-cms/admin-simple-cms.component';
import { WebsitesComponent } from './websites.component';


@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    WorkComponent,
    // BlogComponent,
    ContactComponent,
    WorkDetailComponent,
    // BlogDetailComponent,
    Beerd3Component,
    SimpleCMSComponent,
    AdminSimpleCMSComponent,
    WebsitesComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  providers: [D3Service, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
