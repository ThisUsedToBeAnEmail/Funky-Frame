# Funky.Util - Utility Functions

Centralized utility functions for common operations across the application.

## Overview

`Funky.Util` provides helper functions for HTML escaping, number formatting, file size display, and other common tasks.

## API Reference

### Methods

#### `Util.escapeHtml(text)`

Escape HTML entities to prevent XSS attacks.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| text | string | Yes | Text to escape |

**Returns:** `string` - Escaped HTML string

**Escaped Characters:**
| Character | Escape |
|-----------|--------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#039;` |

**Example:**
```javascript
const userInput = '<script>alert("xss")</script>';
const safe = Funky.Util.escapeHtml(userInput);
// Output: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

element.innerHTML = '<span>' + safe + '</span>';
```

---

#### `Util.formatNumber(num, options)`

Format number with locale-aware separators.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| num | number | Yes | Number to format |
| options | object | No | Intl.NumberFormat options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| maximumFractionDigits | number | 2 | Max decimal places |
| minimumFractionDigits | number | 0 | Min decimal places |
| style | string | 'decimal' | 'decimal', 'currency', 'percent' |
| currency | string | - | Currency code (required if style='currency') |

**Returns:** `string` - Formatted number string

**Example:**
```javascript
Funky.Util.formatNumber(1234567.89);
// Output (US): '1,234,567.89'

Funky.Util.formatNumber(0.156, { style: 'percent' });
// Output: '16%'

Funky.Util.formatNumber(99.99, { style: 'currency', currency: 'USD' });
// Output: '$99.99'
```

---

#### `Util.abbreviateNumber(num, decimals)`

Abbreviate large numbers using K/M/B/T notation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| num | number | Yes | Number to abbreviate |
| decimals | number | No | Decimal places (default: 1) |

**Returns:** `string` - Abbreviated number string

**Abbreviations:**
| Range | Suffix |
|-------|--------|
| < 1,000 | (none) |
| 1,000+ | K |
| 1,000,000+ | M |
| 1,000,000,000+ | B |
| 1,000,000,000,000+ | T |

**Example:**
```javascript
Funky.Util.abbreviateNumber(1234);      // '1.2K'
Funky.Util.abbreviateNumber(1234567);   // '1.2M'
Funky.Util.abbreviateNumber(1500000, 2); // '1.50M'
Funky.Util.abbreviateNumber(999);        // '999'
```

---

#### `Util.formatFileSize(bytes, decimals)`

Format bytes into human-readable file size.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| bytes | number | Yes | File size in bytes |
| decimals | number | No | Decimal places (default: 2) |

**Returns:** `string` - Formatted file size

**Units:** Bytes, KB, MB, GB, TB, PB

**Example:**
```javascript
Funky.Util.formatFileSize(1024);        // '1 KB'
Funky.Util.formatFileSize(1536000);     // '1.46 MB'
Funky.Util.formatFileSize(0);           // '0 Bytes'
Funky.Util.formatFileSize(1073741824);  // '1 GB'
```

## Dependencies

None - this is a core module.

## Examples

### Safe HTML Rendering

```javascript
function renderUserComment(comment) {
  const safe = Funky.Util.escapeHtml(comment.text);
  return '<div class="comment">' + safe + '</div>';
}
```

### Display Statistics

```javascript
function renderStats(stats) {
  return `
    <div class="stat">
      <span class="value">${Funky.Util.abbreviateNumber(stats.trades)}</span>
      <span class="label">Trades</span>
    </div>
    <div class="stat">
      <span class="value">${Funky.Util.formatNumber(stats.totalValue, { 
        style: 'currency', 
        currency: 'USD' 
      })}</span>
      <span class="label">Total Value</span>
    </div>
  `;
}
```

### File Upload Display

```javascript
function displayUploadedFile(file) {
  return `
    <div class="file-item">
      <span class="name">${Funky.Util.escapeHtml(file.name)}</span>
      <span class="size">${Funky.Util.formatFileSize(file.size)}</span>
    </div>
  `;
}
```
