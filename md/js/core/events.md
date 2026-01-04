# Funky.Events

> DOM event handling and custom event emission.

## Overview

Funky.Events (`E`) provides a unified API for DOM event handling with listener tracking, one-time events, and event delegation.

## Quick Start

```javascript
// Basic event handling
E.on(element, 'click', function(e) {
    console.log('Clicked!');
});

// One-time event
E.once(element, 'load', function(e) {
    console.log('Loaded once!');
});

// Custom events
E.emit(element, 'custom.event', { data: 'value' });

// Event delegation
var cleanup = E.delegate(list, '.item', 'click', function(e) {
    console.log('Item clicked');
});

// DOM ready
E.ready(function() {
    console.log('DOM is ready');
});
```

---

## API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|--------|
| `E.on(element, event, callback, options?)` | Add event listener | `undefined` |
| `E.off(element, event, callback?, options?)` | Remove event listener(s) | `undefined` |
| `E.once(element, event, callback, options?)` | Add one-time listener | `undefined` |
| `E.emit(element, event, data?, options?)` | Emit custom event | `undefined` |
| `E.delegate(parent, selector, event, callback, options?)` | Delegated event handling | `Function` (cleanup) |
| `E.ready(callback)` | Wait for DOM ready | `undefined` |

---

## Usage Examples

### Basic Event Handling

```javascript
var button = D.one('#my-button');

// Add listener
E.on(button, 'click', function(e) {
    e.preventDefault();
    console.log('Button clicked');
});

// Remove listener
E.off(button, 'click', handler);

// Remove all click listeners
E.off(button, 'click');
```

### One-Time Events

```javascript
// Listener auto-removes after first fire
E.once(element, 'transitionend', function(e) {
    console.log('Transition complete!');
});

// Useful for initialization
E.once(document, 'DOMContentLoaded', function() {
    initializeApp();
});
```

### Custom Events

```javascript
// Emit custom event with data
E.emit(element, 'user.selected', {
    userId: 123,
    name: 'John'
});

// Listen for custom event
E.on(element, 'user.selected', function(e) {
    console.log('User:', e.detail.name);
});
```

### Event Delegation

```javascript
// Delegate clicks on list items
var cleanup = E.delegate(list, '.item', 'click', function(e) {
    // 'this' is bound to the matched element
    console.log('Clicked item:', this.textContent);
});

// Later: remove delegation
cleanup();
```

### DOM Ready

```javascript
// Wait for DOM to be ready
E.ready(function() {
    initializeApp();
});

// Works immediately if DOM already loaded
E.ready(function() {
    // This runs immediately if DOM is already ready
});
```

### Cleanup Pattern

```javascript
// Store handlers for cleanup
var handlers = {
    click: function(e) { /* ... */ },
    keydown: function(e) { /* ... */ }
};

// Add handlers
E.on(element, 'click', handlers.click);
E.on(element, 'keydown', handlers.keydown);

// Cleanup with handler reference
E.off(element, 'click', handlers.click);
E.off(element, 'keydown', handlers.keydown);

// Or remove ALL handlers for an event (no handler arg)
E.off(element, 'click');
E.off(element, 'keydown');
```

---

## Best Practices

1. **Store handlers for cleanup** when you need to remove them later:
   ```javascript
   var handler = function() { /* ... */ };
   E.on(el, 'click', handler);
   // Later:
   E.off(el, 'click', handler);
   ```

2. **Use `once()` for one-time events**:
   ```javascript
   E.once(modal, 'shown', initModalContent);
   ```

3. **Use delegation for dynamic content**:
   ```javascript
   var cleanup = E.delegate(list, '.item', 'click', handleItemClick);
   // Later when destroying:
   cleanup();
   ```

4. **Remove all handlers without reference**:
   ```javascript
   // Removes ALL click handlers from element
   E.off(element, 'click');
   ```

5. **Use E.ready() instead of DOMContentLoaded**:
   ```javascript
   E.ready(function() {
       initApp();
   });
   ```

---

## See Also

- [Funky.Dom](dom.md) - DOM manipulation
- [Funky.PubSub](pubsub.md) - Application-level messaging
- [Event Conventions](event-conventions.md) - Naming patterns
