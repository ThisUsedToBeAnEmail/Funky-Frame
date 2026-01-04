# Funky.CardGrid - Responsive Data Card Layout

Responsive grid component for displaying data as cards with custom templates, selection, filtering, sorting, pagination, and virtualization support.

## Overview

`Funky.CardGrid` provides a flexible grid layout for displaying data as cards. Features include custom card templates via `renderCard` function, multiple layout modes (grid/list), sorting and filtering, selection (single/multi/none), pagination, infinite scroll, and virtualization for large datasets.

## Quick Start

```javascript
var grid = Funky.CardGrid.init('#products', {
    items: productData,
    selectable: 'multi',
    searchable: true,
    sortable: true,
    renderCard: function(item) {
        return '<div class="product-card">' +
            '<img src="' + item.image + '" alt="' + item.name + '">' +
            '<h3>' + item.name + '</h3>' +
            '<p>' + item.price + '</p>' +
        '</div>';
    }
});
```

---

## API Reference

### Factory Methods

#### `CardGrid.init(container, options)`

Initialize a new CardGrid instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | Yes | CSS selector or DOM element |
| options | object | No | Configuration options |

**Returns:** CardGridInstance

**Example:**
```javascript
var grid = Funky.CardGrid.init('#container', {
    items: myData,
    columns: 3,
    selectable: 'multi'
});
```

---

#### `CardGrid.create(container, options)` *(deprecated)*

Alias for `init()`. Use `init()` instead.

---

#### `CardGrid.getInstance(id)`

Get an instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

**Returns:** CardGridInstance or null

---

#### `CardGrid.getInstanceByElement(element)`

Get instance by container element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | HTMLElement | Yes | Container element |

**Returns:** CardGridInstance or null

---

#### `CardGrid.destroy(id)`

Destroy a CardGrid instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

---

#### `CardGrid.destroyAll()`

Destroy all CardGrid instances.

---

## Configuration Options

### Data Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | array | `[]` | Initial items array |
| `url` | string | `null` | API URL for remote data |
| `idField` | string | `'id'` | Field name for unique item ID |

### Layout Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | number\|string | `'auto'` | Number of columns or `'auto'` |
| `gap` | string | `'md'` | Gap size: `'sm'`, `'md'`, `'lg'` |
| `layout` | string | `'grid'` | Layout mode: `'grid'` or `'list'` |
| `cardMinWidth` | string | `'280px'` | Minimum card width (for auto columns) |

### Pagination Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pagination` | boolean | `false` | Enable pagination |
| `pageSize` | number | `12` | Items per page |

### Feature Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searchable` | boolean | `false` | Enable search toolbar |
| `sortable` | boolean | `false` | Enable sort dropdown |
| `viewToggle` | boolean | `false` | Enable grid/list toggle |
| `selectable` | boolean\|string | `false` | Selection mode: `false`, `'single'`, `'multi'` |
| `checkboxPosition` | string | `'top-left'` | Checkbox position: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'` |

### Search Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `searchFields` | array | `['title', 'name', 'description']` | Fields to search in |

### Sort Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sortFields` | array | `[]` | Available sort fields: `[{ field: 'name', label: 'Name' }]` |
| `defaultSort` | string | `null` | Default sort field |
| `defaultSortDirection` | string | `'asc'` | Default direction: `'asc'` or `'desc'` |

### Virtualization Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `virtualize` | boolean\|string | `'auto'` | Enable virtualization: `true`, `false`, `'auto'` |
| `virtualizeThreshold` | number | `100` | Enable when items exceed this count |
| `rowHeight` | number\|string | `'auto'` | Row height for virtualization |
| `overscan` | number | `3` | Extra rows above/below viewport |
| `containerHeight` | string | `'600px'` | Height of virtualized container |

### Animation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `animate.cards` | boolean | `true` | Animate card entrance |
| `animate.addRemove` | boolean | `true` | Animate add/remove |
| `animate.stagger` | number | `50` | Stagger delay in ms |

### LiveBinding Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `liveBinding` | object | `null` | LiveBinding configuration for real-time updates |

### Render Function

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `renderCard` | function | `null` | Custom card render function: `function(item) { return html; }` |

### Callbacks

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onCardClick` | function | `null` | Called when card is clicked: `function(item, event)` |
| `onSelect` | function | `null` | Called when selection changes: `function(selectedIds, selectedItems)` |
| `onSearch` | function | `null` | Called on search: `function(query, results)` |
| `onSort` | function | `null` | Called on sort: `function(field, direction)` |
| `onViewChange` | function | `null` | Called on view change: `function(view)` |
| `onLoad` | function | `null` | Called after data load: `function(items)` |
| `onLoadError` | function | `null` | Called on load error: `function(error)` |

---

## Instance Methods

### Data Methods

#### `setItems(items)`

Set the items array (replaces existing items).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| items | array | Yes | Array of item objects |

**Returns:** CardGridInstance

**Example:**
```javascript
grid.setItems([
    { id: 1, name: 'Product A', price: '$99' },
    { id: 2, name: 'Product B', price: '$149' }
]);
```

---

#### `addItems(items)`

Add items to the grid.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| items | array | Yes | Items to add |

**Returns:** CardGridInstance

---

#### `removeItem(id)`

Remove an item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID to remove |

**Returns:** CardGridInstance

---

#### `getItems()`

Get all items.

**Returns:** Array of item objects

---

#### `getItem(id)`

Get a single item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID |

**Returns:** Item object or undefined

---

#### `updateItem(id, updates)`

Update an existing item.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID |
| updates | object | Yes | Object with fields to update |

**Returns:** CardGridInstance

---

### Selection Methods

#### `select(id)`

Select an item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID |

**Returns:** CardGridInstance

---

#### `selectAll()`

Select all items.

**Returns:** CardGridInstance

---

#### `deselect(id)`

Deselect an item by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID |

**Returns:** CardGridInstance

---

#### `clearSelection()`

Clear all selections.

**Returns:** CardGridInstance

---

#### `getSelected()`

Get selected item IDs and data.

**Returns:** Object `{ ids: Set, items: Array }`

---

### Layout Methods

#### `setView(view)`

Set the layout view.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| view | string | Yes | `'grid'` or `'list'` |

**Returns:** CardGridInstance

---

#### `getView()`

Get current view mode.

**Returns:** String `'grid'` or `'list'`

---

#### `setColumns(columns)`

Set number of columns.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| columns | number\|string | Yes | Number or `'auto'` |

**Returns:** CardGridInstance

---

#### `setGap(gap)`

Set gap between cards.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| gap | string | Yes | `'sm'`, `'md'`, or `'lg'` |

**Returns:** CardGridInstance

---

#### `setCardMinWidth(minWidth)`

Set minimum card width.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| minWidth | string | Yes | CSS width value (e.g., `'300px'`) |

**Returns:** CardGridInstance

---

### Filter & Search Methods

#### `search(query)`

Search/filter items.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search query |

**Returns:** CardGridInstance

---

#### `filter(fn)`

Apply custom filter function.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fn | function | Yes | Filter function: `function(item) { return boolean; }` |

**Returns:** CardGridInstance

**Example:**
```javascript
grid.filter(function(item) {
    return item.price > 100;
});
```

---

#### `clearFilters()`

Clear all filters and search.

**Returns:** CardGridInstance

---

### Sort Methods

#### `sort(field, direction)`

Sort items.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| field | string | Yes | Field name to sort by |
| direction | string | No | `'asc'` or `'desc'` (default: `'asc'`) |

**Returns:** CardGridInstance

---

### Pagination Methods

#### `goToPage(page)`

Navigate to a specific page.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | number | Yes | Page number (1-based) |

**Returns:** CardGridInstance

---

#### `loadMore()`

Load next page of items (infinite scroll).

**Returns:** CardGridInstance

---

#### `reload()`

Reload data from source.

**Returns:** CardGridInstance

---

### Navigation Methods

#### `scrollToItem(id)`

Scroll to a specific item.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string\|number | Yes | Item ID |

**Returns:** CardGridInstance

---

### Lifecycle

#### `destroy()`

Destroy the instance and clean up.

---

## Examples

### Basic Grid with Selection

```javascript
var grid = Funky.CardGrid.init('#products', {
    items: products,
    columns: 4,
    selectable: 'multi',
    renderCard: function(item) {
        return '<div class="product-card">' +
            '<img src="' + item.image + '">' +
            '<h4>' + item.name + '</h4>' +
            '<p class="price">' + item.price + '</p>' +
        '</div>';
    },
    onSelect: function(ids, items) {
        console.log('Selected:', ids.size, 'items');
    }
});
```

### Searchable & Sortable Grid

```javascript
var grid = Funky.CardGrid.init('#users', {
    url: '/api/users',
    searchable: true,
    sortable: true,
    sortFields: [
        { field: 'name', label: 'Name' },
        { field: 'created_at', label: 'Date Joined' }
    ],
    defaultSort: 'name',
    renderCard: function(user) {
        return '<div class="user-card">' +
            '<img src="' + user.avatar + '" class="avatar">' +
            '<h4>' + user.name + '</h4>' +
            '<p>' + user.email + '</p>' +
        '</div>';
    }
});
```

### Paginated Grid

```javascript
var grid = Funky.CardGrid.init('#articles', {
    url: '/api/articles',
    pagination: true,
    pageSize: 9,
    columns: 3,
    renderCard: function(article) {
        return '<article>' +
            '<img src="' + article.thumbnail + '">' +
            '<h3>' + article.title + '</h3>' +
            '<p>' + article.excerpt + '</p>' +
        '</article>';
    }
});
```

### Virtualized Grid (Large Datasets)

```javascript
var grid = Funky.CardGrid.init('#large-list', {
    items: largeDataset,  // 1000+ items
    virtualize: true,
    containerHeight: '800px',
    rowHeight: 200,
    columns: 4,
    renderCard: function(item) {
        return '<div class="card">' + item.title + '</div>';
    }
});
```

### With LiveBinding (Real-time Updates)

```javascript
var grid = Funky.CardGrid.init('#live-grid', {
    url: '/api/tasks',
    liveBinding: {
        source: 'websocket',
        channel: 'tasks:updates',
        keyField: 'id'
    },
    renderCard: function(task) {
        return '<div class="task-card">' +
            '<h4>' + task.title + '</h4>' +
            '<span class="status">' + task.status + '</span>' +
        '</div>';
    }
});
```

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-card-grid` | Main container |
| `.funky-card-grid__toolbar` | Toolbar container |
| `.funky-card-grid__grid` | Cards grid container |
| `.funky-card-grid__card` | Individual card wrapper |
| `.funky-card-grid__card--selected` | Selected card state |
| `.funky-card-grid--list` | List view mode |
| `.funky-card-grid--grid` | Grid view mode |

---

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Registry` - Instance management
- `Funky.LiveBinding` (optional) - Real-time updates
- `Funky.Announce` (optional) - Accessibility announcements

## See Also

- [Funky.Table](table.md) - Data table component
- [Funky.LiveBinding](../core/live-binding.md) - Real-time data binding
