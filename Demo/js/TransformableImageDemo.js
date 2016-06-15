'use strict';

import React, { Component } from 'react';
import {
  Text,
  View,
  Dimensions
} from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

const {width, height} = Dimensions.get('window');

export default class Demo extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View
        style={{flex: 1, alignItems: 'center'}}>
        <ViewTransformer.Image
          style={{width: width, height: height - 100}}
          source={{uri: 'https://raw.githubusercontent.com/yoaicom/react-native-demo/res/res/dany%20game%20of%20thrones.jpg'}}
          pixels={{width: 1920, height: 1080}}
        />

        <Text style={{fontSize: 16, margin: 10}}>
          Image component supporting pinch, taps and scroll. The 'pixels' prop must be provided to detect the edge of image content.
        </Text>
      </View>
    );
  }

}