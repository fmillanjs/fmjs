import { Component, OnInit, HostBinding } from '@angular/core';
import { routeTransition } from './animations';

@Component({
  selector: 'fm-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [routeTransition()],
  host: {'[@routeTransition]': ''}
})
export class ProfileComponent implements OnInit {
  constructor() { }

  ngOnInit() {
  }
}
