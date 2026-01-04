# Funky.QueueStatus

Visual queue status indicator showing pending count, sync status, and queue viewer modal.

## Overview

`Funky.QueueStatus` displays a status indicator for background job queues. Works with both `Funky.JobQueue` and `Funky.RequestQueue` to show pending operations and sync status.

## Quick Start

```javascript
// Initialize with auto-detection
Funky.QueueStatus.init({
  container: '#header'
});

// Show the queue viewer modal
Funky.QueueStatus.showModal();
```

## API Reference

### Initialization

#### `Funky.QueueStatus.init(options)`

Initialize the queue status indicator.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| container | string | `'body'` | Container selector |
| position | string | `'fixed'` | `'fixed'` or `'inline'` |
| showWhenEmpty | boolean | `false` | Show when no pending items |
| clickAction | string | `'modal'` | `'modal'`, `'custom'`, `'none'` |
| animations | boolean | `true` | Enable animations |
| queueSource | string | `'auto'` | `'auto'`, `'requestqueue'`, `'jobqueue'` |
| queueName | string | `null` | Specific JobQueue name |

**Example:**
```javascript
Funky.QueueStatus.init({
  container: '#status-bar',
  position: 'inline',
  showWhenEmpty: false,
  queueSource: 'requestqueue'
});
```

---

### Methods

#### `showModal()`

Open the queue viewer modal.

---

#### `hideModal()`

Close the queue viewer modal.

---

#### `refresh()`

Refresh the status display.

---

#### `show()` / `hide()`

Show or hide the indicator.

---

#### `destroy()`

Clean up and remove the indicator.

---

## Queue Sources

### Auto-Detection

By default, QueueStatus auto-detects the queue to monitor:
1. If `Funky.RequestQueue` is enabled, use it
2. Otherwise, look for configured `JobQueue`

### RequestQueue

Monitor the HTTP request queue:

```javascript
Funky.QueueStatus.init({
  queueSource: 'requestqueue'
});
```

### JobQueue

Monitor a specific JobQueue:

```javascript
Funky.QueueStatus.init({
  queueSource: 'jobqueue',
  queueName: 'sync-queue'
});
```

### Direct Instance

Pass a queue instance directly:

```javascript
var myQueue = Funky.JobQueue.create('my-jobs');

Funky.QueueStatus.init({
  queue: myQueue
});
```

## Status States

| State | Icon | Description |
|-------|------|-------------|
| Idle | Cloud | No pending items |
| Syncing | Spinner | Items being processed |
| Pending | Badge | Items waiting |
| Offline | Warning | Network offline |
| Error | Error | Processing errors |

## Queue Viewer Modal

The modal displays:
- Pending items list
- Item status (pending, processing, failed)
- Retry/cancel actions
- Processing history

## CSS Classes

| Class | Description |
|-------|-------------|
| `.queue-status` | Main container |
| `.queue-status--fixed` | Fixed position |
| `.queue-status--inline` | Inline position |
| `.queue-status--syncing` | Syncing state |
| `.queue-status--offline` | Offline state |
| `.queue-status__icon` | Status icon |
| `.queue-status__badge` | Count badge |

## PubSub Events

### Emitted Events

| Event | Data | Description |
|-------|------|-------------|
| `funky:queue-status:shown` | `{}` | Indicator shown |
| `funky:queue-status:hidden` | `{}` | Indicator hidden |
| `funky:queue-status:modal:opened` | `{}` | Modal opened |
| `funky:queue-status:modal:closed` | `{}` | Modal closed |

### Subscribed Events

QueueStatus listens to queue events:

| Event | Description |
|-------|-------------|
| `funky:requestqueue:pending` | Request queue changed |
| `funky:jobqueue:job:added` | Job added |
| `funky:jobqueue:job:complete` | Job completed |
| `funky:network:offline` | Network went offline |
| `funky:network:online` | Network came online |

## Accessibility

- Proper ARIA labels on indicator
- Screen reader announcements
- Keyboard accessible modal
- Focus management

## Usage Patterns

### Header Integration

```javascript
// Add to header bar
Funky.QueueStatus.init({
  container: '#header-actions',
  position: 'inline',
  showWhenEmpty: true
});
```

### Fixed Position

```javascript
// Floating indicator
Funky.QueueStatus.init({
  container: 'body',
  position: 'fixed',
  showWhenEmpty: false
});
```

### Custom Click Handler

```javascript
Funky.QueueStatus.init({
  clickAction: 'custom',
  onClick: function() {
    // Custom action instead of modal
    showCustomQueuePanel();
  }
});
```

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Events` - Event handling
- `Funky.RequestQueue` or `Funky.JobQueue` - Queue source

## File Location

`/public/assets/js/components/queue-status.js`

## See Also

- [Queue System Overview](../../QUEUE.md) - Architecture overview
- [Funky.RequestQueue](../core/request-queue.md) - HTTP request queue
- [Funky.JobQueue](../core/job-queue.md) - Background job queue
