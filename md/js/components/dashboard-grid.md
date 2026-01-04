# Funky.DashboardGrid

Flexible CSS Grid-based dashboard layout system with drag-and-drop widgets.

## Overview

`Funky.DashboardGrid` provides a fully-featured dashboard layout component with:
- Drag-and-drop widget repositioning
- 8-direction resize handles
- Multiple widget types (HTML, DOM, VDOM, component, LiveBinding, nested grid)
- Persistent layouts (localStorage or API)
- Full accessibility support

## Quick Start

```javascript
var grid = Funky.DashboardGrid.init('#dashboard', {
  columns: 12,
  rowHeight: 80,
  editable: true,
  widgets: [
    { id: 'stats', type: 'html', html: '<p>Stats</p>', col: 1, row: 1, width: 4, height: 2 }
  ]
});
```

## API Reference

### Initialization

#### `Funky.DashboardGrid.init(container, options)`

Initialize a dashboard grid.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| container | string/Element | - | Container selector or element |
| columns | number | `12` | Number of grid columns |
| rowHeight | number | `80` | Row height in pixels |
| gap | number | `16` | Gap between widgets |
| editable | boolean | `false` | Enable drag/resize |
| widgets | Array | `[]` | Initial widget configs |
| minWidth | number | `1` | Minimum widget columns |
| minHeight | number | `1` | Minimum widget rows |

**Returns:** `DashboardGrid` instance

### Widget Configuration

```javascript
{
  id: 'widget-1',         // Unique identifier
  type: 'html',           // Widget type
  html: '<p>Content</p>', // For html type
  col: 1,                 // Column position (1-based)
  row: 1,                 // Row position (1-based)
  width: 4,               // Width in columns
  height: 2,              // Height in rows
  title: 'My Widget',     // Widget title
  removable: true,        // Allow removal
  resizable: true,        // Allow resize
  draggable: true         // Allow drag
}
```

### Widget Types

| Type | Description |
|------|-------------|
| `'html'` | Raw HTML content |
| `'dom'` | DOM element or Funky.Dom |
| `'vdom'` | Virtual DOM element |
| `'component'` | Funky component |
| `'livebinding'` | LiveBinding template |
| `'grid'` | Nested grid |

### Instance Methods

#### `addWidget(config)`

Add a widget dynamically.

```javascript
grid.addWidget({
  id: 'new-widget',
  type: 'html',
  html: '<p>New!</p>',
  col: 5, row: 1, width: 2, height: 1
});
```

---

#### `removeWidget(id)`

Remove a widget by ID.

---

#### `updateWidget(id, updates)`

Update widget configuration.

```javascript
grid.updateWidget('stats', { title: 'Updated Title' });
```

---

#### `getWidget(id)`

Get widget by ID.

**Returns:** Widget object or `null`

---

#### `getWidgets()`

Get all widgets.

**Returns:** `Array`

---

#### `setEditable(enabled)`

Enable/disable edit mode.

---

#### `isEditable()`

Check if edit mode is enabled.

**Returns:** `boolean`

---

#### `getLayout()`

Get current layout configuration.

**Returns:** `Object`

---

#### `setLayout(layout)`

Restore a saved layout.

---

#### `destroy()`

Clean up and remove the grid.

---

## Events

DOM events are dispatched on the grid container:

| Event | Detail | Description |
|-------|--------|-------------|
| `funky.dashboard-grid.initialized` | `{ instance }` | Grid initialized |
| `funky.dashboard-grid.destroyed` | `{ id }` | Grid destroyed |
| `funky.dashboard-grid.layout-change` | `{ layout }` | Layout changed |
| `funky.dashboard-grid.widget-add` | `{ widget }` | Widget added |
| `funky.dashboard-grid.widget-remove` | `{ id }` | Widget removed |
| `funky.dashboard-grid.widget-move` | `{ id, col, row }` | Widget moved |
| `funky.dashboard-grid.widget-resize` | `{ id, width, height }` | Widget resized |
| `funky.dashboard-grid.edit-mode` | `{ editable }` | Edit mode toggled |

**Example:**
```javascript
document.getElementById('dashboard').addEventListener('funky.dashboard-grid.widget-move', function(e) {
  console.log('Widget moved:', e.detail.id, 'to', e.detail.col, e.detail.row);
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.dashboard-grid` | Main container |
| `.dashboard-grid--edit-mode` | Edit mode active |
| `.dashboard-grid--nested` | Nested grid |
| `.dashboard-widget` | Widget container |
| `.dashboard-widget--dragging` | Being dragged |
| `.dashboard-widget--resizing` | Being resized |
| `.dashboard-widget__header` | Widget header |
| `.dashboard-widget__title` | Widget title |
| `.dashboard-widget__controls` | Widget control buttons |
| `.dashboard-widget__content` | Widget content area |
| `.dashboard-widget__resize-handle` | Resize handles |
| `.dashboard-grid__placeholder` | Drop placeholder |

## Widget Type Registration

Register custom widget types:

```javascript
Funky.DashboardGrid.registerWidgetType('chart', {
  render: function(widget, container) {
    // Render chart into container
    Funky.Plotly.line(container, widget.data);
  },
  destroy: function(widget, container) {
    // Cleanup
  }
});
```

## Persistence

```javascript
// Save layout to localStorage
var layout = grid.getLayout();
localStorage.setItem('dashboard-layout', JSON.stringify(layout));

// Restore layout
var saved = localStorage.getItem('dashboard-layout');
if (saved) {
  grid.setLayout(JSON.parse(saved));
}
```

## Accessibility

- Full keyboard navigation
- Arrow keys to move focus between widgets
- Enter to interact, Escape to cancel
- ARIA labels on all interactive elements
- Screen reader announcements

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Events` - Event handling

## File Location

`/public/assets/js/components/dashboard-grid.js`

## See Also

- [Funky.WidgetCatalog](widget-catalog.md) - Widget browser modal
- [Funky.WidgetPalette](widget-palette.md) - Sidebar widget picker
