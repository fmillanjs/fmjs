import { Component, HostBinding, OnInit} from '@angular/core';
import { Router , ActivatedRoute} from '@angular/router';
import { loadingLogo, loadingHeadBar, loadingHeadTitle, loadingNavigation, routeTransition} from './animations';

@Component({
  selector: 'fm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    loadingLogo, loadingHeadBar, loadingHeadTitle, loadingNavigation,
  ],
})
export class AppComponent implements OnInit {
  title = 'Fernando Millan';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // setTimeout( () => {
    //   this.router.navigate(['/profile']);
    // }, 2800);
  }
  animationDone(e) {
    let url = this.router.url;
    (url === '/') ? this.router.navigate(['/profile']): '';
  }
}
