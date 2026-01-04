# Funky Queue System

Offline-capable job queue with automatic sync, retry logic, and conflict resolution.

## Architecture

The queue system consists of three components:

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| `Funky.JobQueue` | Generic job queue with persistence | [job-queue.md](js/core/job-queue.md) |
| `Funky.RequestQueue` | HTTP-specific layer wrapping Funky.Api | [request-queue.md](js/core/request-queue.md) |
| `Funky.QueueStatus` | Visual status indicator and modal viewer | [queue-status.md](js/components/queue-status.md) |

## When to Use Which

### Funky.JobQueue

Use for **any async processing** that isn't HTTP requests:

- Background task processing
- Batch operations
- Custom sync logic
- File uploads with custom handling

```javascript
var queue = new Funky.JobQueue({
  name: 'tasks',
  processor: function(job) {
    return processTask(job.data);
  },
  persist: true
});
```

### Funky.RequestQueue

Use for **HTTP offline support** with Funky.Api:

- Offline-first applications
- Auto-sync when connection restored
- HTTP 409 conflict resolution

```javascript
Funky.RequestQueue.enable();
// Now Funky.Api calls auto-queue when offline
```

### Funky.QueueStatus

Use for **visual feedback** to users:

- Shows pending count
- Syncing indicator
- Click to view queue modal

```javascript
Funky.QueueStatus.init({
  container: '#header',
  queueSource: 'requestqueue'
});
```

## Quick Start

### Simple Background Queue

```javascript
// Create queue with processor
var queue = new Funky.JobQueue({
  name: 'my-queue',
  processor: function(job) {
    return doWork(job.data);
  }
});

// Add jobs
queue.add({ type: 'task', data: { id: 123 } });
```

### Offline HTTP Support

```javascript
// Enable request queueing
Funky.RequestQueue.enable({
  exclude: ['/api/auth/*']  // Don't queue auth
});

// Normal API calls now queue when offline
Funky.Api.post('/api/orders', orderData);

// Add status indicator
Funky.QueueStatus.init({
  container: '#status-bar'
});
```

### Persisted Queue with Status UI

```javascript
// Create persistent queue
var syncQueue = new Funky.JobQueue({
  name: 'sync',
  processor: syncToServer,
  persist: true,
  maxAttempts: 5
});

// Connect status UI
Funky.QueueStatus.init({
  queue: syncQueue,
  position: 'inline',
  container: '#header-actions'
});

// Initialize storage
syncQueue.init().then(function() {
  console.log('Queue ready, pending:', syncQueue.count('pending'));
});
```

## Job Object Structure

All queues use the same job structure:

| Property | Type | Description |
|----------|------|-------------|
| `id` | number | Unique identifier |
| `type` | string | Job type |
| `data` | object | Job payload |
| `priority` | string | 'high', 'normal', 'low' |
| `status` | string | 'pending', 'processing', 'failed', 'completed' |
| `attempts` | number | Attempt count |
| `maxAttempts` | number | Max attempts |
| `createdAt` | string | ISO timestamp |
| `lastAttempt` | string | Last attempt timestamp |
| `error` | object | Last error (message, code, timestamp) |
| `result` | any | Success result |
| `meta` | object | Custom metadata |

## Events

### JobQueue Events

Events use colon notation: `jobqueue:{queueName}:{event}`

| Event | Description |
|-------|-------------|
| `added` | Job added |
| `success` | Job completed |
| `failed` | Job failed permanently |
| `retry` | Job will retry |
| `changed` | Queue count changed |

### RequestQueue Events

Events use prefix: `funky:request-queue:{event}`

| Event | Description |
|-------|-------------|
| `queued` | Request queued |
| `online` / `offline` | Network status changed |
| `conflict` | HTTP 409 detected |
| `conflict:resolved` | Conflict resolved |

## File Locations

| File | Description |
|------|-------------|
| `public/assets/js/core/job-queue.js` | Generic JobQueue |
| `public/assets/js/core/request-queue.js` | HTTP RequestQueue |
| `public/assets/js/components/queue-status.js` | UI component |
| `public/assets/css/components/queue-status.css` | UI styles |

## Detailed Documentation

- [Funky.JobQueue](js/core/job-queue.md) - Full API reference
- [Funky.RequestQueue](js/core/request-queue.md) - HTTP queueing and conflict resolution
- [Funky.QueueStatus](js/components/queue-status.md) - Visual status indicator
