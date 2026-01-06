# Funky.WebSocket

Real-time WebSocket client with automatic reconnection, channel subscriptions, and session management.

## Overview

`Funky.WebSocket` provides a shared WebSocket connection for real-time updates. Multiple components can subscribe to the same connection via channels. It handles connection management, automatic reconnection with exponential backoff, channel subscriptions, and session expiry detection.

## Registration

Registered as `Funky.WebSocket` via the component registry.

**File:** `js/core/websocket.js`

**Version:** 2.0.0 (requires explicit initialization)

## Features

- **Shared Connection** - Single WebSocket connection shared by all components
- **Explicit Initialization** - Must call `init()` then `connect()` (no auto-connect)
- **Channel Handlers** - Subscribe to channels with per-channel message handlers
- **Exponential Backoff** - Reconnects with increasing delays (1s → 30s max)
- **Page Visibility** - Pauses heartbeat when tab is hidden, reconnects when visible
- **Network Awareness** - Pauses reconnection when offline
- **Session Management** - Detects session expiry and redirects to login
- **Event System** - Listen for specific message types
- **Presence System** - Real-time user presence tracking with typing, cursor, and status
- **Latency Tracking** - Monitor connection quality and average latency
- **PubSub Integration** - All channel messages broadcast via PubSub for loose coupling

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `socket` | WebSocket\|null | The underlying WebSocket instance |
| `connected` | boolean | Whether currently connected |
| `userId` | string\|null | Current user's ID |
| `reconnectAttempts` | number | Current reconnection attempt count |
| `subscriptions` | Set | Active channel subscriptions |
| `debug` | boolean | Enable console logging (default: false) |

## Quick Start

```javascript
// 1. Initialize (once per app, typically in app.js)
Funky.WebSocket.init({ debug: false });

// 2. Connect when user is authenticated
if (document.body.dataset.userId) {
  Funky.WebSocket.connect();
}

// 3. Subscribe to channels with handlers
var unsubscribe = Funky.WebSocket.subscribe('trades', function(message) {
  console.log('Trade update:', message);
});

// 4. Later, unsubscribe
unsubscribe();
```

## Methods

### init(options)

Initialize the WebSocket module. **Must be called before `connect()`.**

```javascript
Funky.WebSocket.init({
  debug: false,
  reconnectMin: 1000,
  reconnectMax: 30000,
  maxRetries: 10
});
```

**Parameters:**
- `options` (object) - Optional configuration options
  - `url` (string) - WebSocket URL (auto-detected if null)
  - `reconnectMin` (number) - Min reconnect delay in ms (default: 1000)
  - `reconnectMax` (number) - Max reconnect delay in ms (default: 30000)
  - `maxRetries` (number) - Max reconnection attempts (default: 10)
  - `debug` (boolean) - Enable debug logging (default: false)

**Behavior:**
- Sets up network and visibility event listeners
- Does NOT auto-connect (must call `connect()` separately)
- Safe to call multiple times (only initializes once)

---

### isInitialized()

Check if the WebSocket module has been initialized.

```javascript
if (!Funky.WebSocket.isInitialized()) {
  Funky.WebSocket.init();
}
```

**Returns:** `boolean`

---

### connect()

Establish a WebSocket connection to the server.

```javascript
Funky.WebSocket.connect();
```

**Behavior:**
- Uses session cookie for authentication
- Connects to `ws://` or `wss://` based on protocol
- Resubscribes to all registered channels on connect
- Shows reconnecting banner if connection was lost

### disconnect()

Gracefully close the WebSocket connection.

```javascript
Funky.WebSocket.disconnect();
```

**Behavior:**
- Sends close frame with code 1000
- Clears all reconnection attempts
- Does not auto-reconnect after manual disconnect

### subscribe(channel, handler)

Subscribe to a channel with an optional message handler.

```javascript
// Subscribe with a handler (recommended)
var unsubscribe = Funky.WebSocket.subscribe('trades', function(message) {
  console.log('Trade update:', message);
});

// Later, unsubscribe using the returned function
unsubscribe();

// Or subscribe without a handler (for PubSub listeners)
Funky.WebSocket.subscribe('user:123');
```

**Parameters:**
- `channel` (string) - Channel name to subscribe to
- `handler` (function) - Optional callback for messages on this channel

**Returns:** `function|undefined` - Unsubscribe function if handler was provided

**Channel Message Routing:**
When a message arrives with a `channel` field:
1. All handlers registered for that channel are called
2. PubSub events are emitted: `funky:ws:{channel}` and `funky:ws:{channel}:{type}`

**Example Channels:**
- `trades` - Trade entity changes
- `notifications` - User notifications
- `kanban:board123` - Kanban board updates
- `user:{id}` - User-specific notifications

### unsubscribe(channel, handler)

Unsubscribe from a channel or remove a specific handler.

```javascript
// Remove a specific handler
Funky.WebSocket.unsubscribe('trades', myHandler);

// Remove all handlers and unsubscribe from channel
Funky.WebSocket.unsubscribe('trades');
```

**Parameters:**
- `channel` (string) - Channel name to unsubscribe from
- `handler` (function) - Optional specific handler to remove

**Behavior:**
- If handler provided: removes only that handler, keeps subscription if other handlers exist
- If handler omitted: removes all handlers and unsubscribes from channel entirely

### on(event, callback)

Register an event listener.

```javascript
// Listen for entity changes
Funky.WebSocket.on('entity_change', function(data) {
    console.log(data.entity, data.id, 'was', data.action);
});

// Listen for notifications
Funky.WebSocket.on('notification', function(data) {
    Funky.Toast.show(data.message, data.level);
});

// Listen for connection status
Funky.WebSocket.on('status_changed', function(status) {
    updateConnectionIndicator(status);
});
```

**Parameters:**
- `event` (string) - Event type to listen for
- `callback` (function) - Handler function

**Events:**
| Event | Data | Description |
|-------|------|-------------|
| `connected` | null | Connection established |
| `disconnected` | `{ code, reason }` | Connection closed |
| `error` | Error | Connection error |
| `status_changed` | string | Status update |
| `session_expired` | `{ message }` | Session invalidated |
| `max_retries_exceeded` | null | All retries failed |
| `entity_change` | object | Entity was modified |
| `notification` | object | User notification |
| `subscribed` | `{ channel }` | Subscription confirmed |
| `unsubscribed` | `{ channel }` | Unsubscription confirmed |
| `latency` | `{ latency, quality }` | Latency measurement |
| `reconnected` | `{ attempt }` | Reconnection successful |
| `presence:*` | `{ channel, user, ... }` | Presence events (see Presence System) |

### off(event, callback)

Remove an event listener.

```javascript
Funky.WebSocket.off('entity_change', myHandler);
```

**Parameters:**
- `event` (string) - Event type
- `callback` (function) - Handler to remove (must be same reference)

### send(type, data)

Send a message to the server.

```javascript
Funky.WebSocket.send('custom_action', { key: 'value' });
```

**Parameters:**
- `type` (string) - Message type
- `data` (object) - Message data (optional)

### isConnected()

Check if currently connected.

```javascript
if (Funky.WebSocket.isConnected()) {
    // Safe to send messages
}
```

**Returns:** `boolean`

### getState()

Get current connection state.

```javascript
var state = Funky.WebSocket.getState();
// 'disconnected', 'connecting', 'connected', 'reconnecting'
```

**Returns:** `string`

---

### getConnectionId()

Get the current connection's unique identifier.

```javascript
var connId = Funky.WebSocket.getConnectionId();
```

**Returns:** `string|null`

---

### getSubscriptions()

Get list of active channel subscriptions.

```javascript
var channels = Funky.WebSocket.getSubscriptions();
// ['trades', 'user:123']
```

**Returns:** `string[]`

---

### destroy()

Destroy WebSocket module and remove all listeners. Used for cleanup.

```javascript
Funky.WebSocket.destroy();
```

---

### configure(options)

Update runtime configuration.

```javascript
Funky.WebSocket.configure({
  reconnectMax: 60000,
  trackLatency: false
});
```

**Parameters:**
- `options` (object) - Configuration options to merge

---

### getDebugState()

Get detailed internal state for debugging.

```javascript
var debug = Funky.WebSocket.getDebugState();
// { status, connected, reconnectAttempts, subscriptions, presenceUserId, ... }
```

**Returns:** `object` - Complete internal state

---

## Connection Quality

### getAverageLatency()

Get average message round-trip latency.

```javascript
var latency = Funky.WebSocket.getAverageLatency();
console.log('Average latency:', latency, 'ms');
```

**Returns:** `number` - Average latency in milliseconds

---

### getConnectionQuality()

Get connection quality assessment.

```javascript
var quality = Funky.WebSocket.getConnectionQuality();
// 'excellent' (<50ms), 'good' (<100ms), 'fair' (<200ms), 'poor' (>=200ms)
```

**Returns:** `string` - `'excellent'`, `'good'`, `'fair'`, `'poor'`, or `'unknown'`

---

## Presence System

The presence system enables real-time user awareness features like "who's viewing this page" and typing indicators.

### PRESENCE_MESSAGES

Message type constants for presence events.

```javascript
Funky.WebSocket.PRESENCE_MESSAGES = {
  JOIN: 'presence:join',
  LEAVE: 'presence:leave',
  STATUS: 'presence:status',
  TYPING: 'presence:typing',
  HEARTBEAT: 'presence:heartbeat',
  SYNC: 'presence:sync',
  USER_JOINED: 'presence:user_joined',
  USER_LEFT: 'presence:user_left',
  USER_STATUS: 'presence:user_status',
  CURSOR: 'presence:cursor'
};
```

---

### setPresenceUser(data)

Set the current user's presence identity.

```javascript
Funky.WebSocket.setPresenceUser({
  id: 'user123',
  name: 'John Doe',
  avatar: '/avatars/john.png'
});
```

**Parameters:**
- `data` (object) - User data with required `id` property

---

### getPresenceUser()

Get the current presence user data.

```javascript
var user = Funky.WebSocket.getPresenceUser();
```

**Returns:** `object|null`

---

### presenceJoin(channel, options)

Join a presence channel.

```javascript
Funky.WebSocket.presenceJoin('trade:123', {
  status: 'editing',
  metadata: { section: 'details' }
});
```

**Parameters:**
- `channel` (string) - Channel to join
- `options` (object) - Optional status and metadata

---

### presenceLeave(channel)

Leave a presence channel.

```javascript
Funky.WebSocket.presenceLeave('trade:123');
```

**Parameters:**
- `channel` (string) - Channel to leave

---

### presenceStatus(channel, status, metadata)

Update status in a presence channel.

```javascript
Funky.WebSocket.presenceStatus('trade:123', 'idle', { lastActive: Date.now() });
```

**Parameters:**
- `channel` (string) - Channel name
- `status` (string) - New status
- `metadata` (object) - Optional metadata

---

### presenceTyping(channel, typing)

Broadcast typing indicator.

```javascript
Funky.WebSocket.presenceTyping('chat:room1', true);

// Stop typing
Funky.WebSocket.presenceTyping('chat:room1', false);
```

**Parameters:**
- `channel` (string) - Channel name
- `typing` (boolean) - Whether currently typing

---

### presenceCursor(channel, position)

Broadcast cursor position (for collaborative editing).

```javascript
Funky.WebSocket.presenceCursor('document:456', { x: 100, y: 200 });
```

**Parameters:**
- `channel` (string) - Channel name
- `position` (object) - Cursor position data

---

### presenceHeartbeat()

Send presence heartbeat to maintain presence state.

```javascript
Funky.WebSocket.presenceHeartbeat();
```

---

### getPresenceChannels()

Get list of active presence channels.

```javascript
var channels = Funky.WebSocket.getPresenceChannels();
// ['trade:123', 'chat:room1']
```

**Returns:** `string[]` - Array of channel names

---

### onPresence(type, handler)

Listen for specific presence events.

```javascript
Funky.WebSocket.onPresence('user_joined', function(data) {
  console.log(data.user.name, 'joined', data.channel);
});

Funky.WebSocket.onPresence('typing', function(data) {
  showTypingIndicator(data.user, data.typing);
});
```

**Parameters:**
- `type` (string) - Presence event type (without `presence:` prefix)
- `handler` (function) - Event handler

---

### offPresence(type, handler)

Remove presence event listener.

```javascript
Funky.WebSocket.offPresence('typing', myHandler);
```

**Parameters:**
- `type` (string) - Presence event type
- `handler` (function) - Handler to remove

## Configuration

### Config Options

```javascript
Funky.WebSocket.configure({
  reconnectMin: 1000,           // Initial reconnect delay (1s)
  reconnectMax: 30000,          // Max reconnect delay (30s)
  reconnectMultiplier: 2,       // Exponential backoff multiplier
  maxRetries: 10,               // Max reconnection attempts
  heartbeatInterval: 25000,     // Client heartbeat interval (25s)
  visibilityDisconnect: 60000,  // Disconnect after 60s hidden
  presenceEnabled: true,        // Enable presence message handling
  autoRestorePresence: true,    // Restore presence on reconnect
  trackLatency: true,           // Track message latency
  heartbeatWithPresence: true   // Include presence in heartbeat
});
```

### Debug Mode

Enable verbose logging:

```javascript
Funky.WebSocket.debug = true;
```

## Component Integration

Components should use the shared `Funky.WebSocket` instead of creating their own connections.

### Funky.Table

Tables use the shared WebSocket for live binding:

```javascript
Funky.Table.create('#myTable', {
  liveBinding: {
    enabled: true,
    source: 'websocket',
    websocket: {
      channel: 'trades'  // Subscribe to this channel
    }
  }
});
```

### Funky.NotificationCenter

Notification center can use the shared WebSocket:

```javascript
Funky.NotificationCenter.init({
  useWebSocket: true,  // Use shared Funky.WebSocket
  channel: 'notifications'
});
```

### Funky.InlineEdit

Inline edit uses the shared WebSocket for real-time sync:

```javascript
var edit = Funky.InlineEdit.create(element, options);
edit.subscribeWebSocket('client:123');
```

### Funky.Kanban

Kanban uses PubSub events from WebSocket:

```javascript
// Kanban listens on PubSub channel: funky:ws:kanban:{boardId}
// Messages routed automatically when channel matches
```

## Usage Examples

### App Initialization

```javascript
// In your app.js or main entry point
function initWebSocket() {
  if (!Funky.WebSocket) return;

  // Initialize the module
  Funky.WebSocket.init({ debug: false });

  // Connect if user is authenticated
  var userId = document.body.dataset.userId;
  if (userId) {
    Funky.WebSocket.connect();
  }
}
```

### Basic Channel Subscription

```javascript
// Subscribe with handler
var unsubscribe = Funky.WebSocket.subscribe('trades', function(message) {
  console.log('Trade update:', message);
  if (message.action === 'created') {
    refreshTradeTable();
  }
});

// Cleanup when done
unsubscribe();
```

### Using PubSub for Loose Coupling

```javascript
// Components can listen via PubSub without direct WebSocket reference
Funky.PubSub.on('funky:ws:trades', function(data) {
  console.log('Trade update via PubSub:', data);
});

// Or listen for specific message types
Funky.PubSub.on('funky:ws:trades:entity_change', function(data) {
  console.log('Trade entity changed:', data);
});
```

### Real-time Table Updates

```javascript
// In a Funky.Table page module
Funky.WebSocket.subscribe('trades');

Funky.WebSocket.on('entity_change', function(data) {
    if (data.entity !== 'trade') return;
    
    var table = Funky.Table.getInstance('#tradesTable');
    
    switch (data.action) {
        case 'created':
            // Fetch and add new row via API
            $.get('/api/trade/' + data.id, function(trade) {
                table.row.add(trade).draw(false);
                Funky.Toast.success('New trade added');
            });
            break;
            
        case 'updated':
            // Fetch updated data and refresh row
            $.get('/api/trade/' + data.id, function(trade) {
                var $row = $('tr[data-id="' + data.id + '"]');
                // Update row data...
                $row.addClass('flash-highlight');
                setTimeout(function() {
                    $row.removeClass('flash-highlight');
                }, 2000);
            });
            break;
            
        case 'deleted':
            $('tr[data-id="' + data.id + '"]').fadeOut();
            break;
    }
});
```

### Connection Status Indicator

```javascript
// Add indicator to navbar
var indicator = document.getElementById('wsIndicator');

Funky.WebSocket.on('status_changed', function(status) {
    indicator.className = 'ws-status ' + status;
    indicator.title = {
        'connecting': 'Connecting...',
        'connected': 'Connected',
        'disconnected': 'Disconnected',
        'reconnecting': 'Reconnecting...'
    }[status] || status;
});
```

### Handling Session Expiry

The module automatically handles session expiry by showing a toast and redirecting to login. You can also listen for the event:

```javascript
Funky.WebSocket.on('session_expired', function(data) {
    console.log('Session expired:', data.message);
    // Custom handling before redirect
    saveLocalDraft();
});
```

## Message Protocol

### Client → Server

| Type | Payload | Purpose |
|------|---------|---------|
| `ping` | `{}` | Heartbeat |
| `subscribe` | `{ channel }` | Subscribe to channel |
| `unsubscribe` | `{ channel }` | Unsubscribe from channel |

### Server → Client

| Type | Payload | Purpose |
|------|---------|---------|
| `pong` | `{}` | Heartbeat response |
| `subscribed` | `{ channel, success }` | Subscription confirmed |
| `unsubscribed` | `{ channel }` | Unsubscription confirmed |
| `entity_change` | `{ entity, id, action, timestamp }` | Entity modified (fetch data via API) |
| `notification` | `{ message, level }` | User notification |
| `session_expired` | `{ message }` | Session invalidated |
| `error` | `{ message }` | Server error |

## Security Model

WebSocket messages intentionally contain **no sensitive data**. The `entity_change` event only provides:

- `entity` - Entity type (e.g., "trade", "client")
- `id` - Record ID
- `action` - Action type ("created", "updated", "deleted")
- `timestamp` - When the change occurred

**Why?** WebSocket connections broadcast to all authenticated users. Including entity data would leak information across user permission boundaries.

**Client Pattern:** When receiving an `entity_change`, clients should:

1. Check if the entity is relevant to current view
2. Fetch fresh data via authenticated REST API
3. The API enforces proper authorization checks

```javascript
Funky.WebSocket.on('entity_change', function(data) {
    if (data.entity === 'trade' && currentPage === 'trades') {
        // Refresh from API - authorization enforced server-side
        $.get('/api/trade/' + data.id, function(trade) {
            updateTradeRow(trade);
        });
    }
});
```

## Reconnection Behavior

1. Connection lost → Wait 1 second
2. Attempt reconnect
3. If failed → Double delay (max 30s)
4. Repeat up to 10 times
5. After 10 failures → Show persistent banner with manual retry

**Backoff sequence:** 1s → 2s → 4s → 8s → 16s → 30s → 30s → 30s → 30s → 30s

## Browser Events

### Page Visibility

- When tab hidden for 60+ seconds → Disconnect
- When tab visible again → Reconnect

### Network Status

- When offline → Pause reconnection
- When online → Resume reconnection

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.ws-connection-banner` | Base banner styles |
| `.ws-connection-banner.error` | Error state (red) |
| `.ws-connection-banner.warning` | Warning state (yellow) |
| `.ws-connection-banner.info` | Info state (blue) |

## Dependencies

- `Funky` global object
- `Funky.Toast` for notifications
- `Funky.PubSub` for event emission
- `Funky.Presence` for presence integration (optional)
- Modern browser with WebSocket support

## See Also

- [WEBSOCKET_API.md](../../WEBSOCKET_API.md) - Full WebSocket API documentation
- [SPA_ARCHITECTURE.md](../../SPA_ARCHITECTURE.md) - SPA architecture overview
- [spa.md](spa.md) - SPA navigation module
