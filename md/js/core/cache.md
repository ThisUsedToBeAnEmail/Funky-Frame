# Funky.Cache & Funky.CacheSync

In-memory data cache with TTL, LRU eviction, and WebSocket synchronization.

## Overview

`Funky.Cache` provides client-side caching of API responses to reduce server load and improve responsiveness. `Funky.CacheSync` automatically invalidates cache entries when WebSocket `entity_change` events are received.

## Registration

- **Funky.Cache** - Registered via `public/assets/js/core/cache.js`
- **Funky.CacheSync** - Registered via `public/assets/js/core/cache-sync.js`

## Features

- **Per-entity caching** - Separate cache stores for each entity type
- **Simple key-value caching** - General-purpose cache with any string key
- **TTL expiry** - Configurable time-to-live per entity type (default: 5 min)
- **LRU eviction** - Automatic removal of least-recently-used items when limit reached
- **List caching** - Cache both individual items and lists
- **WebSocket sync** - Automatic invalidation on entity changes
- **Event system** - Listen for cache updates and invalidations
- **Cache statistics** - Track hit/miss rates for performance monitoring

## Funky.Cache API

### Configuration

```javascript
// Configure cache for specific entity type
Funky.Cache.configure('trade', {
    ttl: 10 * 60 * 1000,    // 10 minutes
    maxEntries: 1000         // Max 1000 trades
});

// Default: 5 minutes TTL, 500 max entries
```

### Methods

#### get(type, id) / get(key)

Get a single cached item. Supports both entity-type API and simple key-value API.

```javascript
// Entity-type API
var trade = Funky.Cache.get('trade', 123);
if (trade) {
    // Use cached data
} else {
    // Fetch from API
}

// Simple key-value API
var userData = Funky.Cache.get('user:profile:123');
if (userData) {
    // Use cached data
}
```

**Returns:** Cached data or `null`/`undefined` if not found/expired

#### getList(type)

Get a cached list.

```javascript
var clients = Funky.Cache.getList('client');
if (clients) {
    renderTable(clients);
} else {
    fetchClientsFromApi();
}
```

**Returns:** Array or `null` if not found/expired

#### set(type, id, data) / set(key, data, options)

Cache a single item. Supports both entity-type API and simple key-value API.

```javascript
// Entity-type API
$.get('/api/trade/123', function(trade) {
    Funky.Cache.set('trade', trade.id, trade);
    displayTrade(trade);
});

// Simple key-value API
Funky.Cache.set('user:profile:123', userData);

// With TTL option
Funky.Cache.set('funky:session:token', token, { ttl: 30 * 60 * 1000 }); // 30 minutes
```

#### setList(type, data)

Cache a list of items. Also populates the `byId` cache for each item.

```javascript
// After fetching list from API
$.get('/api/trades', function(trades) {
    Funky.Cache.setList('trade', trades);
    renderTable(trades);
});
```

#### has(type, id)

Check if item exists in cache (and not expired).

```javascript
if (Funky.Cache.has('client', 456)) {
    // Already cached
}
```

#### hasList(type)

Check if list exists in cache (and not expired).

```javascript
if (!Funky.Cache.hasList('trade')) {
    // Need to fetch list
}
```

#### invalidate(type, id)

Remove a specific item from cache.

```javascript
Funky.Cache.invalidate('trade', 123);
```

#### clear(type)

Clear all cached data for an entity type. When called without arguments, clears the simple key-value store.

```javascript
// Clear entity type cache
Funky.Cache.clear('trade');

// Clear simple key-value store
Funky.Cache.clear();
```

#### clearAll()

Clear entire cache.

```javascript
Funky.Cache.clearAll();
```

#### stats()

Get cache statistics for entity-type stores.

```javascript
console.log(Funky.Cache.stats());
// {
//   trade: { itemCount: 50, hasList: true, ttl: 300000, maxEntries: 500 },
//   client: { itemCount: 25, hasList: false, ttl: 300000, maxEntries: 500 }
// }
```

---

## Simple Key-Value API

In addition to the entity-type API, Funky.Cache provides a simple key-value store for general-purpose caching.

### Methods

#### delete(key)

Delete a cache entry by key.

```javascript
Funky.Cache.delete('user:profile:123');
```

#### clearPattern(pattern)

Clear all cache entries matching a key prefix.

```javascript
// Clear all user-related cache entries
Funky.Cache.clearPattern('user:');

// Clear all session data
Funky.Cache.clearPattern('session:');
```

#### setMaxSize(size)

Set the maximum number of entries in the key-value store. Triggers LRU eviction if current size exceeds the new limit.

```javascript
Funky.Cache.setMaxSize(500);  // Default is 1000
```

#### size()

Get the current number of entries in the key-value store.

```javascript
console.log(Funky.Cache.size());  // e.g., 42
```

#### keys(prefix)

Get all cache keys, optionally filtered by prefix.

```javascript
// Get all keys
var allKeys = Funky.Cache.keys();

// Get keys matching a prefix
var userKeys = Funky.Cache.keys('user:');
// ['user:profile:123', 'user:settings:123', ...]
```

#### getStats()

Get hit/miss statistics for performance monitoring.

```javascript
var stats = Funky.Cache.getStats();
console.log(stats);
// {
//   hits: 150,
//   misses: 30,
//   hitRate: 0.833
// }
```

#### resetStats()

Reset cache statistics counters.

```javascript
Funky.Cache.resetStats();
```

---

### Events

```javascript
// Listen for cache updates
Funky.Cache.on('updated', function(data) {
    console.log('Cached:', data.type, data.id);
});

// Listen for invalidations
Funky.Cache.on('invalidated', function(data) {
    console.log('Invalidated:', data.type, data.id);
});

// Listen for clears
Funky.Cache.on('cleared', function(data) {
    console.log('Cleared:', data.type || 'all');
});
```

## Funky.CacheSync API

CacheSync automatically initializes and listens for WebSocket events.

### Automatic Behavior

| WebSocket Event | Cache Action |
|-----------------|--------------|
| `entity_change` with `action: 'created'` | Clear entity type cache |
| `entity_change` with `action: 'updated'` | Invalidate item + clear list |
| `entity_change` with `action: 'deleted'` | Invalidate item |
| `bulk_change` | Clear entity type cache |
| `connected` (reconnect) | Clear all caches |

### Events

```javascript
// Listen for cache invalidations triggered by WebSocket
Funky.CacheSync.on('funky:cache-sync:invalidated', function(data) {
    console.log('Cache invalidated:', data.type, data.reason);
    // Possible reasons: 'created', 'updated', 'deleted', 'bulk', 'manual'
    
    // Refresh UI if needed
    if (data.type === 'trade' && currentPage === 'trades') {
        refreshTradeTable();
    }
});
```

### Manual Invalidation

```javascript
// Force invalidation (for testing or special cases)
Funky.CacheSync.invalidate('trade', 123);  // Single item
Funky.CacheSync.invalidate('trade');        // All trades
```

## Usage Patterns

### API Integration

```javascript
// Wrap API calls with cache
var TradeApi = {
    get: function(id) {
        var cached = Funky.Cache.get('trade', id);
        if (cached) {
            return Promise.resolve(cached);
        }
        
        return Funky.Api.get('/api/trade/' + id).then(function(trade) {
            Funky.Cache.set('trade', id, trade);
            return trade;
        });
    },
    
    list: function() {
        var cached = Funky.Cache.getList('trade');
        if (cached) {
            return Promise.resolve(cached);
        }
        
        return Funky.Api.get('/api/trades').then(function(trades) {
            Funky.Cache.setList('trade', trades);
            return trades;
        });
    }
};
```

### Real-time UI Updates

```javascript
// In a page module
Funky.CacheSync.on('funky:cache-sync:invalidated', function(data) {
    if (data.type !== 'trade') return;
    
    switch (data.reason) {
        case 'created':
        case 'bulk':
            // Full refresh needed
            TradeApi.list().then(renderTable);
            break;
            
        case 'updated':
            // Refresh single row
            TradeApi.get(data.id).then(function(trade) {
                updateTableRow(data.id, trade);
            });
            break;
            
        case 'deleted':
            // Remove row from UI
            removeTableRow(data.id);
            break;
    }
});
```

### Page-level Cache Management

```javascript
// Clear cache when navigating away (optional)
Funky.Pages.register('trades', {
    destroy: function() {
        // Don't clear - keep cache for quick return
    }
});

// Or clear on logout
function logout() {
    Funky.Cache.clearAll();
    // ... redirect
}
```

## Configuration Constants

| Constant | Default | Description |
|----------|---------|-------------|
| `DEFAULT_TTL` | 5 minutes | Time before cached data expires |
| `DEFAULT_MAX_ENTRIES` | 500 | Max items per entity type |
| `CLEANUP_INTERVAL` | 1 minute | How often to clean expired entries |

## Security Notes

- Cache is in-memory only (cleared on page refresh)
- No sensitive data persisted to localStorage
- WebSocket invalidation uses secure pattern (no data in messages)
- Clients always refetch via authenticated API

## Dependencies

- `Funky.register` (registry.js)
- `Funky.WebSocket` (websocket.js) - for CacheSync

## See Also

- [websocket.md](websocket.md) - WebSocket client documentation
- [api.md](api.md) - API client documentation
- [WEBSOCKET_API.md](../../WEBSOCKET_API.md) - WebSocket protocol
