# Funky.BulkActions - Row Selection and Bulk Operations

Multi-select functionality for Funky.Table with a floating action toolbar for performing batch operations on selected items.

## Overview

`Funky.BulkActions` integrates with `Funky.Table` to provide:
- Selection-aware action bar that shows/hides based on selection
- Configurable action buttons with callbacks
- Dynamic action management via ActionRegistry
- Full LiveBinding support for reactive data flow

## API Reference

### Constructor

#### `Funky.BulkActions.create(config)`

Create bulk actions for a Funky.Table.

**Config Options:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| table | Funky.Table | Yes* | Funky.Table instance |
| tableSelector | string | Yes* | CSS selector for table container (alternative to table) |
| actions | array | Yes | Array of action configurations |
| onAction | function | Yes | Callback when action triggered |
| barPosition | string | No | Toolbar position: 'top' or 'bottom' (default: 'top') |
| barClass | string | No | Additional CSS class for action bar |
| showCount | boolean | No | Show selection count badge (default: true) |
| showClear | boolean | No | Show clear selection button (default: true) |
| animation | boolean | No | Animate bar show/hide (default: true) |

*Either `table` or `tableSelector` is required.

**Action Config:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Action identifier |
| label | string | Yes | Button label |
| icon | string | No | FontAwesome icon class (e.g., 'fa-trash') |
| variant | string | No | Bootstrap variant (default: 'primary') |
| order | number | No | Sort order (default: 50) |
| hidden | boolean | No | Hide action (default: false) |
| disabled | boolean | No | Disable action (default: false) |

### Selection Methods

#### `bulk.getSelectedItems()`

Get array of selected row data objects.

**Returns:** `Object[]` - Array of row data

---

#### `bulk.getSelectedIds()`

Get array of selected row IDs.

**Returns:** `string[]` - Array of selected IDs

---

#### `bulk.getSelectionCount()`

Get count of selected rows.

**Returns:** `number` - Selection count

---

#### `bulk.select(ids)`

Select rows by ID via the underlying Funky.Table.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ids | string/array | Yes | ID or array of IDs to select |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.deselect(ids)`

Deselect rows by ID via the underlying Funky.Table.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ids | string/array | Yes | ID or array of IDs to deselect |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.selectAll()`

Select all rows via the underlying Funky.Table.

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.clearSelection()`

Deselect all rows via the underlying Funky.Table.

**Returns:** `BulkActions` - this for chaining

### Action Registry Methods

#### `bulk.addAction(action)`

Dynamically add a new action button.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | Object | Yes | Action config (requires id) |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.removeAction(id)`

Remove an action by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Action identifier |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.setActionEnabled(id, enabled)`

Enable or disable an action.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Action identifier |
| enabled | boolean | Yes | Whether action is enabled |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.setActionVisible(id, visible)`

Show or hide an action.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Action identifier |
| visible | boolean | Yes | Whether action is visible |

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.getAction(id)`

Get action config by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Action identifier |

**Returns:** `Object|null` - Action config or null

### Utility Methods

#### `bulk.getTable()`

Get the underlying Funky.Table instance.

**Returns:** `Funky.Table` - Table instance

---

#### `bulk.refresh()`

Re-sync UI with current table selection state.

**Returns:** `BulkActions` - this for chaining

---

#### `bulk.destroy()`

Remove bulk actions and cleanup all event listeners.

## Callback

The `onAction` callback receives:
```javascript
function onAction(actionId, selectedItems, table) {
  // actionId: string - The action that was triggered
  // selectedItems: Object[] - Full row data for selected items
  // table: Funky.Table - The table instance
}
```

## Events

### PubSub Events

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:bulk-actions:selection-changed` | `{ count, items, ids }` | Selection changed |
| `funky:bulk-actions:action` | `{ actionId, items, table }` | Action button clicked |

## Dependencies

- `Funky.Table` (required - must have selection enabled with `selectable: 'multi'`)
- `Funky.ActionRegistry` (for dynamic action management)
- `Funky.PubSub` (for event handling)
- `Funky.Toast` (optional, for confirmations)

## Examples

### Basic Setup with Funky.Table

```javascript
// Create table with multi-select enabled
var table = Funky.Table.init('#tradesTable', {
  selectable: 'multi',
  idField: 'trade_id',
  columns: [
    { data: 'trade_id', title: 'ID' },
    { data: 'symbol', title: 'Symbol' },
    { data: 'quantity', title: 'Qty' }
  ],
  data: trades
});

// Attach bulk actions
var bulk = Funky.BulkActions.create({
  table: table,
  actions: [
    { id: 'delete', label: 'Delete', icon: 'fa-trash', variant: 'danger' },
    { id: 'export', label: 'Export', icon: 'fa-download' },
    { id: 'archive', label: 'Archive', icon: 'fa-archive', variant: 'warning' }
  ],
  onAction: function(actionId, selectedItems, table) {
    var ids = selectedItems.map(function(row) { return row.trade_id; });

    switch (actionId) {
      case 'delete':
        Funky.Api.post('/api/trades/bulk-delete', { ids: ids }).then(function() {
          Funky.Toast.success('Deleted ' + ids.length + ' trades');
          table.reload();
        });
        break;
      case 'export':
        window.location.href = '/api/trades/export?ids=' + ids.join(',');
        break;
      case 'archive':
        Funky.Api.post('/api/trades/archive', { ids: ids }).then(function() {
          Funky.Toast.success('Archived ' + ids.length + ' trades');
        });
        break;
    }
  }
});
```

### Using tableSelector Instead of Table Instance

```javascript
// If table is already created and you want to attach by selector
var bulk = Funky.BulkActions.create({
  tableSelector: '#tradesTable',
  actions: [
    { id: 'delete', label: 'Delete', icon: 'fa-trash', variant: 'danger' }
  ],
  onAction: function(actionId, selectedItems) {
    console.log('Action:', actionId, 'Items:', selectedItems);
  }
});
```

### Dynamic Action Management

```javascript
// Add action dynamically
bulk.addAction({
  id: 'email',
  label: 'Send Email',
  icon: 'fa-envelope',
  variant: 'info',
  order: 10  // Appears first
});

// Disable an action conditionally
if (!userCanDelete) {
  bulk.setActionEnabled('delete', false);
}

// Hide an action
bulk.setActionVisible('archive', false);

// Remove an action
bulk.removeAction('export');
```

### Selection Control

```javascript
// Programmatic selection
bulk.selectAll();
bulk.clearSelection();

// Select specific items
bulk.select(['id_001', 'id_002', 'id_003']);

// Deselect specific items
bulk.deselect(['id_002']);

// Check selection
var count = bulk.getSelectionCount();
var items = bulk.getSelectedItems();
var ids = bulk.getSelectedIds();
```

### Listen to Selection Events

```javascript
Funky.PubSub.on('funky:bulk-actions:selection-changed', function(data) {
  console.log('Selected count:', data.count);
  console.log('Selected IDs:', data.ids);

  // Update UI based on selection
  updateSelectionSummary(data.items);
});

Funky.PubSub.on('funky:bulk-actions:action', function(data) {
  console.log('Action triggered:', data.actionId);
  console.log('On items:', data.items);
});
```

---

## Bindable Interface (LiveBinding)

BulkActions supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by table ID
var instance = Funky.BulkActions.getInstance('tradesTable');
```

### Bindable Methods

#### `setData(containerId, items)`

Set the selected items programmatically via LiveBinding.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| containerId | string | Table container ID |
| items | array | Array of item IDs to select |

**Example:**
```javascript
Funky.BulkActions.setData('tradesTable', ['id_001', 'id_002', 'id_003']);
```

---

#### `getData(containerId)`

Get the currently selected items.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| containerId | string | Table container ID |

**Returns:** `Array` - Array of selected item data

**Example:**
```javascript
var selected = Funky.BulkActions.getData('tradesTable');
console.log(selected); // [{trade_id: 'id_001', ...}, ...]
```

### LiveBinding Integration

```javascript
// Bind selection state to a data source
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'selectedItems' },
  target: {
    type: 'component',
    component: 'BulkActions',
    instance: 'tradesTable'
  }
});

// Update selection reactively
Funky.LiveBinding.setState('selectedItems', ['id_100', 'id_101']);

// Read selection from bound state
var currentSelection = Funky.LiveBinding.getState('selectedItems');
```

---

## Funky.Table Selection Requirements

For BulkActions to work, your Funky.Table must have selection enabled:

```javascript
var table = Funky.Table.init('#myTable', {
  // Enable multi-select (required for BulkActions)
  selectable: 'multi',  // or 'single', 'os'

  // Optional: specify which field is the row ID
  idField: 'id',  // default is 'id'

  // Optional: selection callbacks
  onSelect: function(data, table) {
    console.log('Selected:', data);
  },
  onDeselect: function(data, table) {
    console.log('Deselected:', data);
  }
});
```

### Selection Modes

| Mode | Description |
|------|-------------|
| `'multi'` | Click to toggle selection, multiple rows allowed |
| `'single'` | Only one row selected at a time |
| `'os'` | OS-style selection (Shift+click for range, Ctrl+click for toggle) |

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.bulk-action-bar` | Main action bar container |
| `.bulk-action-bar-inner` | Inner flex container |
| `.selected-count` | Selection count badge |
| `.bulk-actions-buttons` | Action buttons container |
| `.btn-clear-selection` | Clear selection button |
