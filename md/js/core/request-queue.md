# Funky.RequestQueue

HTTP request queue for offline support with automatic sync and conflict resolution.

## Overview

`Funky.RequestQueue` builds on `Funky.JobQueue` to add HTTP-specific functionality:

- Online/offline detection
- Automatic `Funky.Api` wrapping
- HTTP conflict resolution (409 handling)
- Network error recovery

**100% Optional** - If this script is not loaded, everything works exactly as before. Even when loaded, nothing happens until `enable()` is explicitly called.

## Quick Start

```javascript
// Enable automatic queueing
Funky.RequestQueue.enable();

// Now API calls auto-queue when offline
Funky.Api.post('/api/trades', { symbol: 'AAPL' });

// When back online, queued requests sync automatically
```

## Enable Options

#### `Funky.RequestQueue.enable(options)`

Enable automatic request queueing.

**Parameters:**
| Option | Config Name | Type | Default | Description |
|--------|-------------|------|---------|-------------|
| methods | queueableMethods | Array | `['POST','PUT','PATCH','DELETE']` | HTTP methods to queue |
| urls | queueableUrls | Array | `null` | URL patterns to queue (null = all) |
| exclude | excludeUrls | Array | `[]` | URL patterns to never queue |
| persist | persist | boolean | `true` | Enable IndexedDB persistence |
| maxAttempts | maxAttempts | number | `3` | Max retry attempts |
| timeout | timeout | number | `30000` | Request timeout in ms |
| autoProcess | autoProcess | boolean | `true` | Auto-process when online |
| queueName | queueName | string | `'funky-requests'` | Name for IndexedDB storage |

**Returns:** `Promise`

```javascript
Funky.RequestQueue.enable({
  methods: ['POST', 'PUT', 'DELETE'],
  exclude: ['/api/auth/*', '/api/search'],
  maxAttempts: 5
});
```

---

#### `Funky.RequestQueue.disable()`

Disable queueing and restore original `Funky.Api`.

## Queue Management Methods

#### `getAll([filter])`

Get all queued requests.

**Returns:** `Array`

```javascript
var pending = Funky.RequestQueue.getAll({ status: 'pending' });
```

---

#### `get(id)`

Get a request by ID.

**Returns:** `Object|null`

---

#### `count([status])`

Count queued requests.

**Returns:** `number`

---

#### `remove(id)`

Remove a request from the queue.

**Returns:** `boolean`

---

#### `clear([status])`

Clear the queue.

---

#### `retry(id)`

Retry a failed request.

**Returns:** `boolean`

---

#### `retryAll()`

Retry all failed requests.

**Returns:** `number` - Count reset

---

#### `sync()`

Force sync all pending requests.

**Returns:** `Promise<Object>` - `{ success, failed, pending }`

```javascript
Funky.RequestQueue.sync().then(function(results) {
  console.log('Synced:', results.success, 'succeeded');
});
```

---

#### `pause()` / `resume()`

Pause or resume processing.

## Status Methods

#### `isOnline()`

Check network status.

**Returns:** `boolean`

---

#### `isEnabled()`

Check if queueing is enabled.

**Returns:** `boolean`

## Events

#### `on(event, handler)` / `off(event, handler)`

Subscribe/unsubscribe to events.

**Returns:** `RequestQueue` - For chaining

```javascript
Funky.RequestQueue
  .on('queued', function(data) {
    console.log('Queued:', data.job.data.url);
  })
  .on('success', function(data) {
    console.log('Synced:', data.job.id);
  });
```

### Available Events

Events can be subscribed via `.on()` or `Funky.PubSub` with `funky:request-queue:` prefix:

| Event | PubSub Event | Payload | Description |
|-------|--------------|---------|-------------|
| `enabled` | `funky:request-queue:enabled` | - | RequestQueue enabled |
| `disabled` | `funky:request-queue:disabled` | - | RequestQueue disabled |
| `online` | `funky:request-queue:online` | - | Network online |
| `offline` | `funky:request-queue:offline` | - | Network offline |
| `queued` | `funky:request-queue:queued` | `{ job, options }` | Request queued |
| `processing` | `funky:request-queue:processing` | `{ job }` | Processing started |
| `success` | `funky:request-queue:success` | `{ job, result }` | Request succeeded |
| `failed` | `funky:request-queue:failed` | `{ job, error }` | Request failed |
| `retry` | `funky:request-queue:retry` | `{ job, attempt }` | Will retry |
| `changed` | `funky:request-queue:changed` | `{ count }` | Count changed |
| `conflict` | `funky:request-queue:conflict` | `{ item, strategy, error }` | Conflict detected |
| `conflict:resolved` | `funky:request-queue:conflict:resolved` | `{ item, strategy }` | Conflict resolved |
| `conflict:prompt` | `funky:request-queue:conflict:prompt` | `{ item }` | User prompt needed |
| `conflict:review` | `funky:request-queue:conflict:review` | `{ item }` | Review requested |

```javascript
// Via .on() (preferred)
Funky.RequestQueue.on('queued', function(data) { ... });

// Via PubSub
Funky.PubSub.on('funky:request-queue:queued', function(data) { ... });
```

## Conflict Resolution

RequestQueue handles HTTP 409 conflicts automatically.

### Default Strategies

| Strategy | Description |
|----------|-------------|
| `server-wins` | Discard local changes, keep server version |
| `client-wins` | Force local changes (adds `X-Force-Update` header) |
| `merge` | Attempt automatic merge of client and server data |
| `prompt` | Show modal for user to choose (default) |

### Configuration

#### `setDefaultConflictStrategy(strategy)`

Set the default conflict resolution strategy.

```javascript
Funky.RequestQueue.setDefaultConflictStrategy('server-wins');
```

---

#### `setConflictStrategy(pattern, strategy)`

Set strategy for specific URL pattern.

```javascript
// Use specific strategy for URL pattern
Funky.RequestQueue.setConflictStrategy('/api/trades/*', 'prompt');

// Custom handler function
Funky.RequestQueue.setConflictStrategy('/api/docs/*', function(item, actions) {
  if (item.data.priority === 'high') {
    actions.resolve();  // Client wins
  } else {
    actions.discard();  // Server wins
  }
});
```

**Custom handler actions:**
| Action | Description |
|--------|-------------|
| `actions.resolve()` | Client wins |
| `actions.discard()` | Server wins |
| `actions.merge()` | Attempt auto-merge |
| `actions.custom(data)` | Use custom data |

---

#### `getConflicts()`

Get all items in conflict state.

**Returns:** `Array`

---

#### `resolveConflict(id, strategy, [customData])`

Resolve a specific conflict.

**Returns:** `boolean`

```javascript
Funky.RequestQueue.resolveConflict(123, 'client-wins');
```

---

#### `resolveAllConflicts(strategy)`

Batch resolve all conflicts.

**Returns:** `number` - Count resolved

## Debug

#### `debug()`

Get debug information.

**Returns:** `Object`

```javascript
console.log(Funky.RequestQueue.debug());
// { online, enabled, config, conflicts, queue: {...} }
```

## Usage Patterns

### Basic Offline Support

```javascript
// Enable on app startup
Funky.RequestQueue.enable({
  exclude: ['/api/auth/*']  // Don't queue auth requests
});

// Show status indicator
Funky.QueueStatus.init({
  queueSource: 'requestqueue',
  container: '#header'
});

// Normal API usage - automatically queues when offline
Funky.Api.post('/api/orders', orderData);
```

### Manual Sync Control

```javascript
// Disable auto-processing
Funky.RequestQueue.enable({ autoProcess: false });

// Manual sync button
document.getElementById('sync-btn').addEventListener('click', function() {
  Funky.RequestQueue.sync().then(function(results) {
    Funky.Toast.show('Synced ' + results.success + ' items');
  });
});
```

### Conflict Handling

```javascript
// Set up strategies
Funky.RequestQueue.setDefaultConflictStrategy('prompt');
Funky.RequestQueue.setConflictStrategy('/api/settings/*', 'server-wins');
Funky.RequestQueue.setConflictStrategy('/api/drafts/*', 'client-wins');

// Custom conflict UI
Funky.RequestQueue.on('conflict:review', function(data) {
  showConflictResolutionPanel(data.item);
});
```

### Network Status UI

```javascript
Funky.RequestQueue
  .on('offline', function() {
    document.body.classList.add('offline-mode');
    Funky.Toast.show('Working offline - changes will sync when connected', 'warning');
  })
  .on('online', function() {
    document.body.classList.remove('offline-mode');
    Funky.Toast.show('Back online - syncing...', 'info');
  });
```

## Dependencies

- `Funky.JobQueue` - Underlying queue implementation
- `Funky.Events` - Event system
- `Funky.Api` - HTTP client (wrapped when enabled)
- `Funky.Modal` (optional) - Conflict resolution prompts

## File Location

`/public/assets/js/core/request-queue.js`

## See Also

- [Queue System Overview](../../QUEUE.md) - Architecture overview
- [Funky.JobQueue](job-queue.md) - Generic job queue
- [Funky.QueueStatus](../components/queue-status.md) - UI component
