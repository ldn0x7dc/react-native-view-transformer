'use strict';

import React, { Component } from 'react';
import { Image } from 'react-native';

import ViewTransformer from './ViewTransformer';

export default class TransformableImage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
      imageLoaded: false
    };
  }

  getPixels() {
    let successCallback = ((width, height) => {
      console.log('getPixels...width=' + width + ', height=' + height);
      this.setState({
        pixels: {width, height}
      });
    }).bind(this);

    if(typeof Image.getSize === 'function') {
      if (this.props.source && this.props.source.uri) {
        Image.getSize(this.props.source.uri, successCallback, (error) => {
          console.log('getPixels...error=' + JSON.stringify(error));
        })
      } else {
        console.log('getPixels...please provide pixels prop for local images');
      }
    } else {
      console.log('getPixels...Image.getSize function not available');
    }
  }

  render() {
    let maxScale = 1;
    let contentAspectRatio = undefined;

    let width, height;
    if(this.props.pixels) {
      width = this.props.pixels.width;
      height = this.props.pixels.height;
    } else if(this.state.pixels) {
      width = this.state.pixels.width;
      height = this.state.pixels.height;
    } else {
      this.getPixels();
    }

    if (width && height) {
      contentAspectRatio = width / height;
      if (this.state.width && this.state.height) {
        maxScale = Math.max(width / this.state.width, height / this.state.height);
        maxScale = Math.max(1, maxScale);
      }
    }

    return (
      <ViewTransformer
        key={JSON.stringify(this.props.source)} //when image source changes, we should use a different node to avoid reusing previous transform state
        enableTransform={this.state.imageLoaded} //disable transform until image is loaded
        enableResistance={true}
        maxScale={maxScale}
        contentAspectRatio={contentAspectRatio}
        onLayout={this.onLayout.bind(this)}
        style={{backgroundColor: 'black'}}>
        <Image
          {...this.props}
          resizeMode={'contain'}
          onLoadStart={this.onLoadStart.bind(this)}
          onLoad={this.onLoad.bind(this)}
          capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}} //on iOS, use capInsets to avoid image downsampling
        />
      </ViewTransformer>
    );
  }

  onLoadStart(e) {
    this.props.onLoadStart && this.props.onLoadStart(e);
    this.setState({
      imageLoaded: false
    });
  }

  onLoad(e) {
    this.props.onLoad && this.props.onLoad(e);
    this.setState({
      imageLoaded: true
    });
  }

  onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    this.setState({
      width: width,
      height: height
    });
  }
}