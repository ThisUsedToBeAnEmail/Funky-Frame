# Funky.WidgetPalette

Collapsible sidebar with draggable widget cards for adding widgets to DashboardGrid.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Overview

`Funky.WidgetPalette` provides a sidebar panel where users can browse widget types and drag them onto a dashboard grid. Categories can be collapsed and widgets can be searched.

## Quick Start

```javascript
// Create palette for a grid instance
var palette = Funky.WidgetPalette.init({
  grid: dashboardGridInstance,
  position: 'left',
  collapsed: false
});

// Toggle the palette
palette.toggle();
```

## API Reference

### Factory Methods

#### `Funky.WidgetPalette.init(options)`

Create a widget palette instance.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| grid | DashboardGrid | - | Target grid instance |
| position | string | `'left'` | `'left'` or `'right'` |
| collapsed | boolean | `true` | Start collapsed |
| container | Element | `body` | Container element |

---

### Instance Methods

#### `expand()`

Expand the sidebar.

---

#### `collapse()`

Collapse the sidebar.

---

#### `toggle()`

Toggle collapsed/expanded state.

---

#### `isCollapsed()`

Check if collapsed.

**Returns:** `boolean`

---

#### `search(query)`

Filter widgets by search term.

---

#### `toggleCategory(name)`

Collapse/expand a category.

---

#### `refresh()`

Refresh widget list from registry.

---

#### `destroy()`

Clean up and remove the palette.

---

## Layout

The palette includes:

1. **Toggle button** - Collapse/expand handle
2. **Header** - Title and close button
3. **Search** - Widget filter input
4. **Categories** - Collapsible groups
5. **Cards** - Draggable widget items

## Drag and Drop

Widgets are added by dragging from the palette to the grid:

1. Press and hold on a widget card
2. Drag over the grid
3. Drop zone highlights valid positions
4. Release to add widget

## Widget Categories

Categories are defined in widget metadata:

```javascript
Funky.DashboardGrid.registerWidgetType('chart', {
  meta: {
    name: 'Chart',
    category: 'Visualization',
    icon: 'fa-chart-line'
  }
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.widget-palette` | Main container |
| `.widget-palette--collapsed` | Collapsed state |
| `.widget-palette--left` | Left position |
| `.widget-palette--right` | Right position |
| `.widget-palette__toggle` | Toggle button |
| `.widget-palette__panel` | Panel container |
| `.widget-palette__search` | Search container |
| `.widget-palette__category` | Category group |
| `.widget-palette__category--collapsed` | Collapsed category |
| `.widget-palette__card` | Widget card |
| `.widget-palette__card--dragging` | Being dragged |
| `.widget-palette__drag-proxy` | Drag preview |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate elements |
| `Enter` | Toggle category / Start drag |
| `Escape` | Collapse palette |
| `Arrow keys` | Navigate cards |

## Usage Patterns

### Left Sidebar

```javascript
var palette = Funky.WidgetPalette.init({
  grid: grid,
  position: 'left',
  collapsed: true
});
```

### Right Sidebar

```javascript
var palette = Funky.WidgetPalette.init({
  grid: grid,
  position: 'right',
  collapsed: false
});
```

### Edit Mode Only

```javascript
// Show palette only in edit mode
Funky.PubSub.on('funky:dashboard-grid:edit-mode', function(data) {
  if (data.editable) {
    palette.expand();
  } else {
    palette.collapse();
  }
});
```

## Touch Support

The palette supports touch devices:
- Touch and hold to start drag
- Visual feedback during drag
- Touch-friendly card sizing

## Accessibility

- Keyboard navigation
- ARIA labels on controls
- Focus management
- Screen reader support for drag operations

## File Location

`/public/assets/js/components/widget-palette.js`

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Events` - Event handling
- `Funky.DashboardGrid` - Grid instance

## See Also

- [Funky.DashboardGrid](dashboard-grid.md) - Dashboard grid
- [Funky.WidgetCatalog](widget-catalog.md) - Modal alternative
