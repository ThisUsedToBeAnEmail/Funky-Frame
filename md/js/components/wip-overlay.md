# Funky.WIPOverlay - Work In Progress Overlay

Simple overlay to indicate pages under development with support for multiple independent instances.

## Overview

`Funky.WIPOverlay` displays a full-page or scoped overlay for pages/sections that are still under construction, with customizable messages, progress indicators, and feature checklists. Version 2.0 introduces a registry-based API supporting multiple concurrent instances, ideal for SPA applications.

## API Reference

### Methods

#### `WIPOverlay.init(options)`

Initialize a WIP overlay instance.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Unique identifier for this instance |
| message | string | '🚧 Work In Progress 🚧' | Main message |
| subMessage | string | 'This page is under development' | Secondary message |
| showInDev | boolean | true | Show in development mode |
| allowClose | boolean | true | Allow user to close overlay |
| scopeToContainer | string | null | CSS selector to scope overlay |
| zIndex | number | 999 | Overlay z-index |
| animation | string | 'fade' | Animation: 'fade', 'slide', 'zoom', 'none' |
| showProgress | boolean | true | Show progress indicator |
| progress | number | 65 | Progress percentage (0-100) |
| estimatedCompletion | string | null | Completion date/quarter |
| contactEmail | string | null | Support email |
| showFeatures | boolean | true | Show feature checklist |
| features | array | [...] | Feature checklist items |

**Returns:** `WIPOverlayInstance` - The created instance object.

---

#### `WIPOverlay.getInstance(id)`

Get an overlay instance by ID.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `WIPOverlayInstance` or `null` if not found.

---

#### `WIPOverlay.show(id)`

Show an overlay instance. If the overlay was previously hidden/destroyed, re-creates it.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `WIPOverlay` for chaining.

---

#### `WIPOverlay.hide(id)`

Hide an overlay instance.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `WIPOverlay` for chaining.

---

#### `WIPOverlay.toggle(id)`

Toggle overlay visibility.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `WIPOverlay` for chaining.

---

#### `WIPOverlay.isShown(id)`

Check if an overlay instance is currently visible.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `boolean`

---

#### `WIPOverlay.destroy(id)`

Destroy an overlay instance and remove from registry.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| id | string | '__default__' | Instance ID |

**Returns:** `WIPOverlay` for chaining.

---

#### `WIPOverlay.destroyAll()`

Destroy all overlay instances.

**Returns:** `WIPOverlay` for chaining.

---

#### `WIPOverlay.disableForSession()`

Disable all overlays for the current session.

---

#### `WIPOverlay.disablePermanently()`

Disable all overlays permanently (stored in localStorage).

---

#### `WIPOverlay.enable()`

Re-enable overlays (clears disabled flags).

## Quick Disable

Development overrides:
- Add `?nowip` to URL
- Set `Funky.Storage.setRaw('wip_disabled', 'true')`
- Call `Funky.WIPOverlay.disableForSession()` or `disablePermanently()`

## CSS Customization

```javascript
Funky.WIPOverlay.init({
  id: 'custom-styled',
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  textColor: '#ffffff',
  accentColor: '#ff6600'
});
```

## Dependencies

- `Funky.Storage` - For disable flag persistence
- `Funky.Dom` - For DOM element creation
- `Funky.Announce` - For screen reader announcements (optional)

## Examples

### Basic Usage (Default Instance)

```javascript
// Simple usage without ID - uses default instance
Funky.WIPOverlay.init({
  message: '🚧 Coming Soon 🚧',
  subMessage: 'This feature is under development'
});
Funky.WIPOverlay.show();
```

### Named Instances (Recommended for SPAs)

```javascript
// Create named instances for different overlays
Funky.WIPOverlay.init({
  id: 'reports-overlay',
  message: 'Reports Coming Soon',
  progress: 75
});

Funky.WIPOverlay.init({
  id: 'analytics-overlay',
  message: 'Analytics In Development',
  progress: 40
});

// Show specific overlay
Funky.WIPOverlay.show('reports-overlay');

// Later, hide it
Funky.WIPOverlay.hide('reports-overlay');
```

### With Progress and Estimate

```javascript
Funky.WIPOverlay.init({
  id: 'feature-preview',
  message: 'Feature Preview',
  estimatedCompletion: 'Q1 2025',
  showProgress: true,
  progress: 65,
  features: [
    { label: 'UI Design', completed: true },
    { label: 'Backend API', completed: true },
    { label: 'Testing', completed: false },
    { label: 'Documentation', completed: false }
  ]
});
Funky.WIPOverlay.show('feature-preview');
```

### Scoped to Container

```javascript
// Overlay only covers a specific section
Funky.WIPOverlay.init({
  id: 'section-wip',
  scopeToContainer: '#reportSection',
  message: 'Reports Coming Soon',
  allowClose: true
});
Funky.WIPOverlay.show('section-wip');
```

### Multiple Independent Overlays

```javascript
// Main page overlay
Funky.WIPOverlay.init({
  id: 'page-overlay',
  message: 'Page Under Construction'
});

// Section-specific overlay (scoped)
Funky.WIPOverlay.init({
  id: 'sidebar-overlay',
  scopeToContainer: '#sidebar',
  message: 'Sidebar Features Coming Soon'
});

// Show both independently
Funky.WIPOverlay.show('page-overlay');
Funky.WIPOverlay.show('sidebar-overlay');

// Hide only the page overlay
Funky.WIPOverlay.hide('page-overlay');

// Toggle sidebar overlay
Funky.WIPOverlay.toggle('sidebar-overlay');
```

### SPA Cleanup Pattern

```javascript
// In a SPA page component
Funky.Pages.register('my-page', {
  init: function() {
    Funky.WIPOverlay.init({
      id: 'my-page-wip',
      message: 'Feature Coming Soon'
    });
    Funky.WIPOverlay.show('my-page-wip');
  },

  destroy: function() {
    // Clean up when leaving page
    Funky.WIPOverlay.destroy('my-page-wip');
    return {};
  }
});
```

### Conditional Display

```javascript
// Show only for certain user roles
if (!user.isAdmin) {
  Funky.WIPOverlay.init({
    id: 'admin-only',
    message: 'Admin Feature',
    subMessage: 'This feature is available for administrators',
    allowClose: false
  });
  Funky.WIPOverlay.show('admin-only');
}
```

### Development Mode

```javascript
// Always show in dev for testing
Funky.WIPOverlay.init({
  id: 'dev-test',
  showInDev: true, // Show even on localhost
  allowClose: true // Let devs close it
});
```

## Migration from v1.x

Version 2.0 introduces instance-based API. The old singleton pattern still works for backward compatibility:

```javascript
// v1.x style (still works)
Funky.WIPOverlay.init({ message: 'Test' });
Funky.WIPOverlay.show();
Funky.WIPOverlay.hide();

// v2.0 style (recommended for SPAs)
Funky.WIPOverlay.init({ id: 'my-overlay', message: 'Test' });
Funky.WIPOverlay.show('my-overlay');
Funky.WIPOverlay.hide('my-overlay');
```

Key differences:
- Add `id` option to `init()` for named instances
- Pass ID to `show()`, `hide()`, `toggle()`, `isShown()`, `destroy()`
- Use `getInstance(id)` to access instance directly
- Use `destroyAll()` to clean up all instances
