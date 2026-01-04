# Funky.Tooltip - Native Tooltip System

Lightweight tooltips without Bootstrap JavaScript dependency.

## Overview

`Funky.Tooltip` provides a tooltip system that replaces Bootstrap's JavaScript while maintaining full compatibility with Bootstrap CSS. It offers hover, focus, and click triggers with CSS-based positioning and fade animations.

## Features

- **Bootstrap CSS compatible** - Works with existing Bootstrap tooltip markup
- **Zero Bootstrap JS dependency** - Pure vanilla JavaScript implementation
- **Multiple triggers** - Hover, focus, click, or manual
- **Configurable delays** - Show/hide delays for better UX
- **Auto-initialization** - Automatically initializes tooltips on page load
- **Data attribute support** - Works with `data-funky-tooltip` and `data-bs-toggle="tooltip"`
- **Animation support** - Respects `prefers-reduced-motion` and `data-animations` settings
- **Lightweight** - CSS-based positioning, no external dependencies

## API Reference

### Factory Methods

#### `Tooltip.init(target, options)`

Initialize a tooltip on target element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or CSS selector |
| options | object | No | Configuration options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | '' | Tooltip text |
| placement | string | 'top' | Placement: 'top', 'bottom', 'left', 'right' |
| trigger | string | 'hover' | Trigger: 'hover', 'focus', 'click', 'manual' |
| delay | number\|object | 0 | Delay in ms or `{ show: 0, hide: 0 }` |
| html | boolean | false | Allow HTML in tooltip content |

**Returns:** `Tooltip` instance

**Example:**
```javascript
var tooltip = Funky.Tooltip.init('#myButton', {
  title: 'Click to submit',
  placement: 'top',
  trigger: 'hover',
  delay: { show: 500, hide: 100 }
});
```

---

#### `Tooltip.getInstance(target)`

Get existing tooltip instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or selector |

**Returns:** `Tooltip|null` - Existing instance or null

**Example:**
```javascript
var tooltip = Funky.Tooltip.getInstance('#myButton');
if (tooltip) {
  tooltip.show();
}
```

---

#### `Tooltip.destroy(target)`

Destroy a tooltip instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or selector |

---

#### `Tooltip.initAll(container)`

Initialize all tooltips from data attributes in a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|HTMLElement | No | Container to search (default: document) |

**Example:**
```javascript
// Initialize all tooltips in a section
Funky.Tooltip.initAll('#my-section');
```

---

### Instance Methods

#### `tooltip.show()`

Show the tooltip.

**Example:**
```javascript
tooltip.show();
```

---

#### `tooltip.hide()`

Hide the tooltip.

**Example:**
```javascript
tooltip.hide();
```

---

#### `tooltip.toggle()`

Toggle tooltip visibility.

**Example:**
```javascript
tooltip.toggle();
```

---

#### `tooltip.setContent(title)`

Update tooltip content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | New tooltip text |

**Example:**
```javascript
tooltip.setContent('Updated tooltip text');
```

---

#### `tooltip.dispose()`

Destroy the tooltip instance and remove event listeners.

**Example:**
```javascript
tooltip.dispose();
```

---

## Configuration

### HTML Markup

**Using data-funky-tooltip (recommended):**
```html
<button data-funky-tooltip="Tooltip text" data-placement="top">
  Hover me
</button>
```

**Using data-bs-toggle (Bootstrap compatibility):**
```html
<button data-bs-toggle="tooltip" data-bs-title="Tooltip text" data-bs-placement="top">
  Hover me
</button>
```

**Using title attribute:**
```html
<button data-funky-tooltip title="Tooltip text">
  Hover me
</button>
```

### Data Attributes

**`data-funky-tooltip`** - Tooltip text

```html
<button data-funky-tooltip="Save changes">Save</button>
```

**`data-bs-toggle="tooltip"`** - Bootstrap compatibility

```html
<button data-bs-toggle="tooltip" data-bs-title="Delete item">Delete</button>
```

**`data-placement` or `data-bs-placement`** - Tooltip placement

```html
<button data-funky-tooltip="Top tooltip" data-placement="top">Top</button>
<button data-funky-tooltip="Bottom tooltip" data-placement="bottom">Bottom</button>
<button data-funky-tooltip="Left tooltip" data-placement="left">Left</button>
<button data-funky-tooltip="Right tooltip" data-placement="right">Right</button>
```

**`data-trigger` or `data-bs-trigger`** - Trigger type

```html
<button data-funky-tooltip="Hover tooltip" data-trigger="hover">Hover</button>
<input data-funky-tooltip="Focus tooltip" data-trigger="focus">
<button data-funky-tooltip="Click tooltip" data-trigger="click">Click</button>
```

---

## Examples

### Basic Tooltip

```html
<button data-funky-tooltip="Click to save">Save</button>
```

```javascript
// Auto-initialized on page load
```

### Manual Creation

```javascript
var button = document.getElementById('submitBtn');

var tooltip = new Funky.Tooltip(button, {
  title: 'Submit the form',
  placement: 'top',
  trigger: 'hover'
});
```

### With Delays

```javascript
var tooltip = new Funky.Tooltip('#helpBtn', {
  title: 'Need help?',
  placement: 'right',
  delay: {
    show: 500,  // Wait 500ms before showing
    hide: 100   // Wait 100ms before hiding
  }
});
```

### Click Trigger

```javascript
var tooltip = new Funky.Tooltip('#infoBtn', {
  title: 'Click anywhere to dismiss',
  placement: 'bottom',
  trigger: 'click'
});
```

### Manual Control

```javascript
var tooltip = new Funky.Tooltip('#myBtn', {
  title: 'Manual tooltip',
  trigger: 'manual'
});

// Show/hide programmatically
document.getElementById('showBtn').addEventListener('click', function() {
  tooltip.show();
});

document.getElementById('hideBtn').addEventListener('click', function() {
  tooltip.hide();
});
```

### HTML Content

```javascript
var tooltip = new Funky.Tooltip('#richBtn', {
  title: '<strong>Bold</strong> and <em>italic</em>',
  html: true,
  placement: 'top'
});
```

### Dynamic Content

```javascript
var tooltip = new Funky.Tooltip('#statusBtn', {
  title: 'Loading...',
  trigger: 'manual'
});

tooltip.show();

fetchStatus().then(function(status) {
  tooltip.setContent('Status: ' + status);
});
```

### All Placements

```html
<button data-funky-tooltip="Top tooltip" data-placement="top">Top</button>
<button data-funky-tooltip="Bottom tooltip" data-placement="bottom">Bottom</button>
<button data-funky-tooltip="Left tooltip" data-placement="left">Left</button>
<button data-funky-tooltip="Right tooltip" data-placement="right">Right</button>
```

### Focus Trigger (Forms)

```html
<label for="username">Username</label>
<input
  id="username"
  type="text"
  data-funky-tooltip="Enter your username"
  data-trigger="focus"
  data-placement="right">
```

### In Funky.Table

```javascript
var table = new Funky.Table('#myTable', {
  columns: [
    {
      data: 'name',
      render: function(data, type, row) {
        return '<span data-funky-tooltip="User ID: ' + row.id + '">' + data + '</span>';
      }
    }
  ],
  drawCallback: function() {
    // Reinitialize tooltips after table redraw
    Funky.Tooltip.init('#myTable');
  }
});
```

### SPA Integration

Tooltips are automatically reinitialized on SPA page loads via `spa.js`:

```javascript
// Automatic in SPA
Funky.PubSub.on('funky:spa:pageload', function() {
  Funky.Tooltip.init('#spaContent');
});
```

---

## CSS Classes

Funky.Tooltip uses Bootstrap's CSS classes:

| Class | Purpose |
|-------|---------|
| `.tooltip` | Base tooltip container |
| `.tooltip-inner` | Content wrapper |
| `.tooltip-arrow` | Arrow element |
| `.bs-tooltip-top` | Top placement |
| `.bs-tooltip-bottom` | Bottom placement |
| `.bs-tooltip-left` | Left placement |
| `.bs-tooltip-right` | Right placement |
| `.fade` | Fade animation |
| `.show` | Visible state |

---

## Animation Control

**Fade Animation** - Added automatically

```javascript
// Tooltips fade in/out by default
```

**Disable Animations** - Set global preference

```javascript
document.documentElement.setAttribute('data-animations', 'off');
```

**Prefers Reduced Motion** - Automatically detected

Tooltips respect the `prefers-reduced-motion` media query for accessibility.

---

## Migration from Bootstrap

### Before (Bootstrap 5)

```html
<script src="bootstrap.bundle.min.js"></script>

<button data-bs-toggle="tooltip" data-bs-title="Tooltip text">Hover</button>
```

```javascript
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});
```

### After (Funky.Tooltip)

```html
<!-- No Bootstrap JS needed -->
<script src="/assets/js/components/tooltip.js"></script>

<!-- Use either attribute -->
<button data-funky-tooltip="Tooltip text">Hover</button>
<!-- Or keep Bootstrap attributes for compatibility -->
<button data-bs-toggle="tooltip" data-bs-title="Tooltip text">Hover</button>
```

```javascript
// Auto-initialized on page load
// Or manually:
Funky.Tooltip.init();
```

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Bootstrap 5 CSS** - Tooltip styling (no Bootstrap JS required)

---

## See Also

- [Funky.Popover](./popover.md) - Popover component
- [Funky.Dom](../core/dom.md) - DOM manipulation
- [Funky.Modal](../core/modal.md) - Modal dialogs
