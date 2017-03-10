import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'fm-work-detail',
  templateUrl: './work-detail.component.html',
  styleUrls: ['./work-detail.component.scss']
})
export class WorkDetailComponent implements OnInit {

  workItem: string;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.workItem = this.route.snapshot.url[1].path;
   }

  ngOnInit() {
  }

}
