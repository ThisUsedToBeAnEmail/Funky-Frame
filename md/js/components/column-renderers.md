# Funky.Renderers - Funky.Table Column Renderers

Reusable render functions for Funky.Table columns with consistent formatting.

## Overview

`Funky.Renderers` provides a library of render functions for Funky.Table columns. Each renderer returns a function that handles display, sorting, and filtering types appropriately.

## Registration

**File:** `public/assets/js/components/column-renderers.js`

Registered as `Funky.Renderers` via the component registry.

## API Reference

### Renderers

#### `Renderers.text(options)`

Render plain text with optional styling.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.bold | boolean | false | Make text bold |
| options.className | string | - | Additional CSS class |
| options.prefix | string | - | Prefix to add before text (e.g., '#') |
| options.suffix | string | - | Suffix to add after text (e.g., '%') |
| options.emptyValue | string | '-' | Value to show for null/empty |

**Returns:** table render function

**Example:**
```javascript
{ data: 'name', render: Funky.Renderers.text() }
// Output: John Doe (or '-' if empty)

{ data: 'name', render: Funky.Renderers.text({ bold: true }) }
// Output: <span class="fw-bold">John Doe</span>

{ data: 'client_name', render: Funky.Renderers.text({ className: 'text-info' }) }
// Output: <span class="text-info">ACME Corp</span>

{ data: 'id', render: Funky.Renderers.text({ prefix: '#', bold: true }) }
// Output: <span class="fw-bold">#123</span>

{ data: 'rate', render: Funky.Renderers.text({ suffix: '%' }) }
// Output: 5.25%
```

---

#### `Renderers.number(options)`

Render number with locale formatting.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.decimals | number | 0 | Decimal places |
| options.emptyValue | string | '-' | Value to show for null |

**Returns:** table render function

**Example:**
```javascript
{ data: 'quantity', render: Funky.Renderers.number() }
// Output: 1,234

{ data: 'quantity', render: Funky.Renderers.number({ decimals: 2 }) }
// Output: 1,234.56
```

---

#### `Renderers.boolean(options)`

Render boolean as Active/Inactive badge.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.activeLabel | string | 'Active' | Label for true |
| options.inactiveLabel | string | 'Inactive' | Label for false |

**Returns:** table render function

**Example:**
```javascript
{ data: 'is_active', render: Funky.Renderers.boolean() }
// Output: <span class="badge-funky badge-active">Active</span>

{ data: 'is_enabled', render: Funky.Renderers.boolean({ activeLabel: 'On', inactiveLabel: 'Off' }) }
// Output: <span class="badge-funky badge-active">On</span>
```

---

#### `Renderers.id()`

Render ID with # prefix in muted text.

**Returns:** table render function

**Example:**
```javascript
{ data: 'id', render: Funky.Renderers.id() }
// Output: <span class="text-muted">#123</span>
```

---

#### `Renderers.bold()`

Render text in bold.

**Returns:** table render function

**Example:**
```javascript
{ data: 'code', render: Funky.Renderers.bold() }
// Output: <span class="fw-bold">ABC123</span>
```

---

#### `Renderers.currency(options)` or `Renderers.currency(symbol, decimals)`

Render number as formatted currency. Accepts either an options object or positional arguments.

**Options Object:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.currency | string | 'USD' | Currency code |
| options.decimals | number | 2 | Decimal places |

**Positional Arguments:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| symbol | string | 'USD' | Currency code |
| decimals | number | 2 | Decimal places |

**Returns:** table render function

**Example:**
```javascript
// Options object (recommended)
{ data: 'amount', render: Funky.Renderers.currency({ currency: 'GBP', decimals: 2 }) }

// Positional arguments
{ data: 'amount', render: Funky.Renderers.currency('GBP', 2) }

// Default (USD, 2 decimals)
{ data: 'amount', render: Funky.Renderers.currency() }
// Output: $1,234.56

// Custom decimals
{ data: 'price', render: Funky.Renderers.currency({ decimals: 4 }) }
// Output: $1,234.5678
```

**Note:** Uses `Funky.Format.currency()` if available.

---

#### `Renderers.percent(options)` or `Renderers.percent(decimals, multiply)`

Render number as percentage. Accepts either an options object or positional arguments.

**Options Object:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.decimals | number | 2 | Decimal places |
| options.multiply | boolean | false | Multiply by 100 (for 0-1 values) |

**Positional Arguments:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| decimals | number | 2 | Decimal places |
| multiply | boolean | false | Multiply by 100 (for 0-1 values) |

**Returns:** table render function

**Example:**
```javascript
// Options object (recommended)
{ data: 'rate', render: Funky.Renderers.percent({ decimals: 4 }) }
// Output: 12.3456%

// Positional arguments
{ data: 'rate', render: Funky.Renderers.percent(2) }
// Output: 12.34%

// Multiply 0-1 values by 100
{ data: 'ratio', render: Funky.Renderers.percent({ decimals: 2, multiply: true }) }
// Input: 0.1234 → Output: 12.34%
```

---

#### `Renderers.date(options)` or `Renderers.date(format)`

Render date with timezone awareness. Accepts either an options object or a format string.

**Options Object:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.format | string | 'YYYY-MM-DD' | Date format |
| options.dateOnly | boolean | false | Show date only (no time) |

**Positional Argument:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | 'YYYY-MM-DD' | Date format |

**Returns:** table render function

**Example:**
```javascript
// Options object (recommended)
{ data: 'trade_date', render: Funky.Renderers.date({ dateOnly: true }) }
// Output: 20 Dec 2025

// Format string
{ data: 'trade_date', render: Funky.Renderers.date('DD/MM/YYYY') }
// Output: 20/12/2025

// Default
{ data: 'created_at', render: Funky.Renderers.date() }
// Output: 2025-12-20 14:30:45
```

**Note:** Uses `Funky.Timezone.renderDate()` if available, falls back to moment.js.

---

#### `Renderers.dateOnly()`

Render date only (no time, timezone-aware). Shortcut for `date({ dateOnly: true })`.

**Returns:** table render function

**Example:**
```javascript
{ data: 'settlement_date', render: Funky.Renderers.dateOnly() }
// Output: Dec 20, 2025
```

---

#### `Renderers.datetime(format)`

Render datetime with timezone awareness.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| format | string | 'YYYY-MM-DD HH:mm' | DateTime format |

**Returns:** table render function

**Example:**
```javascript
{ data: 'created_at', render: Funky.Renderers.datetime('DD/MM/YYYY HH:mm:ss') }
// Output: 20/12/2025 14:30:45
```

---

#### `Renderers.activeStatus(options)`

Render boolean as Active/Inactive badge.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.activeText | string | 'Active' | Text for active state |
| options.inactiveText | string | 'Inactive' | Text for inactive state |

**Returns:** table render function

**Example:**
```javascript
{ data: 'is_active', render: Funky.Renderers.activeStatus() }
// Output: <span class="badge-funky badge-active">Active</span>
// Or: <span class="badge-funky badge-inactive">Inactive</span>

{ data: 'enabled', render: Funky.Renderers.activeStatus({ activeText: 'On', inactiveText: 'Off' }) }
```

---

#### `Renderers.yesNo(options)`

Render boolean as Yes/No badge.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.yesText | string | 'Yes' | Text for true state |
| options.noText | string | 'No' | Text for false state |

**Returns:** table render function

**Example:**
```javascript
{ data: 'is_verified', render: Funky.Renderers.yesNo() }
// Output: <span class="badge-funky badge-active">Yes</span>
```

---

#### `Renderers.badgeMap(badgeMap, options)`

Render status badges using a value-to-class mapping. Useful for status columns with multiple states.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| badgeMap | object | - | Map of value → class or value → {text, class} |
| options.defaultClass | string | 'badge-inactive' | Default badge class for unknown values |
| options.defaultText | string | '-' | Default text for unknown values |

**Badge Map Formats:**
- **Simple:** `{ 'value': 'badge-class' }` - text is auto-capitalized from value
- **Full:** `{ 'value': { text: 'Display Text', class: 'badge-class' } }` - explicit text and class

**Available Badge Classes:**
- `badge-active` - Green (success state)
- `badge-inactive` - Gray (inactive/cancelled)
- `badge-warning` - Yellow (pending/warning)
- `badge-info` - Blue (informational)

**Returns:** table render function

**Example:**
```javascript
// Simple format: value → class (text auto-capitalized)
var statusBadges = {
  'pending': 'badge-warning',
  'queued': 'badge-info',
  'sent': 'badge-active',
  'rejected': 'badge-inactive',
  'cancelled': 'badge-inactive'
};
{ data: 'status', render: Funky.Renderers.badgeMap(statusBadges) }
// 'pending' → <span class="badge-funky badge-warning">Pending</span>
// 'sent' → <span class="badge-funky badge-active">Sent</span>

// Full format: value → {text, class} (explicit control)
var priorityBadges = {
  'high': { text: 'High Priority', class: 'badge-warning' },
  'medium': { text: 'Medium', class: 'badge-info' },
  'low': { text: 'Low', class: 'badge-inactive' }
};
{ data: 'priority', render: Funky.Renderers.badgeMap(priorityBadges) }
// 'high' → <span class="badge-funky badge-warning">High Priority</span>
```

---

#### `Renderers.truncate(maxLength)`

Render text with ellipsis truncation and title tooltip.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| maxLength | number | 50 | Maximum character length |

**Returns:** table render function

**Example:**
```javascript
{ data: 'description', render: Funky.Renderers.truncate(30) }
// Output: <span title="Full long text here...">Full long text h...</span>
```

---

#### `Renderers.link(urlTemplate, options)`

Render text as clickable link.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| urlTemplate | string\|function | - | URL with `{field}` placeholders or function(row) |
| options.newTab | boolean | false | Open in new tab |

**Returns:** table render function

**Example:**
```javascript
// Template string
{ data: 'name', render: Funky.Renderers.link('/web/client/{id}') }

// Function
{ data: 'name', render: Funky.Renderers.link(function(row) { 
    return '/web/client/' + row.id; 
}, { newTab: true }) }
```

---

#### `Renderers.actions(config)`

Render action buttons (View, Edit, Delete, Audit, Nested, Custom).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config.entity | string | Parent entity name (required for nested actions) |
| config.nested | Array | Nested CRUD action buttons |
| config.view | boolean\|object | Show view button |
| config.edit | boolean\|object | Show edit button |
| config.delete | boolean\|object | Show delete button |
| config.audit | boolean\|object | Show audit button |
| config.custom | Array | Custom action buttons |

**Button Object Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| icon | string | varies | FontAwesome icon class |
| title | string | varies | Button tooltip |
| handler | string\|function | varies | Click handler |

**Nested Button Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | Nested CRUD config key (required) |
| icon | string | 'fa-list' | FontAwesome icon class |
| title | string | 'Manage' | Button tooltip |
| btnClass | string | 'btn-primary' | Button class |

**Returns:** table render function

**Example:**
```javascript
// Simple
{ data: null, render: Funky.Renderers.actions({ view: true, edit: true, delete: true }) }

// With audit
{ data: null, render: Funky.Renderers.actions({ 
    view: true, 
    edit: true, 
    delete: true,
    audit: true 
}) }

// With nested CRUD (requires entity)
{ data: null, render: Funky.Renderers.actions({ 
    entity: 'client',  // Required for nested actions
    nested: [
        { 
            name: 'relationships',    // Key in parent's nested config
            icon: 'fa-link', 
            title: 'Manage Relationships', 
            btnClass: 'btn-primary' 
        }
    ],
    view: true,
    edit: true,
    delete: true
}) }

// Custom actions
{ data: null, render: Funky.Renderers.actions({ 
    edit: true,
    custom: [
        {
            icon: 'fa-link',
            title: 'View Relationships',
            btnClass: 'btn-outline-info',
            handler: function(row) { 
                window.location.href = '/web/client/' + row.id + '/relationships'; 
            }
        },
        {
            icon: 'fa-copy',
            title: 'Duplicate',
            handler: 'duplicateRow'  // calls window.duplicateRow(id)
        }
    ]
}) }
```

---

### String Shortcuts

#### `Renderers.get(name)`

Get a renderer by string shortcut name.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| name | string | Renderer name with optional args (e.g., 'currency:USD:2') |

**Returns:** table render function or null

**Example:**
```javascript
var renderer = Funky.Renderers.get('currency:GBP:2');
// Equivalent to: Funky.Renderers.currency('GBP', '2')

// Used by Funky.CRUD for string shortcuts
columns: [
    { data: 'id', render: 'id' },
    { data: 'amount', render: 'currency:USD' },
    { data: 'is_active', render: 'activeStatus' }
]
```

## Usage with Funky.Table

```javascript
// Status badge map
var statusBadges = {
  'pending': 'badge-warning',
  'sent': 'badge-active',
  'rejected': 'badge-inactive'
};

new Funky.Table('#myTable', {
    columns: [
        { data: 'id', title: 'ID', render: Funky.Renderers.id() },
        { data: 'code', title: 'Code', render: Funky.Renderers.bold() },
        { data: 'name', title: 'Name', render: Funky.Renderers.text() },
        { data: 'trade_ref', title: 'Trade Ref', render: Funky.Renderers.text({ prefix: '#', bold: true }) },
        { data: 'client_name', title: 'Client', render: Funky.Renderers.text({ className: 'text-info' }) },
        { data: 'quantity', title: 'Qty', render: Funky.Renderers.number({ decimals: 2 }) },
        { data: 'amount', title: 'Amount', render: Funky.Renderers.currency() },
        { data: 'price', title: 'Price', render: Funky.Renderers.currency({ decimals: 4 }) },
        { data: 'rate', title: 'Rate', render: Funky.Renderers.percent({ decimals: 4 }) },
        { data: 'trade_date', title: 'Trade Date', render: Funky.Renderers.dateOnly() },
        { data: 'created_at', title: 'Created', render: Funky.Renderers.date() },
        { data: 'status', title: 'Status', render: Funky.Renderers.badgeMap(statusBadges) },
        { data: 'is_active', title: 'Active', render: Funky.Renderers.activeStatus() },
        { data: 'is_verified', title: 'Verified', render: Funky.Renderers.yesNo() },
        { data: 'description', title: 'Description', render: Funky.Renderers.truncate(40) },
        { data: null, title: 'Actions', render: Funky.Renderers.actions({ 
            view: true, edit: true, delete: true 
        }) }
    ]
});
```

## Usage with Funky.CRUD

```javascript
// Status badge map for trade actions
var statusBadges = {
  'pending': 'badge-warning',
  'queued': 'badge-info',
  'sent': 'badge-active',
  'rejected': 'badge-inactive'
};

Funky.CRUD.init({
    entity: 'trade',
    apiUrl: '/api/trades',
    tableSelector: '#tradesTable',
    columns: [
        { data: 'id', title: 'ID', render: Funky.Renderers.text({ prefix: '#', bold: true }) },
        { data: 'trade_ref', title: 'Trade Ref', render: Funky.Renderers.text({ bold: true, className: 'text-info' }) },
        { data: 'client_name', title: 'Client', render: Funky.Renderers.text({ className: 'text-success' }) },
        { data: 'quantity', title: 'Quantity', render: Funky.Renderers.number({ decimals: 2 }) },
        { data: 'trade_value', title: 'Value', render: Funky.Renderers.currency() },
        { data: 'rate', title: 'Rate', render: Funky.Renderers.percent({ decimals: 4 }) },
        { data: 'trade_date', title: 'Trade Date', render: Funky.Renderers.dateOnly() },
        { data: 'status', title: 'Status', render: Funky.Renderers.badgeMap(statusBadges) },
        { data: 'is_active', title: 'Active', render: Funky.Renderers.activeStatus() },
        { data: 'is_settled', title: 'Settled', render: Funky.Renderers.yesNo() }
        // Actions column added automatically by CRUD
    ]
});
```

## Security

All renderers use `escapeHtml()` internally to prevent XSS attacks.

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Format` (optional, for currency formatting)
- `Funky.Timezone` (optional, for date formatting)
- `moment.js` (optional fallback for dates)

## See Also

- [table.md](table.md) - Funky.Table component
- [crud.md](crud.md) - CRUD controller using renderers
