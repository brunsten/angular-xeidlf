import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import html2canvas from 'html2canvas';
import { contain, cover } from '../test';
import { Subscription, zip} from 'rxjs';
import { first } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { of, fromEvent, animationFrameScheduler } from 'rxjs';
import { map, switchMap, takeUntil, startWith, tap, filter, subscribeOn } from 'rxjs/operators';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit {
  showCanvas = false;
  @ViewChild('canvasOutput', {static: true}) output: ElementRef<HTMLDivElement>;
  @ViewChild('svgHolder', {static: true}) svgHolder: ElementRef<HTMLDivElement>;
  
  svgImage: SVGImageElement;
  @ViewChild('image', {static: true}) image: ElementRef<HTMLImageElement>;
  svgElement: SVGSVGElement;
  backgroundImageY: number;
  backgroundImageX: number;
  backgroundImageWidth: number;
  backgroundImageHeight: number;
  imageSrc: string = 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=975&q=80';
  imgOutputSrc: string;
  onImageLoad: Subscription;
  svgBoundings: ClientRect;
  imageBoundings: {minX: number, maxX: number, minY: number, maxY:number};
  constructor(private httpClient: HttpClient) { 
    
  }

  ngOnInit() {
    this.httpClient.get('https://raw.githubusercontent.com/brunsten/angular-xeidlf/master/assets/iphone.svg', {responseType:'application/html' }).subscribe((a) =>{
      this.svgHolder.nativeElement.innerHTML = a;
      this.svgElement = this.svgHolder.nativeElement.querySelector('svg');
      this.svgImage = this.svgHolder.nativeElement.querySelector('svg image');
       this.updateHref();
    })
    
  }
  ngAfterViewInit() {
    const box = this.image.nativeElement;

    const mousedown$ = fromEvent<MouseEvent>(box, 'mousedown');
    const mousemove$ = fromEvent<MouseEvent>(document, 'mousemove');
    const mouseup$ = fromEvent<MouseEvent>(document, 'mouseup');

    const drag$ = mousedown$.pipe(
      switchMap(
        (start) => {
          return mousemove$.pipe(map(move => {
            move.preventDefault();
            return {
              left: move.clientX - start.offsetX - this.svgBoundings.left,
              top: move.clientY - start.offsetY - this.svgBoundings.top
            }
          }),
            takeUntil(mouseup$));
        }));

    const position$ = drag$;

    position$.subscribe(pos => {
      let top = pos.top ;
      let left = pos.left;
      if(top > this.imageBoundings.maxY) {
        top = this.imageBoundings.maxY;
      }
      if(top < this.imageBoundings.minY) {
        top = this.imageBoundings.minY;
      }
      if(left > this.imageBoundings.maxX) {
        left = this.imageBoundings.maxX;
      }
      if(left < this.imageBoundings.minX) {
        left = this.imageBoundings.minX;
      }
      this.backgroundImageY = top
      this.backgroundImageX = left
          this.svgImage.style.transform = `translate(${left}px, ${top}px)`;

    });
  }
  toggleCanvas() {
    
    
      this.output.nativeElement.innerHTML = '';
      html2canvas(this.svgHolder.nativeElement as HTMLElement,
      {width: this.svgBoundings.width, height: this.svgBoundings.height, logging: false}).then((canvas) => {
      // this.output.nativeElement.appendChild(canvas);
      this.imgOutputSrc = canvas.toDataURL();
    })
  }

  updateHref() {
    this.httpClient.get(this.imageSrc, { responseType: 'blob' }).subscribe((blob) => {
      const reader = new FileReader()
       this.onImageLoad = fromEvent(this.image.nativeElement, 'load').pipe(first()).subscribe((e) => {

          this.svgBoundings = this.svgElement.getBoundingClientRect()
          const imageBoundings = cover(this.svgBoundings.width, this.svgBoundings.height, this.image.nativeElement.naturalWidth, this.image.nativeElement.naturalHeight);
          // this.svgImage.height.baseVal.newValueSpecifiedUnits(imageBoundings.height);
          this.svgImage.setAttribute('height', imageBoundings.height);
          this.svgImage.setAttribute('width', imageBoundings.width);
          this.backgroundImageY = imageBoundings.offsetY;
          this.backgroundImageX =  imageBoundings.offsetX;
          this.backgroundImageWidth = imageBoundings.width;
          this.backgroundImageHeight = imageBoundings.height;
          // this.svgImage.width.baseVal.value = imageBoundings.width;
          this.svgImage.style.transform = `translate(${imageBoundings.offsetX}px, ${imageBoundings.offsetY}px)`;
          this.setImageBoundings();
        })
      reader.onloadend = () => {

       
        this.image.nativeElement.src = reader.result.toString();
        this.svgImage.href.baseVal = reader.result.toString();

      }
      
      reader.readAsDataURL(blob)
    // this.image.nativeElement.src = e;
    // this.svgImage.href.baseVal = e;
    })
    }

    setImageBoundings() {
      const minX = this.svgBoundings.width - this.backgroundImageWidth;
      const maxX = 0;
      const minY = this.svgBoundings.height - this.backgroundImageHeight;
      const maxY =0;
      console.log(minX, maxX, minY, maxY);
      this.imageBoundings = {minX, maxX, minY, maxY};
    }

}