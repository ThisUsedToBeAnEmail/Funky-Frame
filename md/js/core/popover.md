# Funky.Popover - Native Popover System

Lightweight popovers without Bootstrap JavaScript dependency.

## Overview

`Funky.Popover` provides a popover system that replaces Bootstrap's JavaScript while maintaining full compatibility with Bootstrap CSS. It offers click, hover, and focus triggers with CSS-based positioning, fade animations, and click-outside-to-close functionality.

## Features

- **Bootstrap CSS compatible** - Works with existing Bootstrap popover markup
- **Zero Bootstrap JS dependency** - Pure vanilla JavaScript implementation
- **Multiple triggers** - Click, hover, focus, or manual
- **Click outside to close** - Automatically closes when clicking outside
- **Title and content** - Supports both title and body content
- **Auto-initialization** - Automatically initializes popovers on page load
- **Data attribute support** - Works with `data-funky-popover` and `data-bs-toggle="popover"`
- **Animation support** - Respects `prefers-reduced-motion` and `data-animations` settings
- **Lightweight** - CSS-based positioning, no external dependencies

## API Reference

### Constructor

#### `new Popover(target, options)`

Create a popover instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or CSS selector |
| options | object | No | Configuration options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | '' | Popover title |
| content | string | '' | Popover body content |
| placement | string | 'top' | Placement: 'top', 'bottom', 'left', 'right' |
| trigger | string | 'click' | Trigger: 'click', 'hover', 'focus', 'manual' |
| html | boolean | false | Allow HTML in content |

**Returns:** `Popover` instance

**Example:**
```javascript
var popover = new Funky.Popover('#myButton', {
  title: 'Important Info',
  content: 'This is the popover content.',
  placement: 'right',
  trigger: 'click'
});
```

---

### Instance Methods

#### `popover.show()`

Show the popover.

**Example:**
```javascript
popover.show();
```

---

#### `popover.hide()`

Hide the popover.

**Example:**
```javascript
popover.hide();
```

---

#### `popover.toggle()`

Toggle popover visibility.

**Example:**
```javascript
popover.toggle();
```

---

#### `popover.setContent(title, content)`

Update popover content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | No | New title (if only one param, it's the content) |
| content | string | No | New content |

**Example:**
```javascript
// Update content only
popover.setContent('New content');

// Update both title and content
popover.setContent('New Title', 'New content');
```

---

#### `popover.dispose()`

Destroy the popover instance and remove event listeners.

**Example:**
```javascript
popover.dispose();
```

---

### Static Methods

#### `Popover.getInstance(target)`

Get existing popover instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or selector |

**Returns:** `Popover|null` - Existing instance or null

**Example:**
```javascript
var popover = Funky.Popover.getInstance('#myButton');
if (popover) {
  popover.show();
}
```

---

#### `Popover.getOrCreateInstance(target, options)`

Get existing instance or create a new one.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or selector |
| options | object | No | Configuration options (if creating) |

**Returns:** `Popover` - Popover instance

**Example:**
```javascript
var popover = Funky.Popover.getOrCreateInstance('#myButton', {
  content: 'Popover content'
});
```

---

#### `Popover.init(container)`

Initialize all popovers within a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|HTMLElement | No | Container to search (default: document) |

**Example:**
```javascript
// Initialize all popovers in document
Funky.Popover.init();

// Initialize popovers in a specific container
Funky.Popover.init('#newContent');
```

---

#### `Popover.destroy(target)`

Destroy a popover instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Trigger element or selector |

**Example:**
```javascript
Funky.Popover.destroy('#myButton');
```

---

#### `Popover.destroyAll()`

Destroy all popover instances. Note: relies on garbage collection for WeakMap-based instances.

**Example:**
```javascript
Funky.Popover.destroyAll();
```

---

## Configuration

### HTML Markup

**Using data attributes (recommended):**
```html
<button
  data-funky-popover
  data-title="Popover Title"
  data-content="This is the popover content."
  data-placement="right">
  Click me
</button>
```

**Using Bootstrap attributes (compatibility):**
```html
<button
  data-bs-toggle="popover"
  data-bs-title="Popover Title"
  data-bs-content="This is the popover content."
  data-bs-placement="right">
  Click me
</button>
```

### Data Attributes

**`data-funky-popover`** - Marks element as popover trigger

```html
<button data-funky-popover data-content="Content here">Info</button>
```

**`data-bs-toggle="popover"`** - Bootstrap compatibility

```html
<button data-bs-toggle="popover" data-bs-content="Content here">Info</button>
```

**`data-title` or `data-bs-title`** - Popover title

```html
<button data-funky-popover data-title="Important" data-content="Read this">Info</button>
```

**`data-content` or `data-bs-content`** - Popover content

```html
<button data-funky-popover data-content="This is the content">Info</button>
```

**`data-placement` or `data-bs-placement`** - Popover placement

```html
<button data-funky-popover data-content="Content" data-placement="top">Top</button>
<button data-funky-popover data-content="Content" data-placement="bottom">Bottom</button>
<button data-funky-popover data-content="Content" data-placement="left">Left</button>
<button data-funky-popover data-content="Content" data-placement="right">Right</button>
```

**`data-trigger` or `data-bs-trigger`** - Trigger type

```html
<button data-funky-popover data-content="Click me" data-trigger="click">Click</button>
<button data-funky-popover data-content="Hover me" data-trigger="hover">Hover</button>
<button data-funky-popover data-content="Focus me" data-trigger="focus">Focus</button>
```

---

## Examples

### Basic Popover

```html
<button
  data-funky-popover
  data-title="Help"
  data-content="This button submits the form.">
  Submit
</button>
```

```javascript
// Auto-initialized on page load
```

### Manual Creation

```javascript
var button = document.getElementById('infoBtn');

var popover = new Funky.Popover(button, {
  title: 'Information',
  content: 'Detailed information about this feature.',
  placement: 'right',
  trigger: 'click'
});
```

### With HTML Content

```javascript
var popover = new Funky.Popover('#richBtn', {
  title: '<strong>Formatted Title</strong>',
  content: '<ul><li>Item 1</li><li>Item 2</li></ul>',
  html: true,
  placement: 'bottom'
});
```

### Hover Trigger

```javascript
var popover = new Funky.Popover('#hoverBtn', {
  title: 'Quick Info',
  content: 'This shows on hover.',
  trigger: 'hover',
  placement: 'top'
});
```

### Manual Control

```javascript
var popover = new Funky.Popover('#manualBtn', {
  title: 'Manual Popover',
  content: 'Controlled programmatically',
  trigger: 'manual'
});

// Show/hide programmatically
document.getElementById('showBtn').addEventListener('click', function() {
  popover.show();
});

document.getElementById('hideBtn').addEventListener('click', function() {
  popover.hide();
});
```

### Dynamic Content

```javascript
var popover = new Funky.Popover('#statusBtn', {
  title: 'Status',
  content: 'Loading...',
  trigger: 'click'
});

// Update content after data loads
fetchUserStatus().then(function(status) {
  popover.setContent('Status', 'Current status: ' + status);
});
```

### All Placements

```html
<button data-funky-popover data-title="Top" data-content="Content" data-placement="top">
  Top
</button>
<button data-funky-popover data-title="Bottom" data-content="Content" data-placement="bottom">
  Bottom
</button>
<button data-funky-popover data-title="Left" data-content="Content" data-placement="left">
  Left
</button>
<button data-funky-popover data-title="Right" data-content="Content" data-placement="right">
  Right
</button>
```

### In Funky.Table

```javascript
var table = new Funky.Table('#myTable', {
  columns: [
    {
      data: null,
      render: function(data, type, row) {
        return '<button data-funky-popover ' +
               'data-title="' + row.name + '" ' +
               'data-content="' + row.description + '" ' +
               'class="btn btn-sm btn-info">Info</button>';
      }
    }
  ],
  drawCallback: function() {
    // Reinitialize popovers after table redraw
    Funky.Popover.init('#myTable');
  }
});
```

### Help System

```html
<h3>
  Account Settings
  <button
    data-funky-popover
    data-title="Account Settings Help"
    data-content="Manage your account preferences, notifications, and privacy settings."
    class="btn btn-sm btn-link">
    <i class="fas fa-question-circle"></i>
  </button>
</h3>
```

### Form Field Help

```html
<div class="mb-3">
  <label for="apiKey">
    API Key
    <button
      type="button"
      data-funky-popover
      data-title="API Key"
      data-content="You can find your API key in the developer settings panel."
      data-placement="right"
      class="btn btn-sm btn-link p-0">
      <i class="fas fa-info-circle"></i>
    </button>
  </label>
  <input type="text" class="form-control" id="apiKey">
</div>
```

### SPA Integration

Popovers are automatically reinitialized on SPA page loads via `spa.js`:

```javascript
// Automatic in SPA
Funky.PubSub.on('funky:spa:pageload', function() {
  Funky.Popover.init('#spaContent');
});
```

### Click Outside to Close

```javascript
// Popovers automatically close when clicking outside
var popover = new Funky.Popover('#btn', {
  title: 'Click outside to close',
  content: 'This will close when you click anywhere else.',
  trigger: 'click'
});
```

---

## CSS Classes

Funky.Popover uses Bootstrap's CSS classes:

| Class | Purpose |
|-------|---------|
| `.popover` | Base popover container |
| `.popover-header` | Title section |
| `.popover-body` | Content section |
| `.popover-arrow` | Arrow element |
| `.bs-popover-top` | Top placement |
| `.bs-popover-bottom` | Bottom placement |
| `.bs-popover-left` | Left placement |
| `.bs-popover-right` | Right placement |
| `.fade` | Fade animation |
| `.show` | Visible state |

---

## Animation Control

**Fade Animation** - Added automatically

```javascript
// Popovers fade in/out by default
```

**Disable Animations** - Set global preference

```javascript
document.documentElement.setAttribute('data-animations', 'off');
```

**Prefers Reduced Motion** - Automatically detected

Popovers respect the `prefers-reduced-motion` media query for accessibility.

---

## Migration from Bootstrap

### Before (Bootstrap 5)

```html
<script src="bootstrap.bundle.min.js"></script>

<button data-bs-toggle="popover" data-bs-title="Title" data-bs-content="Content">
  Click
</button>
```

```javascript
var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl);
});
```

### After (Funky.Popover)

```html
<!-- No Bootstrap JS needed -->
<script src="/assets/js/core/popover.js"></script>

<!-- Use either attribute -->
<button data-funky-popover data-title="Title" data-content="Content">
  Click
</button>
<!-- Or keep Bootstrap attributes for compatibility -->
<button data-bs-toggle="popover" data-bs-title="Title" data-bs-content="Content">
  Click
</button>
```

```javascript
// Auto-initialized on page load
// Or manually:
Funky.Popover.init();
```

---

## Differences from Tooltip

| Feature | Tooltip | Popover |
|---------|---------|---------|
| **Default trigger** | hover | click |
| **Content** | Single text/HTML | Title + body content |
| **Dismissal** | Auto on mouse leave | Click outside to close |
| **Use case** | Quick hints | Detailed information |
| **Size** | Small | Larger with header |

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Bootstrap 5 CSS** - Popover styling (no Bootstrap JS required)

---

## See Also

- [Funky.Tooltip](./tooltip.md) - Tooltip component
- [Funky.Dom](./dom.md) - DOM manipulation
- [Funky.Modal](./modal.md) - Modal dialogs
