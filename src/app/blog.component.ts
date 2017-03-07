import { Component, OnInit } from '@angular/core';
import { routeTransition } from './animations';

@Component({
  selector: 'fm-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  animations: [routeTransition()],
  host: {'[@routeTransition]': ''}
})
export class BlogComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
