import { Component, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';

import {
  D3Service,
  D3,
  Axis,
  BrushBehavior,
  BrushSelection,
  D3BrushEvent,
  ScaleLinear,
  ScaleOrdinal,
  Selection,
  Transition,
  Dispatch,
} from 'd3-ng2-service';

import { BEERS } from '../data/providers';

@Component({
  selector: 'fm-beerd3',
  templateUrl: './beerd3.component.html',
  styleUrls: ['./beerd3.component.scss']
})
export class Beerd3Component implements OnInit {
  
  private beerData = BEERS;
  private d3: D3;
  private parentNativeElement: any;
  private d3Svg: Selection<SVGSVGElement, any, null, undefined>;

  constructor(element: ElementRef, private ngZone: NgZone, d3Service: D3Service) {
    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    // this.d3.json('../data/beers.json').get((error, data) => console.log(data));
  }

  ngOnDestroy() {
    if (this.d3Svg.empty && !this.d3Svg.empty()) {
      this.d3Svg.selectAll('*').remove();
    }
  }

  ngOnInit() {
    let self = this;
    let d3 = this.d3;
    let d3ParentElement: Selection<HTMLElement, any, null, undefined>;
    let d3Svg: Selection<SVGSVGElement, any, null, undefined>;
    let d3G: Selection<SVGGElement, any, null, undefined>;
    let width: number;
    let height: number;
    let random: () => number;
    let sqrt3: number;
    let points: Array<[number, number]>; // ABV/IBU
    let k: number;
    let x0: [number, number];
    let y0: [number, number];
    let x: ScaleLinear<number, number>;
    let y: ScaleLinear<number, number>;
    let z: ScaleOrdinal<number, string>;
    let xAxis: Axis<number>;
    let yAxis: Axis<number>;
    let brush: BrushBehavior<any>;
    let idleTimeout: number | null;
    let idleDelay: number;
    
    function brushended(this: SVGGElement) {
      let e = <D3BrushEvent<any>>d3.event;
      let s: BrushSelection = e.selection;
      if (!s) {
        if (!idleTimeout) {
          self.ngZone.runOutsideAngular(() => {
            idleTimeout = window.setTimeout(idled, idleDelay);
          });
          return idleTimeout;
        }
        x.domain(x0);
        y.domain(y0);
      } else {
        x.domain([s[0][0], s[1][0]].map(x.invert, x));
        y.domain([s[1][1], s[0][1]].map(y.invert, y));
        d3Svg.select<SVGGElement>('.brush').call(brush.move, null);
      }
      zoom();
    }

    function idled() {
      idleTimeout = null;
    }

    function zoom() {
      let t: Transition<SVGSVGElement, any, null, undefined> = d3Svg.transition().duration(750);
      d3Svg.select<SVGGElement>('.axis--x').transition(t).call(xAxis);
      d3Svg.select<SVGGElement>('.axis--y').transition(t).call(yAxis);
      d3Svg.selectAll<SVGCircleElement, [number, number, number]>('circle').transition(t)
        .attr('cx', function (d) { return x(d[0]); })
        .attr('cy', function (d) { return y(d[1]); });
    }

    if (this.parentNativeElement !== null) {

      d3ParentElement = d3.select(this.parentNativeElement);
      d3Svg = this.d3Svg = d3ParentElement.select<SVGSVGElement>('svg');
      width = +d3Svg.attr('width');
      height = +d3Svg.attr('height');

      let tooltip = d3ParentElement.append('div').style('opacity', '0').style('position', 'absolute');

      d3G = d3Svg.append<SVGGElement>('g');
      random = d3.randomNormal(0, 0.2);
      sqrt3 = Math.sqrt(3);
      points = this.beerData;

      k = height / width;
      x0 = [-0.5, 1.1];
      y0 = [0, 105];
      x = d3.scaleLinear().domain(x0).range([0, width]);
      y = d3.scaleLinear().domain(y0).range([height, 0]);
      z = d3.scaleOrdinal<number, string>(d3.schemeCategory10);

      xAxis = d3.axisTop<number>(x).ticks(8).tickSize(0);
      yAxis = d3.axisRight<number>(y).ticks(8 * height / width).tickSize(0);

      brush = d3.brush().on('end', brushended);
      idleDelay = 350;

      d3Svg.selectAll<SVGCircleElement, any>('circle')
        .data(points)
        .enter().append<SVGCircleElement>('circle')
        .attr('cx', function (d) { return x(d[0]); })
        .attr('cy', function (d) { return y(d[1]); })
        .attr('position', 'absolute')
        .attr('r', 2.5)
        .attr('fill', function (d) { return "#fff"; })
        .attr('class', 'svgcircle');

      d3Svg.append<SVGGElement>('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + (height - 10) + ')')
        .attr('stroke', function (d) { return "#fff"; })
        .call(xAxis);

      d3Svg.append<SVGGElement>('g')
       .attr('class', 'axis axis--y')
        .attr('transform', 'translate(10,0)')
        .attr('stroke', function (d) { return "#fff"; })
        .call(yAxis);

      d3Svg.selectAll('.domain')
        .style('display', 'visible')
        .attr('stroke', function (d) { return "#fff"; });

      d3Svg.selectAll('.ticks')
        .style('display', 'none')
        .attr('stroke', function (d) { return "#fff"; });

      d3Svg.append<SVGGElement>('g')
        .attr('class', 'brush')
        .call(brush);

    }
    // document.getElementById('beerd3').setAttribute('viewBox', '0 0 640 400');


  }
}
