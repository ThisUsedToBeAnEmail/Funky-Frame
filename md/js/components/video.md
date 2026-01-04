# Funky.Video - Video Player Component

Lightweight video player wrapper with minimal overlay controls for play/pause, rewind, and loop functionality.

## Overview

`Funky.Video` provides a simple video player with customisable overlay controls that appear on hover. Supports keyboard navigation, touch devices, and theme integration.

## Quick Start

```javascript
var player = Funky.Video.init('#container', {
  src: '/video.mp4',
  loop: true,
  autoplay: false,
  muted: false,
  controls: true
});

// Control playback
player.play();
player.pause();
player.rewind();
```

## API Reference

### Factory Methods

#### `Video.init(container, options)`

Create a new video player instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string \| HTMLElement | Yes | CSS selector or DOM element |
| options | object | No | Configuration options |

**Returns:** `VideoInstance` - The video player instance

**Example:**
```javascript
var player = Funky.Video.init('#my-video', {
  src: '/assets/demo.mp4',
  loop: true
});
```

---

#### `Video.destroyAll()`

Destroy all video player instances.

---

#### `Video.getInstance(id)`

Get a specific instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID (e.g., 'video-1') |

**Returns:** `VideoInstance | null`

---

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| src | string | `''` | Video source URL |
| loop | boolean | `false` | Loop video playback |
| autoplay | boolean | `false` | Start playing automatically |
| muted | boolean | `false` | Start with audio muted |
| controls | boolean | `true` | Show overlay controls |
| rewindSeconds | number | `10` | Seconds to rewind/forward |
| poster | string | `''` | Poster image URL |

---

### Instance Methods

#### `player.play()`

Start video playback.

**Returns:** `void`

**Example:**
```javascript
player.play();
```

---

#### `player.pause()`

Pause video playback.

---

#### `player.toggle()`

Toggle between play and pause.

---

#### `player.rewind()`

Rewind by the configured `rewindSeconds` (default 10).

---

#### `player.forward()`

Forward by the configured `rewindSeconds`.

---

#### `player.toggleMute()`

Toggle audio mute state.

---

#### `player.setSrc(url)`

Change the video source.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | New video URL |

**Example:**
```javascript
player.setSrc('/assets/another-video.mp4');
```

---

#### `player.getCurrentTime()`

Get current playback position in seconds.

**Returns:** `number`

---

#### `player.setCurrentTime(seconds)`

Seek to a specific position.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| seconds | number | Yes | Position in seconds |

---

#### `player.getDuration()`

Get total video duration in seconds.

**Returns:** `number`

---

#### `player.destroy()`

Destroy the player instance and clean up resources.

---

## Keyboard Shortcuts

When the video player has focus:

| Key | Action |
|-----|--------|
| `Space` or `K` | Play/Pause |
| `←` Arrow Left | Rewind 10 seconds |
| `→` Arrow Right | Forward 10 seconds |
| `M` | Toggle mute |
| `Home` | Go to start |
| `End` | Go to end |

---

## Styling

The video component uses theme CSS variables for consistent styling:

### Theme Variables Used

| Variable | Usage |
|----------|-------|
| `--pro-bg-tertiary` | Container background |
| `--pro-primary` | Progress bar fill |
| `--pro-focus-ring` | Focus outline |
| `--pro-border-radius` | Container corners |
| `--pro-font-mono` | Time display font |

### CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-video` | Main container |
| `.funky-video-element` | Video element |
| `.funky-video-controls` | Controls overlay |
| `.funky-video-btn` | Control buttons |
| `.funky-video-progress` | Progress bar |
| `.funky-video-time` | Time display |

### Custom Styling Example

```css
/* Make progress bar thicker */
.funky-video-progress {
  height: 6px;
}

/* Change play button size */
.funky-video-play {
  width: 3rem;
  height: 3rem;
  font-size: 1.25rem;
}
```

---

## Accessibility

- Keyboard navigation supported
- Focus visible on container
- Button labels for screen readers
- Respects `prefers-reduced-motion`

---

## Examples

### Basic Video with Loop

```javascript
Funky.Video.init('#demo', {
  src: '/assets/intro.mp4',
  loop: true,
  muted: true
});
```

### Video with Poster Image

```javascript
Funky.Video.init('#tutorial', {
  src: '/assets/tutorial.mp4',
  poster: '/assets/tutorial-poster.jpg',
  controls: true
});
```

### Autoplay (Muted Required)

```javascript
// Browsers require muted for autoplay
Funky.Video.init('#hero-video', {
  src: '/assets/hero.mp4',
  autoplay: true,
  muted: true,
  loop: true,
  controls: false
});
```

### Programmatic Control

```javascript
var player = Funky.Video.init('#player', {
  src: '/assets/presentation.mp4'
});

// Custom play button
document.getElementById('my-play-btn').addEventListener('click', function() {
  player.toggle();
});

// Seek to specific time
document.getElementById('skip-intro').addEventListener('click', function() {
  player.setCurrentTime(30); // Skip to 30 seconds
  player.play();
});
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Touch support included for mobile devices.
