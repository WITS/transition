# What is transition.js?

transition.js provides some static methods that make it easy to transtion and animate elements in web pages.

# Usage

## Load transition.js

To use transition.js, you simply need to load the transition.js in your page. This can be accomplished by adding the following line to your `<head>` element:

```html
<script src='https://wits.github.io/transition/transition.js'></script>
```

The code above will ensure that you always get the latest version of transition.js. (You can also host the file yourself.)

## Transition an element

To transition an element, you first need to capture the initial state of the element. Then ensure that the element is in the state you want the element to end in.

### Take a snapshot of the state of an element

To take a snapshot of an element, simply call `Transition.snapshot` like this:

```js
let snapshot = Transition.snapshot(element); // A transition snapshot object
```

#### How do I make sure it transitions everything?

By default, the snapshot will keep track of the size and position of the element on screen. If you need to transition additional properties, you can capture them as well, like so:

```js

let snapshot = Transition.snapshot(element, ['background-color', 'color']);
```

### Update the element's style

After taking the snapshot, and before starting the animation, you should perform and changes you want to make to the element's style. This might be as simple as adding a class, or as complex as setting several `.style` properties.

### Animate from that snapshot to the element's current state

Now all that's left is to perform the actual animation. The transition will animate the element from the snapshot to its current state. You can do this, like so:

```js
Transition.from(element, snapshot, 500); // 500 represents 500 milliseconds, or half a second
```

### Try transitioning from one element to another

The snapshot doesn't have to be from the element that you're animating. For instance, in the [demo](https://wits.github.io/transition/), clicking on the button in the bottom right corner creates a new card element, and animates it from the button. The source code for that demo can be seen [here](https://wits.github.io/transition/demo.js).

### A complete example

To see how this all looks when put together, here's an example:

```js
// Get an element
let element = document.querySelector('#foo');

// Capture a snapshot of the element before the changes
let snapshot = Transition.snapshot(element, ['background-color', 'color']);

// Restyle the element
element.style.backgroundColor = 'black';
element.style.color = 'white';
element.style.position = 'fixed';
element.style.left = '500px';
element.style.top = '300px';

// Transition the changes for 500 milliseconds
Transition.from(element, snapshot, 500);
```

## Animate an element

To animate an element, you must first create a set of keyframes for the animation to follow. Then you can simply call a method with the element and keyframes.

### Create the keyframes

Keyframes can be done in several formats.

#### Single Property Animation

If you're only animating one property, you can write the animation using very simple JSON, like so:

```js
let json = {
    'background-color': {
        from: 'black',
        to: 'white'
    }
};
```

#### To-From Animation (2 Keyframes)

If you're just trying to animate some properties from initial values to different end values, you can write the json like so:

```js
let json = {
    from: {
        'background-color': 'black'
    },
    to: {
        'background-color': 'white'
    }
};
```

#### Complex Animation

If you're trying to create the types of complex animation that CSS3 supports, you can also enter the JSON like this:

```js
let json = {
    // 0%
    0: {
        'background-color': 'black'
    },
    // 50%
    50: {
        'background-color': 'red'
    },
    // 100%
    100: {
        'background-color': 'white'
    }
};
```

### Animate the element using these keyframes

Once you've created your animation JSON, you can perform the animation like so:

```js
Transition.animate(element, json, 500); // Where 500 represents the duration of the animation, in milliseconds
```