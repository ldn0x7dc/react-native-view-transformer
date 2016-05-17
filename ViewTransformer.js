'use strict';

import React, {
  View,
  Image,
  Animated,
  Easing,
  NativeModules
} from 'react-native';

import PanAndPinchResponder from './library/gesture/PanAndPinchResponder';
import Scroller from './library/scroller/Scroller';
import TransformableImage from './Image';

import {Rect, Transform, transformedRect, availableTranslateSpace, fitCenterRect, alignedRect, getTransform} from './TransformUtils';

export default class ViewTransformer extends React.Component {

  static get Image() {
    return TransformableImage;
  }

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
    this.handleDoubleTapUp = this.handleDoubleTapUp.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.cancelAnimation = this.cancelAnimation.bind(this);
    this.debug = this.debug.bind(this);
    this.contentRect = this.contentRect.bind(this);
    this.transformedContentRect = this.transformedContentRect.bind(this);
    this.animate = this.animate.bind(this);
  }

  viewPortRect() {
    this._viewPortRect.set(0, 0, this.state.width, this.state.height);
    return this._viewPortRect;
  }

  contentRect() {
    let rect = this.viewPortRect().copy();
    if (this.props.contentAspectRatio && this.props.contentAspectRatio > 0) {
      rect = fitCenterRect(this.props.contentAspectRatio, rect);
    }
    return rect;
  }

  transformedContentRect() {
    let rect = transformedRect(this.viewPortRect(), this.currentTransform());
    if (this.props.contentAspectRatio && this.props.contentAspectRatio > 0) {
      rect = fitCenterRect(this.props.contentAspectRatio, rect);
    }
    return rect;
  }

  currentTransform() {
    return new Transform(this.state.scale, this.state.translateX, this.state.translateY);
  }

  render() {
    return (
      <View
        {...this.props}
        {...this.panAndPinchResponder}
        style={[this.props.style, {overflow: 'hidden'}]}
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
    let availablePanDistance = availableTranslateSpace(this.transformedContentRect(), this.viewPortRect());
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

  handleDoubleTapUp(e, gestureState) {
    console.log('handleDoubleTapUp...' + JSON.stringify(gestureState));

    let curScale = this.state.scale;
    let scaleBy;
    if (curScale > (1 + this.props.maxScale) / 2) {
      scaleBy = 1 / curScale;
    } else {
      scaleBy = this.props.maxScale / curScale;
    }
    let pivotX = gestureState.centroidX - this.state.pageX;
    let pivotY = gestureState.centroidY - this.state.pageY;

    let rect = transformedRect(this.transformedContentRect(), new Transform(
      scaleBy,
      0,
      0,
      {
        x: pivotX,
        y: pivotY
      }
    ));
    rect = alignedRect(rect, this.viewPortRect());

    this.animate(rect);
  }

  handlePanAndPinch(e, gestureState) {
    console.log('handlePanAndPinch...' + JSON.stringify(gestureState));
    this.cancelAnimation();

    let transform = {};
    if (gestureState.previousPinchDistance && gestureState.currentPinchDistance && this.props.enableScale) {
      let scaleBy = gestureState.currentPinchDistance / gestureState.previousPinchDistance;
      let pivotX = gestureState.centroidX - this.state.pageX;
      let pivotY = gestureState.centroidY - this.state.pageY;

      let rect = transformedRect(transformedRect(this.contentRect(), this.currentTransform()), new Transform(
        scaleBy,
        gestureState.dxSinceLast,
        gestureState.dySinceLast,
        {
          x: pivotX,
          y: pivotY
        }
      ));
      transform = getTransform(this.contentRect(), rect);
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
    if (this.props.onGestureEnd) {
      let e = {
        transform: this.currentTransform(),
        width: this.state.width,
        height: this.state.height
      };
      if (this.props.onGestureEnd(e)) {
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
    if (durationInMillis) {
      duration = durationInMillis;
    }


    let fromRect = this.transformedContentRect();
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

      let transform = getTransform(this.contentRect(), new Rect(left, top, right, bottom));
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
    let maxScale = this.props.maxScale;
    let scaleBy = 1;
    if (curScale > maxScale) {
      scaleBy = maxScale / curScale;
    } else if (curScale < minScale) {
      scaleBy = minScale / curScale;
    }

    let rect = transformedRect(this.transformedContentRect(), new Transform(
      scaleBy,
      0,
      0,
      {
        x: this.viewPortRect().centerX(),
        y: this.viewPortRect().centerY()
      }
    ));
    rect = alignedRect(rect, this.viewPortRect());
    this.animate(rect);
  }


  debug() {
    console.log('------debug------');
    console.log('state=' + JSON.stringify(this.state));
    console.log('-------end-------');
  }
}

ViewTransformer.defaultProps = {
  maxOverScrollDistance: 20,
  enableScale: true,
  maxScale: 1
};