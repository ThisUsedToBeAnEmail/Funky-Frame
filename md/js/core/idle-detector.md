# Funky.IdleDetector

User activity and idle state detection utility.

## Overview

IdleDetector is a core module that monitors user activity to determine idle states. It's useful for:

- **Auto-logout**: Log out users after inactivity
- **Presence**: Update online/away/idle status
- **Resources**: Pause animations and reduce polling when idle
- **Analytics**: Track active vs idle time
- **Draft Saving**: Auto-save work when user goes idle

## Quick Start

```javascript
Funky.IdleDetector.init({
    idleTimeout: 300000,  // 5 minutes
    onIdle: function(data) {
        console.log('User idle for', data.idleTime, 'ms');
    },
    onActive: function() {
        console.log('User active again');
    }
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `idleTimeout` | number | `300000` | Milliseconds until idle (5 min) |
| `awayTimeout` | number | `60000` | Milliseconds until away when tab hidden (1 min) |
| `events` | array | See below | Activity events to track |
| `throttle` | number | `1000` | Activity event throttle (ms) |
| `checkInterval` | number | `30000` | Periodic idle check interval (ms) |
| `trackVisibility` | boolean | `true` | Track tab visibility changes |
| `onIdle` | function | `null` | Callback when user becomes idle |
| `onActive` | function | `null` | Callback when user becomes active |
| `onAway` | function | `null` | Callback when tab is hidden (away) |
| `onReturn` | function | `null` | Callback when tab becomes visible |
| `debug` | boolean | `false` | Enable debug logging |

Default events: `['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']`

## States

IdleDetector tracks three states:

| State | Description |
|-------|-------------|
| `active` | User is interacting with the page |
| `idle` | No interaction for `idleTimeout` duration |
| `away` | Tab is hidden for `awayTimeout` duration |

### State Transitions

```
┌────────┐  timeout   ┌────────┐
│ Active │───────────▶│  Idle  │
└────────┘            └────────┘
    ▲                     │
    │  activity           │ activity
    └─────────────────────┘

┌────────┐  tab hidden  ┌────────┐
│ Active │─────────────▶│  Away  │
│  Idle  │  (timeout)   │        │
└────────┘              └────────┘
    ▲                       │
    │    tab visible        │
    └───────────────────────┘
```

## State Checking

```javascript
// Simple checks
Funky.IdleDetector.isIdle();    // true/false
Funky.IdleDetector.isAway();    // true/false
Funky.IdleDetector.isActive();  // true/false
Funky.IdleDetector.getState();  // 'active', 'idle', or 'away'

// Timing
Funky.IdleDetector.getIdleTime();      // ms since last activity
Funky.IdleDetector.getLastActivity();  // timestamp of last activity
Funky.IdleDetector.getAwayDuration();  // ms away (or null if not away)

// Visibility
Funky.IdleDetector.isTabHidden();      // true if tab is hidden
Funky.IdleDetector.isWindowFocused();  // true if window has focus

// Detailed info
var info = Funky.IdleDetector.getStateInfo();
// {
//   state: 'active',
//   isIdle: false,
//   isAway: false,
//   isActive: true,
//   isPaused: false,
//   tabHidden: false,
//   windowFocused: true,
//   lastActivity: 1234567890,
//   idleTime: 5000,
//   idleDuration: null,
//   awayDuration: null
// }
```

## Manual Control

```javascript
// Reset idle timer (mark as active)
Funky.IdleDetector.triggerActivity();

// Pause/resume detection
Funky.IdleDetector.pause();
Funky.IdleDetector.resume();
Funky.IdleDetector.isPaused();  // true/false

// Update config at runtime
Funky.IdleDetector.configure({ idleTimeout: 60000 });

// Get current config
var config = Funky.IdleDetector.getConfig();
```

## Events

### Using on()/off()

```javascript
Funky.IdleDetector.on('idle', function(data) {
    // data.idleTime - ms inactive before idle
    // data.lastActivity - timestamp
    // data.timestamp - when event fired
});

Funky.IdleDetector.on('active', function(data) {
    // data.idleDuration - how long was idle
    // data.timestamp - when event fired
});

Funky.IdleDetector.on('away', function(data) {
    // data.timestamp - when went away
    // data.wasIdle - true if was idle before away
    // data.previousState - 'active' or 'idle'
});

Funky.IdleDetector.on('return', function(data) {
    // data.awayDuration - how long was away
    // data.timestamp - when returned
    // data.newState - 'active' or 'idle'
});

// Remove specific handler
var handler = function() {};
Funky.IdleDetector.on('idle', handler);
Funky.IdleDetector.off('idle', handler);

// Remove all handlers for event
Funky.IdleDetector.off('idle');
```

### PubSub Events

IdleDetector also emits events via `Funky.PubSub`:

| Event | Description |
|-------|-------------|
| `funky:idle:idle` | User became idle |
| `funky:idle:active` | User became active |
| `funky:idle:away` | Tab became hidden |
| `funky:idle:return` | Tab became visible |

```javascript
Funky.PubSub.on('funky:idle:idle', function(data) {
    console.log('User went idle');
});
```

### DOM Events

Events are also emitted on the document:

| Event | Description |
|-------|-------------|
| `funky.idle.idle` | User became idle |
| `funky.idle.active` | User became active |
| `funky.idle.away` | Tab became hidden |
| `funky.idle.return` | Tab became visible |

```javascript
document.addEventListener('funky.idle.idle', function(e) {
    console.log('User went idle', e.detail);
});
```

## Integration with Presence

IdleDetector is used by Funky.Presence for broadcasting user status:

```javascript
Funky.IdleDetector.on('idle', function() {
    Funky.Presence.setStatus('idle');
});

Funky.IdleDetector.on('active', function() {
    Funky.Presence.setStatus('online');
});

Funky.IdleDetector.on('away', function() {
    Funky.Presence.setStatus('away');
});
```

## Integration with SPA

SPA can use IdleDetector to optimize resources:

```javascript
Funky.IdleDetector.on('idle', function() {
    // Pause animations
    document.documentElement.classList.add('user-idle');

    // Reduce polling frequency
    reducePollingInterval();
});

Funky.IdleDetector.on('active', function() {
    // Resume animations
    document.documentElement.classList.remove('user-idle');

    // Restore polling frequency
    restorePollingInterval();
});
```

## Cleanup

```javascript
Funky.IdleDetector.destroy();
```

This removes all event listeners, clears timers, and resets state.

## API Reference

### Initialization

| Method | Returns | Description |
|--------|---------|-------------|
| `init(options)` | `this` | Initialize with options |
| `isInitialized()` | `boolean` | Check if initialized |
| `destroy()` | `void` | Clean up and reset |

### State Queries

| Method | Returns | Description |
|--------|---------|-------------|
| `isIdle()` | `boolean` | True if idle |
| `isAway()` | `boolean` | True if away (tab hidden) |
| `isActive()` | `boolean` | True if active |
| `getState()` | `string` | Current state |
| `getIdleTime()` | `number` | Ms since last activity |
| `getLastActivity()` | `number` | Last activity timestamp |
| `isTabHidden()` | `boolean` | True if tab is hidden |
| `isWindowFocused()` | `boolean` | True if window focused |
| `getAwayDuration()` | `number\|null` | Ms away, or null |
| `getStateInfo()` | `object` | Detailed state object |
| `isPaused()` | `boolean` | True if paused |

### Control

| Method | Returns | Description |
|--------|---------|-------------|
| `triggerActivity()` | `this` | Reset idle timer |
| `pause()` | `this` | Pause detection |
| `resume()` | `this` | Resume detection |
| `configure(options)` | `this` | Update config |
| `getConfig()` | `object` | Get current config |

### Events

| Method | Returns | Description |
|--------|---------|-------------|
| `on(event, handler)` | `this` | Add event handler |
| `off(event, handler?)` | `this` | Remove handler(s) |
