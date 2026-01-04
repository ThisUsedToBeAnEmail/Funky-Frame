# Funky.ConditionalFormatting - Cell Formatting Rules

Apply conditional formatting rules to DataTable cells with various conditions and style presets.

## Overview

`Funky.ConditionalFormatting` allows dynamic cell styling based on cell values with support for multiple condition types and customizable styles.

## API Reference

### Factory Methods

#### `Funky.ConditionalFormatting.init(tableId, columns)`

Create conditional formatting for a table (primary factory method).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the DataTable element |
| columns | array | Yes | Column definitions with data/title |

**Returns:** `ConditionalFormatting` instance

---

#### `Funky.ConditionalFormatting.getInstance(tableId)`

Get existing instance by table ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the DataTable element |

**Returns:** `ConditionalFormatting` instance or `undefined`

---

#### `Funky.ConditionalFormatting.destroy(tableId)`

Destroy instance by table ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tableId | string | Yes | ID of the DataTable element |

---

#### `Funky.ConditionalFormatting.destroyAll()`

Destroy all conditional formatting instances.

---

### Instance Methods

#### `formatting.addRule(rule)`

Add a formatting rule.

**Rule Config:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| column | string | Yes | Column data name |
| condition | string | Yes | Condition type |
| value | any | Varies | Comparison value |
| value2 | any | No | Second value (for 'between') |
| style | string | Yes | Style preset name |

**Example:**
```javascript
formatting.addRule({
  column: 'status',
  condition: 'equals',
  value: 'Closed',
  style: 'positive'
});
```

---

#### `formatting.removeRule(index)`

Remove a rule by index.

---

#### `formatting.clearRules()`

Remove all rules.

---

#### `formatting.getRules()`

Get all current rules.

**Returns:** `Array` - Array of rule objects

---

#### `formatting.showModal()`

Show the rule management modal.

---

#### `formatting.apply()`

Re-apply all rules to the table.

### Condition Types

| Condition | Description | Needs Value |
|-----------|-------------|-------------|
| `equals` | Exact match | Yes |
| `notEquals` | Not equal | Yes |
| `contains` | Contains string | Yes |
| `notContains` | Doesn't contain | Yes |
| `greaterThan` | > (numeric) | Yes |
| `lessThan` | < (numeric) | Yes |
| `greaterOrEqual` | >= (numeric) | Yes |
| `lessOrEqual` | <= (numeric) | Yes |
| `between` | Between two values | Yes (2) |
| `isEmpty` | Cell is empty | No |
| `isNotEmpty` | Cell has value | No |

### Style Presets

| Style | Appearance |
|-------|------------|
| `positive` | Green text |
| `positiveBg` | Green background |
| `negative` | Red text |
| `negativeBg` | Red background |
| `warning` | Orange text |
| `warningBg` | Orange background |
| `neutral` | Gray text |
| `highlight` | Blue highlight |
| `bold` | Bold text |
| `italic` | Italic text |

## Dependencies

- jQuery
- DataTables
- `Funky.Storage` - For rule persistence
- Bootstrap 5 (for modal)

## Examples

### Basic Setup

```javascript
var formatting = Funky.ConditionalFormatting.init('tradesTable', [
  { data: 'status', title: 'Status' },
  { data: 'quantity', title: 'Quantity' },
  { data: 'trade_value', title: 'Trade Value' }
]);

// Add some rules
formatting.addRule({
  column: 'quantity',
  condition: 'greaterThan',
  value: 10000,
  style: 'positiveBg'
});

formatting.addRule({
  column: 'status',
  condition: 'equals',
  value: 'Pending',
  style: 'warning'
});
```

### Rule Management UI

```javascript
// Open rule editor
$('#formatRulesBtn').on('click', function() {
  formatting.showModal();
});
```

### Numeric Range Highlighting

```javascript
// Highlight values between ranges
formatting.addRule({
  column: 'trade_value',
  condition: 'between',
  value: 0,
  value2: 1000,
  style: 'negative'
});

formatting.addRule({
  column: 'trade_value',
  condition: 'greaterThan',
  value: 100000,
  style: 'positive'
});
```
