# Funky.FilterToolbar - Saved Filters Management

Manages saved filters dropdown and filter state persistence with URL sharing support.

## Overview

`Funky.FilterToolbar` provides a toolbar for managing saved filters with quick access dropdown, URL persistence for shareable links, and integration with DataTables.

## API Reference

### Constructor

#### `Funky.FilterToolbar.create(config)`

Create a filter toolbar.

**Config Options:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| context | string | Yes | Filter context (e.g., 'trades') |
| toolbarSelector | string | Yes | CSS selector for toolbar container |
| dataTable | DataTable | No | DataTables instance |
| onFilterChange | function | No | Callback when filters change |
| savedFiltersEnabled | boolean | No | Enable saved filters (default: true) |
| quickFiltersEnabled | boolean | No | Enable quick filters (default: true) |
| persistToUrl | boolean | No | Save to URL hash (default: true) |

### Instance Methods

#### `toolbar.loadSavedFilters()`

Load saved filters from server.

**Returns:** `Promise<void>`

---

#### `toolbar.saveFilter(name, filters)`

Save current filters with a name.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Filter name |
| filters | object | Yes | Filter values |

**Returns:** `Promise<void>`

---

#### `toolbar.applyFilter(filterId)`

Apply a saved filter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filterId | string | Yes | Saved filter ID |

---

#### `toolbar.deleteFilter(filterId)`

Delete a saved filter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filterId | string | Yes | Saved filter ID |

**Returns:** `Promise<void>`

---

#### `toolbar.clearFilters()`

Clear all active filters.

---

#### `toolbar.getFiltersFromUrl()`

Get filters from URL hash.

**Returns:** `Object` - Filter values

---

#### `toolbar.updateUrl(filters)`

Update URL hash with current filters.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filters | object | Yes | Filter values |

## URL Persistence

Filters are encoded in the URL hash for sharing:
```
/web/trades#filters={"status":"active","client_id":"123"}
```

## Dependencies

- jQuery
- `Funky.Api` - For saved filters
- `Funky.Storage` - For session caching

## Examples

### Basic Setup

```javascript
var toolbar = Funky.FilterToolbar.create({
  context: 'trades',
  toolbarSelector: '#filterToolbar',
  dataTable: tradesTable,
  onFilterChange: function(filters) {
    console.log('Filters changed:', filters);
    // Update DataTable ajax data
    tradesTable.ajax.reload();
  }
});
```

### Quick Filters

```html
<div id="filterToolbar">
  <div class="quick-filters">
    <button data-quick-filter='{"status":"active"}'>Active</button>
    <button data-quick-filter='{"status":"pending"}'>Pending</button>
    <button data-quick-filter='{"created_today":true}'>Today</button>
  </div>
  <div class="saved-filters-dropdown">
    <!-- Populated dynamically -->
  </div>
</div>
```

### Share Filtered View

```javascript
// Copy shareable link
$('#shareBtn').on('click', function() {
  var url = window.location.origin + window.location.pathname + '#filters=' + 
    encodeURIComponent(JSON.stringify(toolbar.currentFilters));
  
  navigator.clipboard.writeText(url);
  Funky.Toast.success('Link copied to clipboard');
});
```

---

## Bindable Interface (LiveBinding)

FilterToolbar supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by container ID
var instance = Funky.FilterToolbar._instances['filterToolbar'];
```

### Bindable Methods

#### `setData(filters)`

Update the toolbar's filter state.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| filters | object | Filter values to apply |

**Example:**
```javascript
var toolbar = Funky.FilterToolbar._instances['filterToolbar'];
toolbar.setData({
  status: 'active',
  date_range: 'last_7_days',
  client_id: ['123', '456']
});
```

---

#### `getData()`

Get the current filter values.

**Returns:** `Object` - Current filter state

**Example:**
```javascript
var toolbar = Funky.FilterToolbar._instances['filterToolbar'];
var filters = toolbar.getData();
console.log(filters.status);     // 'active'
console.log(filters.date_range); // 'last_7_days'
```

### LiveBinding Integration

```javascript
// Bind toolbar filters to a state source
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'activeFilters' },
  target: {
    type: 'component',
    component: 'FilterToolbar',
    instance: 'filterToolbar'
  }
});

// Update filters reactively
Funky.LiveBinding.setState('activeFilters', {
  status: 'pending',
  priority: 'high'
});
```
