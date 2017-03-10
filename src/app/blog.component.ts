import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { routeTransition } from './animations';

@Component({
  selector: 'fm-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  animations: [routeTransition()],
  host: {'[@routeTransition]': ''}
})
export class BlogComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
  }

  onSelect(id){
      this.router.navigate([id], {relativeTo: this.route});
  }

}
