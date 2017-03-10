import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { routeTransition } from './animations';

import { WORKS, Work } from '../data/providers';

@Component({
  selector: 'fm-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  animations: [routeTransition()],
  host: {'[@routeTransition]': ''}
})
export class WorkComponent implements OnInit {
  works: Work[];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.getWorks().then(works => this.works = works);
  }
  getWorks(): Promise<Work[]> {
    return Promise.resolve(WORKS); // TODO: get hero data from the server;
  }
  onSelect(urlName) {
    this.router.navigate([urlName], {relativeTo: this.route});
  }
}
