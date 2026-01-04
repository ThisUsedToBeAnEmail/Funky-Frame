# Funky.Presence

Real-time user presence system for showing who's online, viewing, editing, and typing.

## Overview

`Funky.Presence` provides real-time awareness of other users in your application. It orchestrates IdleDetector, Channel, and TypingIndicator components to provide a unified presence system with automatic page tracking, typing indicators, and UI components.

## Registration

Registered as `Funky.Presence` via the component registry.

**File:** `public/assets/js/components/presence.js`

## Features

- **Who's online** - See which team members are active
- **Who's viewing** - See who else is on the same page/record
- **Who's editing** - Prevent conflicts by knowing when others are editing
- **Who's typing** - Real-time typing indicators for chat/comments
- **Idle Detection** - Automatic away/idle status via IdleDetector
- **UI Components** - Avatar stacks, viewers lists, typing indicators
- **SPA Integration** - Automatic page channel tracking

## Dependencies

| Dependency | Required | Purpose |
|------------|----------|---------|
| `Funky.IdleDetector` | No | Status broadcasting on idle/active |
| `Funky.Channel` | No | Real-time message transport |
| `Funky.TypingIndicator` | No | Typing indicator functionality |
| `Funky.SPA` | No | Auto page-channel navigation |

## Quick Start

```javascript
// Initialize presence
Funky.Presence.init({
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatar
});

// Join a page channel
Funky.Presence.join('page:/trades/123');

// Get other users on this page
var viewers = Funky.Presence.getOtherUsers('page:/trades/123');
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `userId` | string | required | Current user ID |
| `userName` | string | 'Anonymous' | Display name |
| `userAvatar` | string | null | Avatar URL |
| `userMetadata` | object | {} | Additional user data |
| `heartbeatInterval` | number | 30000 | Heartbeat interval (ms) |
| `autoJoinPage` | boolean | true | Auto-join page channel on init |
| `autoTrackNavigation` | boolean | true | Auto-join/leave on SPA navigation |
| `channelPrefix` | string | 'presence:' | Prefix for presence channels |
| `typingTimeout` | number | 3000 | Auto-stop typing after (ms) |
| `typingDebounce` | number | 300 | Debounce typing input events (ms) |
| `autoBindTypingInputs` | boolean | true | Auto-bind data-presence-input elements |
| `autoInitUI` | boolean | true | Auto-init UI from data attributes |
| `maxAvatars` | number | 5 | Max avatars before overflow |
| `defaultAvatar` | string | null | Default avatar URL |
| `debug` | boolean | false | Enable debug logging |

## Constants

### STATUS

Global user status values:

```javascript
Funky.Presence.STATUS.ONLINE   // 'online'
Funky.Presence.STATUS.AWAY     // 'away'
Funky.Presence.STATUS.IDLE     // 'idle'
Funky.Presence.STATUS.BUSY     // 'busy'
Funky.Presence.STATUS.OFFLINE  // 'offline'
```

### ACTIVITY_STATUS

Channel-specific activity status:

```javascript
Funky.Presence.ACTIVITY_STATUS.VIEWING  // 'viewing'
Funky.Presence.ACTIVITY_STATUS.EDITING  // 'editing'
Funky.Presence.ACTIVITY_STATUS.TYPING   // 'typing'
```

## Methods

### Initialization

#### init(options)

Initialize the presence system.

```javascript
Funky.Presence.init({
    userId: 'user-123',
    userName: 'John Doe',
    userAvatar: '/avatars/john.jpg',
    autoJoinPage: true
});
```

**Returns:** `this` for chaining

#### isInitialized()

Check if presence system is initialized.

```javascript
if (Funky.Presence.isInitialized()) {
    // Presence is ready
}
```

**Returns:** `boolean`

#### destroy()

Clean up and destroy the presence system.

```javascript
Funky.Presence.destroy();
```

### User Information

#### getCurrentUser()

Get current user info.

```javascript
var user = Funky.Presence.getCurrentUser();
// { id, name, avatar, metadata, status, joinedAt }
```

**Returns:** `Object|null`

### Channel Management

#### join(channel, options)

Join a presence channel.

```javascript
// Join with default 'viewing' status
Funky.Presence.join('page:/trades/123');

// Join with specific status
Funky.Presence.join('page:/trades/123', {
    status: 'editing',
    metadata: { recordType: 'trade' }
});
```

**Parameters:**
- `channel` (string) - Channel name
- `options` (object) - Join options
  - `status` (string) - Activity status ('viewing', 'editing', etc.)
  - `metadata` (object) - Additional metadata

**Returns:** `this` for chaining

#### leave(channel)

Leave a presence channel.

```javascript
Funky.Presence.leave('page:/trades/123');
```

**Returns:** `this` for chaining

#### leaveAll()

Leave all presence channels.

```javascript
Funky.Presence.leaveAll();
```

**Returns:** `this` for chaining

#### isInChannel(channel)

Check if currently in a channel.

```javascript
if (Funky.Presence.isInChannel('page:/trades/123')) {
    // User is in this channel
}
```

**Returns:** `boolean`

#### getChannels()

Get all joined channels.

```javascript
var channels = Funky.Presence.getChannels();
// ['presence:page:/trades', 'presence:page:/dashboard']
```

**Returns:** `Array<string>`

#### getCurrentPageChannel()

Get the current page channel (for SPA tracking).

```javascript
var pageChannel = Funky.Presence.getCurrentPageChannel();
```

**Returns:** `string|null`

### Getting Users

#### getUsers(channel)

Get all users in a channel including self.

```javascript
var users = Funky.Presence.getUsers('page:/trades/123');
```

**Returns:** `Array<Object>`

#### getOtherUsers(channel)

Get other users in a channel excluding self.

```javascript
var others = Funky.Presence.getOtherUsers('page:/trades/123');
```

**Returns:** `Array<Object>`

#### getUserCount(channel, excludeSelf)

Get user count in a channel.

```javascript
var total = Funky.Presence.getUserCount('page:/trades/123');
var others = Funky.Presence.getUserCount('page:/trades/123', true);
```

**Returns:** `number`

#### isUserInChannel(channel, userId)

Check if a specific user is in a channel.

```javascript
if (Funky.Presence.isUserInChannel('page:/trades/123', 'user-456')) {
    // User 456 is viewing this page
}
```

**Returns:** `boolean`

#### getUser(channel, userId)

Get a specific user from a channel.

```javascript
var user = Funky.Presence.getUser('page:/trades/123', 'user-456');
```

**Returns:** `Object|null`

#### isOnline(userId)

Check if a user is online in any channel.

```javascript
if (Funky.Presence.isOnline('user-456')) {
    // User is online somewhere
}
```

**Returns:** `boolean`

### Status Management

#### getStatus()

Get current global status.

```javascript
var status = Funky.Presence.getStatus();
// 'online', 'away', 'idle', 'busy', 'offline'
```

**Returns:** `string`

#### setStatus(status)

Set global status manually.

```javascript
Funky.Presence.setStatus('busy');
```

**Returns:** `this` for chaining

#### setOnline() / setAway() / setBusy()

Convenience methods for common statuses.

```javascript
Funky.Presence.setOnline();
Funky.Presence.setAway();
Funky.Presence.setBusy();
```

**Returns:** `this` for chaining

#### setChannelStatus(channel, status)

Set activity status for a specific channel.

```javascript
Funky.Presence.setChannelStatus('page:/trades/123', 'editing');
```

**Returns:** `this` for chaining

#### getChannelStatus(channel)

Get activity status for a specific channel.

```javascript
var status = Funky.Presence.getChannelStatus('page:/trades/123');
// 'viewing', 'editing', etc.
```

**Returns:** `string|null`

### Idle Detection

#### isIdle()

Check if user is currently idle.

```javascript
if (Funky.Presence.isIdle()) {
    // User has been inactive
}
```

**Returns:** `boolean`

#### isAway()

Check if user is currently away.

```javascript
if (Funky.Presence.isAway()) {
    // User has been inactive for extended time
}
```

**Returns:** `boolean`

#### getIdleTime()

Get time since last activity in milliseconds.

```javascript
var idleMs = Funky.Presence.getIdleTime();
```

**Returns:** `number`

#### getLastActivity()

Get timestamp of last activity.

```javascript
var lastActive = Funky.Presence.getLastActivity();
```

**Returns:** `number` (timestamp)

#### triggerActivity()

Manually trigger activity to reset idle timer.

```javascript
Funky.Presence.triggerActivity();
```

**Returns:** `this` for chaining

### Typing Indicators

#### startTyping(channel)

Start typing in a channel.

```javascript
Funky.Presence.startTyping('chat:room-1');
```

**Returns:** `this` for chaining

#### stopTyping(channel)

Stop typing in a channel.

```javascript
Funky.Presence.stopTyping('chat:room-1');
```

**Returns:** `this` for chaining

#### stopAllTyping()

Stop typing in all channels.

```javascript
Funky.Presence.stopAllTyping();
```

**Returns:** `this` for chaining

#### isTypingIn(channel)

Check if currently typing in a channel.

```javascript
if (Funky.Presence.isTypingIn('chat:room-1')) {
    // User is typing
}
```

**Returns:** `boolean`

#### getTypingUsers(channel)

Get users currently typing in a channel.

```javascript
var typers = Funky.Presence.getTypingUsers('chat:room-1');
```

**Returns:** `Array<Object>`

#### getOtherTypingUsers(channel)

Get other users typing (excluding self).

```javascript
var typers = Funky.Presence.getOtherTypingUsers('chat:room-1');
```

**Returns:** `Array<Object>`

#### getTypingText(channel)

Get formatted typing text.

```javascript
var text = Funky.Presence.getTypingText('chat:room-1');
// "John is typing..." or "John and Jane are typing..."
```

**Returns:** `string`

### Input Binding

#### bindTypingInput(channel, input, options)

Bind an input to typing indicator for a channel.

```javascript
var binding = Funky.Presence.bindTypingInput('chat:room-1', '#message-input', {
    debounce: 300,
    timeout: 3000
});
```

**Returns:** `Object` - Binding reference for unbinding

#### unbindTypingInput(binding)

Unbind a typing input.

```javascript
Funky.Presence.unbindTypingInput(binding);
```

**Returns:** `this` for chaining

#### unbindAllTypingInputs()

Unbind all typing inputs.

```javascript
Funky.Presence.unbindAllTypingInputs();
```

**Returns:** `this` for chaining

#### refreshTypingBindings()

Refresh typing input bindings after dynamic content loaded.

```javascript
Funky.Presence.refreshTypingBindings();
```

**Returns:** `this` for chaining

### Last Seen

#### getLastSeen(userId)

Get last seen timestamp for a user.

```javascript
var lastSeen = Funky.Presence.getLastSeen('user-456');
// '2024-01-15T12:00:00Z' or null
```

**Returns:** `string|null` (ISO timestamp)

#### getLastSeenRelative(userId)

Get relative time since last seen.

```javascript
var relative = Funky.Presence.getLastSeenRelative('user-456');
// '5 minutes ago', 'just now', etc.
```

**Returns:** `string|null`

## UI Components

### createAvatarStack(container, channel, options)

Create an avatar stack component.

```javascript
var stack = Funky.Presence.createAvatarStack('#container', 'page:/trades', {
    maxAvatars: 5,
    excludeSelf: true,
    showCount: true,
    defaultAvatar: '/default.png'
});

// Later
stack.update();  // Force refresh
stack.destroy(); // Clean up
```

**Options:**
- `maxAvatars` (number) - Max avatars before overflow
- `excludeSelf` (boolean) - Exclude current user (default: true)
- `showCount` (boolean) - Show user count (default: true)
- `defaultAvatar` (string) - Default avatar URL

**Returns:** Component instance with `element`, `update()`, `destroy()`

### createViewersList(container, channel, options)

Create a viewers list component.

```javascript
var list = Funky.Presence.createViewersList('#container', 'page:/trades', {
    label: 'Also viewing:',
    showStatus: true,
    defaultAvatar: '/default.png'
});
```

**Options:**
- `label` (string) - Label text (default: 'Also viewing:')
- `showStatus` (boolean) - Show user status (default: true)
- `defaultAvatar` (string) - Default avatar URL

**Returns:** Component instance with `element`, `update()`, `destroy()`

### createTypingIndicatorUI(container, channel, options)

Create a typing indicator UI component.

```javascript
var indicator = Funky.Presence.createTypingIndicatorUI('#container', 'chat:room-1', {
    showDots: true
});
```

**Options:**
- `showDots` (boolean) - Show animated dots (default: true)

**Returns:** Component instance with `element`, `update()`, `destroy()`

### createStatusDot(container, userId, options)

Create a status dot indicator.

```javascript
// For current user
var dot = Funky.Presence.createStatusDot('#container');

// For specific user
var dot = Funky.Presence.createStatusDot('#container', 'user-456');
```

**Returns:** Component instance with `element`, `update()`, `destroy()`

### refreshUI()

Refresh all UI components.

```javascript
Funky.Presence.refreshUI();
```

**Returns:** `this` for chaining

### destroyUI()

Destroy all UI components.

```javascript
Funky.Presence.destroyUI();
```

**Returns:** `this` for chaining

## Data Attributes

### Auto-initialized Avatar Stack

```html
<div data-presence-avatars
     data-presence-channel="page:/trades"
     data-presence-max="5"
     data-presence-exclude-self="true">
</div>
```

### Auto-initialized Viewers List

```html
<div data-presence-viewers
     data-presence-channel="page:/trades"
     data-presence-label="Also viewing:"
     data-presence-show-status="true">
</div>
```

### Auto-initialized Typing Indicator

```html
<div data-presence-typing-ui
     data-presence-channel="chat:room-1"
     data-presence-dots="true">
</div>
```

### Auto-initialized Status Dot

```html
<span data-presence-dot data-presence-user="user-456"></span>
```

### Input with Auto Typing Broadcast

```html
<input data-presence-input
       data-presence-channel="chat:room-1"
       data-presence-debounce="300">
```

## Events

### on(event, handler)

Register an event handler.

```javascript
Funky.Presence.on('join', function(data) {
    console.log(data.user.name + ' joined ' + data.channel);
});
```

**Returns:** `this` for chaining

### off(event, handler)

Remove an event handler.

```javascript
Funky.Presence.off('join', handler);
// Or remove all handlers for event
Funky.Presence.off('join');
```

**Returns:** `this` for chaining

### once(event, handler)

Register a one-time event handler.

```javascript
Funky.Presence.once('join', function(data) {
    // Only called once
});
```

**Returns:** `this` for chaining

### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `init` | `{ user }` | Presence initialized |
| `destroy` | `{}` | Presence destroyed |
| `join` | `{ channel, user }` | Joined a channel |
| `leave` | `{ channel, user }` | Left a channel |
| `status` | `{ user, status }` | Status changed |
| `channelStatus` | `{ channel, user, status }` | Channel status changed |
| `user:join` | `{ channel, user }` | Other user joined |
| `user:leave` | `{ channel, user }` | Other user left |
| `user:status` | `{ channel, userId, status }` | Other user status changed |
| `idle` | `{ user }` | User became idle |
| `active` | `{ user }` | User became active |
| `away` | `{ user }` | User went away |
| `typing:start` | `{ channel, user }` | User started typing |
| `typing:stop` | `{ channel, user }` | User stopped typing |

## Integration Examples

### SPA Navigation

```javascript
// Presence auto-tracks SPA navigation when autoTrackNavigation: true
Funky.Presence.init({
    userId: currentUser.id,
    userName: currentUser.name,
    autoTrackNavigation: true,
    channelPrefix: 'page:'
});
```

### Modal Forms

```html
<button data-modal-open="edit-trade"
        data-modal-presence="true"
        data-modal-record-id="123">
    Edit Trade
</button>
```

```javascript
// Modal will join presence:modal:trade:123:edit channel
// and show conflict warning if others are editing
```

### Inline Edit

```html
<span data-inline-edit
      data-presence="true"
      data-record-id="123"
      data-field="notes">
    Click to edit
</span>
```

### Chat Room

```javascript
// Join chat channel
Funky.Presence.join('chat:room-123');

// Create UI
Funky.Presence.createAvatarStack('#members', 'chat:room-123');
Funky.Presence.createTypingIndicatorUI('#typing', 'chat:room-123');

// Bind input
Funky.Presence.bindTypingInput('chat:room-123', '#message-input');
```

## Best Practices

1. **Use meaningful channel names** - `page:/trades/123`, `modal:trade:123:edit`, `chat:room-5`
2. **Clean up on destroy** - Always call `leave()` when done
3. **Handle conflicts** - Check for other editors before entering edit mode
4. **Respect privacy** - Don't track more than necessary
5. **Batch UI updates** - Use `refreshUI()` after bulk changes

## Accessibility

- Avatar stacks have `aria-label` for screen readers
- Viewers lists use `role="list"` and proper list markup
- Typing indicators use `aria-live="polite"` for announcements
- Focus states on all interactive elements
- Reduced motion support for animations

## Browser Support

- Modern browsers with WebSocket support
- IE11 not supported
