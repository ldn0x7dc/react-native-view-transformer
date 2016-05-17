'use strict';

import React, {
  View,
  Image,
  PixelRatio,
  Animated,
  Easing,
  NativeModules
} from 'react-native';

import TimerMixin from 'react-timer-mixin';
import PanAndPinchResponder from './library/gesture/PanAndPinchResponder';
import Scroller from './library/scroller/Scroller';

function isEquivalentRect(rect1, rect2) {
  if (rect1 && rect2) {
    return rect1.left === rect2.left && rect1.top === rect2.top && rect1.right === rect2.right && rect1.bottom && rect2.bottom;
  }
}

/**
 *
 * @param imageAspectRatio the aspect of the image content
 * @param viewSize contains 'width' and 'height' of the view
 * @param transform contains 'translateX', 'translateY', 'scale'
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
function calTransformedRect(imageAspectRatio, viewSize, transform) {
  let viewAspectRatio = viewSize.width / viewSize.height;

  let w = viewSize.width;
  let h = viewSize.height;
  if (imageAspectRatio > viewAspectRatio) {
    h = w / imageAspectRatio;
  } else {
    w = h * imageAspectRatio;
  }

  let viewCenterX = viewSize.width / 2;
  let viewCenterY = viewSize.height / 2;

  let transformedW = w * transform.scale;
  let transformedH = h * transform.scale;
  let transformedCenterX = viewCenterX + transform.translateX * transform.scale;
  let transformedCenterY = viewCenterY + transform.translateY * transform.scale;
  return {
    left: transformedCenterX - transformedW / 2,
    right: transformedCenterX + transformedW / 2,
    top: transformedCenterY - transformedH / 2,
    bottom: transformedCenterY + transformedH / 2
  };
}

/**
 *
 * @param viewSize contains 'width' and 'height' of the view
 * @param transformedRect the rect returned from calTransformedRect()
 * @returns {{translateX: number, translateY: number, scale: number}}
 */
function calTransform(viewSize, transformedRect) {
  let transformedW = transformedRect.right - transformedRect.left;
  let transformedH = transformedRect.bottom - transformedRect.top;
  let scale = Math.max(transformedW / viewSize.width, transformedH / viewSize.height);

  let transformedCenterX = (transformedRect.left + transformedRect.right) / 2;
  let transformedCenterY = (transformedRect.top + transformedRect.bottom) / 2;
  let viewCenterX = viewSize.width / 2;
  let viewCenterY = viewSize.height / 2;
  let translateX = (transformedCenterX - viewCenterX ) / scale;
  let translateY = (transformedCenterY - viewCenterY ) / scale;

  return {
    translateX, translateY, scale
  };
}

/**
 *
 * @param imageAspectRatio
 * @param viewSize
 * @param currentTransform
 * @param scaleBy
 * @param pivotX
 * @param pivotY
 * @returns {{translateX, translateY, scale}|{translateX: number, translateY: number, scale: number}}
 */
function calScaledTransform(imageAspectRatio, viewSize, currentTransform, scaleBy, pivotX, pivotY) {
  if (pivotX === undefined || pivotX === null) {
    pivotX = viewSize.width / 2;
  }
  if (pivotY === undefined || pivotY === null) {
    pivotY = viewSize.height / 2;
  }

  let transformedRect, transformedCenterX, transformedCenterY;

  transformedRect = calTransformedRect(imageAspectRatio, viewSize, currentTransform);
  transformedCenterX = (transformedRect.left + transformedRect.right) / 2;
  transformedCenterY = (transformedRect.top + transformedRect.bottom) / 2;
  let dx = pivotX - transformedCenterX;
  let dy = pivotY - transformedCenterY;

  transformedRect = calTransformedRect(imageAspectRatio, viewSize, {
    translateX: 0,
    translateY: 0,
    scale: currentTransform.scale * scaleBy
  });
  transformedCenterX = (transformedRect.left + transformedRect.right) / 2;
  transformedCenterY = (transformedRect.top + transformedRect.bottom) / 2;

  let pivotXX = transformedCenterX + dx * scaleBy;
  let pivotYY = transformedCenterY + dy * scaleBy;

  transformedRect = offsetRect(transformedRect, pivotX - pivotXX, pivotY - pivotYY);
  return calTransform(viewSize, transformedRect);
}

/**
 * We need to bounce the image content to avoid black edge
 * @param imageAspectRatio
 * @param viewSize
 * @param currentTransform
 * @param pivotX
 * @param pivotY
 * @param maxScale
 * @returns {*}
 */
function calBouncedRect(imageAspectRatio, viewSize, currentTransform, pivotX, pivotY, maxScale) {
  if (currentTransform.scale < 1) {
    return calTransformedRect(imageAspectRatio, viewSize, {scale: 1, translateX: 0, translateY: 0});
  }

  if (currentTransform.scale > maxScale) {
    currentTransform = calScaledTransform(imageAspectRatio, viewSize, currentTransform, maxScale / currentTransform.scale, pivotX, pivotY);
  }

  let transformedRect = calTransformedRect(imageAspectRatio, viewSize, currentTransform);
  let transformedW = transformedRect.right - transformedRect.left;
  let transformedH = transformedRect.bottom - transformedRect.top;
  let transformedCenterX = (transformedRect.left + transformedRect.right) / 2;
  let transformedCenterY = (transformedRect.top + transformedRect.bottom) / 2;
  let viewCenterX = viewSize.width / 2;
  let viewCenterY = viewSize.height / 2;

  let dx = 0, dy = 0;
  if (transformedW > viewSize.width) {
    if (transformedRect.left > 0) {
      dx = 0 - transformedRect.left;
    } else if (transformedRect.right < viewSize.width) {
      dx = viewSize.width - transformedRect.right;
    }
  } else {
    dx = viewCenterX - transformedCenterX;
  }

  if (transformedH > viewSize.height) {
    if (transformedRect.top > 0) {
      dy = 0 - transformedRect.top;
    } else if (transformedRect.bottom < viewSize.height) {
      dy = viewSize.height - transformedRect.bottom;
    }
  } else {
    dy = viewCenterY - transformedCenterY;
  }

  return offsetRect(transformedRect, dx, dy);
}

/**
 * Offset the rectangle by adding dx to its left and right coordinates, and
 * adding dy to its top and bottom coordinates.
 * @param rect
 * @param dx
 * @param dy
 * @returns {{left: *, right: *, top: *, bottom: *}}
 */
function offsetRect(rect, dx, dy) {
  return {
    left: rect.left + dx,
    right: rect.right + dx,
    top: rect.top + dy,
    bottom: rect.bottom + dy
  };
}

/**
 *
 * @param imageAspectRatio
 * @param viewSize
 * @param transform
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
function calAvailablePanSpace(imageAspectRatio, viewSize, transform) {
  let transformedRect = calTransformedRect(imageAspectRatio, viewSize, transform);

  return {
    left: 0 - transformedRect.left,
    right: transformedRect.right - viewSize.width,
    top: 0 - transformedRect.top,
    bottom: transformedRect.bottom - viewSize.height
  };
}

const TransformableImage = React.createClass({
  mixins: [TimerMixin],

  getInitialState: function () {
    return {
      //view layout state
      width: 0,
      height: 0,
      pageX: 0,
      pageY: 0,

      //transform state
      scale: 1,
      translateX: 0,
      translateY: 0,
      disableTransform: true,

      //animation state
      animator: new Animated.Value(0)

    };
  },


  getDefaultProps: function () {
    return {
      maxOverScrollDistance: 20
    };
  },

  componentWillMount: function () {
    this.panAndPinchResponder = PanAndPinchResponder.create({
      onStartShouldSetPanAndPinchResponder: function (e, gestureState) {
        console.log('onStartShouldSetPanAndPinchResponder...');
        return true;
      },
      onPanAndPinchResponderMove: this.handlePanAndPinch,
      onPanAndPinchResponderRelease: this.handleEnd,
      onPanAndPinchResponderTerminate: this.handleEnd,
      onPanAndPinchResponderDoubleTabUp: this.handleDoubleTapUp,
      onPanAndPinchResponderFling: this.handleFling
    });
    this.scroller = Scroller.create(this.handleScroll);
  },

  imageWidth: function () {
    return this.props.source.width;
  },
  imageHeight: function () {
    return this.props.source.height;
  },
  imageAspectRatio: function () {
    return this.props.source.width / this.props.source.height;
  },

  handleScroll: function (dx, dy, scroller) {
    console.log('onScroll...dx=' + dx + ', dy=' + dy);
    if (dx === 0 && dy === 0 && scroller.isFinished()) {
      this.animateBounce();
      return;
    }

    this.setState({
      translateX: this.state.translateX + dx / this.state.scale,
      translateY: this.state.translateY + dy / this.state.scale
    });
  },

  handleFling: function (e, gestureState) {
    console.log('handleFling...velocity=' + gestureState.vx + ' ' + gestureState.vy);

    let startX = 0;
    let startY = 0;
    let maxX, minX, maxY, minY;
    let availablePanDistance = calAvailablePanSpace(this.imageAspectRatio(), this.state, this.currentTransform());
    if (gestureState.vx > 0) {
      minX = 0;
      if (availablePanDistance.left > 0) {
        maxX = availablePanDistance.left + this.props.maxOverScrollDistance;
      } else {
        maxX = 0;
      }
    } else {
      maxX = 0;
      if (availablePanDistance.right > 0) {
        minX = -availablePanDistance.right - this.props.maxOverScrollDistance;
      } else {
        minX = 0;
      }
    }
    if (gestureState.vy > 0) {
      minY = 0;
      if (availablePanDistance.top > 0) {
        maxY = availablePanDistance.top + this.props.maxOverScrollDistance;
      } else {
        maxY = 0;
      }
    } else {
      maxY = 0;
      if (availablePanDistance.bottom > 0) {
        minY = -availablePanDistance.bottom - this.props.maxOverScrollDistance;
      } else {
        minY = 0;
      }
    }

    var vx = gestureState.vx * 1000; //per second
    var vy = gestureState.vy * 1000;
    if (Math.abs(vx) > 2 * Math.abs(vy)) {
      vy = 0;
    } else if (Math.abs(vy) > 2 * Math.abs(vx)) {
      vx = 0;
    }

    this.scroller.fling(startX, startY, vx, vy, minX, maxX, minY, maxY);
  }
  ,
  handleDoubleTapUp: function (e, gestureState) {
    console.log('handleDoubleTapUp...' + JSON.stringify(gestureState));
    this.debug()

    let curScale = this.state.scale;
    let scaleBy;
    if (curScale > (1 + this.maxScale) / 2) {
      scaleBy = 1 / curScale;
    } else {
      scaleBy = this.maxScale / curScale;
    }
    let pivotX = gestureState.centroidX - this.state.pageX;
    let pivotY = gestureState.centroidY - this.state.pageY;
    let viewCenterX = this.state.width / 2;
    let viewCenterY = this.state.height / 2;

    let transform = calScaledTransform(this.imageAspectRatio(), this.state, this.currentTransform(), scaleBy, pivotX, pivotY);
    // move focus to view center
    transform.translateX += (viewCenterX - pivotX) / transform.scale;
    transform.translateY += (viewCenterY - pivotY) / transform.scale

    let transformRect = calBouncedRect(this.imageAspectRatio(), this.state, transform, pivotX, pivotY, this.maxScale);


    this.animate(transformRect);
  }
  ,
  handlePanAndPinch: function (e, gestureState) {
    console.log('handlePanAndPinch...' + JSON.stringify(gestureState));
    this.cancelAnimation();

    let transform = {};
    if (gestureState.previousPinchDistance && gestureState.currentPinchDistance) {
      let scaleBy = gestureState.currentPinchDistance / gestureState.previousPinchDistance;
      let pivotX = gestureState.centroidX - this.state.pageX;
      let pivotY = gestureState.centroidY - this.state.pageY;

      let targetScale = this.state.scale * scaleBy;
      if (targetScale > this.maxScale) {
        scaleBy = Math.pow(scaleBy, Math.pow(this.maxScale / targetScale, 3));
      }
      transform = calScaledTransform(this.imageAspectRatio(), this.state, this.currentTransform(), scaleBy, pivotX, pivotY);
      transform.translateX = transform.translateX + gestureState.dxSinceLast / this.state.scale;
      transform.translateY = transform.translateY + gestureState.dySinceLast / this.state.scale;
    } else {
      let dx = gestureState.dxSinceLast;
      let dy = gestureState.dySinceLast;
      if (Math.abs(dx) > 2 * Math.abs(dy)) {
        dy = 0;
      } else if (Math.abs(dy) > 2 * Math.abs(dx)) {
        dx = 0;
      }
      transform.translateX = this.state.translateX + dx / this.state.scale;
      transform.translateY = this.state.translateY + dy / this.state.scale;
    }
    this.setState(transform);
  }
  ,
  handleEnd: function (e, gestureState) {
    if (!gestureState.releaseWithFling && !gestureState.releaseWithDoubleTab) {
      this.animateBounce()
    }
  }
  ,
  animateBounce: function () {
    let transformedRect = calBouncedRect(this.imageAspectRatio(), this.state, this.currentTransform(), undefined, undefined, this.maxScale);
    this.animate(transformedRect);
  }
  ,
  currentTransform: function () {
    return {
      translateX: this.state.translateX,
      translateY: this.state.translateY,
      scale: this.state.scale
    };
  }
  ,

  animate(targetRect)
  {
    this.debug();
    let fromRect = calTransformedRect(this.imageAspectRatio(), this.state, this.currentTransform());
    console.log('animate...to=' + JSON.stringify(targetRect) + ' from=' + JSON.stringify(fromRect));

    if (isEquivalentRect(fromRect, targetRect)) {
      console.log('animate...equivalentRect');
      return;
    }
    this.state.animator.removeAllListeners();
    this.state.animator.setValue(0);
    this.state.animator.addListener(function (state) {
      let progress = state.value;
      console.log('animate...progress=' + state.value);

      let left = fromRect.left + (targetRect.left - fromRect.left) * progress;
      let right = fromRect.right + (targetRect.right - fromRect.right) * progress;
      let top = fromRect.top + (targetRect.top - fromRect.top) * progress;
      let bottom = fromRect.bottom + (targetRect.bottom - fromRect.bottom) * progress;
      var imageRect = {
        left: left,
        right: right,
        top: top,
        bottom: bottom
      };
      let transform = calTransform(this.state, {
        left, right, top, bottom
      })
      this.setState(transform);
    }.bind(this));
    Animated.timing(this.state.animator, {
      toValue: 1,
      duration: 200,
      easing: Easing.inOut(Easing.ease)
    }).start();
  }
  ,

  cancelAnimation: function () {
    this.state.animator.stopAnimation();
  },

  render: function () {
    console.log('render...' + JSON.stringify(this.state));

    let gestureResponder = {};
    if (!this.state.disableTransform) {
      gestureResponder = this.panAndPinchResponder;
    }

    return (
      <View
        style={this.props.style}
        {...gestureResponder}
      >
        <View
          ref={'innerViewRef'}
          onLayout={this.onLayout}
          style={{
            flex: 1,
            transform: [
                  {scale: this.state.scale},
                  {translateX: this.state.translateX},
                  {translateY: this.state.translateY}
                ],

          }}>
          <Image
            source={this.props.source.requiredSource ? this.props.source.requiredSource: this.props.source}
            style={{
                width: this.state.width,
                height: this.state.height,
                resizeMode: 'contain',

            }}
            capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}} //on iOS, use capInsets to avoid image downsampling
            onLoad={(e) => {
              console.log('onLoad...' + JSON.stringify(e));
              this.setState({
                disableTransform: false
              });
            }}
            onLoadStart={(e) => {
              console.log('onLoadStart...' + JSON.stringify(e));
              this.setState({
                disableTransform: true
              });
            }}
          />
        </View>
      </View>
    );
  },

  onLayout: function (e) {
    console.log('onLayout...' + JSON.stringify(e));
    let {width, height} = e.nativeEvent.layout;
    this.setState({
      width: width,
      height: height,
    });
    let handle = React.findNodeHandle(this.refs['innerViewRef']);
    NativeModules.UIManager.measure(handle, this.handleMeasure)
  },
  handleMeasure: function (x, y, width, height, pageX, pageY) {
    console.log('measure...' + x + ' ' + y + ' ' + width + ' ' + height + ' ' + pageX + ' ' + pageY);
    this.setState({
      width: width,
      height: height,
      pageX: pageX,
      pageY: pageY
    });

    if (this.transformable) {
      let transformedRect = calTransformedRect(this.imageAspectRatio(), this.state, this.currentTransform());
      this.maxScale = Math.max(
        this.props.source.width / PixelRatio.get() / this.state.width * 2,
        this.props.source.height / PixelRatio.get() / this.state.height * 2,
        this.state.width / (transformedRect.right - transformedRect.left),
        this.state.height / (transformedRect.bottom - transformedRect.top)
      );
    }

    this.debug()
  },
  transformable: function () {
    return this.props.source && this.props.source.width && this.props.source.height;
  },

  debug: function () {
    console.log('------debug------');
    console.log('imageSize=' + this.imageWidth() + ' ' + this.imageHeight() + ', maxScale=' + this.maxScale);
    console.log('state=' + JSON.stringify(this.state));
    console.log('rect=' + JSON.stringify(calTransformedRect(this.imageAspectRatio(), this.state, this.currentTransform())));
    console.log('-------end-------');
  }
});

export default TransformableImage;
