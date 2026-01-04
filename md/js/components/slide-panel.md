# Funky.SlidePanel - Slide-in Panel Management

Handles body scroll lock, focus trapping, and animations for slide-in modal panels.

## Overview

`Funky.SlidePanel` manages the behavior of slide-in panels including scroll locking when panels are open, accessibility focus trapping, and smooth animations.

## API Reference

### Methods

#### `SlidePanel.init()`

Initialize slide panel handlers. Called automatically on DOMContentLoaded.

---

#### `SlidePanel.lockScroll()`

Lock body scroll when a panel opens.

**Example:**
```javascript
// Usually called automatically by modal events
Funky.SlidePanel.lockScroll();
```

---

#### `SlidePanel.unlockScroll()`

Unlock body scroll when a panel closes.

---

#### `SlidePanel.register(panelId, options)`

Register a slide panel instance for the Bindable Interface.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| panelId | string | Panel element ID |
| options | object | Optional configuration |

**Returns:** Instance object with `show()`, `hide()`, `setData()` methods

**Example:**
```javascript
var instance = Funky.SlidePanel.register('detailsPanel', { title: 'Details' });
instance.show();
```

---

#### `SlidePanel.getInstance(panelId)`

Get a registered panel instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| panelId | string | Panel element ID |

**Returns:** Instance object or `null`

**Example:**
```javascript
var panel = Funky.SlidePanel.getInstance('detailsPanel');
if (panel) {
    panel.setData({ title: 'Updated', content: '<p>New content</p>' });
}
```

---

#### `SlidePanel.destroy(panelId)`

Destroy a panel instance and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| panelId | string | Panel element ID |

---

#### `SlidePanel.destroyAll()`

Destroy all registered panel instances.

**Example:**
```javascript
// Clean up on page unload
Funky.SlidePanel.destroyAll();
```

---

#### `SlidePanel.isOpen()`

Check if any slide panel is currently open.

**Returns:** `boolean`

### Features

#### Scroll Lock

When a slide panel opens:
1. Current scroll position is saved
2. Body is set to `position: fixed` to prevent scroll
3. When closed, scroll position is restored

This prevents the "scroll jump" issue on mobile and desktop.

#### Nested Panels

The module tracks open panel count for nested modals:
- First panel: locks scroll
- Nested panels: increment counter only
- Last panel closes: unlocks scroll

#### Focus Trapping

For accessibility, focus is trapped within the open panel:
- Tab cycles through focusable elements
- Shift+Tab cycles backwards
- Focus cannot escape to background content

## Auto-Initialization

Automatically binds to Bootstrap modal events:
- `show.bs.modal` → lock scroll
- `hidden.bs.modal` → unlock scroll

## Dependencies

- Bootstrap 5 (for modal events)

## Examples

### Custom Slide Panel

```html
<div class="modal slide-panel" id="detailsPanel">
  <div class="modal-dialog modal-dialog-slideout">
    <div class="modal-content">
      <!-- Panel content -->
    </div>
  </div>
</div>
```

### Manual Control

```javascript
// For non-Bootstrap modals or custom implementations
function showCustomPanel() {
  Funky.SlidePanel.lockScroll();
  panel.classList.add('show');
}

function hideCustomPanel() {
  panel.classList.remove('show');
  Funky.SlidePanel.unlockScroll();
}
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.slide-panel` | Base class for slide panels |
| `.modal-dialog-slideout` | Makes dialog slide in from side |
| `.slide-left` | Slide from left edge |
| `.slide-right` | Slide from right edge |

---

## Bindable Interface (LiveBinding)

`Funky.SlidePanel` implements the bindable interface, allowing it to be used as a target for LiveBinding data sources. This enables automatic updates to panel content from WebSocket updates, API responses, or other reactive data sources.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(data)` | `data: Object` | Sets the panel content including `title`, `content` (HTML body), and `footer` (HTML footer). Updates are applied immediately if the panel is visible. |

### Instance Registry

SlidePanel instances are registered in `Funky.SlidePanel._instances[panelId]` upon initialization. This allows LiveBinding adapters to locate and bind to specific panel instances.

### Usage with LiveBinding

```javascript
// Bind to a WebSocket for live content updates
Funky.LiveBinding.bind({
    source: {
        type: 'websocket',
        channel: 'details:entity:123'
    },
    target: {
        type: 'component',
        component: 'SlidePanel',
        instance: 'detailsPanel'
    },
    transform: function(data) {
        return {
            title: data.entityName + ' Details',
            content: renderDetailsHTML(data),
            footer: '<button class="btn btn-primary">Save Changes</button>'
        };
    }
});

// Manual instance access
var instance = Funky.SlidePanel._instances['detailsPanel'];
instance.setData({
    title: 'Client Details',
    content: '<p>Updated client information...</p>',
    footer: '<button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>'
});
```
