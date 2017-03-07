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

  works = [
    {
      name: 'Blog CMS',
      updated: new Date('1/1/16'),
    },
    {
      name: 'Diveshop',
      updated: new Date('1/17/16'),
    },
    {
      name: 'Chat FM',
      updated: new Date('1/28/16'),
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
