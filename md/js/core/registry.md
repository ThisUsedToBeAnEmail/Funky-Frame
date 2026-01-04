# Funky.Registry - Generic Registry Utility

A flexible registry utility for managing named collections. Provides two factory methods for different use cases:

- **ConfigRegistry** (`create()`) - For key→value mappings (sounds, configurations, widget types)
- **InstanceRegistry** (`createInstanceRegistry()`) - For component instance tracking with lifecycle management

## Overview

The Registry utility standardizes the common pattern of storing and retrieving items by name across the Funky framework. Instead of each component implementing its own `instances = {}` with custom methods, they use the shared Registry API.

## Registration

```javascript
// Registered as Funky.Registry
Funky.Registry.create('sounds', { defaults: { volume: 1.0 } });
Funky.Registry.createInstanceRegistry('Modal');
```

---

## Config Registry

For storing configuration objects, settings, or any key→value mappings.

### `Funky.Registry.create(name, options)`

Create a new config registry.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Registry name (for debugging) |
| options | object | No | Configuration options |
| options.defaults | object | No | Default properties merged into registered items |
| options.validate | function | No | Validation function `(item) => boolean` |
| options.onRegister | function | No | Called when item registered `(key, item)` |
| options.onUnregister | function | No | Called when item unregistered `(key)` |

**Returns:** `ConfigRegistry` instance

**Example:**
```javascript
var sounds = Funky.Registry.create('sounds', {
    defaults: { volume: 1.0, loop: false },
    validate: function(item) { return item.file; },
    onRegister: function(key, item) {
        console.log('Registered sound:', key);
    }
});

sounds.register('success', { file: 'success.mp3', volume: 0.6 });
sounds.register('error', { file: 'error.mp3' });

sounds.get('success');  // { file: 'success.mp3', volume: 0.6, loop: false }
sounds.list();          // ['success', 'error']
sounds.has('success');  // true
```

### ConfigRegistry Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(key, item) → boolean` | Add item to registry |
| `unregister` | `(key) → boolean` | Remove item from registry |
| `get` | `(key) → item\|null` | Get item by key |
| `has` | `(key) → boolean` | Check if key exists |
| `list` | `() → string[]` | Get all keys |
| `all` | `() → object` | Get all items as object |
| `count` | `() → number` | Get item count |
| `clear` | `() → void` | Remove all items |
| `forEach` | `(fn) → void` | Iterate items `fn(item, key)` |

---

## Instance Registry

For tracking component instances with element lookup and lifecycle management.

### `Funky.Registry.createInstanceRegistry(componentName)`

Create an instance registry for a component.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| componentName | string | Yes | Component name (for debugging/logging) |

**Returns:** `InstanceRegistry` instance

**Example:**
```javascript
var _instances = Funky.Registry.createInstanceRegistry('Modal');

// In constructor
_instances.register(this.id, this);

// Static getInstance
Modal.getInstance = function(target) {
    return _instances.getByElement(target) || _instances.get(target);
};

// In destroy
_instances.unregister(this.id);

// Global cleanup
Modal.destroyAll = function() {
    _instances.destroyAll();
};
```

### InstanceRegistry Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(id, instance) → boolean` | Register instance |
| `unregister` | `(id) → boolean` | Unregister instance |
| `get` | `(id) → instance\|null` | Get instance by ID |
| `has` | `(id) → boolean` | Check if ID exists |
| `list` | `() → string[]` | Get all IDs |
| `getAll` | `() → instance[]` | Get all instances as array |
| `count` | `() → number` | Get instance count |
| `forEach` | `(fn) → void` | Iterate instances `fn(instance, id)` |
| `getByElement` | `(el) → instance\|null` | Find instance by DOM element |
| `destroyAll` | `() → void` | Call destroy() on all instances and clear |

### Element Lookup

`getByElement(el)` searches for instances by checking these properties:
- `instance.container`
- `instance.el`
- `instance.element`

It also handles Funky.Dom wrappers automatically.

```javascript
// Find by element
var modal = _instances.getByElement(document.getElementById('myModal'));

// Works with Funky.Dom wrappers
var modal = _instances.getByElement(D.one('#myModal'));
```

---

## Migration Guide

### Before (manual instance tracking)

```javascript
var _instances = {};

function Modal(el, options) {
    this.id = 'modal-' + (++counter);
    _instances[this.id] = this;
}

Modal.prototype.destroy = function() {
    delete _instances[this.id];
};

Modal.getInstance = function(id) {
    return _instances[id];
};

Modal.destroyAll = function() {
    Object.keys(_instances).forEach(function(id) {
        if (_instances[id].destroy) {
            _instances[id].destroy();
        }
    });
};
```

### After (using InstanceRegistry)

```javascript
var _instances = Funky.Registry.createInstanceRegistry('Modal');

function Modal(el, options) {
    this.id = 'modal-' + (++counter);
    _instances.register(this.id, this);
}

Modal.prototype.destroy = function() {
    _instances.unregister(this.id);
};

Modal.getInstance = function(target) {
    return _instances.getByElement(target) || _instances.get(target);
};

Modal.destroyAll = function() {
    _instances.destroyAll();
};
```

---

## Components Using Registry

### Config Registry Users
- `Funky.Audio` - Sound configurations
- `Funky.ActionRegistry` - Action definitions (internal)

### Instance Registry Users
- `Funky.Modal`
- `Funky.Table`
- `Funky.Accordion`
- `Funky.Carousel`
- `Funky.Wizard`
- `Funky.Tabbed`
- `Funky.TreeView`
- `Funky.Sidenav`
- `Funky.DashboardGrid`
- `Funky.CardGrid`
- `Funky.MorphPanel`
- `Funky.NotificationCenter`
- `Funky.Timeline`
- `Funky.Calendar`
- `Funky.Iframe`
- `Funky.Plotly`
- And 10+ more components

---

## API Reference

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Funky.Registry.version` | string | Version number |

### Methods

| Method | Description |
|--------|-------------|
| `Funky.Registry.create(name, options)` | Create config registry |
| `Funky.Registry.createInstanceRegistry(name)` | Create instance registry |
| `Funky.Registry.get(name)` | Get registry by name |
| `Funky.Registry.list()` | List all registry names |

---

## See Also

- [namespace.md](namespace.md) - Funky namespace bootstrap (`Funky.register()`)
- [action-registry.md](../components/action-registry.md) - ActionRegistry component
