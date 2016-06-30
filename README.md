# react-native-view-transformer

 A pure JavaScript RN component that makes **ANY** views transformable using gestures like pinch, double tap or pull.

![](Demo/demo.gif)



## Install

`npm install --save react-native-view-transformer@latest`

## Usage

```
import ViewTransformer from 'react-native-view-transformer';
...
render() {
  return (
  	<ViewTransformer>
	  //ANY views
	</ViewTransformer>
  );
}
```

Now, the wrapped views are transformable!

This component accept following props:

* `enableTransform` : false to disable transform gestures. Default is true.
* `enableScale` : false to disable scale. Default is true.
* `enableTranslate` : false to disable translateX/Y. Default is true.
* `maxScale` : a number. Default is 1.
* `enableResistance`  : true to resist over pan. Defaul is false.
* `maxOverScrollDistance` : a number used to determine final scroll position triggered by fling. Default is 20.
* `onViewTransformed` : a callback called when transform changed, receiving current transform object, {scale: xxx, translateX: xxx, translateY: xxx}.
* `onTransformGestureReleased` : a callback called when the transform gesture is released,  receiving current transform object, {scale: xxx, translateX: xxx, translateY: xxx}. Return true to abort further animations like bounce back.

#### methods

`updateTransform(transform)` : immediately transform this view.



## Transformable Image

The most common case is to transform an image, or a photo, which is famous as a ***PhotoView***, or ***ImageViewer***, so I provide a dedicated component [**react-native-transformable-image**](https://github.com/ldn0x7dc/react-native-transformable-image)





