# Funky.PointerTracker

Low-level core utility for continuous pointer tracking with pressure sensitivity, element-relative coordinates, and unified mouse/touch/stylus handling.

## When to Use

Use PointerTracker when you need:
- Continuous coordinate tracking (drawing, signatures)
- Pressure sensitivity for stylus/Force Touch
- Unified API for mouse, touch, and pen input
- Velocity calculations for smooth drawing

**Don't use PointerTracker** for gesture detection (use GestureTracker instead).

## Installation

PointerTracker is a core module, included in the Funky bundle:

```html
<script src="/assets/js/core/pointer-tracker.js"></script>
```

## Basic Usage

```javascript
var tracker = new Funky.PointerTracker(element, {
  onStart: function(point) {
    console.log('Started at', point.x, point.y);
  },
  onMove: function(point) {
    console.log('Moved to', point.x, point.y);
  },
  onEnd: function(point) {
    console.log('Ended at', point.x, point.y);
  }
});

// Later
tracker.destroy();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pressure` | boolean | `false` | Include pressure data (0-1) |
| `velocity` | boolean | `false` | Calculate velocity between points |
| `tilt` | boolean | `false` | Include tilt/twist for stylus |
| `coalesced` | boolean | `false` | Use coalesced events for high-resolution |
| `throttle` | number | `0` | Throttle onMove callbacks (ms) |
| `preventDefault` | boolean | `true` | Prevent default on touch |
| `multiPointer` | boolean | `false` | Track all pointers or just first |
| `onStart` | function | - | Called on pointer down |
| `onMove` | function | - | Called on pointer move (while active) |
| `onEnd` | function | - | Called on pointer up |
| `onCancel` | function | - | Called on pointer cancel |

## Point Object

All callbacks receive a point object with the following properties:

```javascript
{
  x: 150,              // Element-relative X coordinate
  y: 200,              // Element-relative Y coordinate
  pressure: 0.5,       // 0-1 (0.5 default when unavailable)
  time: 1234567890,    // Date.now() timestamp
  pointerId: 1,        // Unique pointer ID
  pointerType: 'touch' // 'mouse', 'touch', or 'pen'
}
```

### Extended Properties (when enabled)

```javascript
// If velocity: true
velocity: {
  x: 0.5,           // Velocity in X direction (px/ms)
  y: 0.3,           // Velocity in Y direction (px/ms)
  magnitude: 0.6    // Overall velocity magnitude
}

// If tilt: true (pen/stylus only)
tilt: {
  x: 15,            // Tilt in X axis (degrees, -90 to 90)
  y: 10             // Tilt in Y axis (degrees)
}
twist: 0,           // Pen rotation (degrees, 0-359)
tangentialPressure: 0  // Barrel button pressure (-1 to 1)
```

## Methods

### isActive()

Returns `true` if currently tracking (between start and end).

```javascript
if (tracker.isActive()) {
  console.log('Currently drawing');
}
```

### destroy()

Removes all event listeners and cleans up internal state.

```javascript
tracker.destroy();
```

## Examples

### Signature Pad

```javascript
var canvas = document.getElementById('signature');
var ctx = canvas.getContext('2d');

var tracker = new Funky.PointerTracker(canvas, {
  pressure: true,
  
  onStart: function(point) {
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  },
  
  onMove: function(point) {
    // Vary line width based on pressure
    ctx.lineWidth = 1 + point.pressure * 3;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  },
  
  onEnd: function() {
    ctx.closePath();
  }
});
```

### High-Resolution Drawing

```javascript
var tracker = new Funky.PointerTracker(canvas, {
  pressure: true,
  velocity: true,
  coalesced: true,  // Get all points between frames
  
  onMove: function(point) {
    // Smooth line with velocity-based width adjustment
    var baseWidth = 2;
    var pressureWidth = point.pressure * 4;
    var velocityScale = Math.min(1, 1 / (1 + point.velocity.magnitude * 0.5));
    
    ctx.lineWidth = (baseWidth + pressureWidth) * velocityScale;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
});
```

### Stylus with Tilt Support

```javascript
var tracker = new Funky.PointerTracker(canvas, {
  pressure: true,
  tilt: true,
  
  onMove: function(point) {
    if (point.pointerType === 'pen' && point.tilt) {
      // Use tilt for brush angle
      var angle = Math.atan2(point.tilt.y, point.tilt.x);
      drawAngledBrush(point.x, point.y, angle, point.pressure);
    } else {
      // Standard drawing for mouse/touch
      drawCircle(point.x, point.y, point.pressure * 5);
    }
  }
});
```

### Throttled Tracking

```javascript
// Limit move events to ~60fps for performance
var tracker = new Funky.PointerTracker(element, {
  throttle: 16,
  
  onMove: function(point) {
    // Called at most every 16ms
    updatePosition(point.x, point.y);
  }
});
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 55+ | Full Pointer Events |
| Firefox 59+ | Full Pointer Events |
| Safari 13+ | Full Pointer Events |
| Edge 12+ | Full Pointer Events |
| Safari < 13 | Mouse + Touch fallback |
| iOS Safari | Touch + Force Touch |
| Android Chrome | Full Pointer Events |

### Fallback Behavior

- **Mouse fallback**: Uses `mousedown`, `mousemove`, `mouseup` events with document-level binding for reliable drag tracking
- **Touch fallback**: Uses `touchstart`, `touchmove`, `touchend`, `touchcancel` with Force Touch support (`touchforcechange`) when available
- Coordinates and pressure work consistently across all input types

## Integration with Funky.Timing

When `throttle` option is set and `Funky.Timing` is available, the tracker uses `Funky.Timing.throttle()` for efficient move event throttling.

```javascript
// Requires Funky.Timing for throttle
var tracker = new Funky.PointerTracker(element, {
  throttle: 32  // ~30fps
});
```

## Performance Tips

1. **Use `throttle`** for non-drawing applications to reduce callback frequency
2. **Enable `coalesced`** for drawing apps to capture all points
3. **Disable `velocity`** and `tilt`** if not needed to reduce point object size
4. **Call `destroy()`** when removing the tracked element
