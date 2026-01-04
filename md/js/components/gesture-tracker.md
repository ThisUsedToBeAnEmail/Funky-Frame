# Funky.GestureTracker

Factory for touch and mouse gesture detection with tap, swipe, long-press, and drag support.

## Overview

`Funky.GestureTracker` provides a simple factory API for detecting common gestures. Create tracker instances that listen to **both touch and mouse events** on target elements and fire callbacks when gestures are detected. This makes gesture-based interactions work seamlessly on both mobile (touch) and desktop (mouse) devices.

## Quick Start

```javascript
var gesture = Funky.GestureTracker.init({
  target: '#my-element',
  gestures: ['swipe', 'longpress'],
  onSwipe: function(data) {
    console.log('Swiped:', data.direction);
  },
  onLongPress: function(data) {
    showContextMenu(data.x, data.y);
  }
});

// Clean up when done
gesture.destroy();
```

## Mouse Event Transparency

GestureTracker automatically handles both touch and mouse events:

- **Touch devices:** Uses `touchstart`, `touchmove`, `touchend`, `touchcancel`
- **Desktop devices:** Uses `mousedown`, `mousemove`, `mouseup`, `mouseleave`

This is handled transparently - your gesture callbacks work identically regardless of input method. The event data objects provide normalized coordinates and behavior.

```javascript
// Works with both touch and mouse drag
var tracker = Funky.GestureTracker.init({
  target: '#carousel',
  gestures: ['swipe'],
  onSwipe: function(data) {
    // data.direction works for both touch swipes and mouse drags
    if (data.direction === 'left') nextSlide();
    if (data.direction === 'right') prevSlide();
  }
});
```

## API Reference

### Factory Methods

#### `Funky.GestureTracker.init(options)`

Create a new gesture tracker instance (primary factory method).

**Returns:** `GestureTrackerInstance`

#### `Funky.GestureTracker.getInstance(id)`

Get existing instance by ID.

**Returns:** `GestureTrackerInstance` or `undefined`

#### `Funky.GestureTracker.destroy(id)`

Destroy instance by ID.

#### `Funky.GestureTracker.destroyAll()`

Destroy all instances.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| target | Element/string | `null` | Target element or selector |
| namespace | string | `'gesturetracker'` | Event namespace for cleanup |
| gestures | string[] | `['tap', 'swipe', 'longpress']` | Gestures to detect |
| swipeThreshold | number | `50` | Minimum px for swipe |
| swipeVelocity | number | `0.3` | Minimum px/ms for swipe |
| longPressDelay | number | `500` | Ms to trigger long-press |
| tapThreshold | number | `10` | Max px movement for tap |
| preventDefault | boolean | `false` | Prevent default on touchmove |
| passive | boolean | `true` | Use passive listeners |
| hapticFeedback | boolean | `false` | Vibrate on gesture |
| autoStart | boolean | `true` | Start tracking immediately |
| emitEvents | boolean | `false` | Emit PubSub events |
| eventPrefix | string | `'funky:gesture'` | PubSub event prefix |

### Gesture Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| onTap | `function(data)` | Triggered on tap |
| onSwipe | `function(data)` | Triggered on swipe |
| onLongPress | `function(data)` | Triggered on long-press |
| onDragStart | `function(data)` | Triggered when drag begins |
| onDragMove | `function(data)` | Triggered during drag |
| onDragEnd | `function(data)` | Triggered when drag ends |

### Instance Methods

#### `start()`

Start tracking touch events on target.

**Returns:** `this` (chainable)

```javascript
gesture.start();
```

---

#### `stop()`

Stop tracking touch events (preserves configuration).

**Returns:** `this` (chainable)

```javascript
gesture.stop();
// Can restart later
gesture.start();
```

---

#### `destroy()`

Fully destroy the tracker and release all references.

```javascript
gesture.destroy();
```

---

#### `isActive()`

Check if tracker is currently listening.

**Returns:** `boolean`

---

#### `getId()`

Get the tracker's unique ID.

**Returns:** `string`

## Callback Data Objects

### Tap Data

```javascript
{
  x: 150,           // clientX
  y: 200,           // clientY
  target: Element,  // Touch target element
  timestamp: 1234567890
}
```

### Swipe Data

```javascript
{
  direction: 'left',  // 'up', 'down', 'left', 'right'
  velocity: 0.8,      // px/ms
  deltaX: -120,       // Horizontal movement
  deltaY: 5,          // Vertical movement
  duration: 150,      // Ms
  startX: 300,
  startY: 200,
  endX: 180,
  endY: 205
}
```

### Long-Press Data

```javascript
{
  x: 150,           // clientX
  y: 200,           // clientY
  target: Element,  // Touch target element
  timestamp: 1234567890
}
```

### Drag Data

```javascript
{
  x: 180,           // Current clientX
  y: 210,           // Current clientY
  startX: 150,
  startY: 200,
  deltaX: 30,       // Movement from start
  deltaY: 10,
  target: Element,
  originalEvent: TouchEvent
}
```

## Usage Patterns

### Swipe Navigation

```javascript
var carousel = Funky.GestureTracker.init({
  target: '#carousel',
  gestures: ['swipe'],
  swipeThreshold: 80,
  onSwipe: function(data) {
    if (data.direction === 'left') {
      showNextSlide();
    } else if (data.direction === 'right') {
      showPrevSlide();
    }
  }
});
```

### Context Menu on Long-Press

```javascript
var list = Funky.GestureTracker.init({
  target: '#item-list',
  gestures: ['longpress', 'tap'],
  hapticFeedback: true,
  onLongPress: function(data) {
    showContextMenu(data.target, data.x, data.y);
  },
  onTap: function(data) {
    selectItem(data.target);
  }
});
```

### Drag to Reorder

```javascript
var sortable = Funky.GestureTracker.init({
  target: '#sortable-list',
  gestures: ['drag'],
  preventDefault: true,
  onDragStart: function(data) {
    data.target.classList.add('dragging');
  },
  onDragMove: function(data) {
    updatePlaceholder(data.y);
  },
  onDragEnd: function(data) {
    data.target.classList.remove('dragging');
    reorderItems(data.target, data.y);
  }
});
```

### PubSub Integration

```javascript
// Enable PubSub events
var tracker = Funky.GestureTracker.init({
  target: '#element',
  gestures: ['swipe'],
  emitEvents: true,
  eventPrefix: 'funky:carousel'
});

// Listen elsewhere
Funky.PubSub.on('funky:carousel:swipe', function(data) {
  console.log('Carousel swiped:', data.gesture.direction);
});
```

## PubSub Events

When `emitEvents: true`, the following PubSub events are emitted:

| Event | Data |
|-------|------|
| `{prefix}:tap` | `{ namespace, id, gesture: {...} }` |
| `{prefix}:swipe` | `{ namespace, id, gesture: {...} }` |
| `{prefix}:longpress` | `{ namespace, id, gesture: {...} }` |
| `{prefix}:dragstart` | `{ namespace, id, gesture: {...} }` |
| `{prefix}:dragmove` | `{ namespace, id, gesture: {...} }` |
| `{prefix}:dragend` | `{ namespace, id, gesture: {...} }` |

## Event Binding

GestureTracker binds to both touch and mouse events for cross-device compatibility:

### Touch Events
| Event | Handler |
|-------|---------|
| `touchstart` | Begin gesture tracking |
| `touchmove` | Track movement, detect drag |
| `touchend` | Evaluate gesture (tap, swipe, drag end) |
| `touchcancel` | Cancel gesture tracking |

### Mouse Events
| Event | Handler |
|-------|---------|
| `mousedown` | Begin gesture tracking |
| `mousemove` | Track movement, detect drag |
| `mouseup` | Evaluate gesture (tap, swipe, drag end) |
| `mouseleave` | Cancel gesture tracking (pointer left target) |

## Gesture Detection Logic

### Tap
- Touch/click ends within `tapThreshold` px of start position
- Long-press did not fire

### Swipe
- Touch/drag ends with distance ≥ `swipeThreshold`
- Velocity ≥ `swipeVelocity` (px/ms)
- Direction determined by largest delta (X or Y)

### Long-Press
- Touch/click held for ≥ `longPressDelay` ms
- Movement stays within `tapThreshold`

### Drag
- Touch/mouse moves beyond `tapThreshold`
- DragStart fires once, DragMove fires continuously

## File Location

`/public/assets/js/components/gesture-tracker.js`

## Dependencies

- `Funky.Events` - For event binding
- `Funky.PubSub` - Optional, for emitting events

## See Also

- [Funky.Carousel](carousel.md) - Uses GestureTracker for swipe navigation
- [Funky.ScrollTracker](scroll-tracker.md) - Scroll position tracking
- [Funky.Events](../core/events.md) - Event utilities
- [Funky.PubSub](../core/pubsub.md) - Application messaging
