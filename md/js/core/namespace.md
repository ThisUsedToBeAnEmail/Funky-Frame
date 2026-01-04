# Funky Namespace

The foundation of the Funky framework. Creates a secure, frozen namespace where all modules are registered and protected from override attacks.

## Overview

The namespace module (`namespace.js`) creates the global `Funky` object and provides a `register()` function that locks components using `Object.defineProperty`. Once registered, components cannot be overwritten or deleted.

**This module MUST be loaded before any other Funky components.**

## File Location

`public/assets/js/funky/namespace.js`

## Registration

This is the first module loaded - it creates the `Funky` namespace itself.

```javascript
// namespace.js creates window.Funky
// All other modules call Funky.register('Name', component)
```

## API Reference

### Methods

#### `Funky.register(name, component)`

Register a component on the Funky namespace.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Component name (e.g., 'Audio', 'Toast', 'Api') |
| component | any | Yes | The component to register (object, function, class) |

**Returns:** `boolean` - True if registration successful, false if already exists

**Example:**
```javascript
var MyModule = {
  doSomething: function() { /* ... */ }
};

Funky.register('MyModule', MyModule);
// Now accessible as Funky.MyModule.doSomething()
```

---

#### `Funky.has(name)`

Check if a component is registered.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Component name to check |

**Returns:** `boolean`

**Example:**
```javascript
if (Funky.has('Toast')) {
  Funky.Toast.success('Ready!');
}
```

---

#### `Funky.isRegistered(name)`

Alias for `Funky.has()`.

---

#### `Funky.list()`

Get list of all registered component names.

**Returns:** `string[]` - Array of registered component names

**Example:**
```javascript
console.log(Funky.list());
// ['Api', 'CSRF', 'Storage', 'Toast', ...]
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `Funky.version` | string | Framework version (e.g., '1.0.0') |

## Security Features

1. **Immutable Registration**: Components are defined with `writable: false, configurable: false`
2. **Frozen Methods**: `register`, `has`, `list`, `version` are locked
3. **Re-initialization Guard**: Prevents script from running twice

## Module Pattern

All Funky modules should follow this pattern:

```javascript
(function() {
  'use strict';
  
  // Guard against re-registration
  if (Funky.has('ModuleName')) {
    console.warn('[Funky.ModuleName] Already registered');
    return;
  }
  
  // Define the module
  var ModuleName = {
    // ... implementation
  };
  
  // Register with the namespace
  Funky.register('ModuleName', ModuleName);
})();
```

## Dependencies

None - this is the foundation module.

## Related

- [registry.md](registry.md) - `Funky.Registry` utility for config and instance registries

## Examples

### Checking Framework Ready

```javascript
if (window.Funky && Funky.has('Api')) {
  // Framework is loaded and Api is available
  Funky.Api.get('/api/status');
}
```

### Listing All Modules

```javascript
console.log('Loaded modules:', Funky.list().join(', '));
// Output: Loaded modules: Api, CSRF, Storage, Toast, Table, ...
```
