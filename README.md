# react-native-view-transformer

`react-native-view-transformer` is a pure JavaScript RN component that makes **ANY** views transformable using gestures like pinch, double tap or pull, as below shows:

![](https://raw.githubusercontent.com/yoaicom/react-native-demo/react-native-view-transformer/resources/1.gif)

Demo project is in the ***Demo*** folder.

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



## Transformable Image

The most common case is to transform an image, or a photo, which is famous as a ***PhotoView***, or ***ImageViewer***, so we provide a dedicated component [**react-native-transformable-image**](https://github.com/yoaicom/react-native-transformable-image)





