# Funky.PubSub

> Application-level publish/subscribe messaging system.

## Overview

Funky.PubSub provides decoupled communication between components without requiring direct references. Unlike `Funky.Events` which works with DOM elements, PubSub is for application-level messaging.

## Naming Convention

PubSub topics use **colon notation** with `funky:` prefix:

```javascript
// ✅ Correct - colon notation
'funky:trade:created'
'funky:user:loaded'
'funky:cache:cleared'

// ❌ Wrong - dot notation (use for DOM events with E)
'funky.trade.created'
```

---

## Quick Start

```javascript
// Subscribe to a topic
Funky.PubSub.on('funky:user:loaded', function(user) {
    console.log('User loaded:', user.name);
});

// Publish to a topic
Funky.PubSub.emit('funky:user:loaded', { id: 1, name: 'John' });

// One-time subscription
Funky.PubSub.once('funky:app:ready', function() {
    console.log('App initialized!');
});
```

---

## API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `PubSub.on(topic, callback)` | Subscribe to topic | `Function` (unsubscribe) |
| `PubSub.off(topic, callback?)` | Unsubscribe from topic | `undefined` |
| `PubSub.once(topic, callback)` | One-time subscription | `Function` (unsubscribe) |
| `PubSub.emit(topic, data?)` | Publish to topic | `undefined` |

### Utility Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `PubSub.has(topic)` | Check if topic has subscribers | `boolean` |
| `PubSub.hasListeners(topic)` | Alias for `has()` | `boolean` |
| `PubSub.subscribers(topic)` | Get subscriber count | `number` |
| `PubSub.listenerCount(topic)` | Alias for `subscribers()` | `number` |
| `PubSub.eventNames()` | Get all registered topic names | `string[]` |
| `PubSub.clear(topic?)` | Remove subscribers | `PubSub` (chainable) |

### Namespacing

| Method | Description | Returns |
|--------|-------------|---------|
| `PubSub.namespace(ns)` | Create namespaced channel | `Object` |

---

## Usage Examples

### Basic Subscription

```javascript
// Subscribe
Funky.PubSub.on('funky:trade:created', function(trade) {
    console.log('New trade:', trade.symbol);
});

// Publish
Funky.PubSub.emit('funky:trade:created', {
    id: 123,
    symbol: 'AAPL',
    quantity: 100
});
```

### One-Time Subscription

```javascript
// Auto-removes after first fire
Funky.PubSub.once('funky:user:loaded', function(user) {
    initializeUserUI(user);
});

// Useful for initialization
Funky.PubSub.once('funky:app:ready', function() {
    startApplication();
});
```

### Removing Subscribers

```javascript
// Store handler reference for removal
var handler = function(data) {
    console.log('Trade updated:', data);
};

Funky.PubSub.on('funky:trade:updated', handler);

// Later: remove specific handler
Funky.PubSub.off('funky:trade:updated', handler);

// Or remove all handlers for topic
Funky.PubSub.off('funky:trade:updated');
```

### Checking Subscribers

```javascript
// Check if anyone is listening
if (Funky.PubSub.has('funky:cache:cleared')) {
    console.log('Something is listening for cache clear');
}

// Get subscriber count
var count = Funky.PubSub.subscribers('funky:trade:created');
console.log('Trade subscribers:', count);
```

### Clearing Subscribers

```javascript
// Clear specific topic
Funky.PubSub.clear('funky:trade:created');

// Clear ALL subscribers (use with caution!)
Funky.PubSub.clear();
```

### Namespaced Channels

```javascript
// Create module-scoped pub/sub
var tradeEvents = Funky.PubSub.namespace('funky:trade');

// Subscribe (actually subscribes to 'funky:trade:created')
tradeEvents.on('created', function(trade) {
    console.log('Trade created:', trade);
});

tradeEvents.on('updated', function(trade) {
    console.log('Trade updated:', trade);
});

tradeEvents.on('deleted', function(id) {
    console.log('Trade deleted:', id);
});

// Emit within namespace
tradeEvents.emit('created', { id: 123, symbol: 'AAPL' });

// Check subscribers
if (tradeEvents.has('created')) {
    console.log('Has trade created listeners');
}

// Clear all trade events
tradeEvents.clear();
```

---

## Namespace Object API

When you call `Funky.PubSub.namespace(ns)`, you get an object with these methods:

| Method | Description |
|--------|-------------|
| `.on(topic, callback)` | Subscribe to namespaced topic |
| `.once(topic, callback)` | One-time namespaced subscription |
| `.off(topic, callback?)` | Unsubscribe from namespaced topic |
| `.emit(topic, data?)` | Publish to namespaced topic |
| `.has(topic)` | Check for namespaced subscribers |
| `.subscribers(topic)` | Count namespaced subscribers |
| `.clear()` | Clear all topics in namespace |

All topics are automatically prefixed with `{namespace}:` - e.g., `funky:trade:created`.

---

## Common Patterns

### Module Communication

```javascript
// In TradeModule
Funky.PubSub.emit('funky:trade:created', tradeData);

// In NotificationModule (no direct reference needed)
Funky.PubSub.on('funky:trade:created', function(trade) {
    showNotification('Trade created: ' + trade.symbol);
});

// In AuditModule
Funky.PubSub.on('funky:trade:created', function(trade) {
    logAuditEvent('trade_created', trade);
});
```

### Cleanup Pattern

```javascript
// Store handlers for cleanup
var handlers = {
    onTradeCreated: function(trade) { /* ... */ },
    onTradeUpdated: function(trade) { /* ... */ }
};

// Subscribe
Funky.PubSub.on('funky:trade:created', handlers.onTradeCreated);
Funky.PubSub.on('funky:trade:updated', handlers.onTradeUpdated);

// Cleanup
function destroy() {
    Funky.PubSub.off('funky:trade:created', handlers.onTradeCreated);
    Funky.PubSub.off('funky:trade:updated', handlers.onTradeUpdated);
}
```

### Conditional Publishing

```javascript
// Only emit if someone is listening
if (Funky.PubSub.has('funky:expensive:operation')) {
    var result = performExpensiveOperation();
    Funky.PubSub.emit('funky:expensive:operation', result);
}
```

---

## Events vs PubSub

| Aspect | Funky.Events (`E`) | Funky.PubSub |
|--------|-------------------|--------------|
| **Scope** | DOM element | Application |
| **Notation** | Dots (`.`) | Colons (`:`) |
| **Prefix** | `funky.` | `funky:` |
| **Element Required** | Yes | No |
| **Use Case** | UI events | App messaging |

```javascript
// DOM Events (E) - requires element
E.on(element, 'funky.modal.opened', handler);

// PubSub - no element
Funky.PubSub.on('funky:user:loaded', handler);
```

---

## Best Practices

1. **Use consistent topic naming**:
   ```javascript
   // Pattern: funky:{module}:{action}
   'funky:trade:created'
   'funky:user:logout'
   'funky:cache:invalidated'
   ```

2. **Store handlers for removal**:
   ```javascript
   var handler = function() { /* ... */ };
   Funky.PubSub.on('topic', handler);
   // Later: Funky.PubSub.off('topic', handler);
   ```

3. **Use namespaces for modules**:
   ```javascript
   var events = Funky.PubSub.namespace('funky:mymodule');
   events.on('action', handler);
   ```

4. **Use `once()` for one-time events**:
   ```javascript
   Funky.PubSub.once('funky:app:initialized', startApp);
   ```

5. **Check before heavy operations**:
   ```javascript
   if (Funky.PubSub.has('funky:data:ready')) {
       Funky.PubSub.emit('funky:data:ready', expensiveData);
   }
   ```

---

## See Also

- [Funky.Events](events.md) - DOM event handling
- [Event Conventions](event-conventions.md) - Naming patterns
- [ServiceWorker](service-worker.md) - Uses PubSub for SW events
