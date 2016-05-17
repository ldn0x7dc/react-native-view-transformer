'use strict';

import React, {
  View,
  Image,
  PixelRatio,
  Animated,
  Easing,
  NativeModules
} from 'react-native';

import PanAndPinchResponder from './library/gesture/PanAndPinchResponder';
import Scroller from './library/scroller/Scroller';

import {Rect, Transform, transformedRect, availableTranslateSpace, fitCenterRect, alignedRect, getTransform} from './TransformUtils';

export default class ViewTransformer extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      //transform state
      scale: 1,
      translateX: 0,
      translateY: 0,

      //animation state
      animator: new Animated.Value(0)
    };

    this._viewPortRect = new Rect();

    this.onLayout = this.onLayout.bind(this);
    this.onMeasure = this.onMeasure.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleFling = this.handleFling.bind(this);
    this.handlePanAndPinch = this.handlePanAndPinch.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.cancelAnimation = this.cancelAnimation.bind(this);
    this.debug = this.debug.bind(this);
    this.contentRect = this.contentRect.bind(this);
  }

  viewPortRect() {
    this._viewPortRect.set(0, 0, this.state.width, this.state.height);
    return this._viewPortRect;
  }

  currentTransform() {
    return new Transform(this.state.scale, this.state.translateX, this.state.translateY);
  }

  render() {
    return (
      <View
        style={[this.props.style, {overflow: 'hidden'}]}
        {...this.panAndPinchResponder}>
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
          {this.props.children}
        </View>
      </View>

    );
  }

  componentWillMount() {
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
  }

  onLayout(e) {
    console.log('onLayout...' + JSON.stringify(e));
    let {width, height} = e.nativeEvent.layout;
    this.setState({
      width: width,
      height: height,
    });

    let handle = React.findNodeHandle(this.refs['innerViewRef']);
    NativeModules.UIManager.measure(handle, this.onMeasure)
  }

  onMeasure(x, y, width, height, pageX, pageY) {
    console.log('onMeasure...' + x + ' ' + y + ' ' + width + ' ' + height + ' ' + pageX + ' ' + pageY);
    this.setState({
      width: width,
      height: height,
      pageX: pageX,
      pageY: pageY
    });
  }

  handleScroll(dx, dy, scroller:Scroller) {
    console.log('onScroll...dx=' + dx + ', dy=' + dy);
    if (dx === 0 && dy === 0 && scroller.isFinished()) {
      this.animateBounce();
      return;
    }

    this.setState({
      translateX: this.state.translateX + dx / this.state.scale,
      translateY: this.state.translateY + dy / this.state.scale
    });
  }

  handleFling(e, gestureState) {
    console.log('handleFling...velocityX=' + gestureState.vx + ' velocityY=' + gestureState.vy);

    let startX = 0;
    let startY = 0;
    let maxX, minX, maxY, minY;
    let availablePanDistance = availableTranslateSpace(this.contentRect(), this.viewPortRect());
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

  handlePanAndPinch(e, gestureState) {
    console.log('handlePanAndPinch...' + JSON.stringify(gestureState));
    this.cancelAnimation();

    let transform = {};
    if (gestureState.previousPinchDistance && gestureState.currentPinchDistance && this.props.enableScale) {
      let scaleBy = gestureState.currentPinchDistance / gestureState.previousPinchDistance;
      let pivotX = gestureState.centroidX - this.state.pageX;
      let pivotY = gestureState.centroidY - this.state.pageY;

      let rect = transformedRect(transformedRect(this.viewPortRect(), this.currentTransform()), new Transform(
        scaleBy,
        gestureState.dxSinceLast,
        gestureState.dySinceLast,
        {
          x: pivotX,
          y: pivotY
        }
      ));
      transform = getTransform(this.viewPortRect(), rect);
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

  handleEnd(e, gestureState) {
    if(this.props.onGestureEnd) {
      let e = {
        transform: this.currentTransform(),
        width: this.state.width,
        height: this.state.height
      };
      if(this.props.onGestureEnd(e)) {
        return;
      }
    }

    if (!gestureState.releaseWithFling && !gestureState.releaseWithDoubleTab) {
      this.animateBounce();
    }
  }

  cancelAnimation() {
    this.state.animator.stopAnimation();
  }

  animate(targetRect, durationInMillis) {
    this.debug();
    let duration = 200;
    if(durationInMillis) {
      duration = durationInMillis;
    }


    let fromRect = this.contentRect();
    console.log('animate...to=' + JSON.stringify(targetRect) + ' from=' + JSON.stringify(fromRect));

    if (fromRect.equals(targetRect)) {
      console.log('animate...equal rect');
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

      let transform = getTransform(this.viewPortRect(), new Rect(left, top, right, bottom)); //TODO
      this.setState(transform);
    }.bind(this));
    Animated.timing(this.state.animator, {
      toValue: 1,
      duration: duration,
      easing: Easing.inOut(Easing.ease)
    }).start();
  }

  animateBounce() {
    let curScale = this.state.scale;
    let minScale = 1;
    let maxScale = 1;
    if (this.props.maxScale && this.props.maxScale > minScale) {
      maxScale = this.props.maxScale;
    }

    let scaleBy = 1;
    if (curScale > maxScale) {
      scaleBy = maxScale / curScale;
    } else if (curScale < minScale) {
      scaleBy = minScale / curScale;
    }

    let rect = transformedRect(this.contentRect(), new Transform(scaleBy, 0, 0));
    rect = alignedRect(rect, this.viewPortRect());
    this.animate(rect);
  }

  contentRect() {
    return transformedRect(this.viewPortRect(), this.currentTransform());
  }

  debug() {
    console.log('------debug------');
    console.log('state=' + JSON.stringify(this.state));
    console.log('-------end-------');
  }
}

ViewTransformer.defaultProps = {
  maxOverScrollDistance: 20,
  enableScale: true
};

//
//const TransformableImage = React.createClass({
//
//  getInitialState: function () {
//    return {
//      //view layout state
//      width: 0,
//      height: 0,
//      pageX: 0,
//      pageY: 0,
//
//      //transform state
//      scale: 1,
//      translateX: 0,
//      translateY: 0,
//      disableTransform: true,
//
//      //animation state
//      animator: new Animated.Value(0)
//
//    };
//  },
//
//  _viewPortRect: new Rect(),
//  _contentRect: new Rect(),
//  viewPortRect: function () {
//    this._viewPortRect.set(0, 0, this.state.width, this.state.height);
//    return this._viewPortRect;
//  },
//  contentRect: function () {
//    let rect = transformedRect(this.viewPortRect(), this.currentTransform());
//    return fitCenterRect(this.imageAspectRatio(), rect);
//  },
//
//  getDefaultProps: function () {
//    return {
//      maxOverScrollDistance: 20
//    };
//  },
//
//  componentWillMount: function () {
//    this.panAndPinchResponder = PanAndPinchResponder.create({
//      onStartShouldSetPanAndPinchResponder: function (e, gestureState) {
//        console.log('onStartShouldSetPanAndPinchResponder...');
//        return true;
//      },
//      onPanAndPinchResponderMove: this.handlePanAndPinch,
//      onPanAndPinchResponderRelease: this.handleEnd,
//      onPanAndPinchResponderTerminate: this.handleEnd,
//      onPanAndPinchResponderDoubleTabUp: this.handleDoubleTapUp,
//      onPanAndPinchResponderFling: this.handleFling
//    });
//    this.scroller = Scroller.create(this.handleScroll);
//  },
//
//
//  imageWidth: function () {
//    return this.props.source.width;
//  },
//  imageHeight: function () {
//    return this.props.source.height;
//  },
//  imageAspectRatio: function () {
//    return this.props.source.width / this.props.source.height;
//  },
//
//  handleScroll: function (dx, dy, scroller) {
//    console.log('onScroll...dx=' + dx + ', dy=' + dy);
//    if (dx === 0 && dy === 0 && scroller.isFinished()) {
//      this.animateBounce();
//      return;
//    }
//
//    this.setState({
//      translateX: this.state.translateX + dx / this.state.scale,
//      translateY: this.state.translateY + dy / this.state.scale
//    });
//  },
//
//  handleFling: function (e, gestureState) {
//    console.log('handleFling...velocity=' + gestureState.vx + ' ' + gestureState.vy);
//
//    let startX = 0;
//    let startY = 0;
//    let maxX, minX, maxY, minY;
//    //let availablePanDistance = calAvailablePanSpace(this.imageAspectRatio(), this.state, this.currentTransform());
//    let availablePanDistance = availableTranslateSpace(this.contentRect(), this.viewPortRect);
//    if (gestureState.vx > 0) {
//      minX = 0;
//      if (availablePanDistance.left > 0) {
//        maxX = availablePanDistance.left + this.props.maxOverScrollDistance;
//      } else {
//        maxX = 0;
//      }
//    } else {
//      maxX = 0;
//      if (availablePanDistance.right > 0) {
//        minX = -availablePanDistance.right - this.props.maxOverScrollDistance;
//      } else {
//        minX = 0;
//      }
//    }
//    if (gestureState.vy > 0) {
//      minY = 0;
//      if (availablePanDistance.top > 0) {
//        maxY = availablePanDistance.top + this.props.maxOverScrollDistance;
//      } else {
//        maxY = 0;
//      }
//    } else {
//      maxY = 0;
//      if (availablePanDistance.bottom > 0) {
//        minY = -availablePanDistance.bottom - this.props.maxOverScrollDistance;
//      } else {
//        minY = 0;
//      }
//    }
//
//    var vx = gestureState.vx * 1000; //per second
//    var vy = gestureState.vy * 1000;
//    if (Math.abs(vx) > 2 * Math.abs(vy)) {
//      vy = 0;
//    } else if (Math.abs(vy) > 2 * Math.abs(vx)) {
//      vx = 0;
//    }
//
//    this.scroller.fling(startX, startY, vx, vy, minX, maxX, minY, maxY);
//  }
//  ,
//  handleDoubleTapUp: function (e, gestureState) {
//    console.log('handleDoubleTapUp...' + JSON.stringify(gestureState));
//    this.debug()
//
//    let curScale = this.state.scale;
//    let scaleBy;
//    if (curScale > (1 + this.maxScale) / 2) {
//      scaleBy = 1 / curScale;
//    } else {
//      scaleBy = this.maxScale / curScale;
//    }
//    let pivotX = gestureState.centroidX - this.state.pageX;
//    let pivotY = gestureState.centroidY - this.state.pageY;
//
//    //let viewCenterX = this.state.width / 2;
//    //let viewCenterY = this.state.height / 2;
//    //
//    //
//    //
//    //let transform = calScaledTransform(this.imageAspectRatio(), this.state, this.currentTransform(), scaleBy, pivotX, pivotY);
//    //// move focus to view center
//    //transform.translateX += (viewCenterX - pivotX) / transform.scale;
//    //transform.translateY += (viewCenterY - pivotY) / transform.scale
//    //
//    //let transformRect = calBouncedRect(this.imageAspectRatio(), this.state, transform, pivotX, pivotY, this.maxScale);
//
//    let rect = transformedRect(this.contentRect(), new Transform(
//      scaleBy,
//      0,
//      0,
//      {
//        x: pivotX,
//        y: pivotY
//      }
//    ));
//    rect = alignedRect(rect, this.viewPortRect());
//
//    this.animate(rect);
//  }
//  ,
//  handlePanAndPinch: function (e, gestureState) {
//    console.log('handlePanAndPinch...' + JSON.stringify(gestureState));
//    this.cancelAnimation();
//
//    let transform = {};
//    if (gestureState.previousPinchDistance && gestureState.currentPinchDistance) {
//      let scaleBy = gestureState.currentPinchDistance / gestureState.previousPinchDistance;
//      let pivotX = gestureState.centroidX - this.state.pageX;
//      let pivotY = gestureState.centroidY - this.state.pageY;
//
//      //let targetScale = this.state.scale * scaleBy;
//      //if (targetScale > this.maxScale) {
//      //  scaleBy = Math.pow(scaleBy, Math.pow(this.maxScale / targetScale, 3));
//      //}
//      //transform = calScaledTransform(this.imageAspectRatio(), this.state, this.currentTransform(), scaleBy, pivotX, pivotY);
//      //transform.translateX = transform.translateX + gestureState.dxSinceLast / this.state.scale;
//      //transform.translateY = transform.translateY + gestureState.dySinceLast / this.state.scale;
//
//
//      let rect = transformedRect(transformedRect(this.viewPortRect(), this.currentTransform()), new Transform(
//        scaleBy,
//        gestureState.dxSinceLast,
//        gestureState.dySinceLast,
//        {
//          x: pivotX,
//          y: pivotY
//        }
//      ));
//      transform = getTransform(this.viewPortRect(), rect);
//    } else {
//      let dx = gestureState.dxSinceLast;
//      let dy = gestureState.dySinceLast;
//      if (Math.abs(dx) > 2 * Math.abs(dy)) {
//        dy = 0;
//      } else if (Math.abs(dy) > 2 * Math.abs(dx)) {
//        dx = 0;
//      }
//      transform.translateX = this.state.translateX + dx / this.state.scale;
//      transform.translateY = this.state.translateY + dy / this.state.scale;
//    }
//    this.setState(transform);
//  },
//  handleEnd: function (e, gestureState) {
//    if (!gestureState.releaseWithFling && !gestureState.releaseWithDoubleTab) {
//      this.animateBounce()
//    }
//  },
//
//  animateBounce: function () {
//    //let transformedRect = calBouncedRect(this.imageAspectRatio(), this.state, this.currentTransform(), undefined, undefined, this.maxScale);
//
//    let curScale = this.state.scale;
//    let scaleBy;
//    if(curScale < 1) {
//      scaleBy = 1 / curScale;
//    } else if(curScale > this.maxScale) {
//      scaleBy = this.maxScale / curScale;
//    }
//
//    let rect = transformedRect(this.contentRect(), new Transform(
//      scaleBy,
//      0,
//      0
//    ));
//    rect = alignedRect(rect, this.viewPortRect());
//    this.animate(rect);
//  }
//  ,
//  currentTransform: function () {
//    return new Transform(this.state.scale, this.state.translateX, this.state.translateY);
//    //return {
//    //  translateX: this.state.translateX,
//    //  translateY: this.state.translateY,
//    //  scale: this.state.scale
//    //};
//  }
//  ,
//
//  animate(targetRect)
//  {
//    this.debug();
//    //let fromRect = calTransformedRect(this.imageAspectRatio(), this.state, this.currentTransform());
//    let fromRect = this.contentRect();
//    console.log('animate...to=' + JSON.stringify(targetRect) + ' from=' + JSON.stringify(fromRect));
//
//    //if (isEquivalentRect(fromRect, targetRect)) {
//    //  console.log('animate...equivalentRect');
//    //  return;
//    //}
//    if (fromRect.equals(targetRect)) {
//      console.log('animate...equal rect');
//      return;
//    }
//
//
//    this.state.animator.removeAllListeners();
//    this.state.animator.setValue(0);
//    this.state.animator.addListener(function (state) {
//      let progress = state.value;
//      console.log('animate...progress=' + state.value);
//
//      let left = fromRect.left + (targetRect.left - fromRect.left) * progress;
//      let right = fromRect.right + (targetRect.right - fromRect.right) * progress;
//      let top = fromRect.top + (targetRect.top - fromRect.top) * progress;
//      let bottom = fromRect.bottom + (targetRect.bottom - fromRect.bottom) * progress;
//      //var imageRect = {
//      //  left: left,
//      //  right: right,
//      //  top: top,
//      //  bottom: bottom
//      //};
//      //let transform = calTransform(this.state, {
//      //  left, right, top, bottom
//      //})
//      let transform = getTransform(fitCenterRect(this.imageAspectRatio(), this.viewPortRect()), new Rect(left, top, right, bottom));
//
//      this.setState(transform);
//    }.bind(this));
//    Animated.timing(this.state.animator, {
//      toValue: 1,
//      duration: 200,
//      easing: Easing.inOut(Easing.ease)
//    }).start();
//  }
//  ,
//
//  cancelAnimation: function () {
//    this.state.animator.stopAnimation();
//  },
//
//  render: function () {
//    console.log('render...' + JSON.stringify(this.state));
//
//    let gestureResponder = {};
//    if (!this.state.disableTransform) {
//      gestureResponder = this.panAndPinchResponder;
//    }
//
//    return (
//      <View
//        style={this.props.style}
//        {...gestureResponder}
//      >
//        <View
//          ref={'innerViewRef'}
//          onLayout={this.onLayout}
//          style={{
//            flex: 1,
//            transform: [
//                  {scale: this.state.scale},
//                  {translateX: this.state.translateX},
//                  {translateY: this.state.translateY}
//                ],
//
//          }}>
//          <Image
//            source={this.props.source.requiredSource ? this.props.source.requiredSource: this.props.source}
//            style={{
//                width: this.state.width,
//                height: this.state.height,
//                resizeMode: 'contain',
//
//            }}
//            capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}} //on iOS, use capInsets to avoid image downsampling
//            onLoad={(e) => {
//              console.log('onLoad...' + JSON.stringify(e));
//              this.setState({
//                disableTransform: false
//              });
//            }}
//            onLoadStart={(e) => {
//              console.log('onLoadStart...' + JSON.stringify(e));
//              this.setState({
//                disableTransform: true
//              });
//            }}
//          />
//        </View>
//      </View>
//    );
//  },
//
//  onLayout: function (e) {
//    console.log('onLayout...' + JSON.stringify(e));
//    let {width, height} = e.nativeEvent.layout;
//    this.setState({
//      width: width,
//      height: height,
//    });
//    let handle = React.findNodeHandle(this.refs['innerViewRef']);
//    NativeModules.UIManager.measure(handle, this.handleMeasure)
//  },
//  handleMeasure: function (x, y, width, height, pageX, pageY) {
//    console.log('measure...' + x + ' ' + y + ' ' + width + ' ' + height + ' ' + pageX + ' ' + pageY);
//    this.setState({
//      width: width,
//      height: height,
//      pageX: pageX,
//      pageY: pageY
//    });
//
//    if (this.transformable) {
//      //let transformedRect = calTransformedRect(this.imageAspectRatio(), this.state, this.currentTransform());
//      let transformedRect = this.contentRect();
//
//      this.maxScale = Math.max(
//        this.props.source.width / PixelRatio.get() / this.state.width * 2,
//        this.props.source.height / PixelRatio.get() / this.state.height * 2,
//        this.state.width / (transformedRect.right - transformedRect.left),
//        this.state.height / (transformedRect.bottom - transformedRect.top)
//      );
//    }
//
//    this.debug()
//  },
//  transformable: function () {
//    return this.props.source && this.props.source.width && this.props.source.height;
//  },
//
//  debug: function () {
//    console.log('------debug------');
//    console.log('imageSize=' + this.imageWidth() + ' ' + this.imageHeight() + ', maxScale=' + this.maxScale);
//    console.log('state=' + JSON.stringify(this.state));
//    console.log('rect=' + JSON.stringify(this.contentRect));
//    console.log('-------end-------');
//  }
//});
//
//export default TransformableImage;
