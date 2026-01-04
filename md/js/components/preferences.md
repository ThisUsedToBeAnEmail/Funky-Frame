# Funky.Preferences - User Preferences Management

Handles loading, saving, and applying user preferences for themes, notifications, display settings, and more.

## Overview

`Funky.Preferences` manages user preferences with server persistence and local caching. Preferences cover themes, notifications, display settings, dashboard layout, and table configurations.

## API Reference

### Methods

#### `Preferences.setEndpoint(endpoint)`

Set a custom API endpoint for preferences. Useful for sandbox/playground environments.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| endpoint | string | Yes | The API endpoint base URL |

**Example:**
```javascript
// Use mock endpoint for playground
Funky.Preferences.setEndpoint('/api/playground/preferences');
```

---

#### `Preferences.getEndpoint()`

Get the current API endpoint.

**Returns:** `string` - The current endpoint URL

**Example:**
```javascript
console.log(Funky.Preferences.getEndpoint());
// '/api/users/preferences' (default)
```

---

#### `Preferences.load(forceRefresh)`

Load preferences from server.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| forceRefresh | boolean | No | Force fresh fetch (bypass cache) |

**Returns:** `Promise<Object>` - The preferences object

**Example:**
```javascript
const prefs = await Funky.Preferences.load();
console.log('Theme:', prefs.theme.mode);
```

---

#### `Preferences.get(path, defaultValue)`

Get a preference value by path.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | string | Yes | Dot-notation path (e.g., 'theme.mode') |
| defaultValue | any | No | Default if not found |

**Returns:** `any` - Preference value

**Example:**
```javascript
const theme = Funky.Preferences.get('theme.mode', 'dark');
const fontSize = Funky.Preferences.get('display.font_size', 14);
```

---

#### `Preferences.set(path, value)`

Set a preference value locally (not persisted).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| path | string | Yes | Dot-notation path |
| value | any | Yes | Value to set |

**Example:**
```javascript
Funky.Preferences.set('theme.mode', 'light');
```

---

#### `Preferences.save(section, data)`

Save preferences to server.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| section | string | Yes | Preference section (e.g., 'theme', 'display') |
| data | object | Yes | Preference data for that section |

**Returns:** `Promise<Object>` - API response

**Example:**
```javascript
await Funky.Preferences.save('theme', {
  mode: 'dark',
  accent_color: '#ff6600',
  nav_position: 'left'
});
```

---

#### `Preferences.apply()`

Apply current preferences to the UI.

**Example:**
```javascript
await Funky.Preferences.load();
Funky.Preferences.apply();
```

---

#### `Preferences.reset(section)`

Reset preferences to defaults.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| section | string | No | Section to reset (all if omitted) |

**Returns:** `Promise<void>`

---

#### `Preferences.onChange(callback)`

Register callback for preference changes.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| callback | function | Yes | Called with `(path, newValue, oldValue)` |

**Returns:** `function` - Unsubscribe function

---

## Component Binding

`Funky.Preferences.bind()` provides encapsulated preference integration for components, handling load, save, and cross-tab synchronization automatically.

### `Preferences.bind(options)`

Create a preference binding for a component.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| key | string | Yes | Preference namespace key (e.g., 'quicknav') |
| persist | string[] | No | Settings to persist (filters getState output) |
| getState | function | Yes | Returns current component state to save |
| applyState | function | Yes | Applies loaded state to component |
| onLoad | string | No | PubSub event to emit when loaded |
| onSave | string | No | PubSub event to emit when saved |
| onClear | string | No | PubSub event to emit when cleared |

**Returns:** `Object` - Binding object with `save()`, `load()`, `clear()`, `get()`, `shouldPersist()`, `destroy()`

**Example:**
```javascript
// In component init
var prefsBinding = Funky.Preferences.bind({
  key: 'quicknav',
  persist: ['position', 'collapsed'],
  getState: function() {
    return {
      position: config.position,
      collapsed: config.collapsed
    };
  },
  applyState: function(saved) {
    if (saved.position) setPosition(saved.position);
    if (saved.collapsed !== undefined) config.collapsed = saved.collapsed;
  },
  onLoad: 'funky:quicknav:preferences:loaded',
  onSave: 'funky:quicknav:preferences:saved'
});

// Save current state
prefsBinding.save();

// Check if setting should persist
if (prefsBinding.shouldPersist('position')) {
  prefsBinding.save();
}

// Get current filtered preferences
var prefs = prefsBinding.get();

// Clear saved preferences
prefsBinding.clear();

// In component destroy
prefsBinding.destroy();
```

### Binding Object API

| Method | Description |
|--------|-------------|
| `save()` | Save current state (filtered by persist array) |
| `load()` | Load and apply saved preferences |
| `clear()` | Clear saved preferences |
| `get()` | Get current preferences (filtered) |
| `shouldPersist(key)` | Check if a setting should be persisted |
| `destroy()` | Cleanup binding (remove event listeners) |

### Cross-Tab Sync

Bindings automatically listen for `funky:preferences:changed` PubSub events, reloading preferences when changed from other tabs/windows.

### Graceful Degradation

If `Funky.Preferences` or `bind()` is not available, the component should handle this gracefully:

```javascript
var prefsBinding = null;

function initPreferences() {
  if (!Funky.Preferences || !Funky.Preferences.bind) return;
  
  prefsBinding = Funky.Preferences.bind({ /* options */ });
}

function saveIfEnabled() {
  if (prefsBinding) prefsBinding.save();
}
```

---

### Preference Sections

#### Theme

```javascript
{
  mode: 'dark',              // 'dark', 'light', 'even-funkyer', 'high-contrast'
  accent_color: '#0d6efd',   // Primary accent color
  nav_position: 'left',      // 'left', 'right', 'top', 'bottom'
  font_scale: 1.0,           // Font size multiplier
  density: 'comfortable',    // 'compact', 'comfortable', 'spacious'
  focusStyle: 'default',     // 'default', 'double-ring', 'high-contrast', 'white-offset'
  animations_enabled: true,
  sidebar_collapsed: false
}
```

#### Notifications

```javascript
{
  email_enabled: true,
  push_enabled: true,
  trade_alerts: true,
  system_alerts: true
}
```

#### Display

```javascript
{
  items_per_page: 25,
  date_format: 'YYYY-MM-DD',
  time_format: 'HH:mm:ss',
  timezone: 'UTC'
}
```

#### Dashboard

```javascript
{
  layout: 'default',
  visible_widgets: ['trades', 'actions', 'stats']
}
```

#### Tables

```javascript
{
  column_visibility: { trades: ['id', 'trade_ref', ...] },
  column_order: { trades: [0, 1, 2, ...] },
  default_sort: { trades: { column: 0, direction: 'desc' } }
}
```

## Dependencies

- `Funky.Api` - For server communication
- `Funky.Storage` - For local caching
- `Funky.PubSub` - For change notifications

## Examples

### Apply Theme on Load

```javascript
document.addEventListener('DOMContentLoaded', async function() {
  await Funky.Preferences.load();
  Funky.Preferences.apply();
});
```

### Theme Switcher

```javascript
$('#themeSwitcher').on('change', async function() {
  const theme = this.value;
  
  await Funky.Preferences.save('theme', { mode: theme });
  Funky.Preferences.apply();
  
  Funky.Toast.success('Theme updated');
});
```

### Watch for Changes

```javascript
Funky.Preferences.onChange(function(path, newVal, oldVal) {
  if (path === 'theme.mode') {
    console.log('Theme changed from', oldVal, 'to', newVal);
    updateThemeUI(newVal);
  }
});
```

### Playground / Sandbox Usage

Use the mock endpoint for demo environments where you don't want to persist to the database:

```javascript
// Switch to playground mock API (in-memory, not persisted)
Funky.Preferences.setEndpoint('/api/playground/preferences');

// Now all operations use the mock endpoint
await Funky.Preferences.load();
await Funky.Preferences.save('theme', { mode: 'dark' });

// Check current endpoint
console.log(Funky.Preferences.getEndpoint());
// '/api/playground/preferences'
```

The playground preferences endpoint supports the same API structure but stores data in memory only.

---

## Focus Style Preference

Users can customize how keyboard focus indicators appear throughout the application. This improves accessibility for users who have difficulty seeing the default blue focus outline, especially on blue buttons.

### Available Focus Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `default` | Blue outline matching accent color | General use |
| `double-ring` | White inner + dark outer ring | Any background color |
| `high-contrast` | Bright yellow 3px outline | Maximum visibility |
| `white-offset` | White outline with offset gap | Dark themes |

### Setting Focus Style

```javascript
// Via Preferences API
Funky.Preferences.set('theme.focusStyle', 'double-ring');
await Funky.Preferences.save('theme', { focusStyle: 'double-ring' });

// Via PlaygroundPreferences (for playground/demos)
Funky.PlaygroundPreferences.set('focusStyle', 'high-contrast');
```

### CSS Variables

The focus style system uses these CSS custom properties (defined in themes.css):

| Variable | Description |
|----------|-------------|
| `--focus-ring-color` | Color of the focus outline |
| `--focus-ring-width` | Width of the outline (default: 2px) |
| `--focus-ring-style` | Style of outline (solid) |
| `--focus-ring-offset` | Offset from element (outset elements) |
| `--focus-ring-offset-inset` | Offset for inset elements (negative) |
| `--focus-ring-shadow` | Additional shadow effect |
| `--focus-ring-shadow-inset` | Shadow for inset elements |

### Usage in Components

Components use the outline-first approach for WCAG compliance:

```css
/* Outset elements (buttons, inputs) */
.btn:focus-visible {
  outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  box-shadow: var(--focus-ring-shadow);
}

/* Inset elements (table rows, list items) */
.table-row:focus-visible {
  outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset-inset);
  box-shadow: var(--focus-ring-shadow-inset);
}
```

### High Contrast Theme Integration

When using the high-contrast theme, focus style defaults to bright yellow. Users can still override this with their preferred focus style.

---

## Mock API Endpoints

For playground/sandbox environments, use these public endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/playground/preferences` | GET | Get all mock preferences |
| `/api/playground/preferences` | PUT | Update preferences (bulk) |
| `/api/playground/preferences/:category` | GET | Get category preferences |
| `/api/playground/preferences/:category` | PUT | Update category preferences |

---

## Bindable Interface (LiveBinding)

Preferences supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by context ID
const instance = Funky.Preferences._instances['user_settings'];
```

### Bindable Methods

#### `setData(prefs)`

Update preferences data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| prefs | object | Preferences object to merge |

**Example:**
```javascript
const prefs = Funky.Preferences._instances['user_settings'];
prefs.setData({
  theme: { mode: 'dark', accent: 'blue' },
  notifications: { enabled: true, sound: false },
  display: { font_size: 14, compact: true }
});
```

---

#### `getData()`

Get all current preferences.

**Returns:** `Object` - Current preferences object

**Example:**
```javascript
const prefs = Funky.Preferences._instances['user_settings'];
const allPrefs = prefs.getData();
console.log(allPrefs.theme.mode);        // 'dark'
console.log(allPrefs.notifications);     // { enabled: true, sound: false }
```

### LiveBinding Integration

```javascript
// Bind preferences to an API source
Funky.LiveBinding.bind({
  source: { type: 'api', endpoint: '/api/users/preferences' },
  target: {
    type: 'component',
    component: 'Preferences',
    instance: 'user_settings'
  },
  options: {
    refreshInterval: 60000 // Sync every minute
  }
});

// Bind to state for local preference management
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'userPreferences' },
  target: {
    type: 'component',
    component: 'Preferences',
    instance: 'user_settings'
  }
});

// Update preferences reactively
Funky.LiveBinding.setState('userPreferences', {
  theme: { mode: 'light' }
});
```
