'use strict';

import React, { Component } from 'react';

import ImageDemo from './js/TransformableImageDemo';
import ViewDemo from './js/TransformableViewDemo';

export default class App extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ImageDemo />
      //<ViewDemo />
    );
  }
}