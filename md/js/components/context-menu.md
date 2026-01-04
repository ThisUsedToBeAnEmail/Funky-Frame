# Context Menu

Native-feeling right-click context menus with submenus, icons, keyboard navigation, and touch support.

## Overview

The Context Menu component provides a powerful way to add contextual actions to any element. It supports:

- **Attach to any element** - Selector, Element, NodeList, or window/document
- **Dynamic items** - Items can be a function that receives the target element
- **Submenus** - Nested menus with automatic positioning
- **Icons & shortcuts** - Visual indicators and keyboard hints
- **Keyboard navigation** - Arrow keys, Enter, Escape
- **Touch support** - Long-press gesture on mobile
- **Viewport-aware** - Menus flip to stay on screen

## Quick Start

### Basic Usage

```javascript
// Attach to specific elements
Funky.ContextMenu.attach('.my-element', {
  items: [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' }
  ],
  onSelect: function(id, target, event) {
    console.log('Selected:', id);
  }
});
```

### Attach to Window

```javascript
// Global context menu
Funky.ContextMenu.attach(window, {
  items: [
    { id: 'refresh', label: 'Refresh' },
    { id: 'settings', label: 'Settings' }
  ],
  onSelect: function(id) {
    if (id === 'refresh') location.reload();
  }
});
```

### With Icons and Shortcuts

```javascript
Funky.ContextMenu.attach('#editor', {
  items: [
    { id: 'cut', icon: 'fa-scissors', label: 'Cut', shortcut: '⌘X' },
    { id: 'copy', icon: 'fa-copy', label: 'Copy', shortcut: '⌘C' },
    { id: 'paste', icon: 'fa-paste', label: 'Paste', shortcut: '⌘V' }
  ],
  onSelect: handleAction
});
```

### With Submenus

```javascript
Funky.ContextMenu.attach('.file-item', {
  items: [
    { id: 'open', label: 'Open' },
    { id: 'export', label: 'Export As', items: [
      { id: 'export-pdf', label: 'PDF' },
      { id: 'export-csv', label: 'CSV' },
      { id: 'export-json', label: 'JSON' }
    ]},
    { divider: true },
    { id: 'delete', label: 'Delete', variant: 'danger' }
  ]
});
```

### Dynamic Items

```javascript
Funky.ContextMenu.attach('.row', {
  items: function(targetElement) {
    var rowId = targetElement.dataset.id;
    var isEditable = targetElement.dataset.editable === 'true';
    
    return [
      { id: 'view', label: 'View Details' },
      { id: 'edit', label: 'Edit', disabled: !isEditable },
      { divider: true },
      { id: 'delete', label: 'Delete Row ' + rowId, variant: 'danger' }
    ];
  }
});
```

## API Reference

### `Funky.ContextMenu.attach(target, options)`

Attach a context menu to element(s).

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `string \| Element \| NodeList \| window` | Target element(s) |
| `options` | `object` | Configuration options |

**Returns:** `Attachment` instance

```javascript
var attachment = Funky.ContextMenu.attach('.item', {
  items: [...],
  onSelect: function(id) { ... }
});

// Later, destroy it
attachment.destroy();
```

### `Funky.ContextMenu.show(x, y, options)`

Show a context menu programmatically at specific coordinates.

```javascript
Funky.ContextMenu.show(event.clientX, event.clientY, {
  items: [
    { id: 'action1', label: 'Action 1' },
    { id: 'action2', label: 'Action 2' }
  ],
  onSelect: handleSelect
});
```

### `Funky.ContextMenu.hide()`

Close any open context menu.

```javascript
Funky.ContextMenu.hide();
```

### `Funky.ContextMenu.destroy(target)`

Remove context menu from a specific target.

```javascript
Funky.ContextMenu.destroy('.file-item');
```

### `Funky.ContextMenu.destroyAll()`

Remove all context menu attachments.

```javascript
Funky.ContextMenu.destroyAll();
```

### `Funky.ContextMenu.isVisible()`

Check if a menu is currently visible.

```javascript
if (Funky.ContextMenu.isVisible()) {
  console.log('Menu is open');
}
```

### `Funky.ContextMenu.get(target)`

Get the attachment instance for a target.

```javascript
var attachment = Funky.ContextMenu.get('.file-item');
if (attachment) {
  attachment.options.disabled = true;
}
```

---

### `Funky.ContextMenu.destroyGlobalListeners()`

Remove global document/window listeners. Useful when you need to temporarily disable all context menus without destroying them.

```javascript
// Disable all context menus temporarily
Funky.ContextMenu.destroyGlobalListeners();
```

---

### `Funky.ContextMenu.reattachGlobalListeners()`

Re-attach previously detached global listeners.

```javascript
// Re-enable context menus
Funky.ContextMenu.reattachGlobalListeners();
```

---

## Attachment Instance Methods

The object returned by `attach()` provides methods for dynamic item management:

### `attachment.addItem(item, position)`

Add a new item to the menu.

```javascript
var attachment = Funky.ContextMenu.attach('.target', { items: initialItems });

// Add item at end
attachment.addItem({ id: 'new-action', label: 'New Action' });

// Add item at specific position
attachment.addItem({ id: 'first', label: 'First' }, 0);
```

---

### `attachment.removeItem(id)`

Remove an item by its ID.

```javascript
attachment.removeItem('delete');
```

---

### `attachment.updateItem(id, properties)`

Update properties of an existing item.

```javascript
attachment.updateItem('save', { label: 'Save Changes', disabled: false });
```

---

### `attachment.setItemEnabled(id, enabled)`

Enable or disable an item.

```javascript
attachment.setItemEnabled('paste', hasClipboardContent);
```

---

### `attachment.setItemVisible(id, visible)`

Show or hide an item.

```javascript
attachment.setItemVisible('admin-action', isAdmin);
```

---

### `attachment.getItem(id)`

Get an item by its ID.

```javascript
var item = attachment.getItem('export');
if (item) {
  console.log('Export label:', item.label);
}
```

---

### `attachment.destroy()`

Remove the attachment and clean up listeners.

```javascript
attachment.destroy();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `array \| function` | `[]` | Menu items array or function returning items |
| `onSelect` | `function` | `null` | Callback when item selected: `(id, target, event)` |
| `onShow` | `function` | `null` | Callback before menu shows (return `false` to cancel) |
| `onHide` | `function` | `null` | Callback when menu closes |
| `className` | `string` | `''` | Additional CSS class for menu |
| `minWidth` | `number` | `160` | Minimum menu width (px) |
| `maxWidth` | `number` | `320` | Maximum menu width (px) |
| `zIndex` | `number` | `10000` | Z-index for menu |
| `longPressDelay` | `number` | `500` | Touch long-press delay (ms) |
| `disabled` | `boolean` | `false` | Disable the context menu |

## Item Structure

Each item in the `items` array can have these properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (passed to `onSelect`) |
| `label` | `string` | Display text |
| `icon` | `string` | FontAwesome icon class (e.g., `'fa-edit'`) |
| `shortcut` | `string` | Keyboard shortcut hint (e.g., `'⌘C'`) |
| `disabled` | `boolean` | Disable the item |
| `hidden` | `boolean` | Hide the item |
| `variant` | `string` | Style variant: `'danger'` |
| `items` | `array` | Submenu items |
| `divider` | `boolean` | Render as a divider line |
| `header` | `string` | Render as a section header |

### Item Examples

```javascript
// Regular item
{ id: 'save', label: 'Save' }

// With icon
{ id: 'edit', icon: 'fa-edit', label: 'Edit' }

// With shortcut
{ id: 'copy', icon: 'fa-copy', label: 'Copy', shortcut: '⌘C' }

// Disabled
{ id: 'paste', label: 'Paste', disabled: true }

// Danger variant
{ id: 'delete', label: 'Delete', variant: 'danger' }

// Divider
{ divider: true }

// Section header
{ header: 'Actions' }

// With submenu
{ id: 'export', label: 'Export', items: [
  { id: 'pdf', label: 'PDF' },
  { id: 'csv', label: 'CSV' }
]}
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate items |
| `→` | Open submenu |
| `←` | Close submenu |
| `Enter` / `Space` | Select item |
| `Escape` | Close menu |
| `Tab` | Close menu and move focus |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-contextmenu` | Main menu container |
| `.funky-contextmenu-item` | Menu item |
| `.funky-contextmenu-item-danger` | Danger variant (red) |
| `.funky-contextmenu-divider` | Divider line |
| `.funky-contextmenu-header` | Section header |
| `.funky-contextmenu-icon` | Item icon |
| `.funky-contextmenu-label` | Item text |
| `.funky-contextmenu-shortcut` | Shortcut hint |
| `.funky-contextmenu-arrow` | Submenu indicator |
| `.is-disabled` | Disabled state |
| `.is-focused` | Keyboard focus state |
| `.is-visible` | Visible (animated) state |
| `.is-submenu` | Submenu modifier |
| `.is-submenu-left` | Submenu opens leftward |

## CSS Variables

The component respects theme variables:

```css
/* Colors */
--pro-surface          /* Menu background */
--pro-text-primary     /* Item text */
--pro-text-secondary   /* Shortcut text, disabled items */
--pro-accent           /* Focus/hover background */
--pro-error            /* Danger variant */

/* Spacing */
--pro-spacing-xs       /* Item padding */
--pro-spacing-sm       /* Menu padding, gaps */

/* Typography */
--pro-font-size-sm     /* Menu text size */
--pro-font-size-xs     /* Shortcut, header size */

/* Effects */
--pro-shadow-lg        /* Menu shadow */
--pro-radius-md        /* Menu border radius */
```

## Customizing Appearance

### Custom Width

```javascript
Funky.ContextMenu.attach('.target', {
  items: menuItems,
  minWidth: 200,
  maxWidth: 400
});
```

### Custom Class

```javascript
Funky.ContextMenu.attach('.target', {
  items: menuItems,
  className: 'my-custom-menu'
});
```

```css
.my-custom-menu {
  --pro-radius-md: 0; /* Square corners */
}
```

### Density Support

The menu automatically respects the current density setting:

```html
<body data-density="compact">
  <!-- Menus will use compact sizing -->
</body>
```

## Accessibility

- Uses semantic `role="menu"` and `role="menuitem"`
- `aria-disabled` on disabled items
- Full keyboard navigation
- Focus management with visible focus ring
- Touch support with long-press

## Examples

### File Browser

```javascript
Funky.ContextMenu.attach('.file-item', {
  items: function(el) {
    var isFolder = el.dataset.type === 'folder';
    return [
      { id: 'open', icon: 'fa-folder-open', label: 'Open' },
      { id: 'rename', icon: 'fa-edit', label: 'Rename' },
      { divider: true },
      { id: 'copy', icon: 'fa-copy', label: 'Copy', shortcut: '⌘C' },
      { id: 'cut', icon: 'fa-scissors', label: 'Cut', shortcut: '⌘X' },
      { id: 'paste', icon: 'fa-paste', label: 'Paste', shortcut: '⌘V', disabled: true },
      { divider: true },
      { id: 'compress', label: 'Compress', hidden: isFolder },
      { id: 'delete', icon: 'fa-trash', label: 'Delete', variant: 'danger' }
    ];
  },
  onSelect: function(id, el) {
    var path = el.dataset.path;
    fileActions[id](path);
  }
});
```

### Table Row Actions

```javascript
Funky.ContextMenu.attach('table tbody tr', {
  items: [
    { header: 'Actions' },
    { id: 'view', icon: 'fa-eye', label: 'View' },
    { id: 'edit', icon: 'fa-edit', label: 'Edit' },
    { id: 'duplicate', icon: 'fa-clone', label: 'Duplicate' },
    { divider: true },
    { id: 'export', label: 'Export', items: [
      { id: 'export-json', label: 'As JSON' },
      { id: 'export-csv', label: 'As CSV' }
    ]},
    { divider: true },
    { id: 'delete', icon: 'fa-trash', label: 'Delete', variant: 'danger' }
  ],
  onSelect: function(id, row) {
    var rowId = row.dataset.id;
    handleRowAction(id, rowId);
  }
});
```

### Canvas/Diagram Editor

```javascript
Funky.ContextMenu.attach('#canvas', {
  items: function(el) {
    var node = el.closest('.node');
    if (node) {
      return [
        { id: 'edit-node', label: 'Edit Node' },
        { id: 'connect', label: 'Connect To...' },
        { divider: true },
        { id: 'delete-node', label: 'Delete', variant: 'danger' }
      ];
    }
    return [
      { id: 'add-node', label: 'Add Node' },
      { id: 'paste', label: 'Paste' },
      { divider: true },
      { id: 'zoom-fit', label: 'Fit to Screen' }
    ];
  }
});
```

### Conditional Callbacks

```javascript
Funky.ContextMenu.attach('.document', {
  items: documentMenuItems,
  onShow: function(target, event) {
    // Check permissions
    if (!hasEditPermission(target.dataset.id)) {
      return false; // Cancel menu
    }
  },
  onSelect: function(id, target) {
    performAction(id, target);
  },
  onHide: function() {
    clearHighlight();
  }
});
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Touch support tested on iOS Safari and Chrome Android.

## See Also

- [Dropdown](./dropdown.md) - Click-triggered dropdown menus
- [Popover](./popover.md) - Positioned content containers
- [Tooltip](./tooltip.md) - Hover hints
