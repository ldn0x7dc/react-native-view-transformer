'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image
} from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

export default class Demo extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ViewTransformer
        onGestureEnd={(e) => {
          console.log('onGestureEnd...' + JSON.stringify(e))
          return false;
        }}
        enableResistance={true}
        maxScale={3}
        style={{flex: 1}}>
        <AnyView />
      </ViewTransformer>
    );
  }
}

class AnyView extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          To make ANY view transformable!
        </Text>
        <Image
          style={{width: 300, height: 200}}
          source={{uri: 'https://raw.githubusercontent.com/yoaicom/react-native-demo/res/res/dany%20game%20of%20thrones.jpg'}}
          resizeMode={'contain'}
        />
        <View
          style={{flexDirection: 'row'}}
        >
          <Image
            style={{width: 150, height: 100}}
            source={{uri: 'https://raw.githubusercontent.com/yoaicom/react-native-demo/res/res/dany%20game%20of%20thrones.jpg'}}
            resizeMode={'contain'}
          />
          <Image
            style={{width: 150, height: 100}}
            source={{uri: 'https://raw.githubusercontent.com/yoaicom/react-native-demo/res/res/dany%20game%20of%20thrones.jpg'}}
            resizeMode={'contain'}
          />

        </View>
        <Text style={styles.instructions}>
          Just wrap your views in ViewTransformer.
        </Text>
        <Text style={styles.instructions}>
          Try pinch, double tap or pull.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    shadowColor: 'black',
    shadowOffset: {width: 5, height: 5},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    margin: 20
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});