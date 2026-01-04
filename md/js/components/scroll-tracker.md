# Funky.ScrollTracker

Factory for creating scroll tracking instances with rAF throttling, direction detection, velocity calculation, and threshold callbacks.

## Overview

`Funky.ScrollTracker` provides performant scroll position tracking with automatic throttling. Create tracker instances that monitor scroll events and provide direction, velocity, and threshold crossing data.

## Quick Start

```javascript
var tracker = Funky.ScrollTracker.init({
  onScroll: function(data) {
    console.log('Scroll Y:', data.scrollY, 'Direction:', data.direction);
  },
  thresholds: [100, 300, 500],
  onThreshold: function(data) {
    console.log('Crossed', data.threshold, data.crossed);
  }
});

// Clean up when done
tracker.destroy();
```

## API Reference

### Factory Methods

#### `Funky.ScrollTracker.init(options)`

Create a new scroll tracker instance (primary factory method).

**Returns:** `ScrollTrackerInstance`

#### `Funky.ScrollTracker.getInstance(id)`

Get existing instance by ID.

**Returns:** `ScrollTrackerInstance` or `undefined`

#### `Funky.ScrollTracker.destroy(id)`

Destroy instance by ID.

#### `Funky.ScrollTracker.destroyAll()`

Destroy all instances.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| target | Element/Window/string | `window` | Scroll target |
| throttle | string/number | `'raf'` | `'raf'`, `'debounce'`, or ms delay |
| onScroll | function | `null` | Main scroll callback |
| onThreshold | function | `null` | Threshold crossing callback |
| thresholds | number[] | `[]` | Scroll positions to monitor |
| trackDirection | boolean | `true` | Track scroll direction |
| trackVelocity | boolean | `false` | Calculate velocity |
| trackHorizontal | boolean | `false` | Track horizontal scroll |
| namespace | string | `'scrolltracker'` | Event namespace for cleanup |
| autoStart | boolean | `true` | Start tracking immediately |

### Instance Methods

#### `start()`

Start tracking scroll events.

**Returns:** `this` (chainable)

```javascript
tracker.start();
```

---

#### `stop()`

Stop tracking scroll events (preserves state).

**Returns:** `this` (chainable)

```javascript
tracker.stop();
// Can restart later
tracker.start();
```

---

#### `destroy()`

Fully destroy the tracker and release all references.

```javascript
tracker.destroy();
```

---

#### `getState()`

Get current scroll state snapshot.

**Returns:** `Object`

```javascript
var state = tracker.getState();
// {
//   scrollY: 250,
//   scrollX: 0,
//   direction: 'down',
//   velocity: 450,
//   isActive: true,
//   crossedThresholds: { 100: true, 300: false, 500: false }
// }
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

### onScroll Data

```javascript
{
  scrollY: 250,      // Vertical scroll position
  scrollX: 0,        // Horizontal scroll position
  direction: 'down', // 'up', 'down', 'left', 'right'
  deltaY: 15,        // Change since last update
  deltaX: 0,         // Horizontal change
  timestamp: 1234567890,
  velocity: 450      // px/second (if trackVelocity: true)
}
```

### onThreshold Data

```javascript
{
  threshold: 300,      // The threshold value
  crossed: 'above',    // 'above' or 'below'
  direction: 'down',   // Scroll direction
  scrollY: 305         // Current scroll position
}
```

## Usage Patterns

### Sticky Header Show/Hide

```javascript
var tracker = Funky.ScrollTracker.init({
  thresholds: [100],
  onScroll: function(data) {
    var header = document.getElementById('header');
    
    if (data.scrollY > 100 && data.direction === 'down') {
      header.classList.add('hidden');
    } else if (data.direction === 'up') {
      header.classList.remove('hidden');
    }
  }
});
```

### Back-to-Top Button

```javascript
var tracker = Funky.ScrollTracker.init({
  thresholds: [400],
  onThreshold: function(data) {
    var btn = document.getElementById('back-to-top');
    
    if (data.threshold === 400) {
      if (data.crossed === 'above') {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }
  }
});
```

### Scroll Spy Navigation

```javascript
var sections = document.querySelectorAll('section');
var sectionOffsets = [];

sections.forEach(function(section) {
  sectionOffsets.push(section.offsetTop);
});

var tracker = Funky.ScrollTracker.init({
  thresholds: sectionOffsets,
  onThreshold: function(data) {
    var index = sectionOffsets.indexOf(data.threshold);
    highlightNavItem(index);
  }
});
```

### Parallax with Velocity

```javascript
var tracker = Funky.ScrollTracker.init({
  trackVelocity: true,
  onScroll: function(data) {
    var parallax = document.getElementById('parallax-bg');
    var speed = Math.min(data.velocity / 1000, 1);
    
    parallax.style.transform = 'translateY(' + (data.scrollY * 0.5) + 'px)';
  }
});
```

### Scrollable Container

```javascript
// Track scroll on a specific element, not window
var tracker = Funky.ScrollTracker.init({
  target: '#scrollable-panel',
  onScroll: function(data) {
    console.log('Panel scrolled to:', data.scrollY);
  }
});
```

### Manual Throttle Control

```javascript
// Use 100ms debounce instead of rAF
var tracker = Funky.ScrollTracker.init({
  throttle: 100,
  onScroll: function(data) {
    // Called at most every 100ms
  }
});

// No throttling (every scroll event)
var tracker2 = Funky.ScrollTracker.init({
  throttle: 'none',
  onScroll: function(data) {
    // Called on every scroll event
  }
});
```

## Throttle Modes

| Mode | Value | Description |
|------|-------|-------------|
| rAF | `'raf'` | Uses `requestAnimationFrame` (default, recommended) |
| Debounce | `100` | Waits N ms after last scroll event |
| None | `'none'` | No throttling, fires every event |

## Direction Values

| Value | Meaning |
|-------|---------|
| `'up'` | Scrolling upward |
| `'down'` | Scrolling downward |
| `'left'` | Scrolling left (if `trackHorizontal: true`) |
| `'right'` | Scrolling right (if `trackHorizontal: true`) |

## File Location

`/public/assets/js/components/scroll-tracker.js`

## Dependencies

- `Funky.Events` - For scroll event binding

## See Also

- [Funky.GestureTracker](gesture-tracker.md) - Touch gesture detection
- [Funky.Events](../core/events.md) - Event utilities
