# Funky.Pages - Page Registry and Cache System

Manages page modules for the SPA, providing registration, caching, lifecycle hooks, and WebSocket integration for targeted updates.

## Overview

`Funky.Pages` extends the SPA with a **cached page architecture** where pages are registered modules with lifecycle methods. This enables:

- **Zero network latency** on repeat navigation (cached HTML + JS)
- **Targeted WebSocket updates** without full page redraws
- **State preservation** across navigations (scroll position, form state)
- **Entity-based cache invalidation** for real-time data updates

## Features

- **Page registration** with lifecycle hooks (`init`, `destroy`, `update`)
- **HTML + state caching** with TTL and size limits
- **Entity → page mapping** for WebSocket invalidation
- **Form state preservation** across navigation
- **Partial re-render utilities** for surgical DOM updates
- **Prefetching** for anticipated navigation

## Configuration

```javascript
// Configure the Pages system
Funky.Pages.configure({
  cacheTTL: 5 * 60 * 1000,   // 5 minutes (default)
  maxCacheSize: 20,          // Max pages to cache
  debug: false               // Enable debug logging
});
```

## Page Module Interface

Each page module should implement:

```javascript
var MyPage = {
  // Required: unique page identifier (matches URL path)
  id: 'trades',
  
  // Required: entities this page displays (for WebSocket invalidation)
  entities: ['trade', 'trade_allocation'],
  
  // Lifecycle: called when page becomes visible
  init: function(state) {
    // Initialize page, optionally restore state
    if (state && state.scrollY) {
      window.scrollTo(0, state.scrollY);
    }
  },
  
  // Lifecycle: called before navigating away
  destroy: function() {
    // Cleanup intervals, listeners, etc.
    // Return state to preserve in cache
    return { scrollY: window.scrollY };
  },
  
  // Lifecycle: called for targeted WebSocket updates (optional)
  update: function(entityType, entityId, data, action) {
    // Handle targeted update without full re-init
  }
};
```

## API Reference

### Registry Methods

#### `Pages.register(module)`

Register a page module.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| module | Object | Yes | Page module object with `id`, `entities`, `init`, etc. |

**Returns:** `boolean` - Success status

**Example:**
```javascript
Funky.Pages.register({
  id: 'trades',
  entities: ['trade'],
  init: function(state) { /* ... */ },
  destroy: function() { /* ... */ }
});
```

---

#### `Pages.get(pageId)`

Get a registered page module.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

**Returns:** `Object|null` - The page module or null

---

#### `Pages.has(pageId)`

Check if a page is registered.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

**Returns:** `boolean`

---

#### `Pages.isManaged(pageId)`

Check if a page is currently managed (mounted via Pages system).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

**Returns:** `boolean`

---

#### `Pages.list()`

List all registered page IDs.

**Returns:** `string[]`

---

#### `Pages.getActivePage()`

Get the currently active page ID.

**Returns:** `string|null`

---

### Lifecycle Methods

#### `Pages.mount(pageId, cachedEntry)`

Mount a page (restore from cache or initialize fresh).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |
| cachedEntry | Object | No | Cached data with `html`, `state`, `scrollY` |

**Returns:** `boolean` - Success status

**Example:**
```javascript
// Mount with cached state
var cached = Funky.Pages.cache.get('trades');
Funky.Pages.mount('trades', cached);
```

**Auto-Integrations:**

When mounting a page, `Pages.mount()` automatically integrates with other Funky components if available:

1. **PageAnimate Integration** - If `Funky.PageAnimate` is loaded:
   - Calls `PageAnimate.enter(pageElement, pageId)` to trigger entrance animations
   - Calls `PageAnimate.init(pageElement)` to initialize scroll animations

2. **SkipLink Integration** - If `Funky.SkipLink` is loaded:
   - Calls `SkipLink.refresh()` to rescan for skip targets in the new page
   - Updates skip links to match the current page structure

These integrations happen automatically after calling the page's `init()` method and restoring form state.

---

#### `Pages.unmount(pageId)`

Unmount a page (cleanup and preserve state).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

**Returns:** `Object|null` - State returned from `destroy()`

---

#### `Pages.refresh(pageId)`

Force refresh a page (invalidate cache and re-fetch from server).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

---

### Cache Methods

#### `Pages.cache.set(pageId, html, state)`

Store page HTML and state in cache.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |
| html | string | Yes | Page HTML content |
| state | Object | No | State to preserve (scrollY, etc.) |

---

#### `Pages.cache.get(pageId)`

Get cached page data.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |

**Returns:** `Object|null` - `{ html, timestamp, scrollY, state, stale }`

---

#### `Pages.cache.has(pageId)`

Check if a page is cached.

**Returns:** `boolean`

---

#### `Pages.cache.invalidate(pageId)`

Invalidate a single page's cache.

---

#### `Pages.cache.invalidateByEntity(entityType)`

Invalidate all pages that display an entity type.

**Example:**
```javascript
// Invalidate all pages showing trades
Funky.Pages.cache.invalidateByEntity('trade');
```

---

#### `Pages.cache.markStale(pageId)`

Mark a cached page as stale (will refresh on next visit).

---

#### `Pages.cache.clear()`

Clear the entire cache.

---

#### `Pages.cache.stats()`

Get cache statistics.

**Returns:** `Object` - `{ size, maxSize, pages, entityMap }`

---

### WebSocket Integration

#### `Pages.handleDataChange(entityType, entityId, action, data)`

Handle data change from WebSocket. Routes to active page's `update()` or marks cached pages stale.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| entityType | string | Yes | Entity type (e.g., 'trade', 'client') |
| entityId | string/number | Yes | Specific entity ID |
| action | string | Yes | 'create', 'update', 'delete', 'refresh' |
| data | Object | No | Data payload |

**Example:**
```javascript
// Called by WebSocket handler when data changes
Funky.Pages.handleDataChange('trade', 123, 'update', { status: 'settled' });
```

**Behavior:**
- If affected page is **active**: calls `page.update()` for targeted DOM update
- If affected page is **cached**: marks cache as stale
- If action is **refresh**: forces immediate page re-fetch

---

#### `Pages.getPagesByEntity(entityType)`

Get pages affected by an entity type.

**Returns:** `string[]` - Array of page IDs

---

### Prefetching

#### `Pages.prefetch(url)`

Prefetch a page in the background.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to prefetch |

**Example:**
```javascript
// Prefetch on hover
link.addEventListener('mouseenter', function() {
  Funky.Pages.prefetch(this.href);
});
```

---

### Form State Utilities

#### `Pages.captureFormState(containerSelector)`

Capture form state from all forms in a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| containerSelector | string | No | Container selector (default: '#spaContent') |

**Returns:** `Object` - Form states keyed by form ID

---

#### `Pages.restoreFormState(formStates, containerSelector)`

Restore form state to forms in a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| formStates | Object | Yes | Form states from `captureFormState()` |
| containerSelector | string | No | Container selector (default: '#spaContent') |

---

### Partial Re-render Utilities

#### `Pages.updateElements(selector, updateFn, options)`

Update specific elements without full re-init.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string | Yes | Elements to update |
| updateFn | Function | Yes | Function(element) to update each element |
| options.container | string | No | Container selector |

**Returns:** `number` - Elements updated

---

#### `Pages.updateTableRow(tableSelector, rowId, data, renderFn)`

Update a single table row.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableSelector | string | Yes | Table selector |
| rowId | string/number | Yes | Row ID (data-id attribute) |
| data | Object | Yes | New data for the row |
| renderFn | Function | Yes | Function(data) → row HTML |

**Returns:** `boolean` - Success

---

#### `Pages.removeTableRow(tableSelector, rowId)`

Remove a table row.

**Returns:** `boolean` - Success

---

#### `Pages.addTableRow(tableSelector, data, renderFn, options)`

Add a new row to a table.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableSelector | string | Yes | Table selector |
| data | Object | Yes | Data for new row |
| renderFn | Function | Yes | Function(data) → row HTML |
| options.prepend | boolean | No | Add to beginning (default: false) |

**Returns:** `boolean` - Success

---

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `pages:mounted` | `{ pageId, cached }` | Page was mounted |
| `pages:unmounted` | `{ pageId, state }` | Page was unmounted |

## Usage in Templates

### Standard Page Module Pattern

```html
<script>
(function() {
  'use strict';

  var TradesPage = {
    id: 'trades',
    entities: ['trade', 'trade_allocation'],
    
    // State
    table: null,

    init: function(state) {
      var self = this;
      
      this.table = new Funky.Table('#tradesTable', {
        ajaxUrl: '/api/trades'
      });
      
      if (state && state.scrollY) {
        requestAnimationFrame(function() {
          window.scrollTo(0, state.scrollY);
        });
      }
    },
    
    destroy: function() {
      if (this.table) {
        this.table.destroy();
        this.table = null;
      }
      return { scrollY: window.scrollY };
    },
    
    update: function(entityType, entityId, data, action) {
      if (this.table && entityType === 'trade') {
        this.table.ajax.reload(null, false);
      }
    }
  };

  // Register and mount
  if (window.Funky && Funky.Pages) {
    Funky.Pages.register(TradesPage);
    Funky.Pages.mount('trades');
  } else {
    TradesPage.init({});
  }
})();
</script>
```

### Important Notes

1. **Use `var` not `const/let`**: Scripts may re-execute on SPA navigation
2. **Store intervals/timeouts**: Always save references for cleanup in `destroy()`
3. **Return state from `destroy()`**: Enables scroll position and form state preservation
4. **entities array**: Critical for WebSocket invalidation targeting

## Integration with SPA

Pages integrates automatically with `Funky.SPA`:

1. **On navigate**: SPA checks `Pages.cache` first
2. **Cache hit**: Calls `Pages.mount()` with cached HTML
3. **Cache miss**: Fetches from server, then caches
4. **On leave**: SPA calls `Pages.unmount()` to cleanup

## Page ID Convention

Page IDs are derived from URL paths:

| URL Path | Page ID |
|----------|---------|
| `/` | `dashboard` |
| `/trades` | `trades` |
| `/trade_actions` | `trade_actions` |
| `/trade_actions/queue` | `trade_actions_queue` |
| `/realtime/files` | `realtime_files` |

## See Also

- [Funky.SPA](spa.md) - SPA navigation system
- [Funky.PubSub](pubsub.md) - Event system
- [Funky.PageAnimate](../components/page-animate.md) - Page animations (auto-integrated on mount)
- [Funky.SkipLink](../components/skip-link.md) - Skip links (auto-integrated on mount)
- [Phase 3B Plan](../../plan_websocket/phase-3B-page-spa-architecture.md) - Architecture details
