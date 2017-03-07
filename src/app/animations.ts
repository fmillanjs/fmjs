import { Input, trigger, state, transition, animate, keyframes, style } from '@angular/core';


// Loading Logo animation
export const loadingLogo = trigger('loadingLogo', [
    transition('void => *', [
    animate('1.5s', keyframes([
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
]);

// Loading head bar animation
export const loadingHeadBar = trigger('loadingHeadBar', [
    transition(':enter', [
        animate('.5s 1.2s ease', keyframes([
            style({ width: '0%', offset: 0 }),
            style({ width: '100%', offset: 1})
        ]))
    ])
]);

// loading title head bar
export const loadingHeadTitle = trigger('loadingHeadTitle', [
    transition(':enter', [
        animate('.5s 1.7s ease', keyframes([
            style({ opacity: '0', offset: 0 }),
            style({ opacity: '1', offset: 1})
        ]))
    ])
]);

// loading navigation
export const loadingNavigation = trigger('loadingNavigation', [
    transition(':enter', [
        animate('1s 1.7s ease', keyframes([
            style({ opacity: '0', offset: 0 }),
            style({ opacity: '0', transform: 'scale(.9)', offset: .6}),
            style({ opacity: '1', transform: 'scale(1.1)', offset: .8}),
            style({ opacity: '1', transform: 'scale(1)', offset: 1})
        ]))
    ])
]);
// loading firt route
// export const loadingFirstRoute = trigger('loadingFirstRoute', [
//     state('void', style({position: 'fixed', width: '100%'}) ),
//     state('*', style({position: 'fixed', width: '100%'}) ),
//     transition(':enter', [
//       style({transform: 'translateX(100%)'}),
//       animate('0.5s 2.4s ease-in-out', style({transform: 'translateX(0%)'}))
//     ])
// ]);

// Component animations
export function routeTransition() {
    return slideLeft();
}

function slideLeft() {
  return trigger('routeTransition', [
    state('void', style({position: 'absolute', width: '100%'}) ),
    state('*', style({position: 'absolute', width: '100%'}) ),
    transition(':enter', [
      style({transform: 'translateX(100%)'}),
      animate('0.5s ease-in-out', style({transform: 'translateX(0%)'}))
    ]),
    transition(':leave', [
      style({transform: 'translateX(0%)'}),
      animate('0.5s ease-in-out', style({transform: 'translateX(-100%)'}))
    ])
  ]);
}
