import {
  Component,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  Renderer2,
  NgZone,
  OnInit,
  OnDestroy,
  HostBinding,
  ChangeDetectionStrategy
} from '@angular/core';

import { MouseEvent } from '../../events';

@Component({
  selector: 'datatable-scroller',
  template: ` <ng-content></ng-content> `,
  host: {
    class: 'datatable-scroll'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollerComponent implements OnInit, OnDestroy {
  @Input() scrollbarV: boolean = false;
  @Input() scrollbarH: boolean = false;

  @HostBinding('style.height.px')
  @Input()
  scrollHeight: number;

  @HostBinding('style.width.px')
  @Input()
  scrollWidth: number;

  @Output() scroll: EventEmitter<any> = new EventEmitter();

  scrollYPos: number = 0;
  scrollXPos: number = 0;
  prevScrollYPos: number = 0;
  prevScrollXPos: number = 0;
  element: any;
  parentElement: any;

  private _scrollEventListener: any = null;

  constructor(private ngZone: NgZone, element: ElementRef, private renderer: Renderer2) {
    this.element = element.nativeElement;
  }

  ngOnInit(): void {
    // manual bind so we don't always listen
    if (this.scrollbarV || this.scrollbarH) {
      const renderer = this.renderer;
      this.parentElement = renderer.parentNode(renderer.parentNode(this.element));
      this._scrollEventListener = this.onScrolled.bind(this);
      this.parentElement.addEventListener('scroll', this._scrollEventListener);

      this.parentElement.addEventListener('mousedown', this.onMouseDownListener); // #18478
    }
  }

  ngOnDestroy(): void {
    if (this._scrollEventListener) {
      this.parentElement.removeEventListener('scroll', this._scrollEventListener);
      this._scrollEventListener = null;
    }

    if (this.onMouseDownListener) {
      // #18478
      this.parentElement?.removeEventListener('mousedown', this.onMouseDownListener);
    }
  }

  setOffset(offsetY: number): void {
    if (this.parentElement) {
      this.parentElement.scrollTop = offsetY;
    }
  }

  onScrolled(event: MouseEvent): void {
    const dom: Element = <Element>event.currentTarget;
    requestAnimationFrame(() => {
      this.scrollYPos = dom.scrollTop;
      this.scrollXPos = dom.scrollLeft;
      this.updateOffset();
    });
  }

  updateOffset(): void {
    let direction: string;
    if (this.scrollYPos < this.prevScrollYPos) {
      direction = 'down';
    } else if (this.scrollYPos > this.prevScrollYPos) {
      direction = 'up';
    }

    this.scroll.emit({
      direction,
      scrollYPos: this.scrollYPos,
      scrollXPos: this.scrollXPos
    });

    this.prevScrollYPos = this.scrollYPos;
    this.prevScrollXPos = this.scrollXPos;
  }

  /***** Touch Scroll *****/
  @Input() scrollH = true;
  @Input() scrollV = true;
  @Input() tipDelayInMs = 100;
  @Input() moveThresholdInPx = 10; // defines the minimum offset that we'd like to consider as 'move'

  touchScrollMove = false; // prevent interactions when view is being moved

  private cursorTimer?: any;
  private touchScrollOn = false;
  private initX: number;
  private initY: number;

  onMouseDownListener = (event: MouseEvent) => {
    // console.log('onMouseDown()', event);
    if (event.button === 0) {
      // left button pressed
      this.initX = event.pageX;
      this.initY = event.pageY;

      this.parentElement.addEventListener('mousemove', this.onMouseMoveFn);

      document.addEventListener('mouseup', this.onDocumentMouseUpFn);
      document.addEventListener('dragend', this.onDocumentDragEndFn); // fixes missed document's 'mouseup' event

      this.setCursor();
    }
  };

  private onMouseMoveFn = (event: MouseEvent) => {
    // console.log('onMouseMove()', event);
    if (!this.touchScrollOn) {
      this.parentElement.classList.add('touch-scroll_on'); // switches off scroll snap in advance to prevent jumping
      this.touchScrollOn = true;
    }

    if (!this.touchScrollMove) {
      // we should avoid preventing elements activation without moving view
      if (
        Math.abs(this.initX - event.pageX) > this.moveThresholdInPx ||
        Math.abs(this.initY - event.pageY) > this.moveThresholdInPx
      ) {
        this.parentElement.classList.add('touch-scroll_move');
        this.touchScrollMove = true;
      } else {
        // return; // no move
      }
    }

    if (this.scrollV) {
      this.parentElement.scrollTop -= event.movementY;
    }
    if (this.scrollH) {
      this.parentElement.scrollLeft -= event.movementX;
    }
  };

  private onDocumentMouseUpFn = () => {
    // console.log('onDocumentMouseUpFn()');
    this.parentElement.removeEventListener('mousemove', this.onMouseMoveFn);

    document.removeEventListener('mouseup', this.onDocumentMouseUpFn);
    document.removeEventListener('dragend', this.onDocumentDragEndFn);

    this.resetCursor();

    this.parentElement.classList.remove('touch-scroll_on');
    this.parentElement.classList.remove('touch-scroll_move');

    this.touchScrollOn = false;
    this.touchScrollMove = false;
  };

  /**
   * When element inside host is being dragged, document 'mouseup' event is not fired,
   * so we call its listener manually in the 'dragend' callback
   */
  private onDocumentDragEndFn = () => {
    // console.log('onDocumentDragEndFn()');
    this.onDocumentMouseUpFn();
  };

  /***** Cursor tip *****/
  private setCursor(): void {
    this.cursorTimer = setTimeout(() => {
      if (this.parentElement) {
        this.parentElement.style.cursor = 'grab';
      }
    }, this.tipDelayInMs);
  }

  private resetCursor(): void {
    if (this.cursorTimer) {
      clearTimeout(this.cursorTimer);
    }
    this.cursorTimer = null;

    if (this.parentElement) {
      this.parentElement.style.cursor = null;
    }
  }
}
