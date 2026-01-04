# Funky.Table - Data Table Component

> **Version**: 1.0.0  
> **Status**: Production Ready  
> **Dependencies**: Funky.Dom, Funky.Events (optional), Funky.Announce (optional)

A high-performance, accessible, native JavaScript data table component built without jQuery dependencies. Designed as a drop-in replacement for jQuery DataTables with enhanced features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Columns](#columns)
4. [Data Loading](#data-loading)
5. [Sorting](#sorting)
6. [Pagination](#pagination)
7. [Search & Filtering](#search--filtering)
8. [Selection](#selection)
9. [Conditional Formatting](#conditional-formatting)
10. [Context Menu](#context-menu)
11. [Column Profiles](#column-profiles)
12. [Aggregations](#aggregations)
13. [LiveBinding](#livebinding)
14. [Export & Buttons](#export--buttons)
15. [Row Animations](#row-animations)
16. [Responsive Design](#responsive-design)
17. [Styling & Density](#styling--density)
18. [Accessibility](#accessibility)
19. [WebSocket Integration](#websocket-integration)
20. [API Reference](#api-reference)
21. [Events](#events)
22. [Theming](#theming)
23. [Migration from DataTables](#migration-from-datatables)

---

## Quick Start

### Basic Usage

```html
<table id="myTable"></table>

<script>
var table = Funky.Table.init('#myTable', {
    tableName: 'products',
    ajaxUrl: '/api/products',
    columns: [
        { data: 'id', title: 'ID', visible: false },
        { data: 'name', title: 'Name' },
        { data: 'sku', title: 'SKU' },
        { data: 'price', title: 'Price', type: 'money' },
        { data: 'status', title: 'Status', render: 'status' }
    ],
    pageLength: 25
});
</script>
```

### Client-Side Data

```javascript
var table = Funky.Table.init('#myTable', {
    tableName: 'items',
    serverSide: false,
    data: [
        { id: 1, name: 'Item 1', price: 100 },
        { id: 2, name: 'Item 2', price: 200 }
    ],
    columns: [
        { data: 'id', title: 'ID' },
        { data: 'name', title: 'Name' },
        { data: 'price', title: 'Price' }
    ]
});
```

---

## Configuration

### Full Configuration Object

```javascript
Funky.Table.init('#table', {
    // Core
    tableName: 'products',           // Table identifier
    idField: 'id',                   // Field used for row identification
    
    // Data Source
    ajaxUrl: '/api/products',        // Server-side data URL
    data: [],                        // Client-side data array
    serverSide: true,                // Server-side processing
    dataSrc: null,                   // Custom data extraction function
    extraAjaxData: {},               // Additional request parameters
    
    // Pagination
    pageLength: 25,                  // Rows per page
    lengthMenu: [10, 25, 50, 100],   // Page length options
    paging: true,                    // Enable pagination
    
    // Sorting
    ordering: true,                  // Enable sorting
    multiSort: true,                 // Allow multi-column sorting
    defaultSort: {                   // Initial sort
        column: 'created_at',
        direction: 'desc'
    },
    
    // Search
    searching: true,                 // Enable search
    searchDelay: 300,                // Debounce delay (ms)
    
    // Selection
    selection: {
        mode: 'multi',               // 'none', 'single', 'multi'
        checkbox: true,              // Show checkbox column
        persist: false               // Persist selection across pages
    },
    
    // Display
    responsive: {
        enabled: true,               // Enable responsive mode
        breakpoints: {               // Custom breakpoints
            mobile: 576,
            tablet: 768,
            desktop: 992
        }
    },
    
    // Styling
    density: 'normal',               // 'compact', 'normal', 'comfortable'
    striped: true,                   // Striped rows
    hover: true,                     // Hover effect
    bordered: false,                 // Cell borders
    
    // Features
    buttons: {
        enabled: true,
        container: '#tableButtons',
        export: ['csv', 'xlsx', 'json'],
        colvis: true
    },
    
    contextMenu: {
        enabled: true,
        items: [...]
    },
    
    filters: {
        enabled: true,
        dateRange: {...},
        dropdowns: [...]
    },
    
    aggregations: {
        enabled: true,
        position: 'footer',
        columns: {...}
    },
    
    conditionalFormatting: {
        rules: [...]
    },
    
    animations: {
        enabled: true,
        highlightDuration: 2000
    },
    
    websocket: {
        enabled: true,
        events: {
            create: 'entity.created',
            update: 'entity.updated',
            delete: 'entity.deleted'
        }
    },
    
    accessibility: {
        enabled: true,
        announceLoading: true,
        announceSort: true,
        keyboardNavigation: true
    },
    
    // Callbacks
    onInit: function(table) {},
    onLoad: function(data) {},
    onError: function(error) {},
    onRowClick: function(data, row) {},
    onSelectionChange: function(ids, data) {},
    onSort: function(column, direction) {},
    onPage: function(page) {},
    
    // Debug
    debug: false
});
```

---

## Columns

### Column Definition

```javascript
columns: [
    {
        data: 'user.name',           // Data field (supports nested paths)
        name: 'user_name',           // Column identifier for server
        title: 'User Name',          // Header text
        visible: true,               // Show/hide column
        sortable: true,              // Allow sorting
        searchable: true,            // Include in search
        className: 'text-center',    // CSS class
        width: '150px',              // Column width
        defaultContent: '-',         // Default for null/undefined
        type: 'string',              // Data type (see below)
        render: function(value, row, rowIndex) {
            return '<strong>' + value + '</strong>';
        },
        createdCell: function(td, value, row, rowIndex, colIndex) {
            // Modify cell after creation
        }
    }
]
```

### Column Types

```javascript
// Built-in types with automatic formatting
{ data: 'created_at', type: 'date' }        // Date formatting
{ data: 'amount', type: 'money' }           // Currency formatting  
{ data: 'quantity', type: 'number' }        // Number formatting
{ data: 'is_active', type: 'boolean' }      // Yes/No badges
{ data: 'status', type: 'status' }          // Status badges
{ data: 'progress', type: 'progress' }      // Progress bar
{ data: 'email', type: 'email' }            // mailto link
{ data: 'url', type: 'link' }               // Clickable link
```

### Custom Renderers

```javascript
// Function renderer
{
    data: 'price',
    render: function(value, row) {
        return '$' + parseFloat(value).toFixed(2);
    }
}

// Named renderer
{
    data: 'status',
    render: 'status'  // Uses built-in status renderer
}

// Register custom renderer
Funky.Table.registerRenderer('custom', function(value, row) {
    return '<span class="custom">' + value + '</span>';
});
```

### Responsive Column Priorities

Columns use a **priority scale from 1-10** where **lower values = more important = stay visible longer**.

```javascript
{
    data: 'name',
    responsivePriority: 1   // Always visible (most important)
},
{
    data: 'description',
    responsivePriority: 8    // Hides first as screen narrows
}
```

**Priority Thresholds by Breakpoint:**

| Breakpoint | Container Width | Max Priority Shown |
|------------|-----------------|--------------------|
| desktop    | > 1280px        | 10000 (show all)   |
| laptop     | ≤ 1280px        | 6                  |
| tablet-l   | ≤ 1024px        | 5                  |
| tablet     | ≤ 768px         | 4                  |
| mobile-l   | ≤ 640px         | 3                  |
| mobile     | ≤ 480px         | 2 (only priority 1-2) |

> **Note:** Columns without `responsivePriority` set always remain visible.

---

## Data Loading

### Server-Side Processing

```javascript
var table = Funky.Table.init('#table', {
    ajaxUrl: '/api/data',
    serverSide: true
});

// Server receives:
// ?page=1&limit=25&search=query&sort=[{"column":"name","dir":"asc"}]

// Server should return:
{
    "data": [...],
    "total": 1000,
    "page": 1,
    "limit": 25
}
```

### Custom Data Source

```javascript
{
    dataSrc: function(response) {
        // Transform server response
        return response.results.map(function(item) {
            return {
                id: item._id,
                name: item.displayName,
                // ...
            };
        });
    }
}
```

### Extra AJAX Parameters

```javascript
var table = Funky.Table.init('#table', {
    ajaxUrl: '/api/data',
    extraAjaxData: {
        status: 'active',
        category_id: 5
    }
});

// Update dynamically
table.setFilter('status', 'pending');
table.reload();
```

---

## Sorting

### Configuration

```javascript
{
    ordering: true,
    multiSort: true,
    defaultSort: {
        column: 'created_at',
        direction: 'desc'
    }
}
```

### API

```javascript
// Sort by column
table.sort('name', 'asc');

// Multi-sort
table.sort([
    { column: 'category', direction: 'asc' },
    { column: 'name', direction: 'asc' }
]);

// Get current sort
var sortOrder = table.getSortOrder();
```

### Per-Column Sorting

```javascript
{
    data: 'computed_field',
    sortable: false  // Disable sorting for this column
}
```

---

## Pagination

### Configuration

```javascript
{
    paging: true,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100, -1],  // -1 for "All"
    pagingType: 'full'  // 'simple', 'numbers', 'full'
}
```

### API

```javascript
// Navigate
table.goToPage(5);
table.nextPage();
table.previousPage();
table.firstPage();
table.lastPage();

// Page length
table.setPageLength(50);

// Get info
var info = table.getPageInfo();
// { page: 1, pages: 10, total: 250, showing: 25 }
```

---

## Search & Filtering

### Global Search

```javascript
{
    searching: true,
    searchDelay: 300,
    search: {
        placeholder: 'Search...',
        minLength: 2
    }
}

// API
table.search('query');
table.clearSearch();
```

### Column Filters

```javascript
{
    filters: {
        enabled: true,
        dropdowns: [
            {
                column: 'status',
                placeholder: 'All Statuses',
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'closed', label: 'Closed' }
                ]
            }
        ]
    }
}
```

### Date Range Filter

```javascript
{
    filters: {
        dateRange: {
            enabled: true,
            columns: [
                { value: 'created_at', label: 'Created Date' },
                { value: 'updated_at', label: 'Modified Date' }
            ],
            defaultColumn: 'created_at',
            defaultRange: 'last7days'
        }
    }
}
```

### Advanced Filter Builder

```javascript
{
    advancedFilter: {
        enabled: true,
        fields: [
            { name: 'name', label: 'Name', type: 'text' },
            { name: 'amount', label: 'Amount', type: 'number' },
            { name: 'status', label: 'Status', type: 'select', options: [...] },
            { name: 'created_at', label: 'Created', type: 'date' }
        ]
    }
}

// API
table.setAdvancedFilter([
    { field: 'status', operator: 'equals', value: 'active' },
    { field: 'amount', operator: 'greaterThan', value: 100 }
]);
```

---

## Selection

### Configuration

```javascript
{
    selection: {
        mode: 'multi',           // 'none', 'single', 'multi'
        checkbox: true,          // Show checkbox column
        selectOnClick: true,     // Select row on click
        persist: false,          // Keep selection across pages
        selectAll: true          // Show select all checkbox
    }
}
```

### API

```javascript
// Select/deselect
table.selectRow(id);
table.deselectRow(id);
table.selectAll();
table.clearSelection();

// Get selection
var ids = table.getSelectedIds();     // ['1', '2', '3']
var data = table.getSelectedData();   // [{...}, {...}]
var count = table.getSelectedCount();

// Check selection
var isSelected = table.isSelected(id);
```

### Callbacks

```javascript
{
    onSelectionChange: function(selectedIds, selectedData) {
        D.one('#deleteBtn').attr('disabled', selectedIds.length === 0);
        D.one('#selectedCount').text(selectedIds.length + ' selected');
    }
}
```

---

## Conditional Formatting

### Configuration

```javascript
{
    conditionalFormatting: {
        rules: [
            {
                id: 'high-value',
                condition: function(row) {
                    return row.amount > 10000;
                },
                className: 'high-value-row',
                style: {
                    backgroundColor: '#fffde7'
                }
            },
            {
                id: 'overdue',
                column: 'due_date',
                condition: function(value, row) {
                    return new Date(value) < new Date();
                },
                cellClassName: 'text-danger font-weight-bold'
            }
        ]
    }
}
```

### API

```javascript
// Add rule dynamically
table.addFormattingRule({
    id: 'new-rule',
    condition: function(row) { return row.priority === 'high'; },
    className: 'priority-high'
});

// Remove rule
table.removeFormattingRule('new-rule');

// Update rule
table.updateFormattingRule('high-value', {
    condition: function(row) { return row.amount > 50000; }
});
```

---

## Context Menu

### Configuration

```javascript
{
    contextMenu: {
        enabled: true,
        items: [
            {
                label: 'View Details',
                icon: 'fas fa-eye',
                action: function(row, table) {
                    window.location = '/items/' + row.id;
                }
            },
            {
                label: 'Edit',
                icon: 'fas fa-edit',
                action: function(row) {
                    Funky.Modal.show('#editModal', { data: row });
                },
                visible: function(row) {
                    return row.editable;
                }
            },
            { type: 'divider' },
            {
                label: 'Delete',
                icon: 'fas fa-trash',
                className: 'text-danger',
                action: function(row, table) {
                    if (confirm('Delete this item?')) {
                        table.removeRow(row.id);
                    }
                }
            }
        ]
    }
}
```

---

## Column Profiles

Save and restore column configurations.

### Configuration

```javascript
{
    columnProfiles: {
        enabled: true,
        storageKey: 'table_profiles_' + tableName,
        presets: [
            {
                name: 'default',
                label: 'Default View',
                columns: ['id', 'name', 'status', 'created_at']
            },
            {
                name: 'detailed',
                label: 'Detailed View',
                columns: ['id', 'name', 'description', 'status', 'amount', 'created_at', 'updated_at']
            }
        ]
    }
}
```

### API

```javascript
// Save current profile
table.saveColumnProfile('my-profile');

// Load profile
table.loadColumnProfile('detailed');

// Get saved profiles
var profiles = table.getColumnProfiles();

// Delete profile
table.deleteColumnProfile('my-profile');
```

---

## Aggregations

Display summary calculations in header or footer.

### Configuration

```javascript
{
    aggregations: {
        enabled: true,
        position: 'footer',  // 'header', 'footer', 'both'
        columns: {
            quantity: ['sum', 'avg'],
            amount: ['sum', 'min', 'max'],
            id: ['count']
        },
        labels: {
            sum: 'Total',
            avg: 'Average',
            min: 'Min',
            max: 'Max',
            count: 'Count'
        },
        formatters: {
            amount: function(value) {
                return '$' + value.toFixed(2);
            }
        }
    }
}
```

### Aggregation Types

- `sum` - Sum of values
- `avg` - Average
- `min` - Minimum value
- `max` - Maximum value
- `count` - Row count
- `countDistinct` - Unique values count

---

## LiveBinding

Automatic updates from data sources.

### Configuration

```javascript
{
    liveBinding: {
        enabled: true,
        mode: 'poll',           // 'poll', 'websocket', 'eventsource'
        interval: 30000,        // Polling interval (ms)
        autoRefresh: true,
        showIndicator: true,
        handlers: {
            create: function(data, table) {
                table.addRow(data);
                table.highlightRow(data.id, 'success');
            },
            update: function(data, table) {
                table.updateRow(data.id, data);
                table.highlightRow(data.id, 'warning');
            },
            delete: function(data, table) {
                table.removeRowAnimated(data.id);
            }
        }
    }
}
```

### API

```javascript
// Manual control
table.startLiveBinding();
table.stopLiveBinding();
table.pauseLiveBinding();
table.resumeLiveBinding();

// Check status
var isLive = table.isLiveBindingActive();
```

---

## Export & Buttons

### Configuration

```javascript
{
    buttons: {
        enabled: true,
        container: '#tableActions',  // Optional external container
        items: [
            {
                type: 'export',
                format: 'csv',
                text: 'Export CSV',
                icon: 'fas fa-file-csv',
                filename: 'export',
                columns: 'visible'  // 'visible', 'all', or array of column names
            },
            {
                type: 'export',
                format: 'xlsx',
                text: 'Export Excel',
                icon: 'fas fa-file-excel',
                serverExport: true,
                serverUrl: '/api/export'
            },
            {
                type: 'export',
                format: 'json',
                text: 'Export JSON',
                icon: 'fas fa-file-code'
            },
            {
                type: 'print',
                text: 'Print',
                icon: 'fas fa-print'
            },
            {
                type: 'colvis',
                text: 'Columns',
                icon: 'fas fa-columns'
            },
            {
                type: 'custom',
                text: 'Refresh',
                icon: 'fas fa-sync',
                action: function(table) {
                    table.reload();
                }
            }
        ]
    }
}
```

### API

```javascript
// Export programmatically
table.export('csv', {
    filename: 'my-export',
    columns: ['name', 'status', 'amount']
});

// Toggle column visibility
table.toggleColumn('description');
table.showColumn('notes');
table.hideColumn('internal_id');
```

---

## Row Animations

### Configuration

```javascript
{
    animations: {
        enabled: true,
        insert: {
            enabled: true,
            className: 'funky-table-row-inserting',
            duration: 400
        },
        remove: {
            enabled: true,
            className: 'funky-table-row-removing',
            duration: 300
        },
        highlight: {
            enabled: true,
            duration: 2000,
            types: {
                success: 'funky-table-row-highlight-success',
                warning: 'funky-table-row-highlight-warning',
                danger: 'funky-table-row-highlight-danger'
            }
        }
    }
}
```

### API

```javascript
// Highlight row
table.highlightRow(id, 'success');  // 'success', 'warning', 'danger'

// Remove with animation
table.removeRowAnimated(id, function() {
    console.log('Row removed');
});

// Insert with animation
table.addRowAnimated(rowData);
```

---

## Responsive Design

Funky.Table automatically hides columns based on container width, showing hidden column data in expandable detail rows.

### Configuration

```javascript
{
    responsive: true,  // Enable responsive mode (boolean or object)
    
    // Or with full options:
    responsive: {
        enabled: true,
        breakpoints: [
            { name: 'mobile', width: 480 },
            { name: 'mobile-l', width: 640 },
            { name: 'tablet', width: 768 },
            { name: 'tablet-l', width: 1024 },
            { name: 'laptop', width: 1280 },
            { name: 'desktop', width: 10000 }
        ]
    }
}
```

### Column Responsive Priority

The `responsivePriority` value determines when a column hides. **Lower values = more important = stays visible longer**.

**Recommended Priority Values:**

| Priority | Visibility | Use For |
|----------|------------|----------|
| 1        | Always visible | Primary identifier (Name, Title) |
| 2        | Visible until mobile | Status, key info |
| 3        | Visible until mobile-l | Important data (Price, Amount) |
| 4        | Visible until tablet | Secondary data |
| 5        | Visible until tablet-l | Supplementary info |
| 6        | Visible until laptop | Details, metadata |
| 7-10     | Desktop only | Notes, descriptions |

**Example:**

```javascript
columns: [
    { data: 'name', responsivePriority: 1 },     // Always visible
    { data: 'status', responsivePriority: 2 },   // Hides on mobile
    { data: 'price', responsivePriority: 3 },    // Hides on mobile-l
    { data: 'quantity', responsivePriority: 4 }, // Hides on tablet
    { data: 'category', responsivePriority: 5 }, // Hides on tablet-l
    { data: 'sku', responsivePriority: 6 },      // Hides on laptop
    { data: 'notes', responsivePriority: 7 }     // Desktop only
]
```

> **Important:** Columns without `responsivePriority` always remain visible regardless of breakpoint.

### Breakpoint Thresholds

The table uses container width (not viewport) to determine breakpoints:

```
Container Width → Breakpoint → Columns with priority > threshold are hidden

> 1280px   → desktop   → Show all (threshold: 10000)
≤ 1280px   → laptop    → Hide priority > 6
≤ 1024px   → tablet-l  → Hide priority > 5
≤ 768px    → tablet    → Hide priority > 4
≤ 640px    → mobile-l  → Hide priority > 3
≤ 480px    → mobile    → Hide priority > 2
```

### API

```javascript
// Get current breakpoint
var bp = table.getCurrentBreakpoint();  // 'mobile', 'tablet', 'desktop'

// Check visibility
var isVisible = table.isColumnVisible('notes');
```

---

## Styling & Density

### Density Modes

```javascript
{
    density: 'normal'  // 'compact', 'normal', 'comfortable'
}

// Change at runtime
table.setDensity('compact');
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-table` | Main table |
| `.funky-table-wrapper` | Container wrapper |
| `.funky-table-header` | Header area |
| `.funky-table-body` | Table body |
| `.funky-table-footer` | Footer area |
| `.funky-table-row` | Data row |
| `.funky-table-row-selected` | Selected row |
| `.funky-table-cell` | Data cell |
| `.funky-table-empty` | Empty state |
| `.funky-table-loading` | Loading state |
| `.funky-table-density-compact` | Compact mode |
| `.funky-table-density-comfortable` | Comfortable mode |

### Custom Styling

```css
/* Override using CSS variables */
.funky-table-wrapper {
    --table-row-height: 48px;
    --table-header-bg: var(--pro-primary);
    --table-stripe-bg: var(--pro-secondary-bg);
}
```

---

## Accessibility

Funky.Table is WCAG 2.1 AA compliant.

### Features

- **ARIA Grid Pattern**: Proper `role="grid"`, `role="row"`, `role="gridcell"`
- **Keyboard Navigation**: Arrow keys, Home/End, PageUp/Down
- **Screen Reader Announcements**: Loading, sort, selection, page changes
- **Focus Management**: Visible focus indicators, focus restoration
- **High Contrast**: `forced-colors` media query support
- **Reduced Motion**: Respects `prefers-reduced-motion`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate rows |
| `←` `→` | Navigate cells |
| `Home` | First cell in row |
| `End` | Last cell in row |
| `Ctrl+Home` | First row |
| `Ctrl+End` | Last row |
| `PageUp` | Move 10 rows up |
| `PageDown` | Move 10 rows down |
| `Enter` | Activate row (trigger click) |
| `Space` | Toggle selection |
| `Ctrl+A` | Select all |
| `Escape` | Clear selection |

### Configuration

```javascript
{
    accessibility: {
        enabled: true,
        ariaLabel: 'Products data table',
        rowLabel: function(row) {
            return row.name + ' - ' + row.status;
        },
        announceLoading: true,
        announceSort: true,
        announcePageChange: true,
        announceSelection: true,
        keyboardNavigation: true
    }
}
```

---

## WebSocket Integration

### Configuration

```javascript
{
    websocket: {
        enabled: true,
        events: {
            create: 'product.created',
            update: 'product.updated',
            delete: 'product.deleted',
            refresh: 'products.refresh'
        },
        handlers: {
            create: function(data, table) {
                table.addRow(data);
            },
            update: function(data, table) {
                table.updateRow(data.id, data);
            },
            delete: function(data, table) {
                table.removeRow(data.id);
            }
        }
    }
}
```

This integrates with Funky.Events for WebSocket message handling.

---

## API Reference

### Static Methods

```javascript
// Initialize
Funky.Table.init(selector, config);

// Get instance
Funky.Table.getInstance('#myTable');

// Get all instances
Funky.Table.getAll();

// Destroy all
Funky.Table.destroyAll();

// Register renderer
Funky.Table.registerRenderer(name, fn);

// Get column presets
Funky.Table.getColumns(tableName);
```

### Instance Methods - Data

```javascript
table.setData(data);           // Replace all data (Bindable)
table.getData();               // Get all data (Bindable)
table.addData(rowData);        // Add row(s) - animated if ≤5 rows (Bindable)
table.updateData(id, updates); // Update row by ID (Bindable)
table.removeData(ids);         // Remove row(s) by ID - animated if ≤5 (Bindable)
table.clearData();             // Clear all data (Bindable)
table.reload(resetPaging);     // Reload from server
table.draw(resetPaging);       // Redraw/refresh table
table.recalculate();           // Recalculate responsive layout
```

### Instance Methods - Pagination

```javascript
table.page();                  // Get page info object
table.page(n);                 // Go to page n (1-based)
table.pageLength();            // Get current page length
table.pageLength(n);           // Set page length
```

### Instance Methods - Sorting

```javascript
table.clearSort();             // Clear all sorting
// Note: Sorting is handled via click/keyboard on column headers
```

### Instance Methods - Search

```javascript
table.search();                // Get current search query
table.search(query);           // Set search query
table.clearSearch();           // Clear search
table.setFilter(key, value);   // Set filter parameter
table.clearFilter(key);        // Clear specific filter
table.clearAllFilters();       // Clear all filters
```

### Instance Methods - Selection

```javascript
table.select(ids);             // Select row(s) by ID
table.deselect(ids);           // Deselect row(s) by ID
table.selectAll();             // Select all visible rows
table.deselectAll();           // Clear all selection
table.toggleSelect(id);        // Toggle selection for row
table.getSelectedIds();        // Get selected IDs array
table.getSelectedData();       // Get selected row objects
```

### Instance Methods - Columns

```javascript
table.showColumn(name);        // Show column by data name
table.hideColumn(name);        // Hide column by data name
table.toggleColumn(name);      // Toggle visibility by data name
table.getVisibleColumns();     // Get array of visible columns
```

### Instance Methods - Export

```javascript
table.export(format, options); // Export data (csv, xlsx, json)
```

### Instance Methods - Animations

```javascript
table.highlightRow(id, type);          // Highlight row ('success', 'warning', 'danger')
table.highlightRows(ids, type);        // Highlight multiple rows
table.insertRowAnimated(data, opts);   // Animated insert
table.updateRowAnimated(data);         // Animated update
table.removeRowAnimated(id, cb);       // Animated remove single row
table.removeRowsAnimated(ids, cb);     // Animated remove multiple rows
```

### Instance Methods - Other

```javascript
table.destroy();               // Destroy instance and cleanup
table.showContextMenu(id,x,y); // Show context menu for row
table.closeContextMenu();      // Close open context menu
```

### Instance Methods - Aggregations

```javascript
table.showAggregations(show);  // Show/hide aggregation footer
table.exportAggregations();    // Get aggregation data
```

### Instance Methods - Column Profiles

```javascript
table.exportProfiles();        // Export column visibility state
```

---

## Events

### Using Callbacks

```javascript
Funky.Table.init('#table', {
    onInit: function(table) {
        console.log('Table initialized');
    },
    onLoad: function(data, table) {
        console.log('Data loaded:', data.length, 'rows');
    },
    onError: function(error, table) {
        console.error('Error:', error);
    },
    onRowClick: function(rowData, rowElement, table) {
        console.log('Row clicked:', rowData);
    },
    onSelectionChange: function(ids, data, table) {
        console.log('Selected:', ids);
    },
    onSort: function(column, direction, table) {
        console.log('Sorted by:', column, direction);
    },
    onPage: function(page, table) {
        console.log('Page:', page);
    },
    onSearch: function(query, table) {
        console.log('Search:', query);
    }
});
```

### Using Funky.Events (PubSub)

```javascript
// Global PubSub events (use colon notation: funky:component:action)
Funky.Events.on('funky:table:init', function(e) {
    console.log('Table init:', e.detail.id);
});

Funky.Events.on('funky:table:load', function(e) {
    console.log('Table load:', e.detail.id);
});

Funky.Events.on('funky:table:select', function(e) {
    console.log('Selection:', e.detail.selected);
});

Funky.Events.on('funky:table:destroy', function(e) {
    console.log('Table destroyed:', e.detail.id);
});
```

---

## Theming

Funky.Table uses CSS custom properties for theming.

### CSS Variables

```css
:root {
    /* Table structure */
    --pro-table-bg: var(--pro-bg);
    --pro-table-border-color: var(--pro-border-color);
    --pro-table-border-radius: var(--pro-radius-md);
    
    /* Header */
    --pro-table-header-bg: var(--pro-secondary-bg);
    --pro-table-header-color: var(--pro-text);
    
    /* Rows */
    --pro-table-row-height: 48px;
    --pro-table-row-hover-bg: var(--pro-bg-hover);
    --pro-table-row-selected-bg: rgba(var(--pro-primary-rgb), 0.1);
    --pro-table-stripe-bg: rgba(0, 0, 0, 0.02);
    
    /* Cells */
    --pro-table-cell-padding: 0.75rem 1rem;
    
    /* Density */
    --pro-table-compact-padding: 0.25rem 0.5rem;
    --pro-table-comfortable-padding: 1rem 1.25rem;
}
```

---

## Migration from DataTables

See [Migration Guide](./FUNKY_TABLE_MIGRATION.md) for complete migration instructions.

### Quick Comparison

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `$(selector).DataTable(config)` | `Funky.Table.init(selector, config)` |
| `table.ajax.reload()` | `table.reload()` |
| `table.search(q).draw()` | `table.search(q)` |
| `table.rows('.selected').data()` | `table.getSelectedData()` |
| `table.row.add(data).draw()` | `table.addRow(data)` |
| `table.row(selector).remove().draw()` | `table.removeRow(id)` |

### Enable Compatibility Layer

```javascript
// Use existing FunkyDataTables API with Funky.Table internally
Funky.DataTables.enableFunkyTable();

// Existing code continues to work
var table = Funky.DataTables.init('#table', {...});
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

ES5 compatible - no transpilation required.

---

## Performance Tips

1. **Use server-side processing** for large datasets (>1000 rows)
2. **Limit visible columns** on mobile using responsive priorities
3. **Use virtual scrolling** for very long lists
4. **Debounce search** with appropriate delay
5. **Lazy load** row details on expand

---

## Troubleshooting

### Table not rendering
- Check console for errors
- Verify element exists in DOM
- Ensure columns are properly defined

### Data not loading
- Check network tab for AJAX errors
- Verify `ajaxUrl` is correct
- Check server response format

### Selection not working
- Ensure `selection.mode` is set
- Check `idField` matches your data

### Export not working
- Verify `buttons.enabled` is true
- Check button configuration

---

## Examples

See the Playground at `/playground/components/table` for interactive examples.
