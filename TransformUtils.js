'use strict';

import Rect from './Rect';

export {Rect};

export class Transform {
  constructor(scale, translateX, translateY, pivot) {
    this.scale = scale;
    this.translateX = translateX;
    this.translateY = translateY;
    this.pivot = pivot;
  }
}

function ensure(value, otherwise) {
  return invalidValue(value) ? otherwise : value;
}

function invalidValue(value) {
  if (value === undefined || value === null) {
    return true;
  }
  return false;
}

export function fitCenterRect(contentAspectRatio, containerRect: Rect) {
  let w = containerRect.width();
  let h = containerRect.height();
  let viewAspectRatio = w / h;

  if (contentAspectRatio > viewAspectRatio) {
    h = w / contentAspectRatio;
  } else {
    w = h * contentAspectRatio;
  }

  return new Rect(
    containerRect.centerX() - w / 2,
    containerRect.centerY() - h / 2,
    containerRect.centerX() + w / 2,
    containerRect.centerY() + h / 2
  );
}

export function transformedRect(rect:Rect, transform:Transform) {
  if (!transform) {
    throw new Error('transformedRect...invalid transform');
  }
  if (!rect || !rect.valid()) {
    throw new Error('transformedRect...invalid rect');
  }

  let scale = ensure(transform.scale, 1);
  let translateX = ensure(transform.translateX, 0);
  let translateY = ensure(transform.translateY, 0);

  let pivot = transform.pivot;
  if (pivot === undefined || pivot === null) {
    //no pivot provided, we make the center of the rect as the pivot when scaling
    //so the center point remains still
    let width = rect.width() * scale;
    let height = rect.height() * scale;
    let centerX = rect.centerX() + translateX * scale;
    let centerY = rect.centerY() + translateY * scale;
    return new Rect(
      centerX - width / 2,
      centerY - height / 2,
      centerX + width / 2,
      centerY + height / 2
    );
  } else {
    let pivotX = pivot.x;
    let pivotY = pivot.y;
    if (invalidValue(pivotX) || invalidValue(pivotY)) {
      throw new Error('transformedRect...invalid pivot x=' + pivot.x + ', y=' + pivot.y);
    }

    //first make the center still
    let resultRect = transformedRect(rect, {
      scale, translateX, translateY
    });

    //the pivot moved during scaling, now move it back
    let dx = (scale - 1) * (pivotX - resultRect.centerX());
    let dy = (scale - 1) * (pivotY - resultRect.centerY());
    return resultRect.offset(-dx, -dy);
  }
}

export function getTransform(fromRect, toRect) {
  console.log('getTransform...' + JSON.stringify(fromRect) + ' ' + JSON.stringify(toRect));

  let scale = toRect.width() / fromRect.width();
  let translateX = (toRect.centerX() - fromRect.centerX()) / scale;
  let translateY = (toRect.centerY() - fromRect.centerY()) / scale;

  return new Transform(scale, translateX, translateY, undefined);
}

/**
 * Align edges of the rect with the viewport to avoid unnecessary blank space. NO scaling is performed here.
 * @param rect
 * @param viewPortRect
 * @returns {*|{line, column}|{column, line}|{x}}
 */
export function alignedRect(rect:Rect, viewPortRect:Rect) {
  let dx = 0, dy = 0;

  if (rect.width() > viewPortRect.width()) {
    if (rect.left > viewPortRect.left) {
      dx = viewPortRect.left - rect.left;
    } else if (rect.right < viewPortRect.right) {
      dx = viewPortRect.right - rect.right;
    }
  } else {
    dx = viewPortRect.centerX() - rect.centerX();
  }

  if (rect.height() > viewPortRect.height()) {
    if (rect.top > viewPortRect.top) {
      dy = viewPortRect.top - rect.top;
    } else if (rect.bottom < viewPortRect.bottom) {
      dy = viewPortRect.bottom - rect.bottom;
    }
  } else {
    dy = viewPortRect.centerY() - rect.centerY();
  }

  return rect.copy().offset(dx, dy);
}

export function availableTranslateSpace(rect, viewPortRect) {
  return {
    left: viewPortRect.left - rect.left,
    right: rect.right - viewPortRect.right,
    top: viewPortRect.top - rect.top,
    bottom: rect.bottom - viewPortRect.bottom
  };
}