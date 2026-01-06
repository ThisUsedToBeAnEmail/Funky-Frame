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

## Component Patterns

Four distinct patterns exist across the 84+ components. Choose based on use case:

| Pattern | Count | When to Use | Examples |
|---------|-------|-------------|----------|
| **A: Singleton** | ~35-40 | Utilities, no instances needed | Badge, Toast, Skeleton, Spinner |
| **B: Registry** | ~15-20 | Multiple instances, lifecycle management | SideNavPanel, FormModal, Accordion |
| **C: DOM-Attached** | ~12-15 | Instance per DOM element | ActionBar, Clock |
| **D: Event-Based** | ~2-3 | Trigger/handler registration | ZeroClick |

---

### Pattern A: Singleton (Utilities)

For stateless utilities with no instance management:

```javascript
(function(window) {
    'use strict';

    var Badge = {
        add: function(el, text, type) {
            // Static method - no instance created
        },
        remove: function(el) {
            // Static method
        }
    };

    Funky.register('Badge', Badge);
})(window);
```

**Use when:** Component provides utility methods, no state tracking needed.

---

### Pattern B: Registry (Multiple Instances)

For components needing multiple instances with lifecycle management. **Use `Funky.Registry.createInstanceRegistry()`**:

```javascript
(function(window) {
    'use strict';

    var _instanceCounter = 0;
    var _instances = Funky.Registry.createInstanceRegistry('SideNavPanel');

    function SideNavPanel(config) {
        this.config = Object.assign({}, config);
        this._init();
    }

    SideNavPanel.prototype._init = function() {
        // Initialization
    };

    SideNavPanel.prototype.destroy = function() {
        // Cleanup
        _instances.unregister(this.id);
    };

    // Static factory method
    SideNavPanel.init = function(config) {
        var instance = new SideNavPanel(config);
        instance.id = 'sidenav-panel-' + (++_instanceCounter);
        _instances.register(instance.id, instance);
        return instance;
    };

    SideNavPanel.getInstance = function(id) {
        return _instances.get(id);
    };

    SideNavPanel.destroyAll = function() {
        _instances.destroyAll();
    };

    Funky.register('SideNavPanel', SideNavPanel);
})(window);
```

**Use when:** Need multiple independent instances, SPA cleanup, instance lookup by ID.

---

### Pattern C: DOM-Attached (Per-Element)

For components that attach to specific DOM elements:

```javascript
(function(window) {
    'use strict';

    var instances = [];

    function ActionBar(el) {
        this.el = el;
        this._init();
    }

    ActionBar.prototype._init = function() {
        // Initialization
    };

    ActionBar.prototype.destroy = function() {
        var idx = instances.indexOf(this);
        if (idx > -1) instances.splice(idx, 1);
    };

    ActionBar.init = function(selector) {
        var els = document.querySelectorAll(selector);
        els.forEach(function(el) {
            if (!el._actionBar) {
                var instance = new ActionBar(el);
                el._actionBar = instance;
                instances.push(instance);
            }
        });
    };

    ActionBar.destroyAll = function() {
        instances.slice().forEach(function(i) { i.destroy(); });
    };

    Funky.register('ActionBar', ActionBar);
})(window);
```

**Use when:** One instance per DOM element, auto-init from selectors.

---

## Component API Standards

Docs: [/md/js/core/component-interface.md](/md/js/core/component-interface.md)

### Required Static Methods (Pattern B & C)

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

Two event systems exist - use the right one:

| System | Purpose | Naming Convention |
|--------|---------|-------------------|
| **Funky.Events** | DOM event utilities | Dot notation: `'funky.modal.opened'` |
| **Funky.PubSub** | App-level messaging | Colon notation: `'funky:trade:created'` |

---

### Funky.Events (DOM Events)
Docs: [/md/js/core/events.md](/md/js/core/events.md)

```javascript
var E = Funky.Events;

// Add listener
E.on(element, 'click', handler);

// Remove listener (with or without handler reference)
E.off(element, 'click', handler);  // Specific handler
E.off(element, 'click');           // All handlers for event

// One-time listener
E.once(element, 'click', handler);

// Dispatch custom event
E.emit(element, 'funky.modal.opened', { data: 123 });

// Event delegation (returns cleanup function)
var cleanup = E.delegate(parent, '.child-selector', 'click', function(e) {
    // 'this' is the matched child element
});
cleanup();  // Remove delegated listener

// DOM ready
E.ready(function() {
    // DOM is loaded
});
```

### Funky.PubSub (App Messaging)
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
