# Funky.Audio - Sound Effect Management

Generic sound effect system for playing audio feedback in web applications.

## Overview

`Funky.Audio` is a lightweight, flexible audio management component. It provides a registry-based approach where applications register their own sounds, keeping the core framework generic and reusable.

**Key Features:**
- Registry-based sound management
- Volume and mute controls with persistence
- Optional theme-gated playback
- Preloading for instant playback
- Promise-based API
- Global callback hooks

## Quick Start

```javascript
// 1. Configure (optional)
Funky.Audio.configure({
    basePath: '/assets/sound/',
    volume: 0.7
});

// 2. Register sounds
Funky.Audio.registerSound('success', 'success.mp3', { volume: 0.6 });
Funky.Audio.registerSound('error', 'error.mp3', { volume: 0.8 });
Funky.Audio.registerSound('notification', 'notify.mp3');

// 3. Play sounds
Funky.Audio.play('success');
```

## API Reference

### Configuration

#### `Audio.configure(options)`

Configure global audio settings.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| basePath | string | '/assets/sound/' | Base path for audio files |
| volume | number | 0.7 | Default volume (0-1) |
| requireTheme | boolean | false | Require specific theme for playback |

**Example:**
```javascript
Funky.Audio.configure({
    basePath: '/sounds/',
    volume: 0.5,
    requireTheme: true  // Only play when 'even-funkyer' theme active
});
```

---

### Sound Registration

#### `Audio.registerSound(name, file, options)`

Register a sound for playback.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Unique sound identifier |
| file | string | Yes | Audio file name |
| options | object | No | Sound-specific options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| volume | number | 0.7 | Volume level (0-1) |
| loop | boolean | false | Loop the sound |
| background | boolean | false | Mark as background audio |

**Example:**
```javascript
Funky.Audio.registerSound('alert', 'alert.mp3', { volume: 0.9 });
Funky.Audio.registerSound('theme', 'theme.mp3', { loop: true, background: true });
```

---

#### `Audio.getSound(name)`

Get a registered sound's configuration.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Sound identifier |

**Returns:** `object|null` - Sound config or null if not found

**Example:**
```javascript
var config = Funky.Audio.getSound('success');
// { file: 'success.mp3', volume: 0.6, loop: false }
```

---

#### `Audio.listSounds()`

Get array of all registered sound names.

**Returns:** `string[]` - Array of sound names

**Example:**
```javascript
var sounds = Funky.Audio.listSounds();
// ['success', 'error', 'notification']
```

---

### Playback

#### `Audio.play(name, options)`

Play a registered sound or raw file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Registered sound name or file path |
| options | object | No | Runtime playback options |

**Runtime Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| volume | number | - | Override volume |
| loop | boolean | - | Override loop setting |
| bypass | boolean | false | Skip theme check |
| onEnd | function | - | Callback when sound ends |

**Returns:** `Promise<void>` - Resolves when playback starts

**Example:**
```javascript
// Play registered sound
await Funky.Audio.play('success');

// Play with options override
await Funky.Audio.play('notification', { volume: 1.0 });

// Play raw file (fallback)
await Funky.Audio.play('custom.mp3');

// With callback
Funky.Audio.play('alert', {
    onEnd: function() {
        console.log('Alert finished');
    }
});
```

---

#### `Audio.stop(name)`

Stop a playing sound.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Sound name or file path |

**Example:**
```javascript
Funky.Audio.stop('theme');
```

---

#### `Audio.stopAll()`

Stop all currently playing sounds.

**Example:**
```javascript
Funky.Audio.stopAll();
```

---

#### `Audio.preload(files)`

Preload audio files for faster playback.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| files | string[] | Yes | Array of file names to preload |

**Example:**
```javascript
Funky.Audio.preload(['success.mp3', 'error.mp3', 'notification.mp3']);
```

---

### Volume & Mute

#### `Audio.setVolume(level)`

Set global volume level.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| level | number | Yes | Volume level (0-1) |

**Example:**
```javascript
Funky.Audio.setVolume(0.5);
```

---

#### `Audio.mute()`

Mute all sounds and persist state.

---

#### `Audio.unmute()`

Unmute sounds and persist state.

---

#### `Audio.toggleMute()`

Toggle mute state.

**Returns:** `boolean` - New state (true = unmuted)

---

#### `Audio.isMuted()`

Check if audio is muted.

**Returns:** `boolean` - Current mute state

---

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `audioCache` | object | Cache of Audio elements by file |
| `volume` | number | Current global volume (0-1) |
| `muted` | boolean | Current mute state |
| `basePath` | string | Base path for audio files |
| `requireTheme` | boolean | Whether theme check is required |

---

## Global Callbacks

Hook into audio events globally:

```javascript
// Called when any sound starts
window.onAudioStarted = function(name, options) {
    console.log('Playing:', name);
};

// Called when any sound ends
window.onAudioEnded = function(name) {
    console.log('Ended:', name);
};

// Called when any sound is stopped
window.onAudioStopped = function(name) {
    console.log('Stopped:', name);
};
```

## Theme Requirement

When `requireTheme: true`, sounds only play if the `even-funkyer` theme is active:

```javascript
// Enable theme requirement
Funky.Audio.configure({ requireTheme: true });

// This will only play if theme is 'even-funkyer'
Funky.Audio.play('notification');

// Bypass theme check for critical sounds
Funky.Audio.play('alert', { bypass: true });
```

## Dependencies

- `Funky.Storage` - For mute state persistence
- `Funky.Registry` - For sound configuration registry

## Examples

### Application Sound Setup

```javascript
// In your app initialization (e.g., audio-init.js)
(function() {
    var Audio = Funky.Audio;

    // Configure paths
    Audio.configure({
        basePath: '/assets/sound/',
        volume: 0.7
    });

    // Register application sounds
    Audio.registerSound('success', 'success.mp3', { volume: 0.6 });
    Audio.registerSound('error', 'error.mp3', { volume: 0.8 });
    Audio.registerSound('create', 'create.mp3', { volume: 0.6 });
    Audio.registerSound('notification', 'notify.mp3');
})();
```

### Play Sound on Action

```javascript
function createRecord(data) {
    return Funky.Api.post('/api/records', data)
        .then(function(response) {
            if (response.success) {
                Funky.Audio.play('create');
                Funky.Toast.success('Record created');
            }
        });
}
```

### Mute Toggle Button

```javascript
var muteBtn = D.one('#muteBtn');

muteBtn.on('click', function() {
    var unmuted = Funky.Audio.toggleMute();
    D.one('#muteIcon').attr('class', unmuted ? 'fa fa-volume-up' : 'fa fa-volume-mute');
});
```
