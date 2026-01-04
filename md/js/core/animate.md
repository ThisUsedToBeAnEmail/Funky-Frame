# Funky.Animate

**File:** `public/assets/js/core/animate.js`

Unified animation system providing low-level animation primitives with accessibility-first design.

---

## Overview

Funky.Animate is the core animation module that provides a consistent, accessible, and performant way to animate elements throughout the Funky framework. It replaces scattered `getTransitionDuration()` implementations with a single source of truth, while offering both programmatic and class-based animation APIs.

### Why Use Funky.Animate?

- **Unified Duration Management** - Single source of truth for animation durations
- **Accessibility First** - Automatically respects `prefers-reduced-motion` and global animation toggle
- **CSS-First Approach** - Leverages browser's CSS engine for GPU-accelerated animations
- **Composition Support** - Chain, run in parallel, or stagger multiple animations
- **Component Integration** - Mixin pattern for easy integration into components
- **Lifecycle Events** - Hook into animation start/end/cancel events

---

## Features

- Duration and easing management with accessibility checks
- Class-based animation API leveraging CSS keyframes
- Transform utilities (fade, slide, scale, shake)
- Sequence and parallel composition
- Stagger animations for lists
- Component mixin pattern
- Cancellable animations
- Lifecycle events via Funky.Events

---

## API Reference

### Constants

#### DURATION

Predefined duration constants for consistent timing across the application:

```javascript
Funky.Animate.DURATION = {
  FAST: 150,      // UI components (tabs, tooltips, popovers)
  NORMAL: 300,    // Modals, navigation
  SLOW: 600       // Page transitions
}
```

#### EASING

Predefined easing curves:

```javascript
Funky.Animate.EASING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  EASE_IN_QUAD: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  EASE_OUT_QUAD: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  EASE_IN_OUT_QUAD: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)'
}
```

#### speedMultiplier

Global speed multiplier for all animation durations. Useful for WCAG compliance or user preferences.

**Type:** `number`  
**Default:** `1.0`

**Example:**
```javascript
// Slow down all animations (for accessibility)
Funky.Animate.speedMultiplier = 1.5;

// Speed up all animations
Funky.Animate.speedMultiplier = 0.5;

// Use user preference
Funky.Animate.speedMultiplier = parseFloat(userSettings.animationSpeed) || 1.0;
```

---

### Methods

#### getDuration(element, defaultMs)

Get animation duration with accessibility checks.

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `defaultMs` (number) - Default duration in milliseconds

**Returns:** `number` - Duration in milliseconds (0 if animations disabled)

**Example:**
```javascript
var duration = Funky.Animate.getDuration('#myElement', Funky.Animate.DURATION.NORMAL);
// Returns 0 if:
// - data-animations="off" on <html>
// - prefers-reduced-motion: reduce
// - Element doesn't have .fade class
```

---

#### animate(element, options)

Core animation function that applies CSS classes with timing control.

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `options` (Object) - Animation configuration
  - `class` (string) - Animation class to add (e.g., 'fade-in-up')
  - `duration` (number) - Duration in ms (null = auto-detect)
  - `easing` (string) - Easing curve
  - `delay` (number) - Delay before start (default: 0)
  - `onStart` (Function) - Callback when animation starts
  - `onEnd` (Function) - Callback when animation ends

**Returns:** `Object` - Animation instance with `cancel()` method

**Example:**
```javascript
var anim = Funky.Animate.animate('#hero', {
  class: 'fade-in-up',
  duration: 400,
  delay: 100,
  onStart: function() {
    console.log('Animation started');
  },
  onEnd: function() {
    console.log('Animation completed');
  }
});

// Cancel if needed
anim.cancel();
```

---

#### fade(element, direction, options)

Fade animation utility.

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `direction` (string) - 'in' or 'out'
- `options` (Object) - Animation options (optional)

**Returns:** `Object` - Animation instance

**Example:**
```javascript
// Fade in
Funky.Animate.fade('#element', 'in');

// Fade out with custom duration
Funky.Animate.fade('#element', 'out', { duration: 200 });
```

---

#### slide(element, direction, options)

Slide animation utility.

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `direction` (string) - 'in' or 'out'
- `options` (Object) - Animation options
  - `from` (string) - Direction: 'right', 'left', 'top', 'bottom' (default: 'right')
  - All standard animation options

**Returns:** `Object` - Animation instance

**Example:**
```javascript
// Slide in from left
Funky.Animate.slide('#panel', 'in', { from: 'left' });

// Slide out to right
Funky.Animate.slide('#panel', 'out', { from: 'right', duration: 300 });
```

---

#### scale(element, direction, options)

Scale animation utility.

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `direction` (string) - 'in' or 'out'
- `options` (Object) - Animation options (optional)

**Returns:** `Object` - Animation instance

**Example:**
```javascript
// Scale in
Funky.Animate.scale('#modal', 'in');

// Scale out
Funky.Animate.scale('#modal', 'out');
```

---

#### shake(element, options)

Shake animation (attention seeker).

**Parameters:**
- `element` (string|HTMLElement) - Element or selector
- `options` (Object) - Animation options (optional)

**Returns:** `Object` - Animation instance

**Example:**
```javascript
// Shake to indicate error
Funky.Animate.shake('#form', {
  onEnd: function() {
    console.log('Shake complete');
  }
});
```

---

#### sequence(animations)

Chain animations to run one after another.

**Parameters:**
- `animations` (Array) - Array of `{element, options}` objects

**Returns:** `Object` - Sequence control with `start()` and `cancel()` methods

**Example:**
```javascript
var seq = Funky.Animate.sequence([
  { element: '#step1', options: { class: 'fade-in' } },
  { element: '#step2', options: { class: 'slide-in-right' } },
  { element: '#step3', options: { class: 'fade-in-up' } }
]).start();

// Cancel sequence
seq.cancel();
```

---

#### parallel(animations)

Run multiple animations simultaneously.

**Parameters:**
- `animations` (Array) - Array of `{element, options}` objects

**Returns:** `Object` - Parallel control with `start()` and `cancel()` methods

**Example:**
```javascript
var par = Funky.Animate.parallel([
  { element: '#hero', options: { class: 'fade-in' } },
  { element: '#sidebar', options: { class: 'slide-in-left' } },
  { element: '#footer', options: { class: 'fade-in-up' } }
]).start();
```

---

#### stagger(elements, options)

Animate list items with staggered timing.

**Parameters:**
- `elements` (string|NodeList|Array) - Elements to animate
- `options` (Object)
  - `class` (string) - Animation class (default: 'fade-in-up')
  - `duration` (number) - Duration per item
  - `stagger` (number) - Delay between items in ms (default: 100)
  - `onComplete` (Function) - Called when all items complete

**Returns:** `Object` - Stagger control with `cancel()` method

**Example:**
```javascript
Funky.Animate.stagger('.list-item', {
  class: 'fade-in-up',
  stagger: 75,
  onComplete: function() {
    console.log('All items animated!');
  }
});
```

---

#### mixin(component, config)

Add animation methods to a component instance.

**Parameters:**
- `component` (Object) - Component instance
- `config` (Object)
  - `show` (Object) - Show animation config
  - `hide` (Object) - Hide animation config
  - `element` (HTMLElement) - Element to animate (default: component.element)

**Returns:** `Object` - Component with added animation methods

**Added Methods:**
- `animateShow(options)` - Animate show
- `animateHide(options)` - Animate hide
- `animateToggle(show, options)` - Toggle animation
- `cancelAnimation()` - Cancel current animation

**Example:**
```javascript
function CustomPanel(element) {
  this.element = Funky.Dom.one(element);

  // Add animation capabilities
  Funky.Animate.mixin(this, {
    show: { class: 'slide-in-right', duration: 400 },
    hide: { class: 'slide-out-right', duration: 300 }
  });
}

CustomPanel.prototype.show = function() {
  var self = this;
  this.animateShow({
    onEnd: function() {
      self.element.classList.add('visible');
    }
  });
};

var panel = new CustomPanel('#myPanel');
panel.show();
```

---

#### wrap(component, config)

Wrap existing component methods with animation.

**Parameters:**
- `component` (Object) - Component instance with existing show/hide methods
- `config` (Object) - Animation configuration (same as mixin)

**Returns:** `Object` - Component with wrapped methods

**Example:**
```javascript
var modal = new Funky.Modal('#myModal');

// Add animations to existing modal
Funky.Animate.wrap(modal, {
  show: { class: 'fade-in-up', duration: 400 },
  hide: { class: 'fade-out-down', duration: 300 }
});

// Now modal.show() and modal.hide() are animated
modal.show();
```

---

## Events

Events emitted via `Funky.Events`:

| Event | Data | Description |
|-------|------|-------------|
| `funky:animate:start` | `{ element, class }` | Animation begins |
| `funky:animate:end` | `{ element, class }` | Animation completes |
| `funky:animate:cancel` | `{ element, class }` | Animation cancelled |

**Example:**
```javascript
Funky.PubSub.on('funky:animate:start', function(data) {
  console.log('Animation started on', data.element);
});

Funky.PubSub.on('funky:animate:end', function(data) {
  console.log('Animation completed');
});
```

---

## CSS Classes

Available animation classes (defined in `animate.css`):

### Fade Animations
- `fade-in`, `fade-out`
- `fade-in-up`, `fade-in-down`
- `fade-out-up`, `fade-out-down`

### Slide Animations
- `slide-in-right`, `slide-in-left`, `slide-in-top`, `slide-in-bottom`
- `slide-out-right`, `slide-out-left`

### Scale Animations
- `scale-in`, `scale-out`
- `scale-fade-in`, `scale-fade-out`

### Attention Seekers
- `shake`, `pulse`, `bounce`

### Rotate Animations
- `rotate-in`, `rotate-out`

### Modifiers
- Duration: `animate-fast`, `animate-normal`, `animate-slow`
- Delay: `animate-delay-100`, `animate-delay-200`, `animate-delay-300`, `animate-delay-500`
- Easing: `animate-ease-in`, `animate-ease-out`, `animate-ease-in-out`, `animate-linear`

---

## Accessibility

### Automatic Accessibility Checks

All animations automatically respect user preferences:

1. **Global Toggle** - `data-animations="off"` on `<html>` element disables all animations
2. **System Preference** - Respects `prefers-reduced-motion: reduce` media query
3. **Element Opt-In** - Only elements with `.fade` class can be animated

**Example:**
```javascript
// Disable all animations globally
document.documentElement.setAttribute('data-animations', 'off');

// Re-enable
document.documentElement.removeAttribute('data-animations');
```

---

## Migration from Manual Animations

### Before (Manual)
```javascript
// Old scattered implementation
function getTransitionDuration(el) {
  var animationsOff = document.documentElement.getAttribute('data-animations') === 'off';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animationsOff || prefersReduced || !el.classList.contains('fade')) {
    return 0;
  }
  return 300;
}

var duration = getTransitionDuration(element);
setTimeout(function() {
  element.classList.add('show');
}, duration);
```

### After (Funky.Animate)
```javascript
// Unified system
Funky.Animate.fade(element, 'in', {
  onEnd: function() {
    element.classList.add('show');
  }
});
```

---

## Performance

### Optimization Strategies

1. **CSS-First** - Animations defined in CSS, JavaScript only toggles classes
2. **GPU Acceleration** - Uses `transform` and `opacity` properties
3. **Cancellation** - All animations support `.cancel()` to prevent memory leaks
4. **Conditional** - Animations automatically disabled when appropriate

### Performance Budget

- Animation frame rate: 60 FPS
- Animation start lag: < 16ms
- JS file size: < 8KB minified
- CSS file size: < 5KB

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Funky.Events** - Event system for lifecycle events

---

## See Also

- [Funky.PageAnimate](../components/page-animate.md) - Page-level animation management
- [Funky.Modal](modal.md) - Modal component (uses Funky.Animate)
- [Funky.Toast](../components/toast.md) - Toast component (uses Funky.Animate)
- [CSS Keyframes](/assets/css/animate.css) - Animation definitions
