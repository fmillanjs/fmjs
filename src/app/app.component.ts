import { Component } from '@angular/core';
import { loadingLogo, loadingHeadBar, loadingHeadTitle, loadingNavigation } from './animations';

@Component({
  selector: 'fm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    loadingLogo, loadingHeadBar, loadingHeadTitle, loadingNavigation
  ]
})
export class AppComponent {
  title = 'Fernando Millan';
}
