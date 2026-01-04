# Funky.WidgetCatalog

Modal-based widget browser for selecting and adding widgets to DashboardGrid.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Overview

`Funky.WidgetCatalog` provides a browsable, searchable catalog of available widget types. Users can preview widgets and add them to a dashboard grid.

## Quick Start

```javascript
// Create catalog for a grid instance
var catalog = Funky.WidgetCatalog.init({
  grid: dashboardGridInstance,
  onAdd: function(type, config) {
    console.log('Added widget:', type);
  }
});

// Open the catalog
catalog.open();
```

## API Reference

### Factory Methods

#### `Funky.WidgetCatalog.init(options)`

Create a widget catalog instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| grid | DashboardGrid | Yes | Target grid instance |
| onAdd | function | No | Callback when widget added |
| onClose | function | No | Callback when modal closed |

---

### Instance Methods

#### `open()`

Open the catalog modal. Sets `isOpen` to `true`.

---

#### `close()`

Close the catalog modal. Sets `isOpen` to `false`.

---

#### `toggle()`

Toggle the catalog visibility. Opens if closed, closes if open.

**Returns:** `WidgetCatalog` instance for chaining.

---

#### `setCategory(category)`

Filter by category.

---

#### `search(query)`

Filter by search term.

---

#### `selectWidget(type)`

Select a widget type.

---

#### `addSelected()`

Add the selected widget to the grid.

---

#### `destroy()`

Clean up and remove the catalog.

---

## Modal Layout

The catalog modal includes:

1. **Sidebar** - Category filter and search
2. **Grid** - Widget type cards
3. **Preview** - Selected widget details
4. **Footer** - Add button

## Widget Metadata

Widget types provide metadata for the catalog:

```javascript
Funky.DashboardGrid.registerWidgetType('chart', {
  // Required for catalog display
  meta: {
    name: 'Chart',
    icon: 'fa-chart-line',
    category: 'Visualization',
    description: 'Interactive data charts',
    preview: '<img src="chart-preview.png">',
    defaultConfig: {
      width: 4,
      height: 3
    }
  },
  render: function(widget, container) {
    // Render implementation
  }
});
```

## Categories

Widget types are grouped by category:

| Category | Description |
|----------|-------------|
| Data | Data display widgets |
| Visualization | Charts and graphs |
| Content | Text, HTML, media |
| Navigation | Links, menus |
| Forms | Input widgets |
| Layout | Containers, grids |

## CSS Classes

| Class | Description |
|-------|-------------|
| `.widget-catalog` | Main container |
| `.widget-catalog__overlay` | Modal overlay |
| `.widget-catalog__dialog` | Modal dialog |
| `.widget-catalog__sidebar` | Left sidebar |
| `.widget-catalog__search` | Search input |
| `.widget-catalog__categories` | Category list |
| `.widget-catalog__category` | Category button |
| `.widget-catalog__category--active` | Active category |
| `.widget-catalog__grid` | Widget cards grid |
| `.widget-catalog__card` | Widget card |
| `.widget-catalog__card--selected` | Selected card |
| `.widget-catalog__preview` | Preview panel |
| `.widget-catalog__add-btn` | Add button |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `Arrow keys` | Navigate cards |
| `Enter` | Select/Add widget |
| `Tab` | Move focus |

## Usage Patterns

### Toolbar Integration

```javascript
var catalog = Funky.WidgetCatalog.init({ grid: grid });

D.one('#add-widget-btn').on('click', function() {
  catalog.open();
});
```

### Custom Add Handler

```javascript
var catalog = Funky.WidgetCatalog.init({
  grid: grid,
  onAdd: function(type, config) {
    // Customize config before adding
    config.title = prompt('Widget title?') || type;
    
    // Return false to prevent default add
    // Return true or undefined to allow
    grid.addWidget(config);
    return false;
  }
});
```

## Accessibility

- Modal has `role="dialog"` and `aria-modal`
- Focus trapped within modal
- Escape key closes modal
- Screen reader announcements

## File Location

`/public/assets/js/components/widget-catalog.js`

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Events` - Event handling
- `Funky.DashboardGrid` - Grid instance

## See Also

- [Funky.DashboardGrid](dashboard-grid.md) - Dashboard grid
- [Funky.WidgetPalette](widget-palette.md) - Sidebar alternative
