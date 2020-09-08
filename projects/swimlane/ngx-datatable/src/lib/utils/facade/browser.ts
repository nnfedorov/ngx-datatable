/*tslint:disable */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * JS version of browser APIs. This library can only run in the browser.
 */
var win = (typeof window !== 'undefined' && window) || <any>{};

export { win as window };
export var document = win.document;
export var location = win.location;
export var gc = win['gc'] ? () => win['gc']() : (): any => null;
export var performance = win['performance'] ? win['performance'] : null;
export const Event = win['Event'];
export const MouseEvent = win['MouseEvent'];
export const KeyboardEvent = win['KeyboardEvent'];
export const EventTarget = win['EventTarget'];
export const History = win['History'];
export const Location = win['Location'];
export const EventListener = win['EventListener'];

const browserInfo = getBrowserInfo();
const browserName = browserInfo.name;
export const isMS = browserName == 'MSIE' || browserName == 'IE' || browserName == 'Edge';
export const isFF = browserName == 'Firefox';

function getBrowserInfo() {
  // console.error(`NGX_DATATABLE_COMPONENT: getBrowserInfo() called!`);
  const ua = navigator.userAgent;

  const edgeIndex = ua.indexOf('Edge/');
  if (edgeIndex > 0) {
    return { name: 'Edge', version: String(parseInt(ua.substring(edgeIndex + 5, ua.indexOf('.', edgeIndex)), 10)) };
  }
  let tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return { name: 'IE', version: tem[1] || '' };
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR\/(\d+)/);
    if (tem != null) {
      return { name: 'Opera', version: tem[1] };
    }
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) {
    M.splice(1, 1, tem[1]);
  }
  return { name: M[0], version: M[1] };
}
