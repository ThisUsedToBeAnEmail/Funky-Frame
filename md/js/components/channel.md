# Funky.Channel

Real-time room-based pub/sub system for grouped communication.

## Overview

Channel provides the foundation for real-time features requiring grouped communication:

- **Chat Rooms**: Multi-user messaging
- **Presence**: Track who's viewing what
- **Collaboration**: Real-time document editing
- **Live Updates**: Push data to groups of users

## Quick Start

```javascript
// Initialize
Funky.Channel.init({
    websocket: Funky.WebSocket,
    userId: currentUser.id,
    userName: currentUser.name
});

// Join a channel
Funky.Channel.join('room:general');

// Subscribe to messages
Funky.Channel.subscribe('room:general', function(message, sender) {
    console.log(sender.name + ':', message.text);
});

// Publish a message
Funky.Channel.publish('room:general', {
    type: 'chat',
    text: 'Hello everyone!'
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `websocket` | object | required | WebSocket instance |
| `userId` | string | required | Current user ID |
| `userName` | string | 'Anonymous' | Display name |
| `userMetadata` | object | {} | Additional user metadata |
| `autoReconnect` | boolean | true | Rejoin on reconnect |
| `maxChannels` | number | 50 | Max simultaneous channels |
| `messageBuffer` | number | 100 | Messages to buffer per channel |
| `debug` | boolean | false | Enable debug logging |

## Channel Operations

### Joining & Leaving

```javascript
// Join with options
Funky.Channel.join('room:123', {
    metadata: { role: 'admin' },
    onJoin: function(members) {
        console.log('Joined with', members.length, 'members');
    }
});

// Leave a channel
Funky.Channel.leave('room:123');

// Leave all channels
Funky.Channel.leaveAll();
```

### Member Queries

```javascript
// All members
var members = Funky.Channel.getMembers('room:123');

// Others (excluding self)
var others = Funky.Channel.getOtherMembers('room:123');

// Count
var count = Funky.Channel.getMemberCount('room:123');
var otherCount = Funky.Channel.getMemberCount('room:123', true); // excludeSelf

// Get specific member
var member = Funky.Channel.getMember('room:123', 'user-456');

// Check membership
Funky.Channel.hasMember('room:123', 'user-456');
```

### Channel Status

```javascript
// Check if joined
Funky.Channel.isJoined('room:123');

// Check if joining (in progress)
Funky.Channel.isJoining('room:123');

// Get all joined channel names
var channels = Funky.Channel.getJoined();

// Get all channel states
var all = Funky.Channel.getAll();

// Get/set channel metadata
var meta = Funky.Channel.getMetadata('room:123');
Funky.Channel.setMetadata('room:123', { topic: 'General Discussion' });
```

## Messaging

### Publishing

```javascript
// Simple publish
Funky.Channel.publish('room:123', { text: 'Hello' });

// With options
Funky.Channel.publish('room:123', message, {
    echo: true,           // Receive own message via handlers
    target: 'user-456',   // Send to specific member only
    ack: true             // Request acknowledgment (returns messageId)
});

// Broadcast to all joined channels
Funky.Channel.broadcast({ type: 'status', status: 'away' });

// Direct message to specific member
Funky.Channel.sendTo('room:123', 'user-456', { text: 'Private message' });
```

### Subscribing

```javascript
// Subscribe to all messages
var sub = Funky.Channel.subscribe('room:123', function(message, sender) {
    console.log(message);
});

// Filter by type
Funky.Channel.subscribeType('room:123', 'chat', function(message, sender) {
    // Only 'chat' type messages
});

// Filter by sender
Funky.Channel.subscribe('room:123', callback, {
    type: 'message',
    from: 'user-456'
});

// One-time subscription
Funky.Channel.subscribeOnce('room:123', function(message, sender) {
    // Automatically unsubscribes after first message
});

// Unsubscribe
Funky.Channel.unsubscribe(sub);

// Unsubscribe all from channel
Funky.Channel.unsubscribeAll('room:123');

// Unsubscribe from all channels
Funky.Channel.unsubscribeAll();

// Get subscription info
var subs = Funky.Channel.getSubscriptions('room:123');
```

### Request/Response Pattern

```javascript
// Send request and wait for response
Funky.Channel.request('room:123', { action: 'getData' }, { timeout: 5000 })
    .then(function(response) {
        console.log('Got response:', response);
    })
    .catch(function(err) {
        console.error('Request failed:', err);
    });

// Handle requests (on receiver side)
Funky.Channel.subscribe('room:123', function(message, sender) {
    if (message._isRequest && message.action === 'getData') {
        Funky.Channel.respond('room:123', message._requestId, {
            data: 'response data'
        });
    }
});
```

### Message Buffer

```javascript
// Get buffered messages for a channel
var buffer = Funky.Channel.getBuffer('room:123');

// Clear buffer for a channel
Funky.Channel.clearBuffer('room:123');

// Clear all buffers
Funky.Channel.clearBuffer();
```

## Events

### Event Types

Use the `EVENTS` constant for type-safe event handling:

```javascript
Funky.Channel.EVENTS.INIT       // 'init'
Funky.Channel.EVENTS.DESTROY    // 'destroy'
Funky.Channel.EVENTS.JOINED     // 'joined'   - Current user joined channel
Funky.Channel.EVENTS.LEFT       // 'left'     - Current user left channel
Funky.Channel.EVENTS.JOIN       // 'join'     - Another member joined
Funky.Channel.EVENTS.LEAVE      // 'leave'    - Another member left
Funky.Channel.EVENTS.SYNC       // 'sync'     - Member list synced
Funky.Channel.EVENTS.MESSAGE    // 'message'
Funky.Channel.EVENTS.ERROR      // 'error'
```

### Event Registration

```javascript
// Global event handler
Funky.Channel.on('message', function(data) {
    console.log('Message in any channel:', data);
});

// Channel-specific handler
Funky.Channel.on('room:123:message', function(data) {
    console.log('Message in room:123 only:', data);
});

// Wildcard handler (receives all events)
Funky.Channel.on('*', function(data) {
    console.log('Event:', data);
});

// One-time handler
Funky.Channel.once('joined', function(data) {
    console.log('First join only:', data);
});
```

### Event Removal

```javascript
// Remove specific handler
Funky.Channel.off('message', myHandler);

// Remove all handlers for event
Funky.Channel.off('message');

// Remove all wildcard handlers
Funky.Channel.off('*');

// Remove all handlers for a channel
Funky.Channel.offChannel('room:123');
```

### DOM Event Delegation

```javascript
// Delegate channel events to DOM element
var delegation = Funky.Channel.delegate('room:123', '#chat-container', {
    events: ['join', 'leave', 'message', 'sync']
});

// Listen on the element
document.getElementById('chat-container').addEventListener('funky.channel.message', function(e) {
    console.log('Message:', e.detail);
});

// Remove delegation
delegation.remove();
```

### Promise-Based Waiting

```javascript
// Wait for a specific event
Funky.Channel.waitFor('message', {
    timeout: 5000,
    filter: function(data) {
        return data.message.type === 'important';
    }
}).then(function(data) {
    console.log('Got important message:', data);
}).catch(function(err) {
    console.log('Timeout');
});

// Wait until joined a channel
Funky.Channel.whenJoined('room:123', 10000)
    .then(function(members) {
        console.log('Joined with members:', members);
    });
```

## Event Payloads

| Event | Payload |
|-------|---------|
| `init` | `{ user }` |
| `joined` | `{ channel, members }` |
| `left` | `{ channel }` |
| `join` | `{ channel, member }` |
| `leave` | `{ channel, member }` |
| `message` | `{ channel, message, sender, local }` |
| `sync` | `{ channel, members, joined, left }` |
| `error` | `{ channel, error }` |

## Debug Helpers

```javascript
// Enable debug logging
Funky.Channel.debug(true);

// Get listener counts
var counts = Funky.Channel.getListenerCounts();
// Returns: {
//   global: { message: 2 },
//   channel: { 'room:123': { message: 1 } },
//   wildcard: 1
// }
```

## Integration

Channel emits events via three channels:

1. **Internal handlers** - via `on()`/`off()`
2. **PubSub** - `funky:channel:eventName` and `funky:channel:channelName:eventName`
3. **DOM events** - `funky.channel.eventName`

```javascript
// Listen via PubSub
Funky.PubSub.on('funky:channel:message', function(data) {
    console.log('Message via PubSub');
});

// Listen via DOM
document.addEventListener('funky.channel.message', function(e) {
    console.log('Message via DOM:', e.detail);
});
```

## Best Practices

1. **Use namespaced channels**: `room:chat:general`, `page:/trades/123`
2. **Clean up subscriptions**: Store and unsubscribe when done
3. **Handle reconnection**: Channels auto-rejoin with `autoReconnect: true`
4. **Adjust buffer size**: Set `messageBuffer` based on your use case
5. **Use typed messages**: Include a `type` field for filtering

## Cleanup

```javascript
// Destroy the channel system
Funky.Channel.destroy();
```

This will:
- Send leave messages to all joined channels
- Clear all subscriptions and handlers
- Clean up pending requests
- Reset all internal state
