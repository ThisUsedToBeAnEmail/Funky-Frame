# Funky.CacheSync

WebSocket to Cache integration for real-time cache invalidation and Funky.Table refresh.

## Overview

`Funky.CacheSync` listens for WebSocket entity change events and automatically:
- Invalidates cache entries so fresh data is fetched via API
- Triggers Funky.Table refreshes for real-time UI updates
- Clears stale caches on WebSocket reconnection

Since WebSocket messages contain only metadata (`{ entity, id, action, timestamp }`), this module invalidates cache entries rather than updating them directly.

## Quick Start

```javascript
// CacheSync auto-initializes on DOMContentLoaded
// Manual initialization if needed:
Funky.CacheSync.init();

// Listen for cache invalidation events
Funky.CacheSync.on('funky:cache-sync:invalidated', function(data) {
  console.log('Cache invalidated:', data.type, data.id, data.reason);
});

// Manually invalidate an entity
Funky.CacheSync.invalidate('users', 123, 'manual');
```

## API Reference

### Module Methods

#### `Funky.CacheSync.init()`

Initialize WebSocket listeners. Called automatically on DOMContentLoaded.

---

#### `Funky.CacheSync.on(event, handler)`

Register an event listener.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | Yes | Event handler function |

---

#### `Funky.CacheSync.off(event, handler)`

Remove an event listener.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | Yes | Handler to remove |

---

#### `Funky.CacheSync.invalidate(entity, id, reason)`

Manually trigger cache invalidation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| entity | string | Yes | Entity type (e.g., `'users'`, `'trades'`) |
| id | string/number | No | Entity ID (omit to clear entire entity cache) |
| reason | string | No | Reason for invalidation (default: `'manual'`) |

---

#### `Funky.CacheSync.invalidateBulk(entity)`

Trigger bulk invalidation for an entity type. Always forces full Funky.Table refresh.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| entity | string | Yes | Entity type |

---

#### `Funky.CacheSync.setDataTableIntegration(enabled)`

Enable or disable automatic Funky.Table refresh.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| enabled | boolean | Yes | Whether to enable Funky.Table integration |

---

#### `Funky.CacheSync.isDataTableIntegrationEnabled()`

**Returns:** `boolean` - Whether Funky.Table integration is enabled

---

## WebSocket Events Handled

| WebSocket Event | Action | Description |
|-----------------|--------|-------------|
| `entity_change` (created) | Clear list cache | New item needs to be fetched |
| `entity_change` (updated) | Invalidate specific item | Item will be refetched on next access |
| `entity_change` (deleted) | Invalidate specific item | Remove from cache |
| `bulk_change` | Clear entire entity cache | Multiple items changed |
| `connected` | Clear all caches | Data may have changed while disconnected |

## Events Emitted

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:cache-sync:invalidated` | `{ type, id?, reason }` | Cache entry invalidated |

**Payload Properties:**
| Name | Type | Description |
|------|------|-------------|
| type | string | Entity type |
| id | string/number | Entity ID (if specific item) |
| reason | string | `'created'`, `'updated'`, `'deleted'`, `'bulk'`, or `'manual'` |

## Examples

### Listening for Invalidations

```javascript
// React to specific entity types
Funky.CacheSync.on('funky:cache-sync:invalidated', function(data) {
  if (data.type === 'users') {
    // Refresh user-related UI
    refreshUserList();
  }

  if (data.type === 'trades' && data.reason === 'created') {
    // Show notification for new trades
    showNotification('New trade added');
  }
});
```

### Manual Invalidation

```javascript
// After a form submission, invalidate related caches
function onFormSubmit() {
  saveData().then(function(result) {
    // Trigger cache invalidation
    Funky.CacheSync.invalidate('users', result.id, 'form-save');
  });
}

// Bulk invalidation after import
function onImportComplete() {
  Funky.CacheSync.invalidateBulk('trades');
}
```

### Disabling Funky.Table Auto-Refresh

```javascript
// Disable during batch operations
Funky.CacheSync.setDataTableIntegration(false);

// Perform batch operations...
processBatchUpdates();

// Re-enable and trigger single refresh
Funky.CacheSync.setDataTableIntegration(true);
Funky.CacheSync.invalidateBulk('trades');
```

### Custom Cache Handling

```javascript
// Combine with direct cache access
Funky.CacheSync.on('funky:cache-sync:invalidated', function(data) {
  if (data.type === 'settings') {
    // Clear related computed caches
    Funky.Cache.clear('derived-settings');

    // Reload settings into app state
    loadSettings();
  }
});
```

## Funky.Table Integration

When Funky.Table integration is enabled (default), cache invalidations automatically notify `Funky.Table.handleCacheInvalidation()` which triggers smart UI updates:

- **created**: Reload table to show new row
- **updated**: Refresh the specific row
- **deleted**: Remove the row from display
- **bulk**: Full table reload

## Dependencies

- **Required:** `Funky.Cache`, `Funky.WebSocket`
- **Optional:** `Funky.Table` (for automatic table refresh)
