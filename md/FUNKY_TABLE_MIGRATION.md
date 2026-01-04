# Funky.Table Migration Guide

> **Purpose**: Step-by-step guide for migrating from jQuery DataTables to Funky.Table

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Phases](#migration-phases)
3. [Quick Start](#quick-start)
4. [Configuration Mapping](#configuration-mapping)
5. [Column Mapping](#column-mapping)
6. [Method Mapping](#method-mapping)
7. [Event Mapping](#event-mapping)
8. [CSS Class Mapping](#css-class-mapping)
9. [Step-by-Step Examples](#step-by-step-examples)
10. [Compatibility Layer](#compatibility-layer)
11. [Testing Your Migration](#testing-your-migration)
12. [Troubleshooting](#troubleshooting)
13. [Rollback Plan](#rollback-plan)

---

## Overview

### Why Migrate?

| Benefit | Description |
|---------|-------------|
| **No jQuery Dependency** | Pure ES5 JavaScript, smaller bundle |
| **Better Performance** | Optimized rendering, virtual DOM-like updates |
| **Full Accessibility** | WCAG 2.1 AA compliant out of the box |
| **Unified Theming** | Uses `--pro-*` CSS variables |
| **Built-in Features** | WebSocket, animations, advanced filters included |
| **Better DX** | Simpler API, better error messages |

### Migration Path

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Enable Compatibility Layer (Zero Changes)         │
│  ↓                                                          │
│  Step 2: Test All Existing Tables                           │
│  ↓                                                          │
│  Step 3: Migrate Templates One-by-One                       │
│  ↓                                                          │
│  Step 4: Remove Compatibility Layer                         │
│  ↓                                                          │
│  Step 5: Remove jQuery DataTables                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Phases

### Phase A: Compatibility Layer (Week 1-2)

**Goal**: Funky.Table runs internally with zero template changes.

```javascript
// Enable Funky.Table mode globally
Funky.DataTables.enableFunkyTable();

// All existing code continues to work
var table = Funky.DataTables.init('#myTable', { ... });
```

**Checklist**:
- [ ] Deploy `table.js` and `tables.css`
- [ ] Enable feature flag
- [ ] Monitor for errors
- [ ] Validate all tables render correctly
- [ ] Test sorting, pagination, search
- [ ] Test selection and export

### Phase B: Template Migration (Week 3-8)

**Goal**: Update templates to use Funky.Table directly.

Priority order:
1. Simple tables (list views)
2. Tables with filters
3. Tables with selection/actions
4. Complex tables (WebSocket, live updates)

### Phase C: Cleanup (Week 9-12)

**Goal**: Remove legacy code.

- [ ] Remove `FunkyDataTables.enableFunkyTable()` calls
- [ ] Remove jQuery DataTables from `package.json`
- [ ] Remove DataTables CSS files
- [ ] Update service worker cache list
- [ ] Archive migration guide

---

## Quick Start

### Before (jQuery DataTables)

```javascript
$(document).ready(function() {
    var table = $('#myTable').DataTable({
        ajax: '/api/data',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'name', title: 'Name' },
            { data: 'status', title: 'Status' }
        ],
        pageLength: 25,
        order: [[1, 'asc']]
    });
});
```

### After (Funky.Table)

```javascript
(function() {
    var table = Funky.Table.init('#myTable', {
        ajaxUrl: '/api/data',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'name', title: 'Name' },
            { data: 'status', title: 'Status' }
        ],
        pageLength: 25,
        defaultSort: { column: 'name', direction: 'asc' }
    });
})();
```

---

## Configuration Mapping

### Core Options

| jQuery DataTables | Funky.Table | Notes |
|-------------------|-------------|-------|
| `ajax` | `ajaxUrl` | String URL only |
| `ajax.url` | `ajaxUrl` | Same |
| `ajax.data` | `extraAjaxData` | Object only |
| `ajax.dataSrc` | `dataSrc` | Same |
| `columns` | `columns` | See column mapping |
| `data` | `data` | Client-side data |
| `serverSide` | `serverSide` | Same |
| `processing` | Auto | Always shown |
| `pageLength` | `pageLength` | Same |
| `lengthMenu` | `lengthMenu` | Same |
| `paging` | `paging` | Same |
| `ordering` | `ordering` | Same |
| `searching` | `searching` | Same |
| `order` | `defaultSort` | Different format |
| `rowId` | `idField` | Renamed |
| `dom` | N/A | Auto-generated |
| `language` | `language` | Similar |

### Order/Sort Format

```javascript
// jQuery DataTables
order: [[0, 'asc'], [1, 'desc']]

// Funky.Table
defaultSort: { column: 'name', direction: 'asc' }
// or
defaultSort: [
    { column: 'category', direction: 'asc' },
    { column: 'name', direction: 'asc' }
]
```

### Selection Options

```javascript
// jQuery DataTables
select: {
    style: 'multi',
    selector: 'td:first-child'
}

// Funky.Table
selection: {
    mode: 'multi',      // 'none', 'single', 'multi'
    checkbox: true,
    selectOnClick: true
}
```

### Responsive Options

```javascript
// jQuery DataTables
responsive: {
    details: {
        type: 'inline'
    }
}

// Funky.Table
responsive: {
    enabled: true,
    details: {
        type: 'inline'
    }
}
```

---

## Column Mapping

### Column Options

| jQuery DataTables | Funky.Table | Notes |
|-------------------|-------------|-------|
| `data` | `data` | Same |
| `name` | `name` | Same |
| `title` | `title` | Same |
| `visible` | `visible` | Same |
| `orderable` | `sortable` | Renamed |
| `searchable` | `searchable` | Same |
| `className` | `className` | Same |
| `width` | `width` | Same |
| `defaultContent` | `defaultContent` | Same |
| `render` | `render` | Similar |
| `createdCell` | `createdCell` | Same |

### Render Function

```javascript
// jQuery DataTables
{
    data: 'price',
    render: function(data, type, row, meta) {
        if (type === 'display') {
            return '$' + data.toFixed(2);
        }
        return data;
    }
}

// Funky.Table
{
    data: 'price',
    render: function(value, row, rowIndex) {
        return '$' + parseFloat(value).toFixed(2);
    }
}
```

### Column Types

```javascript
// jQuery DataTables - manual render
{
    data: 'created_at',
    render: function(data) {
        return moment(data).format('YYYY-MM-DD');
    }
}

// Funky.Table - built-in type
{
    data: 'created_at',
    type: 'date'
}

// Available types: 'date', 'money', 'number', 'boolean', 'status', 'email', 'link'
```

---

## Method Mapping

### Data Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.ajax.reload()` | `table.reload()` |
| `table.ajax.url(url).load()` | `table.setAjaxUrl(url); table.reload()` |
| `table.clear().draw()` | `table.clear()` |
| `table.row.add(data).draw()` | `table.addRow(data)` |
| `table.rows.add(data).draw()` | `table.addRows(data)` |
| `table.row(selector).remove().draw()` | `table.removeRow(id)` |
| `table.row(selector).data()` | `table.getRowData(id)` |
| `table.rows().data().toArray()` | `table.getData()` |

### Search Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.search(query).draw()` | `table.search(query)` |
| `table.search('')` | `table.clearSearch()` |
| `table.column(n).search(query).draw()` | `table.setFilter(column, value)` |

### Pagination Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.page(n).draw()` | `table.goToPage(n + 1)` |
| `table.page('next').draw()` | `table.nextPage()` |
| `table.page('previous').draw()` | `table.previousPage()` |
| `table.page.len(n).draw()` | `table.setPageLength(n)` |
| `table.page.info()` | `table.getPageInfo()` |

### Sort Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.order([0, 'asc']).draw()` | `table.sort('columnName', 'asc')` |
| `table.order()` | `table.getSortOrder()` |

### Selection Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.rows('.selected').data()` | `table.getSelectedData()` |
| `table.rows('.selected').ids()` | `table.getSelectedIds()` |
| `table.rows().select()` | `table.selectAll()` |
| `table.rows().deselect()` | `table.clearSelection()` |
| `table.row(selector).select()` | `table.selectRow(id)` |
| `table.row(selector).deselect()` | `table.deselectRow(id)` |

### Column Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.column(n).visible(true)` | `table.showColumn(name)` |
| `table.column(n).visible(false)` | `table.hideColumn(name)` |
| `table.column(n).visible()` | `table.isColumnVisible(name)` |

### Other Methods

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `table.destroy()` | `table.destroy()` |
| `table.draw()` | `table.refresh()` |
| `$.fn.dataTable.isDataTable(selector)` | `Funky.Table.get(selector)` |

---

## Event Mapping

### Callback-Style Events

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `initComplete` | `onInit` |
| `drawCallback` | `onLoad` |
| `rowCallback` | `rowCallback` |
| `createdRow` | `createdRow` |

```javascript
// jQuery DataTables
$('#table').DataTable({
    initComplete: function(settings, json) {
        console.log('Initialized');
    },
    drawCallback: function(settings) {
        console.log('Drawn');
    }
});

// Funky.Table
Funky.Table.init('#table', {
    onInit: function(table) {
        console.log('Initialized');
    },
    onLoad: function(data, table) {
        console.log('Loaded');
    }
});
```

### PubSub Events

| jQuery DataTables | Funky.Table (PubSub) |
|-------------------|-------------|
| `$('#table').on('init.dt', fn)` | `Funky.Events.on('funky:table:init', fn)` |
| `$('#table').on('draw.dt', fn)` | `Funky.Events.on('funky:table:load', fn)` |
| `$('#table').on('select.dt', fn)` | `onSelectionChange` callback |
| `$('#table').on('order.dt', fn)` | `onSort` callback |
| `$('#table').on('page.dt', fn)` | `onPage` callback |
| `$('#table').on('search.dt', fn)` | `onSearch` callback |

---

## CSS Class Mapping

### Structure Classes

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `.dataTable` | `.funky-table` |
| `.dataTables_wrapper` | `.funky-table-wrapper` |
| `.dataTables_filter` | `.funky-table-search-wrapper` |
| `.dataTables_paginate` | `.funky-table-pagination` |
| `.dataTables_info` | `.funky-table-info` |
| `.dataTables_length` | `.funky-table-length` |
| `.dataTables_processing` | `.funky-table-processing` |
| `.dataTables_empty` | `.funky-table-empty` |
| `.dataTables_scroll` | `.funky-table-container` |

### Row/Cell Classes

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `tbody tr` | `.funky-table-row` |
| `tbody tr.selected` | `.funky-table-row-selected` |
| `tbody tr:hover` | `.funky-table-row:hover` |
| `tbody td` | `.funky-table-cell` |

### Sorting Classes

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `.sorting` | `.funky-table-sortable` |
| `.sorting_asc` | `.funky-table-sort-asc` |
| `.sorting_desc` | `.funky-table-sort-desc` |
| `.sorting_disabled` | No class (just no `.funky-table-sortable`) |

### Responsive Classes

| jQuery DataTables | Funky.Table |
|-------------------|-------------|
| `.dtr-control` | `.funky-table-control-cell` |
| `.dtr-details` | `.funky-table-details-row` |
| `.dtr-hidden` | `.funky-table-hidden` |

---

## Step-by-Step Examples

### Example 1: Simple List Table

**Before:**
```html
<table id="clientsTable" class="table table-striped"></table>

<script>
$(document).ready(function() {
    var table = $('#clientsTable').DataTable({
        ajax: '/api/clients',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'name', title: 'Name' },
            { data: 'email', title: 'Email' },
            { data: 'status', title: 'Status' }
        ],
        pageLength: 25
    });
});
</script>
```

**After:**
```html
<table id="clientsTable"></table>

<script>
(function() {
    var table = Funky.Table.init('#clientsTable', {
        tableName: 'clients',
        ajaxUrl: '/api/clients',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'name', title: 'Name' },
            { data: 'email', title: 'Email', type: 'email' },
            { data: 'status', title: 'Status', type: 'status' }
        ],
        pageLength: 25
    });
})();
</script>
```

### Example 2: Table with Selection

**Before:**
```javascript
var table = $('#ordersTable').DataTable({
    ajax: '/api/orders',
    columns: [...],
    select: {
        style: 'multi'
    }
});

$('#bulkDelete').on('click', function() {
    var selectedData = table.rows('.selected').data().toArray();
    var ids = selectedData.map(function(row) { return row.id; });
    
    if (ids.length === 0) {
        alert('Select at least one row');
        return;
    }
    
    $.post('/api/orders/bulk-delete', { ids: ids });
});
```

**After:**
```javascript
var table = Funky.Table.init('#ordersTable', {
    tableName: 'orders',
    ajaxUrl: '/api/orders',
    columns: [...],
    selection: {
        mode: 'multi',
        checkbox: true
    },
    onSelectionChange: function(ids, data) {
        D.one('#bulkDelete').attr('disabled', ids.length === 0);
    }
});

D.one('#bulkDelete').on('click', function() {
    var ids = table.getSelectedIds();
    
    if (ids.length === 0) {
        Funky.Toast.warning('Select at least one row');
        return;
    }
    
    fetch('/api/orders/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: ids }),
        headers: { 'Content-Type': 'application/json' }
    });
});
```

### Example 3: Table with Filters

**Before:**
```javascript
var extraData = {};

var table = Funky.DataTables.init('#tradesTable', {
    tableName: 'trades',
    ajaxUrl: '/api/trades',
    extraAjaxData: extraData
});

table.setupGlobalSearch('#searchInput');
table.setupDateRangeFilter('#dateRange', '#dateColumn', extraData, [
    { value: 'trade_date', label: 'Trade Date' },
    { value: 'created_at', label: 'Created' }
]);
table.setupClientFilter('#clientFilter', extraData);
```

**After:**
```javascript
var table = Funky.Table.init('#tradesTable', {
    tableName: 'trades',
    ajaxUrl: '/api/trades',
    columns: [...],
    search: {
        enabled: true,
        selector: '#searchInput'
    },
    filters: {
        dateRange: {
            enabled: true,
            selector: '#dateRange',
            columnSelector: '#dateColumn',
            columns: [
                { value: 'trade_date', label: 'Trade Date', selected: true },
                { value: 'created_at', label: 'Created' }
            ]
        },
        client: {
            enabled: true,
            selector: '#clientFilter',
            remote: {
                url: '/api/clients',
                searchParam: 'search'
            }
        }
    }
});
```

### Example 4: Table with WebSocket

**Before:**
```javascript
var table = Funky.DataTables.init('#tradesTable', {
    tableName: 'trades',
    ajaxUrl: '/api/trades'
});

// Manual WebSocket handling
Funky.Events.on('trade.created', function(data) {
    table.addData(data.trade);
});

Funky.Events.on('trade.updated', function(data) {
    table._table.ajax.reload(null, false);
});

Funky.Events.on('trade.deleted', function(data) {
    // Find and remove row
    table._table.rows().every(function() {
        if (this.data().id === data.id) {
            this.remove();
        }
    });
    table._table.draw(false);
});
```

**After:**
```javascript
var table = Funky.Table.init('#tradesTable', {
    tableName: 'trades',
    ajaxUrl: '/api/trades',
    columns: [...],
    websocket: {
        enabled: true,
        events: {
            create: 'trade.created',
            update: 'trade.updated',
            delete: 'trade.deleted'
        }
    },
    animations: {
        enabled: true
    }
});

// That's it! WebSocket handling is automatic
```

---

## Compatibility Layer

The compatibility layer allows existing code to work without changes.

### Enable Compatibility Mode

```javascript
// In your app initialization
Funky.DataTables.enableFunkyTable();

// All existing FunkyDataTables calls now use Funky.Table internally
var table = Funky.DataTables.init('#myTable', { ... });
```

### Check Current Mode

```javascript
// Check if Funky.Table is enabled
if (Funky.DataTables.isFunkyTableEnabled()) {
    console.log('Using Funky.Table');
} else {
    console.log('Using jQuery DataTables');
}
```

### Migration Status

```javascript
// Log status of all tables
Funky.DataTables.logMigrationStatus();

// Generate detailed report
var report = Funky.DataTables.generateMigrationReport();
console.log(JSON.stringify(report, null, 2));
```

### Per-Table Override

```javascript
// Force legacy mode for specific table (if needed)
Funky.DataTables.disableFunkyTable();
var legacyTable = Funky.DataTables.init('#problemTable', { ... });
Funky.DataTables.enableFunkyTable();
```

---

## Testing Your Migration

### Checklist Per Table

- [ ] Table renders correctly
- [ ] Data loads from server
- [ ] Pagination works
- [ ] Sorting works (all sortable columns)
- [ ] Search works
- [ ] Filters work (if applicable)
- [ ] Row selection works (if applicable)
- [ ] Bulk actions work (if applicable)
- [ ] Export works (if applicable)
- [ ] Context menu works (if applicable)
- [ ] WebSocket updates work (if applicable)
- [ ] Responsive mode works
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

### Automated Testing

```javascript
// Test suite for migrated table
describe('Trades Table', function() {
    var table;
    
    beforeEach(function() {
        table = Funky.Table.init('#tradesTable', { ... });
    });
    
    afterEach(function() {
        table.destroy();
    });
    
    it('should load data', function(done) {
        table.onLoad = function(data) {
            expect(data.length).toBeGreaterThan(0);
            done();
        };
    });
    
    it('should sort by column', function() {
        table.sort('trade_date', 'desc');
        var order = table.getSortOrder();
        expect(order[0].column).toBe('trade_date');
    });
    
    it('should select rows', function() {
        table.selectRow('1');
        expect(table.getSelectedIds()).toContain('1');
    });
});
```

---

## Troubleshooting

### Common Issues

#### Table not rendering

```javascript
// Check if element exists
var el = document.querySelector('#myTable');
console.log('Element:', el);

// Check if Funky.Table is loaded
console.log('Funky.Table:', window.Funky && window.Funky.Table);

// Enable debug mode
Funky.Table.init('#myTable', {
    debug: true,
    // ...
});
```

#### AJAX errors

```javascript
// Check network tab for request/response
// Verify URL is correct
// Check server response format:
{
    "data": [...],    // or your table name
    "total": 100
}
```

#### Columns not matching

```javascript
// Verify column data paths
columns: [
    { data: 'user.name' },  // Nested path
    { data: 'status' }      // Direct path
]

// Check actual data structure
table.onLoad = function(data) {
    console.log('First row:', data[0]);
};
```

#### Selection not working

```javascript
// Ensure idField matches your data
{
    idField: 'id',  // Must match your row ID field
    selection: {
        mode: 'multi'
    }
}
```

---

## Rollback Plan

### Quick Rollback

```javascript
// Disable Funky.Table mode
Funky.DataTables.disableFunkyTable();

// Tables will now use jQuery DataTables
```

### Full Rollback

1. Remove `table.js` and `tables.css` from assets
2. Remove `Funky.DataTables.enableFunkyTable()` call
3. Revert any template changes
4. Clear browser cache
5. Test affected pages

### Partial Rollback

If only specific tables have issues:

```javascript
// Disable globally, then re-enable for working tables
Funky.DataTables.disableFunkyTable();

// Problem table uses jQuery DataTables
var problemTable = Funky.DataTables.init('#problemTable', { ... });

// Re-enable for other tables
Funky.DataTables.enableFunkyTable();
var workingTable = Funky.DataTables.init('#workingTable', { ... });
```

---

## Support

### Resources

- [Funky.Table API Documentation](./FUNKY_TABLE.md)
- [Frontend Components Guide](../llm_context/frontend/COMPONENTS.md)
- [Theming Guide](./THEMING.md)

### Getting Help

1. Check browser console for errors
2. Enable debug mode for verbose logging
3. Check network tab for AJAX issues
4. Review similar working tables for patterns
5. Consult phase documentation in `plan_table/`

---

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | Compatibility | Deploy, enable flag, monitor |
| 3-4 | Priority 1 | Migrate high-traffic tables |
| 5-6 | Priority 2 | Migrate medium-complexity tables |
| 7-8 | Priority 3 | Migrate remaining tables |
| 9-10 | Cleanup | Remove compatibility layer |
| 11-12 | Documentation | Update all docs |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Templates Migrated | 100% |
| Zero Regression Bugs | ✓ |
| Test Coverage | >90% |
| Bundle Size Reduction | >50KB |
| Lighthouse Accessibility | 100 |
