import { Component } from '@angular/core';
import 'hammerjs';
import { MdIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-head',
  templateUrl: './head.component.html',
  styleUrls: ['./head.component.scss']
})
export class HeadComponent{
  title = 'Fernando Millan';
  logo = '/assets/logo1.svg';

  constructor(m: MdIconRegistry, s: DomSanitizer) {
    m.addSvgIcon('logo1', s.bypassSecurityTrustResourceUrl(this.logo));
   }
}
