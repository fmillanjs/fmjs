import { Component, OnInit } from '@angular/core';
import { routeTransition } from './animations';

@Component({
  selector: 'fm-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  animations: [routeTransition()],
  host: {'[@routeTransition]': ''}
})
export class WorkComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
