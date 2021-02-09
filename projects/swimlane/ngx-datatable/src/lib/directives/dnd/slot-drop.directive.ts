import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2
} from '@angular/core';

export interface DragInfo {
  event: DragEvent;
}

@Directive({
  selector: '[slotDrop]'
})
export class SlotDropDirective implements AfterViewInit, OnDestroy {
  constructor(private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2, private ngZone: NgZone) {}

  @Input() set slotAllowDrop(allowDrop: ((element?: any, event?: DragEvent) => boolean) | boolean) {
    this._allowDrop = allowDrop instanceof Function ? allowDrop : event => allowDrop;
  }

  @Input() isDropAllowedClass = 'is-drop-allowed';
  @Input() dragEnterDelayInMs = 15;

  @Output() slotDragEnter = new EventEmitter<DragInfo>();
  @Output() slotDragOver = new EventEmitter<DragInfo>();
  @Output() slotDragLeave = new EventEmitter<DragInfo>();
  @Output() slotDrop = new EventEmitter<DragInfo>();

  private _allowDrop = (event?: DragEvent) => true;

  private readonly dragEnterEventListener = this.onDragEnter.bind(this);
  private readonly dragOverEventListener = this.onDragOver.bind(this);
  private readonly dragLeaveEventListener = this.onDragLeave.bind(this);

  private allowDrop(event: DragEvent) {
    return this._allowDrop(event);
  }

  private dragEnterTimer?: any;
  private entered = 0; // helps to filter out dragenter/dragleave events, bubbled from nested elements

  ngAfterViewInit() {
    const el = this.elementRef.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      el.addEventListener('dragenter', this.dragEnterEventListener);
      el.addEventListener('dragover', this.dragOverEventListener);
      el.addEventListener('dragleave', this.dragLeaveEventListener);
    });
  }

  ngOnDestroy() {
    const el = this.elementRef.nativeElement;
    el.removeEventListener('dragenter', this.dragEnterEventListener);
    el.removeEventListener('dragover', this.dragOverEventListener);
    el.removeEventListener('dragleave', this.dragLeaveEventListener);
  }

  /***** Event listeners *****/
  onDragEnter(event: DragEvent) {
    if (!this.allowDrop(event)) {
      return;
    }

    this.entered++;
    if (this.entered === 1) {
      this.dragEnterTimer = setTimeout(() => {
        // delay handling for better performance when user moves row intensively
        this.slotDragEnter.emit({ event });

        this.addStyles();
      }, this.dragEnterDelayInMs);
    }
  }

  onDragOver(event: DragEvent) {
    if (!this.allowDrop(event)) {
      return;
    }

    this.slotDragOver.emit({ event });

    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    if (!this.allowDrop(event)) {
      return;
    }

    this.entered--;
    if (this.entered <= 0) {
      this.entered = 0;

      if (this.dragEnterTimer) {
        clearTimeout(this.dragEnterTimer);
        this.dragEnterTimer = null;
      }

      this.slotDragLeave.emit({ event });

      this.removeStyles();
    }
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    if (!this.allowDrop(event)) {
      return;
    }

    event.preventDefault();

    this.entered = 0;

    this.slotDrop.emit({ event });

    this.removeStyles();
  }

  /***** Styling *****/
  private addStyles(): void {
    this.addClass();
  }

  private removeStyles(): void {
    this.removeClass();
  }

  private addClass() {
    this.renderer.addClass(this.elementRef.nativeElement, this.isDropAllowedClass);
  }

  private removeClass() {
    this.renderer.removeClass(this.elementRef.nativeElement, this.isDropAllowedClass);
  }
}
