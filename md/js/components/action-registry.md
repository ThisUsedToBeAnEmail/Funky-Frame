# Funky.ActionRegistry

Factory for creating action registry instances for managing ordered collections of actions.

## Overview

`Funky.ActionRegistry` provides a reusable pattern for managing actions across multiple components (QuickNav, BulkActions, ContextMenu, etc.). Each registry instance maintains its own collection with schema defaults and lifecycle callbacks.

## Quick Start

```javascript
// Create a registry instance
var registry = Funky.ActionRegistry.init({
  schema: { icon: 'fas fa-circle', order: 50 },
  onAdd: function(action) {
    console.log('Action added:', action.id);
    renderActions();
  }
});

// Add actions
registry.add({ id: 'edit', icon: 'fas fa-edit', label: 'Edit' });
registry.add({ id: 'delete', icon: 'fas fa-trash', label: 'Delete' });

// Get sorted actions for rendering
var actions = registry.getSorted();
```

## API Reference

### Factory Methods

#### `Funky.ActionRegistry.init(options)`

Create a new registry instance (primary factory method).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| schema | Object | `{}` | Default properties for actions |
| onAdd | function | `null` | Callback when action added |
| onRemove | function | `null` | Callback when action removed |
| onUpdate | function | `null` | Callback when action updated |
| onClear | function | `null` | Callback when registry cleared |

**Returns:** `Registry` instance

#### `Funky.ActionRegistry.getInstance(id)`

Get existing instance by ID.

**Returns:** `Registry` or `undefined`

#### `Funky.ActionRegistry.destroy(id)`

Destroy instance by ID.

#### `Funky.ActionRegistry.destroyAll()`

Destroy all instances.

**Example:**
```javascript
var registry = Funky.ActionRegistry.init({
  schema: {
    icon: 'fas fa-circle',
    order: 50,
    disabled: false
  },
  onAdd: function(action) {
    PubSub.emit('menu:action:added', { id: action.id });
  },
  onRemove: function(id) {
    PubSub.emit('menu:action:removed', { id: id });
  },
  onUpdate: function(id, updates) {
    PubSub.emit('menu:action:updated', { id: id, updates: updates });
  }
});
```

---

### Instance Methods

#### `add(action)`

Add an action to the registry.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action.id | string | Yes | Unique identifier |
| action.* | any | No | Any additional properties |

**Returns:** `boolean` - Success

**Example:**
```javascript
registry.add({
  id: 'save',
  icon: 'fas fa-save',
  label: 'Save',
  order: 10,
  onClick: function() { save(); }
});
```

---

#### `remove(id)`

Remove an action by ID.

**Returns:** `boolean` - Success

```javascript
registry.remove('save');
```

---

#### `update(id, updates)`

Update action properties.

**Returns:** `boolean` - Success

```javascript
registry.update('save', { disabled: true });
```

---

#### `get(id)`

Get action by ID.

**Returns:** `Object|null`

```javascript
var action = registry.get('save');
if (action) {
  console.log(action.label);
}
```

---

#### `getAll()`

Get all actions (unfiltered, unsorted).

**Returns:** `Array`

---

#### `getSorted()`

Get visible actions sorted by `order` property.

**Returns:** `Array` - Sorted actions where `hidden !== true`

```javascript
var visibleActions = registry.getSorted();
visibleActions.forEach(function(action) {
  renderActionButton(action);
});
```

---

#### `hide(id)` / `show(id)`

Toggle action visibility without removing.

**Returns:** `boolean` - Success

```javascript
// Hide temporarily
registry.hide('delete');

// Show again
registry.show('delete');
```

---

#### `has(id)`

Check if action exists.

**Returns:** `boolean`

---

#### `count()`

Get total action count.

**Returns:** `number`

---

#### `clear()`

Remove all actions.

```javascript
registry.clear();
```

---

## Default Schema

Actions are merged with these defaults (plus any custom schema):

```javascript
{
  icon: 'fas fa-circle',
  label: '',
  order: 50,
  hidden: false,
  disabled: false,
  className: ''
}
```

## Usage Patterns

### Component Integration

```javascript
// In component initialization
function MyComponent() {
  var self = this;
  
  this.actionRegistry = Funky.ActionRegistry.init({
    schema: {
      icon: 'fas fa-circle',
      order: 50,
      disabled: false
    },
    onAdd: function(action) {
      self._renderActions();
    },
    onRemove: function(id) {
      self._renderActions();
    },
    onUpdate: function(id, updates) {
      self._renderActions();
    }
  });
}

MyComponent.prototype.addAction = function(config) {
  this.actionRegistry.add(config);
  return this;
};

MyComponent.prototype._renderActions = function() {
  var actions = this.actionRegistry.getSorted();
  // Render UI...
};
```

### Context Menu Actions

```javascript
var contextRegistry = Funky.ActionRegistry.init({
  schema: {
    icon: 'fas fa-circle',
    shortcut: null,
    dividerAfter: false
  }
});

contextRegistry.add({
  id: 'cut',
  icon: 'fas fa-cut',
  label: 'Cut',
  shortcut: 'Ctrl+X',
  order: 10
});

contextRegistry.add({
  id: 'copy',
  icon: 'fas fa-copy',
  label: 'Copy',
  shortcut: 'Ctrl+C',
  order: 20
});

contextRegistry.add({
  id: 'paste',
  icon: 'fas fa-paste',
  label: 'Paste',
  shortcut: 'Ctrl+V',
  order: 30,
  dividerAfter: true
});
```

### Conditional Actions

```javascript
// Show/hide based on selection
function updateActions(selectedItems) {
  if (selectedItems.length === 0) {
    registry.hide('delete');
    registry.hide('edit');
  } else if (selectedItems.length === 1) {
    registry.show('delete');
    registry.show('edit');
  } else {
    registry.show('delete');
    registry.hide('edit'); // Can't edit multiple
  }
}
```

### Dynamic Ordering

```javascript
// Insert action between existing ones
registry.add({ id: 'first', order: 10 });
registry.add({ id: 'third', order: 30 });
registry.add({ id: 'second', order: 20 }); // Will sort between

// getSorted() returns: [first, second, third]
```

## Type Checking

```javascript
// Check if object is a Registry instance
if (myObj instanceof Funky.ActionRegistry.Registry) {
  // It's a registry instance
}
```

## File Location

`/public/assets/js/components/action-registry.js`

## See Also

- [Funky.QuickNav](quick-nav.md) - Uses ActionRegistry for navigation actions
