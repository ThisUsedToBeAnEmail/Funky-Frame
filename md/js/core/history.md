# Funky.History - LRU History Tracking

Reusable LRU (Least Recently Used) history tracking module with localStorage persistence.

## Overview

`Funky.History` provides history management for tracking recently used items across the application. It handles:

- Automatic deduplication (existing items move to front)
- Configurable maximum size with LRU eviction
- Optional localStorage persistence via Funky.Storage
- Namespace prefixing to prevent storage collisions
- Custom equality comparators for complex objects
- Batch operations for efficient updates
- Event emission for reactive UIs via Funky.PubSub
- onChange callbacks for component integration
- Instance management (get by key anywhere in app)

## Installation

History is part of Funky core and is automatically available:

```html
<script src="/assets/js/core/history.js"></script>
```

Depends on:
- `Funky.register` (registry.js)
- `Funky.Storage` (optional, for persistence)
- `Funky.PubSub` (optional, for events)

## Quick Start

```javascript
// Create a named history
var recentSearches = Funky.History.create({
    key: 'recent_searches',
    maxItems: 10
});

// Add items
recentSearches.add('user management');
recentSearches.add('dashboard settings');
recentSearches.add('user management');  // Moves to front (dedupe)

// Get all items (most recent first)
recentSearches.getAll();
// → ['user management', 'dashboard settings']

// Get same instance anywhere in the app
var same = Funky.History.get('recent_searches');
```

## API Reference

### Factory Methods

#### `Funky.History.create(options)`

Create or retrieve a history instance. If key is provided and instance exists, returns existing instance.

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options.key` | string | `null` | Storage key (required for persistence and `get()`) |
| `options.namespace` | string | `null` | Namespace prefix for storage key (prevents collisions) |
| `options.maxItems` | number | `10` | Maximum items to keep |
| `options.persist` | boolean | `true` | Persist to Funky.Storage |
| `options.dedupe` | boolean | `true` | Remove duplicates (move to front) |
| `options.emitEvents` | boolean | `true` | Emit PubSub events on changes |
| `options.comparator` | function | `null` | Custom equality: `function(a, b) => boolean` |
| `options.onChange` | function | `null` | Callback on any change: `function(action, data)` |

**Returns:** `HistoryInstance`

**Example:**

```javascript
// Basic usage
var history = Funky.History.create({
    key: 'palette_recent',
    maxItems: 5,
    persist: true
});

// With namespace (stored as 'myapp:palette_recent')
var history = Funky.History.create({
    key: 'palette_recent',
    namespace: 'myapp',
    maxItems: 5
});

// With custom comparator (for object items)
var history = Funky.History.create({
    key: 'recent_users',
    comparator: function(a, b) {
        return a.id === b.id;
    }
});

// With onChange callback
var history = Funky.History.create({
    key: 'search_history',
    onChange: function(action, data) {
        console.log('History changed:', action, data);
        updateUI();
    }
});
```

---

#### `Funky.History.get(key)`

Get an existing history instance by key.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `key` | string | The storage key used in `create()` |

**Returns:** `HistoryInstance | null`

**Example:**

```javascript
// In another file/component
var history = Funky.History.get('palette_recent');
if (history) {
    var recent = history.getAll();
}
```

---

#### `Funky.History.has(key)`

Check if an instance exists for the given key.

**Returns:** `boolean`

---

#### `Funky.History.destroy(key)`

Destroy an instance by key.

---

#### `Funky.History.destroyAll()`

Destroy all instances.

---

#### `Funky.History.keys()`

Get all registered instance keys.

**Returns:** `Array<string>`

---

### Instance Methods

#### `add(item, options)`

Add an item to history. If the item exists and `dedupe` is enabled, it moves to the front.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | any | Item to add (typically a string ID) |
| `options.silent` | boolean | Skip event emission (default: false) |

**Returns:** `HistoryInstance` (for chaining)

**Example:**

```javascript
// Basic add
history.add('save-document');

// Chained adds
history.add('save-document').add('open-file');

// Silent add (no event emitted)
history.add('internal-action', { silent: true });
```

---

#### `addAll(items, options)`

Add multiple items. First item in array becomes most recent.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | Array | Items to add |
| `options.silent` | boolean | Skip event emission (default: false) |

**Returns:** `HistoryInstance`

**Example:**

```javascript
history.addAll(['recent1', 'recent2', 'recent3']);
// Order: ['recent1', 'recent2', 'recent3'] (recent1 is most recent)
```

---

#### `batch(fn)`

Execute multiple operations as a batch, emitting only a single event when complete. Useful for efficiency when making many changes.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fn` | function | Function containing operations (called with `this` as instance) |

**Returns:** `HistoryInstance`

**Example:**

```javascript
// Single 'batch' event instead of 3 'add' events
history.batch(function() {
    this.add('item1');
    this.add('item2');
    this.add('item3');
});
```

---

#### `remove(item)`

Remove an item from history.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | any | Item to remove |

**Returns:** `boolean` - `true` if removed, `false` if not found

---

#### `has(item)`

Check if an item exists in history.

**Returns:** `boolean`

---

#### `getAll()`

Get all items (most recent first). Returns a copy, not reference.

**Returns:** `Array`

---

#### `get(index)`

Get item at specific index.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `index` | number | Zero-based index |

**Returns:** `any`

---

#### `first()`

Get most recent item.

**Returns:** `any`

---

#### `last()`

Get oldest item.

**Returns:** `any`

---

#### `size()`

Get number of items.

**Returns:** `number`

---

#### `isEmpty()`

Check if history is empty.

**Returns:** `boolean`

---

#### `clear()`

Remove all items.

**Returns:** `HistoryInstance`

---

#### `forEach(callback)`

Iterate over items.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | function | `function(item, index)` |

---

#### `map(callback)`

Map items to new array.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | function | `function(item, index) => mappedValue` |

**Returns:** `Array`

---

#### `filter(callback)`

Filter items.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `callback` | function | `function(item, index) => boolean` |

**Returns:** `Array`

---

#### `setMaxItems(max)`

Update the maximum items limit. Trims if necessary.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `max` | number | New maximum items |

**Returns:** `HistoryInstance`

---

#### `getKey()`

Get the storage key.

**Returns:** `string | null`

---

#### `reload()`

Force reload from storage. Useful when storage may have been modified by another tab or process.

**Returns:** `HistoryInstance`

**Example:**

```javascript
// Sync with storage after potential external changes
history.reload();
```

---

#### `save()`

Force save to storage.

**Returns:** `HistoryInstance`

---

#### `destroy()`

Destroy the instance and remove from registry.

---

### Stack Methods

#### `pop()`

Remove and return the most recent item (from the front of the history).

**Returns:** `any` - The removed item, or `undefined` if empty

**Example:**

```javascript
history.add('a').add('b').add('c');
// History: ['c', 'b', 'a']

var newest = history.pop();
// newest = 'c', History: ['b', 'a']
```

---

#### `shift()`

Remove and return the oldest item (from the end of the history).

**Returns:** `any` - The removed item, or `undefined` if empty

**Example:**

```javascript
history.add('a').add('b').add('c');
// History: ['c', 'b', 'a']

var oldest = history.shift();
// oldest = 'a', History: ['c', 'b']
```

---

#### `peek()`

Return the most recent item without removing it. Alias for `first()` for stack-like semantics.

**Returns:** `any`

---

### Traversal Methods (Cursor-Based Navigation)

History includes a cursor for navigating through items without modifying the list.

#### `cursor()`

Get the current cursor position.

**Returns:** `number` - `-1` if not positioned, `0+` if positioned

---

#### `current()`

Get the item at the current cursor position.

**Returns:** `any` - Current item, or `undefined` if not positioned

---

#### `next()`

Move the cursor to the next (older) item and return it.

**Returns:** `any` - The next item, or `undefined` if at end

**Example:**

```javascript
history.add('a').add('b').add('c');
// History: ['c', 'b', 'a'], cursor: -1

history.next(); // → 'c', cursor: 0
history.next(); // → 'b', cursor: 1
history.next(); // → 'a', cursor: 2
history.next(); // → undefined (at end)
```

---

#### `prev()`

Move the cursor to the previous (newer) item and return it.

**Returns:** `any` - The previous item, or `undefined` if at start

---

#### `goto(index)`

Move the cursor to a specific index.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `index` | number | Target index (0-based) |

**Returns:** `any` - Item at index, or `undefined` if out of bounds

---

#### `resetCursor()`

Reset cursor to unpositioned state (`-1`).

**Returns:** `HistoryInstance`

---

#### `hasNext()`

Check if cursor can move to the next (older) item.

**Returns:** `boolean`

---

#### `hasPrev()`

Check if cursor can move to the previous (newer) item.

**Returns:** `boolean`

---

## Events

When `emitEvents` is enabled (default), events are emitted via `Funky.PubSub`:

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:history:add` | `{ key, item, size }` | Item added |
| `funky:history:remove` | `{ key, item, size }` | Item removed |
| `funky:history:clear` | `{ key, previousSize }` | History cleared |
| `funky:history:batch` | `{ key, items, size }` | Batch operation completed |
| `funky:history:reload` | `{ key, size }` | Reloaded from storage |
| `funky:history:pop` | `{ key, item, size }` | Item popped from front |
| `funky:history:shift` | `{ key, item, size }` | Item shifted from end |

**Example:**

```javascript
Funky.PubSub.on('funky:history:add', function(data) {
    console.log('Added to', data.key, ':', data.item);
});

Funky.PubSub.on('funky:history:batch', function(data) {
    console.log('Batch added', data.items.length, 'items');
});
```

## onChange Callback

For component-level integration without global PubSub subscription, use the `onChange` option:

```javascript
var history = Funky.History.create({
    key: 'my_history',
    onChange: function(action, data) {
        // action: 'add', 'remove', 'clear', 'batch', 'reload'
        // data: { key, item?, size, items?, previousSize? }
        
        switch (action) {
            case 'add':
                renderHistoryList();
                break;
            case 'clear':
                showEmptyState();
                break;
        }
    }
});
```

## Namespace Option

Use namespaces to prevent storage key collisions between different features or applications:

```javascript
// User A's recent searches (stored as 'user_123:recent_searches')
var userSearches = Funky.History.create({
    key: 'recent_searches',
    namespace: 'user_123'
});

// App-level recent searches (stored as 'app:recent_searches')
var appSearches = Funky.History.create({
    key: 'recent_searches',
    namespace: 'app'
});
```

## Custom Comparator

For histories containing objects, provide a custom comparator for deduplication:

```javascript
var recentUsers = Funky.History.create({
    key: 'recent_users',
    comparator: function(a, b) {
        // Compare by ID property
        return a.id === b.id;
    }
});

recentUsers.add({ id: 1, name: 'Alice' });
recentUsers.add({ id: 2, name: 'Bob' });
recentUsers.add({ id: 1, name: 'Alice Updated' }); // Moves to front, replaces old

recentUsers.getAll();
// → [{ id: 1, name: 'Alice Updated' }, { id: 2, name: 'Bob' }]
```

## Use Cases

### Recent Commands (Command Palette)

```javascript
var recentCommands = Funky.History.create({
    key: 'palette_recent',
    maxItems: 5
});

// When command executed
function executeCommand(command) {
    recentCommands.add(command.id);
    command.execute();
}

// Get recent for display
function getRecentCommands() {
    return recentCommands.map(function(id) {
        return findCommandById(id);
    }).filter(Boolean);
}
```

### Navigation History

```javascript
var navHistory = Funky.History.create({
    key: 'nav_history',
    namespace: 'spa',
    maxItems: 20
});

// On page navigation
Funky.PubSub.on('funky:page:loaded', function(data) {
    navHistory.add(data.url);
});

// Show recent pages
function showRecentPages() {
    return navHistory.getAll().map(function(url) {
        return { url: url, title: getPageTitle(url) };
    });
}
```

### Search History (No Persistence)

```javascript
var searchHistory = Funky.History.create({
    key: 'search_session',
    maxItems: 10,
    persist: false  // Clear on page reload
});

searchHistory.add(query);
```

### Recently Viewed Entities

```javascript
var recentTrades = Funky.History.create({
    key: 'recent_trades',
    namespace: 'trading',
    maxItems: 10,
    onChange: function(action, data) {
        if (action === 'add') {
            updateRecentTradesWidget();
        }
    }
});

// When viewing a trade
function viewTrade(tradeId) {
    recentTrades.add(tradeId);
    // Load trade...
}
```

### Batch Import

```javascript
// Import saved history efficiently
var history = Funky.History.create({ key: 'imported_history' });

history.batch(function() {
    savedItems.forEach(function(item) {
        this.add(item);
    }, this);
});
// Only one 'batch' event emitted
```

## Best Practices

### Store IDs, Not Objects

```javascript
// ✅ Good - store IDs
history.add(trade.id);

// ❌ Bad - store full objects (wastes localStorage)
history.add(trade);
```

### Use Descriptive Keys

```javascript
// ✅ Good
Funky.History.create({ key: 'palette_recent_commands' });
Funky.History.create({ key: 'trade_search_history' });

// ❌ Bad
Funky.History.create({ key: 'history1' });
```

### Use Namespaces for Multi-User/Multi-Feature

```javascript
// ✅ Good - namespaced by user
Funky.History.create({
    key: 'recent_trades',
    namespace: 'user_' + userId
});

// ✅ Good - namespaced by feature
Funky.History.create({
    key: 'recent_items',
    namespace: 'trade_blotter'
});
```

### Use Batch for Bulk Operations

```javascript
// ✅ Good - single event
history.batch(function() {
    items.forEach(function(item) { this.add(item); }, this);
});

// ❌ Bad - many events
items.forEach(function(item) { history.add(item); });
```

### Clean Up on Logout

```javascript
function logout() {
    Funky.History.destroyAll();
    Funky.Storage.clear();
}
```

## Accessibility

History is a data module without visual output. When building UI that displays history:

- Use semantic lists (`<ul>`, `<ol>`) for history items
- Add `aria-label="History list"` or similar
- Support keyboard navigation (Arrow keys, Enter to select)
- Announce changes with `Funky.A11y.announce()` for screen readers
- Provide clear "Remove" and "Clear all" actions with `aria-label`

## Browser Support

Works in all browsers that support ES5 and localStorage:
- Chrome 23+
- Firefox 21+
- Safari 6+
- Edge 12+
- IE 10+

## Related

- [Funky.Storage](./storage.md) - Low-level storage wrapper
- [Funky.PubSub](./pubsub.md) - Event system
- [Funky.FuzzySearch](./fuzzy-search.md) - Often paired with History for searchable recent items
