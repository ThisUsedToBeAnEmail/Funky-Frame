# Funky.Storage - Local Storage Management

Centralized localStorage management with automatic JSON serialization and namespaced keys.

## Overview

`Funky.Storage` provides a simple interface for storing and retrieving data from localStorage. All keys are automatically prefixed with `funky_` to avoid collisions with other applications.

## API Reference

### Methods

#### `Storage.get(key, defaultValue)`

Get value from localStorage with automatic JSON parsing.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |
| defaultValue | any | No | Default value if key not found |

**Returns:** `any` - Stored value or default

**Example:**
```javascript
var theme = Funky.Storage.get('theme', 'dark');
var prefs = Funky.Storage.get('user_preferences', {});
```

---

#### `Storage.getRaw(key, defaultValue)`

Get raw string value without JSON parsing.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |
| defaultValue | string | No | Default value if key not found |

**Returns:** `string` - Stored value or default

**Example:**
```javascript
var token = Funky.Storage.getRaw('auth_token', '');
```

---

#### `Storage.set(key, value)`

Set value in localStorage with automatic JSON serialization.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |
| value | any | Yes | Value to store (will be JSON serialized) |

**Returns:** `boolean` - Success status

**Example:**
```javascript
Funky.Storage.set('theme', 'dark');
Funky.Storage.set('user_preferences', { fontSize: 14, sidebar: 'collapsed' });
```

---

#### `Storage.setRaw(key, value)`

Set raw string value without JSON serialization.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |
| value | string | Yes | Value to store |

**Returns:** `boolean` - Success status

---

#### `Storage.remove(key)`

Remove value from localStorage.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |

**Example:**
```javascript
Funky.Storage.remove('temp_data');
```

---

#### `Storage.has(key)`

Check if a key exists in localStorage.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Storage key (without prefix) |

**Returns:** `boolean` - True if key exists

**Example:**
```javascript
if (Funky.Storage.has('user_preferences')) {
    var prefs = Funky.Storage.get('user_preferences');
}
```

---

#### `Storage.clear(subPrefix)`

Clear storage keys with optional prefix filter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| subPrefix | string | No | Optional sub-prefix to filter (e.g., 'prefs_') |

**Example:**
```javascript
// Clear all funky_ keys
Funky.Storage.clear();

// Clear only funky_prefs_* keys
Funky.Storage.clear('prefs_');
```

---

#### `Storage.keys(subPrefix)`

Get all keys with optional prefix filter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| subPrefix | string | No | Optional sub-prefix to filter |

**Returns:** `string[]` - Array of keys (without funky_ prefix)

**Example:**
```javascript
var allKeys = Funky.Storage.keys();
var prefKeys = Funky.Storage.keys('prefs_');
```

## Key Namespacing

All keys are automatically prefixed with `funky_`:

| Your Key | Actual Key in localStorage |
|----------|---------------------------|
| `theme` | `funky_theme` |
| `user_preferences` | `funky_user_preferences` |
| `prefs_sidebar` | `funky_prefs_sidebar` |

## Error Handling

All methods catch and log errors (e.g., quota exceeded, private browsing mode). Failed operations return gracefully:

- `get()` returns `defaultValue`
- `set()` returns `false`
- Other methods complete silently

## Dependencies

None - this is a core module.

## Examples

### Theme Persistence

```javascript
// Save theme
function setTheme(theme) {
  Funky.Storage.set('theme', theme);
  document.documentElement.dataset.theme = theme;
}

// Load theme on page load
var savedTheme = Funky.Storage.get('theme', 'dark');
document.documentElement.dataset.theme = savedTheme;
```

### User Preferences

```javascript
// Load preferences
var prefs = Funky.Storage.get('preferences', {
  fontSize: 14,
  compactMode: false,
  notifications: true
});

// Update a preference
prefs.fontSize = 16;
Funky.Storage.set('preferences', prefs);
```

### Table Column State

```javascript
// Save column visibility
function saveColumnState(tableId, columns) {
  Funky.Storage.set('table_cols_' + tableId, columns);
}

// Load column visibility
function loadColumnState(tableId) {
  return Funky.Storage.get('table_cols_' + tableId, null);
}
```
