# Funky.Presence

Real-time user presence system for tracking online users, typing indicators, and page presence.

## Overview

`Funky.Presence` is an orchestration layer that coordinates:
- `Funky.IdleDetector` for activity tracking
- `Funky.Channel` for real-time communication
- `Funky.TypingIndicator` for typing status

Features include:
- User online/away/idle status tracking
- Typing indicators with auto-timeout
- Page-level presence (who's viewing what)
- SPA navigation integration
- Heartbeat system for connection monitoring
- Avatar stacks for user lists
- Declarative data attribute UI

## Quick Start

```javascript
// Initialize presence
Funky.Presence.init({
  userId: currentUser.id,
  userName: currentUser.name,
  userAvatar: currentUser.avatarUrl
});

// Join a channel
Funky.Presence.join('document:123');

// Listen for user events
Funky.Presence.on('user:join', function(data) {
  console.log(data.user.name + ' joined');
});
```

## API Reference

### Module Methods

#### `Funky.Presence.init(options)`

Initialize the presence system.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Configuration options |

**Returns:** `void`

---

#### `Funky.Presence.destroy()`

Destroy the presence system and clean up all subscriptions.

---

#### `Funky.Presence.join(channel, options)`

Join a presence channel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name to join |
| options | object | No | Join options |

**Join Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| status | string | `'viewing'` | Activity status: `'viewing'`, `'editing'`, `'typing'` |
| metadata | object | `{}` | Additional user metadata |

---

#### `Funky.Presence.leave(channel)`

Leave a presence channel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name to leave |

---

#### `Funky.Presence.leaveAll()`

Leave all joined channels.

---

#### `Funky.Presence.getMembers(channel)`

Get current members of a channel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name |

**Returns:** `array` - Array of member objects

---

#### `Funky.Presence.setStatus(status)`

Update current user's status across all channels.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| status | string | Yes | Status: `'online'`, `'away'`, `'busy'`, `'idle'` |

---

#### `Funky.Presence.setActivity(channel, activity)`

Update activity status in a specific channel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name |
| activity | string | Yes | Activity: `'viewing'`, `'editing'`, `'typing'` |

---

#### `Funky.Presence.startTyping(channel)`

Indicate user started typing in a channel.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name |

---

#### `Funky.Presence.stopTyping(channel)`

Indicate user stopped typing.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| channel | string | Yes | Channel name |

---

#### `Funky.Presence.on(event, handler)`

Register an event handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | Yes | Event handler function |

---

#### `Funky.Presence.off(event, handler)`

Remove an event handler.

---

#### `Funky.Presence.getCurrentUser()`

**Returns:** Current user object

---

#### `Funky.Presence.isInitialized()`

**Returns:** `boolean` - Whether system is initialized

---

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| userId | string | `null` | Current user's ID |
| userName | string | `'Anonymous'` | Current user's display name |
| userAvatar | string | `null` | Current user's avatar URL |
| userMetadata | object | `{}` | Additional user metadata |
| heartbeatInterval | number | `30000` | Heartbeat interval (ms) |
| autoJoinPage | boolean | `true` | Auto-join page channel on init |
| autoTrackNavigation | boolean | `true` | Auto-join/leave on SPA navigation |
| channelPrefix | string | `'presence:'` | Prefix for presence channels |
| typingTimeout | number | `3000` | Auto-stop typing after (ms) |
| typingDebounce | number | `300` | Debounce typing input events (ms) |
| autoBindTypingInputs | boolean | `true` | Auto-bind `data-presence-input` elements |
| autoInitUI | boolean | `true` | Auto-init UI from data attributes |
| maxAvatars | number | `5` | Max avatars in stack before overflow |
| defaultAvatar | string | `null` | Default avatar URL |
| debug | boolean | `false` | Enable debug logging |

---

### Status Constants

#### User Status
| Value | Description |
|-------|-------------|
| `'online'` | User is active |
| `'away'` | User is away (tab hidden) |
| `'idle'` | User is idle (no activity) |
| `'busy'` | User set as busy |
| `'offline'` | User disconnected |

#### Activity Status
| Value | Description |
|-------|-------------|
| `'viewing'` | User is viewing content |
| `'editing'` | User is editing content |
| `'typing'` | User is typing |

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `{ channel, user }` | User joined channel |
| `user:leave` | `{ channel, user }` | User left channel |
| `user:status` | `{ channel, userId, status }` | User status changed |
| `user:typing` | `{ channel, userId, isTyping }` | User typing state changed |
| `idle` | `{ user }` | Current user became idle |
| `active` | `{ user }` | Current user became active |
| `away` | `{ user }` | Current user went away |

Events are also emitted via PubSub as `funky:presence:{event}`.

## Examples

### Basic Presence

```javascript
Funky.Presence.init({
  userId: 'user-123',
  userName: 'John Doe',
  userAvatar: '/avatars/john.jpg'
});

// Join a document channel
Funky.Presence.join('document:456');

// Listen for users joining
Funky.Presence.on('user:join', function(data) {
  showNotification(data.user.name + ' is now viewing this document');
});

// Listen for users leaving
Funky.Presence.on('user:leave', function(data) {
  showNotification(data.user.name + ' left');
});
```

### Typing Indicators

```html
<!-- Auto-bind input for typing detection -->
<input type="text" data-presence-input="comments:123" placeholder="Add a comment...">
```

```javascript
// Manual typing control
var channel = 'chat:room-1';
Funky.Presence.join(channel);

document.getElementById('message').addEventListener('input', function() {
  Funky.Presence.startTyping(channel);
});

// Listen for others typing
Funky.Presence.on('user:typing', function(data) {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

### Avatar Stack UI

```html
<!-- Declarative avatar stack -->
<div data-presence-avatars="document:123" data-max-avatars="4"></div>
```

```javascript
// Get current members for custom UI
var members = Funky.Presence.getMembers('document:123');
renderAvatarStack(members);
```

### Collaborative Editing

```javascript
Funky.Presence.init({
  userId: currentUser.id,
  userName: currentUser.name
});

// Join document channel with editing status
Funky.Presence.join('document:' + documentId, {
  status: 'editing',
  metadata: {
    cursor: { line: 1, column: 0 }
  }
});

// Update cursor position
editor.on('cursorChange', function(position) {
  Funky.Presence.setActivity('document:' + documentId, 'editing');
  // Use Channel directly for cursor updates
  Funky.Channel.publish('document:' + documentId, 'cursor:move', {
    userId: currentUser.id,
    position: position
  });
});
```

### SPA Navigation Tracking

```javascript
// With autoTrackNavigation: true (default), presence
// automatically joins/leaves page channels on navigation

Funky.Presence.init({
  userId: currentUser.id,
  autoTrackNavigation: true,
  channelPrefix: 'presence:'
});

// When user navigates to /users:
// - Leaves presence:page:/old-page
// - Joins presence:page:/users

// Listen for who's on each page
Funky.Presence.on('user:join', function(data) {
  if (data.channel.startsWith('presence:page:')) {
    updatePageViewers(data.channel, data.user);
  }
});
```

### Status Updates

```javascript
// Set user as busy
Funky.Presence.setStatus('busy');

// Listen for idle/active changes
Funky.Presence.on('idle', function() {
  console.log('User went idle');
});

Funky.Presence.on('active', function() {
  console.log('User is active again');
});
```

## Declarative UI

### Avatar Stack

```html
<div data-presence-avatars="channel-name"
     data-max-avatars="5"
     data-show-count="true">
</div>
```

### Typing Indicator

```html
<div data-presence-typing="channel-name"
     data-format="{names} {verb} typing...">
</div>
```

### Typing Input

```html
<input data-presence-input="channel-name"
       data-presence-debounce="300">
```

## Accessibility

- Avatar stacks include proper `alt` text for user names
- Typing indicators use `aria-live="polite"` for announcements
- Status changes announced to screen readers
- Keyboard-accessible UI components

## Dependencies

- **Required:** None (gracefully degrades without dependencies)
- **Optional:** `Funky.IdleDetector` (status tracking), `Funky.Channel` (real-time), `Funky.TypingIndicator` (typing UI), `Funky.AvatarStack` (avatar UI), `Funky.SPA` (navigation tracking), `Funky.PubSub` (events)
