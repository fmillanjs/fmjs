import { Component, Input, trigger, state, transition, animate, style } from '@angular/core';

@Component({
  selector: 'fm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('loading', [
      transition('void => *', [
        style({opacity: '0'}),
        animate(1000)
      ]),
      transition('* => void', [
        style({opacity: '1'}),
        animate(500)
      ])
    ]),
  ]
})
export class AppComponent {
  title = 'Fernando Millan';
}
