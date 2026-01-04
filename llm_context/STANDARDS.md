# Funky Frame - Code Standards

> ES5 JavaScript requirements, module patterns, and API conventions.

## 🚨 ES5 Only - No Modern JavaScript

| Feature | ❌ Never Use | ✅ Always Use |
|---------|--------------|---------------|
| Variables | `const`, `let` | `var` |
| Functions | `() => {}` | `function() {}` |
| Strings | `` `template ${x}` `` | `'string ' + x` |
| Objects | `{ method() {} }` | `{ method: function() {} }` |
| Destructuring | `var {a, b} = obj` | `var a = obj.a; var b = obj.b;` |
| Spread | `[...arr]`, `{...obj}` | `arr.slice()`, `Object.assign({}, obj)` |
| Promises | `async/await` | `.then()/.catch()` |
| Classes | `class Foo {}` | `function Foo() {}` + prototype |

---

## IIFE Module Pattern

All components use this pattern:

```javascript
/**
 * Funky.ComponentName
 * Brief description
 */
(function(global) {
    'use strict';

    var Funky = global.Funky = global.Funky || {};
    var D = Funky.Dom;
    var E = Funky.Events;

    // Private state
    var _instances = {};
    var _defaults = {
        option1: true,
        option2: 'value'
    };

    /**
     * Constructor
     */
    function ComponentName(container, config) {
        this.container = D.one(container);
        this.config = Object.assign({}, _defaults, config);
        this.id = config.id || 'component-' + Date.now();
        
        this._init();
    }

    ComponentName.prototype._init = function() {
        this._render();
        this._bindEvents();
    };

    ComponentName.prototype._render = function() {
        // Build DOM
    };

    ComponentName.prototype._bindEvents = function() {
        // Attach event listeners
    };

    ComponentName.prototype.destroy = function() {
        // Cleanup
        delete _instances[this.id];
    };

    // Static methods
    ComponentName.init = function(container, config) {
        var instance = new ComponentName(container, config);
        _instances[instance.id] = instance;
        return instance;
    };

    ComponentName.getInstance = function(id) {
        return _instances[id] || null;
    };

    ComponentName.destroyAll = function() {
        Object.keys(_instances).forEach(function(id) {
            _instances[id].destroy();
        });
    };

    Funky.ComponentName = ComponentName;
})(window);
```

---

## Funky.Dom Patterns

Docs: [/md/js/core/dom.md](/md/js/core/dom.md)

### Selection
```javascript
var el = D.one('#selector');     // Single element (or null)
var els = D.all('.selector');    // Array of elements
```

### Creation & Chaining
```javascript
D.create('div')
    .classAdd('card', 'active')
    .attr('data-id', '123')
    .style({ padding: '10px', color: 'var(--pro-text-primary)' })
    .text('Content')
    .appendTo(container);
```

### Common Methods

| Method | Purpose |
|--------|---------|
| `.classAdd('a', 'b')` | Add classes |
| `.classRemove('a')` | Remove class |
| `.classToggle('a')` | Toggle class |
| `.classHas('a')` | Check class (returns boolean) |
| `.attr('key', 'val')` | Set attribute |
| `.attr('key')` | Get attribute |
| `.data('key', 'val')` | Set data attribute |
| `.style({ prop: val })` | Set inline styles |
| `.css('prop')` | **GET only** - returns computed style |
| `.text('content')` | Set text content |
| `.html('<b>html</b>')` | Set innerHTML |
| `.appendTo(parent)` | Append to parent |
| `.prependTo(parent)` | Prepend to parent |
| `.remove()` | Remove from DOM |
| `.on('click', fn)` | Add event listener |
| `.off('click', fn)` | Remove event listener |
| `.show()` / `.hide()` | Visibility |

### ⚠️ .css() vs .style()
```javascript
// .css() is a GETTER - returns string, breaks chain!
var color = D.one('#el').css('color');  // Returns 'rgb(0,0,0)'

// .style() is a SETTER - chainable
D.one('#el').style({ color: 'red' }).text('Hi');
```

---

## Component API Standards

Docs: [/md/js/core/component-interface.md](/md/js/core/component-interface.md)

### Required Static Methods

| Method | Purpose |
|--------|---------|
| `Component.init(container, config)` | Create and return instance |
| `Component.getInstance(id)` | Get existing instance by ID |
| `Component.destroyAll()` | Cleanup all instances |

### Required Instance Methods

| Method | Purpose |
|--------|---------|
| `instance.destroy()` | Cleanup instance, remove from registry |

### Optional Standard Methods

| Method | Purpose |
|--------|---------|
| `instance.show()` / `hide()` | Visibility control |
| `instance.enable()` / `disable()` | Interactive state |
| `instance.refresh()` | Re-render with current data |
| `instance.setData(data)` | Update data and re-render |
| `instance.getData()` | Get current data |

---

## Event Patterns

### Funky.Events (Global Event Bus)
Docs: [/md/js/core/events.md](/md/js/core/events.md)

```javascript
// Subscribe
E.on('user:login', function(userData) {
    console.log('User logged in:', userData);
});

// Publish
E.emit('user:login', { id: 1, name: 'John' });

// Unsubscribe
var unsub = E.on('event', handler);
unsub();  // Cleanup
```

### Funky.PubSub (Namespaced Channels)
Docs: [/md/js/core/pubsub.md](/md/js/core/pubsub.md)

```javascript
// Subscribe to channel
var unsub = Funky.PubSub.subscribe('orders', 'created', function(order) {
    console.log('New order:', order);
});

// Publish to channel
Funky.PubSub.publish('orders', 'created', { id: 123, total: 99.99 });

// Cleanup
unsub();
```

---

## Visibility Convention

Docs: [/md/js/core/visibility-conventions.md](/md/js/core/visibility-conventions.md)

```javascript
// Standard show/hide implementation
ComponentName.prototype.show = function() {
    this.container.style.display = '';
    this.container.setAttribute('aria-hidden', 'false');
    return this;
};

ComponentName.prototype.hide = function() {
    this.container.style.display = 'none';
    this.container.setAttribute('aria-hidden', 'true');
    return this;
};
```

---

## Cleanup Pattern

Always cleanup resources in `destroy()`:

```javascript
ComponentName.prototype.destroy = function() {
    // Remove event listeners
    if (this._clickHandler) {
        this.container.removeEventListener('click', this._clickHandler);
    }
    
    // Unsubscribe from PubSub
    if (this._unsubscribes) {
        this._unsubscribes.forEach(function(unsub) { unsub(); });
    }
    
    // Clear intervals/timeouts
    if (this._interval) {
        clearInterval(this._interval);
    }
    
    // Remove from DOM
    if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
    }
    
    // Remove from registry
    delete _instances[this.id];
};
```
