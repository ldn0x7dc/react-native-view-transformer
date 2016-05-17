'use strict';


export default class Rect {

  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  set(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  width() {
    return this.right - this.left;
  }

  height() {
    return this.bottom - this.top;
  }

  centerX() {
    return (this.left + this.right) / 2;
  }

  centerY() {
    return (this.top + this.bottom) / 2;
  }

  offset(dx, dy) {
    this.left += dx;
    this.right += dx;
    this.top += dy;
    this.bottom += dy;
    return this;
  }

  copy() {
    return new Rect(this.left, this.top, this.right, this.bottom);
  }


  equals(rect: Rect) {
    return this.left === rect.left && this.top === rect.top && this.right === rect.right && this.bottom && rect.bottom;
  }

  valid() {
    if(this.left === undefined || this.left === null) {
      return false;
    }
    if(this.right === undefined || this.right === null) {
      return false;
    }
    if(this.top === undefined || this.top === null) {
      return false;
    }
    if(this.bottom === undefined || this.bottom === null) {
      return false;
    }
    return true;
  }
}