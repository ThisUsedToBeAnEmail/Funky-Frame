# Funky.JobQueue

Generic job queue with persistence, retry logic, and priority processing.

## Overview

`Funky.JobQueue` is a constructor-based queue for deferred/background processing. Process anything with your own processor function. Supports IndexedDB persistence with localStorage fallback.

## Quick Start

```javascript
// Create a queue
var queue = new Funky.JobQueue({
  name: 'my-jobs',
  processor: function(job) {
    return doSomethingAsync(job.data);
  },
  persist: true
});

// Initialize storage (required if persist: true)
queue.init().then(function() {
  // Add jobs
  queue.add({ type: 'task', data: { foo: 'bar' } });
});
```

## Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | required | Unique queue name (used for persistence key) |
| `processor` | function | required | Async function to process jobs, receives job object |
| `persist` | boolean | `false` | Enable IndexedDB/localStorage persistence |
| `autoProcess` | boolean | `true` | Auto-process when jobs added |
| `maxAttempts` | number | `3` | Default retry attempts per job |
| `retryDelay` | number | `1000` | Base retry delay in ms |
| `maxRetryDelay` | number | `30000` | Maximum retry delay in ms |
| `backoffMultiplier` | number | `2` | Exponential backoff multiplier |
| `timeout` | number | `0` | Processor timeout in ms (0 = no timeout) |
| `processInterval` | number | `5000` | Auto-process check interval in ms |
| `dbName` | string | `'funky_jobqueue'` | IndexedDB database name |
| `storeName` | string | queue name | IndexedDB store name |
| `dbVersion` | number | `1` | IndexedDB schema version |

## Instance Methods

### Queue Management

#### `init()`

Initialize storage. Required if `persist: true`.

**Returns:** `Promise<Array>` - Loaded items

```javascript
queue.init().then(function(items) {
  console.log('Loaded', items.length, 'pending jobs');
});
```

---

#### `add(jobData)`

Add a job to the queue.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| type | string | `'default'` | Job type identifier |
| data | object | `{}` | Job payload |
| priority | string | `'normal'` | `'high'`, `'normal'`, `'low'` |
| maxAttempts | number | config value | Override default max attempts |
| meta | object | `{}` | Custom metadata |

**Returns:** `Object` - Created job

```javascript
var job = queue.add({
  type: 'email',
  data: { to: 'user@example.com', subject: 'Hello' },
  priority: 'high'
});
console.log('Created job:', job.id);
```

---

#### `remove(id)`

Remove a job by ID.

**Returns:** `boolean` - True if job was found and removed

---

#### `get(id)`

Get a job by ID.

**Returns:** `Object|null` - Job copy or null

---

#### `getAll([filter])`

Get all jobs, optionally filtered.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| status | string | Filter by status |
| type | string | Filter by type |
| priority | string | Filter by priority |

**Returns:** `Array` - Job copies

```javascript
var pending = queue.getAll({ status: 'pending' });
var highPriority = queue.getAll({ priority: 'high' });
```

---

#### `count([status])`

Count jobs in queue.

**Returns:** `number`

```javascript
var total = queue.count();
var failed = queue.count('failed');
```

---

#### `clear([status])`

Clear jobs from queue.

```javascript
queue.clear('completed');  // Clear completed only
queue.clear();             // Clear all
```

---

#### `retry(id)`

Retry a failed job.

**Returns:** `boolean` - True if job was reset for retry

---

#### `retryAll()`

Retry all failed jobs.

**Returns:** `number` - Count of jobs reset

### Processing Control

#### `process()`

Process next pending job (priority-sorted).

---

#### `sync()`

Process all pending jobs. Auto-resumes if paused.

**Returns:** `Promise<Object>` - Results: `{ success, failed, pending }`

```javascript
queue.sync().then(function(results) {
  console.log('Synced:', results.success, 'succeeded,', results.failed, 'failed');
});
```

---

#### `pause()` / `resume()`

Pause or resume processing. Jobs still queue when paused.

---

#### `isPaused()`

Check if queue is paused.

**Returns:** `boolean`

---

#### `isProcessing()`

Check if currently processing a job.

**Returns:** `boolean`

---

#### `getCurrentJob()`

Get the job currently being processed.

**Returns:** `Object|null`

---

#### `startAutoProcess()` / `stopAutoProcess()`

Start or stop interval-based processing.

```javascript
queue.startAutoProcess();  // Check every processInterval ms
queue.stopAutoProcess();
```

---

#### `isAutoProcessing()`

Check if auto-processing is running.

**Returns:** `boolean`

### Events

#### `on(event, handler)`

Subscribe to queue events.

**Returns:** `JobQueue` - For chaining

---

#### `off(event, handler)`

Unsubscribe from events.

**Returns:** `JobQueue` - For chaining

### Storage

#### `isStorageReady()`

Check if storage is initialized.

**Returns:** `boolean`

---

#### `isIndexedDB()`

Check if using IndexedDB (vs localStorage fallback).

**Returns:** `boolean`

### Debug

#### `debug()`

Get debug information about queue state.

**Returns:** `Object`

## Static Methods

#### `JobQueue.get(name)`

Get a queue instance by name.

**Returns:** `JobQueue|null`

```javascript
var queue = Funky.JobQueue.get('my-jobs');
```

---

#### `JobQueue.list()`

Get all registered queue names.

**Returns:** `Array<string>`

---

#### `JobQueue.destroy(name)`

Destroy a queue instance and clear its data.

**Returns:** `boolean`

## Events

Events are emitted via `Funky.PubSub` with colon notation: `jobqueue:{queueName}:{event}`

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | - | Queue created |
| `storage:ready` | `{ count, type }` | Storage initialized |
| `added` | `{ job }` | Job added |
| `removed` | `{ job }` | Job removed |
| `changed` | `{ count }` | Queue count changed |
| `processing` | `{ job }` | Job processing started |
| `success` | `{ job, result }` | Job completed successfully |
| `retry` | `{ job, attempt, nextRetry }` | Job will retry |
| `failed` | `{ job, error }` | Job failed permanently |
| `paused` | - | Queue paused |
| `resumed` | - | Queue resumed |
| `empty` | - | No pending jobs |
| `synced` | `{ success, failed, pending }` | Sync completed |

**Subscribing:**

```javascript
// Via instance method (recommended)
queue.on('success', function(data) {
  console.log('Job completed:', data.job.id);
});

// Via PubSub directly
Funky.PubSub.on('jobqueue:my-jobs:failed', function(data) {
  console.error('Job failed:', data.error);
});
```

## Job Object Structure

| Property | Type | Description |
|----------|------|-------------|
| `id` | number | Unique identifier |
| `type` | string | Job type |
| `data` | object | Job payload |
| `priority` | string | `'high'`, `'normal'`, `'low'` |
| `status` | string | `'pending'`, `'processing'`, `'failed'`, `'completed'` |
| `attempts` | number | Attempt count |
| `maxAttempts` | number | Max attempts |
| `createdAt` | string | ISO timestamp |
| `lastAttempt` | string | Last attempt timestamp |
| `error` | object | Last error: `{ message, code, timestamp }` |
| `result` | any | Success result |
| `meta` | object | Custom metadata |

## Usage Patterns

### Background Task Processing

```javascript
var taskQueue = new Funky.JobQueue({
  name: 'background-tasks',
  processor: function(job) {
    switch (job.type) {
      case 'report':
        return generateReport(job.data);
      case 'export':
        return exportData(job.data);
      default:
        return Promise.reject(new Error('Unknown task type'));
    }
  },
  persist: true,
  maxAttempts: 5
});

taskQueue.init();

// Queue a report generation
taskQueue.add({
  type: 'report',
  data: { format: 'pdf', dateRange: 'last-month' },
  priority: 'low'
});
```

### Sync Queue with UI Integration

```javascript
var syncQueue = new Funky.JobQueue({
  name: 'sync',
  processor: syncToServer,
  persist: true
});

// Connect to QueueStatus component
Funky.QueueStatus.init({
  queue: syncQueue,
  position: 'inline',
  container: '#status-bar'
});
```

### Priority Processing

```javascript
// High priority jobs process first
queue.add({ type: 'urgent', data: {...}, priority: 'high' });
queue.add({ type: 'normal', data: {...}, priority: 'normal' });
queue.add({ type: 'batch', data: {...}, priority: 'low' });
```

## Dependencies

- `Funky.PubSub` - Event system

## File Location

`/public/assets/js/core/job-queue.js`

## See Also

- [Queue System Overview](../../QUEUE.md) - Architecture overview
- [Funky.RequestQueue](request-queue.md) - HTTP request queue
- [Funky.QueueStatus](../components/queue-status.md) - UI component
