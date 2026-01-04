# Funky.Timezone - Timezone Management

Browser timezone detection, session storage, and date/time formatting for table components.

## Overview

`Funky.Timezone` handles timezone detection, server session synchronization, and provides utilities for formatting dates and times in the user's selected timezone. It integrates with ComboBox for timezone selection and Funky.Table for date column rendering.

## API Reference

### Methods

#### `Timezone.initialize()`

Initialize the timezone manager. Fetches timezone from server session or detects from browser.

**Returns:** `Promise<string>` - The current timezone

**Example:**
```javascript
Funky.Timezone.initialize().then(function(tz) {
  console.log('Timezone initialized:', tz);
});
```

---

#### `Timezone.detectBrowserTimezone()`

Detect the browser's timezone using the Intl API.

**Returns:** `string` - IANA timezone identifier (e.g., 'America/New_York')

**Example:**
```javascript
var browserTz = Funky.Timezone.detectBrowserTimezone();
console.log('Browser timezone:', browserTz);
```

---

#### `Timezone.getEffectiveTimezone()`

Get the current effective timezone (or UTC fallback).

**Returns:** `string` - Current timezone name

**Example:**
```javascript
var tz = Funky.Timezone.getEffectiveTimezone();
// Returns 'America/New_York' or 'UTC' if not set
```

---

#### `Timezone.setTimezone(timezone)`

Set and persist timezone preference to server session.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| timezone | string | Yes | IANA timezone identifier |

**Returns:** `Promise<Object>` - Server response

**Example:**
```javascript
Funky.Timezone.setTimezone('Europe/London').then(function(data) {
  console.log('Timezone updated:', data.timezone);
});
```

---

#### `Timezone.fetchTimezones()`

Fetch available timezones from server, grouped by region.

**Returns:** `Promise<Object>` - Timezones object with region keys

**Example:**
```javascript
Funky.Timezone.fetchTimezones().then(function(timezones) {
  console.log('Regions:', Object.keys(timezones));
  // ['Americas', 'Asia', 'Europe', 'UTC']
});
```

---

#### `Timezone.initializeSelector(selector, options)`

Initialize a timezone selector dropdown with ComboBox.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string | Yes | CSS selector for the select element |
| options | object | No | Additional ComboBox options |

**Example:**
```javascript
Funky.Timezone.initializeSelector('#timezone-select', {
  placeholder: 'Choose timezone',
  searchable: true
});
```

---

#### `Timezone.format(timestamp, options)`

Format a timestamp in the current timezone. Accepts either Intl.DateTimeFormat options or a format string.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| timestamp | string\|Date | Yes | ISO timestamp or Date object |
| options | object\|string | No | Intl.DateTimeFormat options or format string |

**Returns:** `string` - Formatted date string

**Default Options (when no options provided):**
```javascript
{
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}
```

**Example:**
```javascript
// Default formatting
var formatted = Funky.Timezone.format('2024-01-15T14:30:00Z');
// Returns: 'Jan 15, 2024, 09:30:00 AM' (in Eastern Time)

// With Intl options
var dateOnly = Funky.Timezone.format(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// Returns: 'January 15, 2024'

// With format string
var custom = Funky.Timezone.format('2024-01-15T14:30:00Z', 'YYYY-MM-DD HH:mm:ss');
// Returns: '2024-01-15 09:30:00' (in Eastern Time)
```

---

#### `Timezone.formatString(timestamp, formatStr)`

Format a timestamp using a custom format string pattern. The format string supports moment.js-style tokens.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| timestamp | string\|Date | Yes | ISO timestamp or Date object |
| formatStr | string | Yes | Format string pattern |

**Supported Tokens:**
| Token | Output | Description |
|-------|--------|-------------|
| YYYY | 2024 | 4-digit year |
| YY | 24 | 2-digit year |
| MM | 01-12 | Month with leading zero |
| M | 1-12 | Month without leading zero |
| DD | 01-31 | Day with leading zero |
| D | 1-31 | Day without leading zero |
| HH | 00-23 | 24-hour with leading zero |
| H | 0-23 | 24-hour without leading zero |
| hh | 01-12 | 12-hour with leading zero |
| h | 1-12 | 12-hour without leading zero |
| mm | 00-59 | Minutes with leading zero |
| m | 0-59 | Minutes without leading zero |
| ss | 00-59 | Seconds with leading zero |
| s | 0-59 | Seconds without leading zero |
| SSS | 000-999 | Milliseconds |
| A | AM/PM | Uppercase meridiem |
| a | am/pm | Lowercase meridiem |

**Returns:** `string` - Formatted date string

**Example:**
```javascript
var date = new Date('2024-01-15T14:30:45.123Z');

Funky.Timezone.formatString(date, 'YYYY-MM-DD');
// Returns: '2024-01-15'

Funky.Timezone.formatString(date, 'DD/MM/YYYY HH:mm:ss');
// Returns: '15/01/2024 09:30:45' (in Eastern Time)

Funky.Timezone.formatString(date, 'M/D/YY h:mm A');
// Returns: '1/15/24 9:30 AM'

Funky.Timezone.formatString(date, 'YYYY-MM-DD HH:mm:ss.SSS');
// Returns: '2024-01-15 09:30:45.123'
```

---

#### `Timezone.formatWithTZ(timestamp, options)`

Format a timestamp with timezone abbreviation included.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| timestamp | string\|Date | Yes | ISO timestamp or Date object |
| options | object | No | Intl.DateTimeFormat options |

**Returns:** `string` - Formatted date string with timezone

**Example:**
```javascript
var formatted = Funky.Timezone.formatWithTZ('2024-01-15T14:30:00Z');
// Returns: 'Jan 15, 2024, 09:30:00 AM EST'
```

---

#### `Timezone.getAbbreviation(date)`

Get the timezone abbreviation (EST, PST, etc.) for a given date.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| date | Date | No | Date object (defaults to now) |

**Returns:** `string` - Timezone abbreviation

**Example:**
```javascript
var abbr = Funky.Timezone.getAbbreviation();
// Returns: 'EST' or 'EDT' depending on daylight saving
```

---

#### `Timezone.renderDate(data, options)`

Render a date for display (used by Funky.Table).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | string | Yes | ISO timestamp string |
| options | object | No | Render options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| dateOnly | boolean | false | Only show date (no time) |
| showTZ | boolean | true | Show timezone abbreviation |

**Returns:** `string` - Formatted HTML string

**Example:**
```javascript
var html = Funky.Timezone.renderDate('2024-01-15T14:30:00Z', { dateOnly: true });
// Returns: 'Jan 15, 2024'

var htmlWithTime = Funky.Timezone.renderDate('2024-01-15T14:30:00Z');
// Returns: 'Jan 15, 2024, 09:30 AM <small class="text-muted">EST</small>'
```

---

#### `Timezone.dateRenderer(options)`

Get a table-compatible render function for date columns.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Options passed to renderDate |

**Returns:** `function` - Render function for Funky.Table

**Example:**
```javascript
// In Funky.Table column definition
{
  data: 'created_at',
  render: Funky.Timezone.dateRenderer({ showTZ: true })
}

// Date only column
{
  data: 'trade_date',
  render: Funky.Timezone.dateRenderer({ dateOnly: true })
}
```

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.timezone.changed` | `{ timezone, previous }` | Dispatched on document when timezone changes |

**Example:**
```javascript
document.addEventListener('funky.timezone.changed', function(e) {
  console.log('Timezone changed from', e.detail.previous, 'to', e.detail.timezone);
});
```

---

## Dependencies

- `Funky.Api` - For session API calls
- `Funky.ComboBox` - For timezone selector (optional)
- `Funky.Toast` - For notifications (optional)

---

## Examples

### Initialize on Page Load

```javascript
document.addEventListener('DOMContentLoaded', function() {
  Funky.Timezone.initialize().then(function(tz) {
    console.log('App using timezone:', tz);
  });
});
```

### Timezone Selector in Settings

```html
<select id="timezone-select"></select>

<script>
  Funky.Timezone.initializeSelector('#timezone-select');
</script>
```

### Funky.Table with Timezone-Aware Dates

```javascript
var table = new Funky.Table('#tradesTable', {
  columns: [
    { data: 'id' },
    { data: 'security' },
    { 
      data: 'created_at',
      render: Funky.Timezone.dateRenderer({ showTZ: true })
    },
    { 
      data: 'trade_date',
      render: Funky.Timezone.dateRenderer({ dateOnly: true })
    }
  ]
});
```

### React to Timezone Changes

```javascript
document.addEventListener('funky.timezone.changed', function(e) {
  // Refresh data displays
  var tables = Funky.Table.getAll();
  tables.forEach(function(table) {
    table.reload();
  });
});
```
