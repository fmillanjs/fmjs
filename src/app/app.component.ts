import { Component, Input, trigger, state, transition, animate, keyframes, style } from '@angular/core';

@Component({
  selector: 'fm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('loading', [
      transition(':enter', [
        animate('2s', keyframes([
          style({
            opacity: 0,
            transform: 'scale(1) translate(-50%, -50%)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '50%',
            offset: 0
          }),
          style({
            opacity: 1,
            transform: 'scale(1.2) translate(-50%, -50%)',
            top: '50%',
            left: '50%',
            width: '50%',
            offset: 0.4
          }),
          style({
            opacity: 1,
            transform: 'scale(1) translate(0%, 0%)',
            top: '0%',
            left: '0%',
            width: '10%',
            offset: 0.8
          }),
          style({
            opacity: 1,
            transform: 'scale(1) translate(0%, 0%)',
            width: '10%',
            top: '0%',
            left: '0%',
            offset: 1
          })
        ]))
      ]),
    ])
  ]
})
export class AppComponent {
  title = 'Fernando Millan';
}
