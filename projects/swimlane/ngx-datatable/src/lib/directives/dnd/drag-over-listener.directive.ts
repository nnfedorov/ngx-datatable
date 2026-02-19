import { Directive, ElementRef, inject, Input, NgZone, OnDestroy, OnInit } from '@angular/core';

import { fromEvent, Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';

@Directive({
  selector: '[dragOverListener]'
})
export class DragOverListenerDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private ngZone = inject(NgZone);

  @Input() dragOverListener: () => any;
  @Input() throttleTime = 25;

  private ngUnsubscribe = new Subject<void>();

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      fromEvent(this.elementRef.nativeElement, 'dragover')
        .pipe(throttleTime(this.throttleTime), takeUntil(this.ngUnsubscribe))
        .subscribe(() => this.dragOverListener());
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
