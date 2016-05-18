# react-native-view-transformer

**`react-native-view-transformer`** is a React Native component that make ***ANY*** views transformable using gestures like pinch, double tap or pull, as below shows:

![](./demo/1.gif)

Demo project is [here](https://github.com/yoaicom/react-native-demo/tree/react-native-view-transformer)

## Install

`npm install --save react-native-view-transformer@latest`

## Usage

First, import:

```
import ViewTransformer from 'react-native-view-transformer';
```

Then, render:

```
<ViewTransformer>
  //Your views here
</ViewTransformer>
```

Now, your views are transformable!

##### ViewTransformer.Image

The most common case is to transform an image, or a photo, which is famous as a ***PhotoView***, or ***ImageViewer***, so we provide a similar component **ViewTransformer.Image**, which is much like the official Image component, but ***transformable***!

 Just use it like the official Image component:

```
<ViewTransformer.Image
  style={{width: width, height: height}}
  source={{uri: 'xxx'}}
  pixels={{width: 1920, height: 1080}} //this prop is important!
/>
```

But with an additional prop **pixels**, which tells image size in pixels. 

The **pixels** prop is used to align the edge of the image content with the view's boundry and to determine the max scale.(We can actually use ***Image.getSize*** to get pixels info on iOS, but [NOT on Android](https://github.com/facebook/react-native/issues/5838), so for now this prop is needed)

There may be a problem: ***How can I find the pixels info of a remote image without loading it?*** Well, you can ask your app's API server to provide it. For example, the API server may return a json like

```
image: {
  url: 'xxx',
  width: 1920,
  height: 1080
}
```

###### demo

![](./demo/2.gif)





