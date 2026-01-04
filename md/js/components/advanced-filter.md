# Funky.AdvancedFilter - Comprehensive Filtering System

Powerful filtering system with URL persistence, saved templates, keyboard shortcuts, and visual filter chips.

## Overview

`Funky.AdvancedFilter` provides comprehensive filtering capabilities for Funky.Table with support for multi-select fields, date ranges, numeric ranges, and saved filter templates.

## Quick Start

The simplest way to use AdvancedFilter:

```javascript
// Basic usage with entity type
Funky.AdvancedFilter.init('#filterBtn', {
  entityType: 'trade',
  dataTable: tradesTable
});
```

The component will automatically derive the endpoints from the entity type:
- `optionsEndpoint` → `/api/filter_options?entity=trade`
- `savedFiltersEndpoint` → `/api/saved_filters`
- `context` → `trade_filters`

## API Reference

### Static Methods

#### `AdvancedFilter.init(buttonSelector, config)`

Initialize filter with a button trigger. This is the **recommended** way to use the component.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| buttonSelector | string | Yes | CSS selector for trigger button |
| config | object | Yes | Filter configuration |

**Config Options:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| entityType | string | Yes | - | Entity type ('trade', 'trade_action', or custom) |
| optionsEndpoint | string | No | Derived | Custom API endpoint for filter field options |
| savedFiltersEndpoint | string | No | `/api/saved_filters` | Custom API endpoint for saved filters CRUD |
| context | string | No | Derived | Filter context name for storage/grouping |
| dataTable | Funky.Table | No | null | Funky.Table instance to auto-apply filters |
| extraAjaxData | object | No | {} | Reference to table ajax data object |
| additional_params | function | No | null | Function returning extra params for options API |
| onApply | function | No | null | Callback when filters are applied |
| onClear | function | No | null | Callback when filters are cleared |
| onFilterStateChange | function | No | null | Callback when filter state changes |

**Example with custom endpoints:**
```javascript
Funky.AdvancedFilter.init('#filterBtn', {
  entityType: 'playground',
  optionsEndpoint: '/api/playground/filter_options',
  savedFiltersEndpoint: '/api/playground/saved_filters',
  context: 'playground_demo',
  onApply: function(filters) {
    console.log('Filters applied:', filters);
  },
  onClear: function() {
    console.log('Filters cleared');
  }
});
```

### Constructor

#### `Funky.AdvancedFilter.create(config)`

Create a new AdvancedFilter instance directly (advanced usage).

**Config Options:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| context | string | Yes | Filter context key (e.g., 'trade_filters') |
| optionsEndpoint | string | Yes | API endpoint for filter options |
| savedFiltersEndpoint | string | No | API endpoint for saved filters |
| dataTable | Funky.Table | Yes | Funky.Table instance to filter |
| extraAjaxData | object | No | Reference to table ajax data |
| multiSelectFields | string[] | No | Fields supporting multiple values |
| rangeFields | string[] | No | Fields supporting min/max ranges |
| dateFields | string[] | No | Fields with date pickers |

**Returns:** `AdvancedFilter` - Filter instance

### Instance Methods

#### `filter.submitFilters()`

Submit the filter form and apply filters to the table.

#### `filter.applyFilters(params, filterHash)`

Apply filters programmatically.

| Name | Type | Required | Description |
|------|------|----------|-------------|
| params | object | Yes | Filter key-value pairs |
| filterHash | string | No | Optional URL hash for the filter state |

#### `filter.resetFilters()`

Clear all filters and reset the form.

#### `filter.serializeFilters(formData)`

Get current filter values from a FormData object.

| Name | Type | Required | Description |
|------|------|----------|-------------|
| formData | FormData | Yes | FormData from the filter form |

**Returns:** `Object` - Filter key-value pairs

#### `filter.populateForm(params)`

Set filters programmatically and populate the form fields.

| Name | Type | Required | Description |
|------|------|----------|-------------|
| params | object | Yes | Filter key-value pairs |

#### `filter.loadSavedFilter(filterId, isAutoLoad)`

Load a saved filter by ID.

| Name | Type | Required | Description |
|------|------|----------|-------------|
| filterId | number | Yes | Saved filter ID |
| isAutoLoad | boolean | No | Whether this is an automatic load (default filter) |

#### `filter.hasActiveFilters()`

Check if there are currently active filters.

**Returns:** `boolean` - True if filters are applied

## API Endpoints

### Filter Options Endpoint

The `optionsEndpoint` should return:

```json
{
  "multi_select_fields": [
    { "name": "status", "options": [{ "value": "active", "label": "Active" }] }
  ],
  "range_fields": [
    { "name": "amount", "label": "Amount" }
  ],
  "date_fields": [
    { "name": "created_at", "label": "Created Date" }
  ]
}
```

### Saved Filters Endpoint

The `savedFiltersEndpoint` should support:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List saved filters |
| POST | `/` | Create new filter |
| GET | `/:id` | Get filter by ID |
| PUT | `/:id` | Update filter |
| DELETE | `/:id` | Delete filter |

## Features

### URL Persistence

Filters are saved in the URL hash for shareable links:
```
/web/trades#filter=abc123
```

### Saved Templates

Users can save filter combinations via the UI or programmatically.

### Visual Filter Chips

Active filters display as removable chips in the filter toolbar.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Shift+F` | Open filter modal |
| `Escape` | Close modal |
| `Enter` | Apply filters |

## Dependencies

- jQuery
- Bootstrap 5 (for modals)
- `Funky.CSRF` - For secure API calls
- `Funky.Toast` - For notifications (optional)

## Examples

### Standard Usage (Recommended)

```javascript
// Let the component derive endpoints from entityType
Funky.AdvancedFilter.init('#filterBtn', {
  entityType: 'trade',
  dataTable: tradesTable,
  onApply: function(filters) {
    console.log('Applied filters:', filters);
  }
});
```

### Custom Endpoints (for testing/playground)

```javascript
// Use custom mock endpoints
Funky.AdvancedFilter.init('#filterBtn', {
  entityType: 'playground',
  optionsEndpoint: '/api/playground/filter_options',
  savedFiltersEndpoint: '/api/playground/saved_filters',
  context: 'playground_demo',
  onApply: function(filters) {
    console.log('Applied:', filters);
  },
  onClear: function() {
    console.log('Cleared');
  }
});
```

### Direct Constructor Usage

```javascript
var advFilter = Funky.AdvancedFilter.create({
  context: 'trade_filters',
  optionsEndpoint: '/api/filter_options?entity=trade',
  savedFiltersEndpoint: '/api/saved_filters',
  dataTable: tradesTable,
  multiSelectFields: ['client_id', 'status'],
  rangeFields: ['quantity', 'trade_value'],
  dateFields: ['trade_date', 'created_at']
});

$('#advFilterBtn').on('click', function() {
  advFilter.open();
});
```

### Programmatic Filtering

```javascript
// Get the instance and set filters
var filter = Funky.AdvancedFilter.init('#btn', { entityType: 'trade' });
filter.setFilters({
  client_id: ['123', '456'],
  status: 'active',
  trade_date_from: '2024-01-01'
});
filter.apply();
```

---

## Bindable Interface (LiveBinding)

AdvancedFilter supports the LiveBinding system for reactive data updates.

### Instance Registry

```javascript
// Access instances by context
const instance = Funky.AdvancedFilter._instances['trade_filters'];
```

### Bindable Methods

#### `setData(config)`

Update the filter configuration and state.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config | object | Filter configuration object |

**Example:**
```javascript
const filter = Funky.AdvancedFilter._instances['trade_filters'];
filter.setData({
  filters: {
    status: ['active', 'pending'],
    client_id: '123'
  },
  savedFilters: [
    { id: 'recent', name: 'Recent Trades', filters: { days: 7 } }
  ]
});
```

---

#### `getData()`

Get the current filter state.

**Returns:** `Object` - Current filter configuration and values

**Example:**
```javascript
const filter = Funky.AdvancedFilter._instances['trade_filters'];
const state = filter.getData();
console.log(state.filters);      // Current active filters
console.log(state.savedFilters); // Available saved filters
```

### LiveBinding Integration

```javascript
// Bind filter state to a data source
Funky.LiveBinding.bind({
  source: { type: 'state', key: 'filterConfig' },
  target: {
    type: 'component',
    component: 'AdvancedFilter',
    instance: 'trade_filters'
  }
});

// Update filters reactively
Funky.LiveBinding.setState('filterConfig', {
  filters: { status: 'completed' }
});
```
