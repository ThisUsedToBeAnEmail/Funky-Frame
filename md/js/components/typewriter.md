# Funky.Typewriter

Animated typing text effect component with configurable speed, modes, and cursor styles.

## Overview

Funky.Typewriter provides:
- **Typing Animation**: Smooth character-by-character, word-by-word, or line-by-line typing
- **Cursor Styles**: Bar, underscore, block, or hidden cursor with optional blinking
- **Text Sequences**: Rotate through multiple texts with delete/backspace effect
- **Programmatic Control**: Start, pause, resume, clear, and destroy methods
- **LiveBinding**: Reactive data binding for dynamic text updates
- **Accessibility**: Respects `prefers-reduced-motion` preference

## Quick Start

### Basic Usage

```javascript
Funky.Typewriter.init('#element', {
  text: 'Hello, world!',
  mode: 'letter',
  speed: 50
});
```

### Data Attribute Initialization

```html
<div data-typewriter="Hello, world!"
     data-typewriter-mode="letter"
     data-typewriter-speed="50">
</div>
```

Then initialize all:

```javascript
Funky.Typewriter.initAll();
```

### Rotating Text Sequences

```javascript
Funky.Typewriter.init('#tagline', {
  text: ['Developer', 'Designer', 'Creator'],
  loop: true,
  pauseOnComplete: 2000,
  deleteSpeed: 30
});
```

## API Reference

### Factory Methods

#### `Funky.Typewriter.init(selector, options)`

Creates a new typewriter instance.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `selector` | `string\|Element` | CSS selector or DOM element |
| `options` | `Object` | Configuration options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string\|string[]` | `''` | Text or array of texts to type |
| `mode` | `string` | `'letter'` | `'letter'`, `'word'`, or `'line'` |
| `speed` | `number` | `50` | Milliseconds per unit |
| `startDelay` | `number` | `0` | Delay before typing starts (ms) |
| `cursor` | `boolean` | `true` | Show cursor |
| `cursorStyle` | `string` | `'bar'` | `'bar'`, `'underscore'`, `'block'`, `'none'` |
| `cursorBlink` | `boolean` | `true` | Enable cursor blinking |
| `loop` | `boolean` | `false` | Loop through sequences |
| `loopDelay` | `number` | `1500` | Delay between loops (ms) |
| `deleteSpeed` | `number` | `30` | Delete animation speed (ms) |
| `pauseOnComplete` | `number` | `1000` | Pause after completing (ms) |
| `autoStart` | `boolean` | `true` | Start typing immediately |
| `size` | `string` | `null` | Size class: `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`, `'3xl'`, `'4xl'` |
| `mono` | `boolean` | `false` | Use monospace font |

**Callbacks:**

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onStart` | `()` | Called when typing starts |
| `onType` | `(unit, index)` | Called for each unit typed |
| `onComplete` | `()` | Called when text completes |
| `onLoop` | `(loopCount)` | Called on each loop iteration |
| `onDelete` | `(index)` | Called for each unit deleted |

**Returns:** `TypewriterInstance`

**Example:**

```javascript
var tw = Funky.Typewriter.init('#hero', {
  text: 'Welcome to Funky!',
  mode: 'letter',
  speed: 50,
  cursor: true,
  cursorStyle: 'bar',
  onComplete: function() {
    console.log('Typing complete!');
  }
});
```

### Instance Methods

#### instance.start()

Start or restart typing from the beginning.

```javascript
tw.start();
```

#### instance.type(text)

Type new text, clearing current content first. Accepts a string or array of strings.

```javascript
tw.type('New text to type');
tw.type(['First', 'Second', 'Third']);
```

#### instance.pause()

Pause the typing animation.

```javascript
tw.pause();
console.log(tw.isPaused); // true
```

#### instance.resume()

Resume a paused animation.

```javascript
tw.resume();
```

#### instance.clear()

Clear all text and reset to initial state.

```javascript
tw.clear();
```

#### instance.destroy()

Destroy the instance and clean up DOM.

```javascript
tw.destroy();
```

#### `Funky.Typewriter.getInstance(selector)`

Get an existing instance by selector.

```javascript
var instance = Funky.Typewriter.getInstance('#my-element');
if (instance) {
  instance.pause();
}
```

#### `Funky.Typewriter.destroy(selector)`

Destroy an instance by selector.

```javascript
Funky.Typewriter.destroy('#my-element');
```

#### `Funky.Typewriter.destroyAll()`

Destroy all typewriter instances.

---

#### `Funky.Typewriter.initAll([container])`

Initialize all elements with `data-typewriter` attribute.

```javascript
// Initialize all on page
Funky.Typewriter.initAll();

// Initialize within a container
Funky.Typewriter.initAll(document.getElementById('my-section'));
```

## Examples

### Hero Section with Rotating Text

```javascript
Funky.Typewriter.init('#hero-tagline', {
  text: ['Developer', 'Designer', 'Creator', 'Innovator'],
  loop: true,
  pauseOnComplete: 2000,
  deleteSpeed: 40,
  cursorStyle: 'bar',
  size: '3xl'
});
```

### Word-by-Word Typing

```javascript
Funky.Typewriter.init('#intro', {
  text: 'This sentence types one word at a time for dramatic effect.',
  mode: 'word',
  speed: 200
});
```

### Line-by-Line for Code

```javascript
Funky.Typewriter.init('#code-demo', {
  text: 'const greeting = "Hello";\nconsole.log(greeting);\n// Output: Hello',
  mode: 'line',
  speed: 500,
  cursorStyle: 'underscore',
  mono: true
});
```

### Controlled Typing

```javascript
var tw = Funky.Typewriter.init('#controlled', {
  text: 'This is controlled typing.',
  autoStart: false
});

// Start on button click
document.getElementById('start-btn').addEventListener('click', function() {
  tw.start();
});

// Pause/resume toggle
document.getElementById('toggle-btn').addEventListener('click', function() {
  tw.isPaused ? tw.resume() : tw.pause();
});
```

### With LiveBinding

```javascript
Funky.Typewriter.init('#live-status', {
  liveSource: {
    source: 'api',
    url: '/api/status',
    path: 'message',
    interval: 10000
  },
  mode: 'word',
  speed: 80
});
```

### Data Attributes

```html
<!-- Basic -->
<div data-typewriter="Hello, world!"></div>

<!-- With options -->
<div data-typewriter="Developer|Designer|Creator"
     data-typewriter-mode="letter"
     data-typewriter-speed="60"
     data-typewriter-loop="true"
     data-typewriter-cursor-style="bar"
     data-typewriter-size="2xl">
</div>

<!-- Monospace code -->
<div data-typewriter="npm install funky-ui"
     data-typewriter-mono="true"
     data-typewriter-cursor-style="block">
</div>
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-typewriter` | Main container element |
| `.funky-typewriter-text` | Text content container |
| `.funky-typewriter-cursor` | Cursor element |
| `.funky-typewriter-cursor-bar` | Bar cursor style |
| `.funky-typewriter-cursor-underscore` | Underscore cursor style |
| `.funky-typewriter-cursor-block` | Block cursor style |
| `.funky-typewriter-cursor-static` | Non-blinking cursor |
| `.funky-typewriter-cursor-hidden` | Hidden cursor |
| `.funky-typewriter-xs` through `.funky-typewriter-4xl` | Size variants |
| `.funky-typewriter-mono` | Monospace font |
| `.is-typing` | Applied while actively typing |
| `.is-deleting` | Applied while deleting |
| `.is-paused` | Applied when paused |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--typewriter-speed` | `50ms` | Animation timing reference |
| `--typewriter-cursor-width` | `2px` | Cursor width |
| `--typewriter-cursor-color` | `var(--pro-accent-primary)` | Cursor color |
| `--typewriter-cursor-blink-speed` | `530ms` | Cursor blink interval |
| `--typewriter-text-color` | `var(--pro-text-primary)` | Text color |
| `--typewriter-font-family` | `inherit` | Font family |

### Theming Example

```css
/* Custom cursor color */
.my-typewriter {
  --typewriter-cursor-color: #ff6b6b;
  --typewriter-cursor-width: 3px;
}

/* Slower blink */
.slow-blink {
  --typewriter-cursor-blink-speed: 1000ms;
}
```

## Accessibility

- **ARIA Live Region**: Text container has `aria-live="polite"` for screen reader announcements
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
  - Shows text instantly without animation
  - Hides cursor to avoid visual distraction
- **Keyboard Navigation**: No keyboard interaction required (display-only component)

### Reduced Motion Behavior

When `prefers-reduced-motion: reduce` is set:
1. Text appears instantly (no typing animation)
2. Cursor is hidden
3. `data-reduced-motion="true"` attribute is added to the element

## Events

The component emits events that can be captured via callbacks:

| Event | Callback | Description |
|-------|----------|-------------|
| Start | `onStart` | Typing begins |
| Type | `onType` | Each unit is typed |
| Complete | `onComplete` | All text finished |
| Loop | `onLoop` | Loop iteration starts |
| Delete | `onDelete` | Unit is deleted |

```javascript
Funky.Typewriter.init('#element', {
  text: ['Hello', 'World'],
  loop: true,
  onStart: function() { console.log('Started typing'); },
  onType: function(unit, index) { console.log('Typed: ' + unit); },
  onComplete: function() { console.log('Completed'); },
  onLoop: function(count) { console.log('Loop #' + count); },
  onDelete: function(index) { console.log('Deleted, remaining: ' + index); }
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Related Components

- [Funky.LiveBinding](./live-binding.md) - Reactive data binding for dynamic updates
- [Funky.Skeleton](./skeleton.md) - Loading placeholders while content loads
