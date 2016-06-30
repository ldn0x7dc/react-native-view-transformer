'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  PixelRatio
} from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

export default class App extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ViewTransformer
        enableTransform={true}
        enableScale={true}
        enableTranslate={true}
        style={{flex: 1}}
        enableResistance={true}
        maxScale={3}>
        <AnyView />
      </ViewTransformer>
    );
  }
}

class AnyView extends Component {
  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={{borderColor: 'black', borderWidth: 1/PixelRatio.get()}}>
          <Text style={styles.welcome}>
            Press Me! Won't capture children's press.
          </Text>
        </TouchableOpacity>
        <View
          style={{height: 120, backgroundColor: '#efefef', alignItems: 'center', justifyContent: 'center', borderColor: 'black', borderWidth: 1/PixelRatio.get()}}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}>
          <Text style={styles.welcome}>
            Scroll Me! Won't capture children's scroll if children don't allow.
          </Text>
        </View>

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
    margin: 20,
    elevation: 10
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