# Funky.Format - Number and Currency Formatting

Consistent formatting for numbers, currencies, percentages, and compact notation with auto-format data attributes.

## Overview

`Funky.Format` provides locale-aware formatting utilities for displaying numbers, currencies, and percentages with support for automatic element formatting via data attributes.

## API Reference

### Methods

#### `Format.number(value, decimals)`

Format a number with locale separators.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | number\|string | Yes | Value to format |
| decimals | number | No | Decimal places (default: 2) |

**Returns:** `string` - Formatted number

**Example:**
```javascript
Funky.Format.number(1234567.89);     // "1,234,567.89"
Funky.Format.number(1234567.89, 0);  // "1,234,568"
```

---

#### `Format.compact(value, decimals)`

Format large numbers with K/M/B notation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | number | Yes | Value to format |
| decimals | number | No | Decimal places (default: 2) |

**Returns:** `string` - Compact notation

**Example:**
```javascript
Funky.Format.compact(1234567);    // "1.23M"
Funky.Format.compact(1234);       // "1.23K"
Funky.Format.compact(999);        // "999"
```

---

#### `Format.currency(value, currency)`

Format as currency.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | number | Yes | Value to format |
| currency | string | No | Currency code (default: 'GBP') |

**Returns:** `string` - Currency string

**Example:**
```javascript
Funky.Format.currency(1234.56, 'USD');  // "$1,234.56"
Funky.Format.currency(1234.56, 'GBP');  // "£1,234.56"
Funky.Format.currency(1234.56, 'EUR');  // "€1,234.56"
```

---

#### `Format.percentage(value, decimals)`

Format as percentage.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | number | Yes | Decimal value (0.1234 = 12.34%) |
| decimals | number | No | Decimal places (default: 2) |

**Returns:** `string` - Percentage string

**Example:**
```javascript
Funky.Format.percentage(0.1234);   // "12.34%"
Funky.Format.percentage(0.5);      // "50.00%"
Funky.Format.percentage(1.234, 1); // "123.4%"
```

---

#### `Format.change(value, decimals)`

Format as change indicator with sign and color class.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | number | Yes | Change value |
| decimals | number | No | Decimal places (default: 2) |

**Returns:** `string` - HTML with color class

**Example:**
```javascript
Funky.Format.change(5.25);   // '<span class="text-success">+5.25%</span>'
Funky.Format.change(-3.5);   // '<span class="text-danger">-3.50%</span>'
Funky.Format.change(0);      // '<span class="text-muted">0.00%</span>'
```

---

#### `Format.configure(options)`

Configure default settings.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| locale | string | 'en-GB' | Number locale |
| defaultCurrency | string | 'GBP' | Default currency |
| decimalPlaces | number | 2 | Default decimals |
| compactThreshold | number | 1000 | Threshold for compact |

## Auto-Format Elements

Use data attributes for automatic formatting:

```html
<!-- Number formatting -->
<span data-format="number" data-value="1234567">Loading...</span>
<!-- Output: 1,234,567.00 -->

<!-- Currency with custom currency -->
<span data-format="currency" data-value="1234.56" data-currency="USD">Loading...</span>
<!-- Output: $1,234.56 -->

<!-- Compact notation -->
<span data-format="compact" data-value="1500000">Loading...</span>
<!-- Output: 1.50M -->

<!-- Percentage -->
<span data-format="percentage" data-value="0.1234">Loading...</span>
<!-- Output: 12.34% -->
```

## Dependencies

None - uses native Intl API.

## Examples

### Funky.Table Render Function

```javascript
{
  data: 'trade_value',
  render: function(data) {
    return Funky.Format.currency(data, 'USD');
  }
}
```

### Dashboard Stat Cards

```javascript
function updateStats(stats) {
  $('#totalValue').text(Funky.Format.compact(stats.total_value));
  $('#changePercent').html(Funky.Format.change(stats.change));
  $('#avgTrade').text(Funky.Format.currency(stats.avg_trade));
}
```
