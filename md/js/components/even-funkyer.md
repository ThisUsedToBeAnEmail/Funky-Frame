# Funky.EvenFunkyer - Interactive Disco Mode

Fun interactive disco effects for the "Even Funkyer" theme with music, animations, and surprises.

## Overview

`Funky.EvenFunkyer` adds playful disco effects when the "Even Funkyer" theme is active. It includes click effects, random disco ball drops, confetti, and background music.

## API Reference

### Methods

#### `EvenFunkyer.init(showWelcome)`

Initialize Even Funkyer mode.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| showWelcome | boolean | No | Show welcome message |

---

#### `EvenFunkyer.destroy()`

Disable and cleanup all effects.

---

#### `EvenFunkyer.toggleMusic()`

Toggle background disco music.

---

#### `EvenFunkyer.dropDiscoball()`

Manually trigger disco ball animation.

---

#### `EvenFunkyer.confetti()`

Trigger confetti burst.

## Configuration

```javascript
CONFIG = {
  discoballChance: 0.25,       // 25% chance on click
  randomEventInterval: 20000,   // Random event every 20s
  confettiCount: 80,           // Particles per confetti burst
  soundTracks: [...]           // Background music tracks
};
```

## Features

### Click Effects
- Random disco ball drops (25% chance)
- Sparkle effects on hover
- Click sound effects

### Random Events
Every 20 seconds, one of:
- Disco ball drop
- Confetti burst
- Light flash
- Funky message

### Funky Marquees
Scrolling messages at screen edges with groovy phrases.

## Auto-Activation

Automatically activates when:
```javascript
Funky.Storage.getRaw('theme') === 'even-funkyer'
```

## Dependencies

- `Funky.Storage` - Theme detection
- `Funky.Audio` - Sound effects

## Examples

### Theme Toggle Integration

```javascript
$('#themeSelect').on('change', function() {
  var theme = $(this).val();
  Funky.Storage.setRaw('theme', theme);
  
  if (theme === 'even-funkyer') {
    Funky.EvenFunkyer.init(true); // Show welcome
  } else if (Funky.EvenFunkyer) {
    Funky.EvenFunkyer.destroy();
  }
});
```

### Manual Disco Ball

```javascript
// Easter egg on logo click
$('#logo').on('click', function() {
  if (Funky.has('EvenFunkyer')) {
    Funky.EvenFunkyer.dropDiscoball();
  }
});
```

## Notes

- Only loads when theme is 'even-funkyer'
- All effects can be disabled via preferences
- Music respects `Funky.Audio.muted` setting
- Optimized for performance with requestAnimationFrame
