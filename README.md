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

## ViewTransformer.Image

The most common case is to transform an image, or a photo, which is famous as a ***PhotoView***, or ***ImageViewer***, so we provide a similar component **ViewTransformer.Image**, which is much like the official Image component, but ***transformable***!

 Just use it like the official Image component:

```
<ViewTransformer.Image
  style={{width: width, height: height}}
  source={{uri: 'xxx'}}
  pixels={{width: 1920, height: 1080}} //Be careful with this prop
/>
```

The additional prop **pixels** tells image size in pixels. (*This prop is used to align the edge of the image content with the view's boundry when scaled up and to determine the max scale*)

#### Good news: with react native v0.28 and above, we can use ***Image.getSize*** to get pixels info using image url both on iOS and Android, so the **pixels** prop is **optional** for remote images.

Bad news: with react native v0.27 and below, we can only use ***Image.getSize*** to get pixels info on iOS, but [NOT on Android](https://github.com/facebook/react-native/issues/5838), so the **pixels** prop is needed. You can ask your app's API server to provide  the pixels info of remote images. For example, the API server may return a json like

```
image: {
  url: 'xxx',
  width: 1920,
  height: 1080
}
```

###### demo

![](https://raw.githubusercontent.com/yoaicom/react-native-demo/react-native-view-transformer/resources/2.gif)





