# Funky.Aggregations - Table Footer Calculations

Calculates and renders footer aggregations for DataTables with multiple calculation types and format options.

## Overview

`Funky.Aggregations` provides automatic footer calculations for DataTables including sums, averages, counts, and more with auto-recalculation on filter changes.

## API Reference

### Factory Methods

#### `Funky.Aggregations.init(tableId, config)`

Create aggregations for a table. Returns a new instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the table element |
| config | array | Yes | Array of aggregation configurations |

---

#### `Funky.Aggregations.getInstance(tableId)`

Get existing instance by table ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the table element |

**Returns:** `Aggregations` instance or `undefined`

---

#### `Funky.Aggregations.destroy(tableId)`

Destroy aggregations instance by table ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the table element |

---

#### `Funky.Aggregations.destroyAll()`

Destroy all aggregation instances.

---

**Aggregation Config:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| column | string\|number | Yes | Column name or index |
| type | string | Yes | Calculation type |
| format | string | No | Output format |
| label | string | No | Optional label prefix |

**Calculation Types:**
| Type | Description |
|------|-------------|
| `sum` | Sum of all values |
| `avg` | Average of all values |
| `count` | Count of rows |
| `min` | Minimum value |
| `max` | Maximum value |
| `countDistinct` | Count of unique values |

**Format Types:**
| Format | Description | Example |
|--------|-------------|---------|
| `number` | Locale number | 1,234.56 |
| `integer` | Whole number | 1,234 |
| `currency` | Currency format | $1,234.56 |
| `percentage` | Percentage | 12.34% |
| `compact` | Compact notation | 1.2M |

### Instance Methods

#### `aggregations.calculate()`

Recalculate all aggregations.

---

#### `aggregations.destroy()`

Remove aggregations and cleanup.

---

#### `aggregations.updateConfig(newConfig)`

Update aggregation configuration.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| newConfig | array | Yes | New configuration |

## Auto-Recalculation

Aggregations automatically recalculate on:
- DataTable draw
- Filter changes
- Search updates
- Page navigation

## Dependencies

- jQuery
- DataTables

## Examples

### Basic Setup

```javascript
var agg = Funky.Aggregations.init('tradesTable', [
  { column: 'quantity', type: 'sum', format: 'integer', label: 'Total: ' },
  { column: 'trade_value', type: 'sum', format: 'currency' },
  { column: 'trade_value', type: 'avg', format: 'currency', label: 'Avg: ' },
  { column: 0, type: 'count', format: 'number' }
]);
```

### With DataTable

```javascript
var dt = Funky.DataTables.init('#tradesTable', {
  tableName: 'trades',
  ajaxUrl: '/api/trades',
  columns: columns,
  initComplete: function() {
    Funky.Aggregations.init('tradesTable', [
      { column: 'quantity', type: 'sum', format: 'compact' },
      { column: 'trade_value', type: 'sum', format: 'currency' }
    ]);
  }
});
```

### Dynamic Updates

```javascript
// Update aggregations when columns change
$('#columnSelector').on('change', function() {
  agg.updateConfig([
    { column: $(this).val(), type: 'sum', format: 'number' }
  ]);
});
```
