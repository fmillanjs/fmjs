import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { routeTransition } from './animations';

interface Work {
    id: number;
    name: string;
    updated: Date;
    description: string;
}

const WORKS: Work[] = [
      {
      id: 0,
      name: 'Blog CMS',
      updated: new Date('1/1/16'),
      description: 'Create a blog CMS'
    },
    {
      id: 1,
      name: 'Diveshop',
      updated: new Date('1/17/16'),
      description: 'A magazine about diving around the world'
    },
    {
      id: 2,
      name: 'Chat FM',
      updated: new Date('1/28/16'),
      description: 'A collective chat app'
    }
];

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
  onSelect(id){
    this.router.navigate([id], {relativeTo: this.route});
  }
}
