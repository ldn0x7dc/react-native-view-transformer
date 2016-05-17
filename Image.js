'use strict';

import React, { Component } from 'react';
import {
  Image
} from 'react-native';

import ViewTransformer from './ViewTransformer';

export default class ImageTransformer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0
    };
  }

  render() {
    let maxScale = 1;
    let contentAspectRatio = undefined;
    if (this.props.pixels) {
      let {width, height} = this.props.pixels;
      if (width && height) {
        contentAspectRatio = width / height;
        if (this.state.width && this.state.height) {
          maxScale = Math.max(width / this.state.width, height / this.state.height);
          maxScale = Math.max(1, maxScale);
        }
      }
    }
    return (
      <ViewTransformer
        maxScale={maxScale}
        contentAspectRatio={contentAspectRatio}
        onLayout={this.onLayout.bind(this)}
        style={{backgroundColor: 'black'}}>
        <Image
          style={this.props.style}
          source={this.props.source}
          resizeMode={'contain'}
          capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}} //on iOS, use capInsets to avoid image downsampling
        />
      </ViewTransformer>
    );
  }

  onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    this.setState({
      width: width,
      height: height
    });
  }
}