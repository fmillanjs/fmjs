import { Component, HostBinding, OnInit} from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(private router: Router) {}

  ngOnInit() {
    // setTimeout( () => {
    //   this.router.navigate(['/profile']);
    // }, 2800);
  }
}
