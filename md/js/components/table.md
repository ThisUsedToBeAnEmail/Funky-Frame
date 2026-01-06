# Funky.Table

Native ES5 table component with server-side and client-side data support, replacing jQuery DataTables.

## Overview

`Funky.Table` provides a fully-featured data table component with:
- Server-side and client-side data processing
- Column sorting (single and multi-column)
- Global search with debounce
- Pagination with configurable page sizes
- Row selection (single, multi, OS-style)
- Column visibility toggle
- Responsive column hiding
- Conditional formatting
- Context menus
- CSV/Excel export
- Fixed headers
- Keyboard navigation
- ARIA accessibility
- LiveBinding integration

## Quick Start

```javascript
// Basic table with client-side data
var table = Funky.Table.init('#myTable', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' }
  ],
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]
});

// Server-side table
var serverTable = Funky.Table.init('#serverTable', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' }
  ],
  ajaxUrl: '/api/users',
  serverSide: true
});
```

## API Reference

### Factory Methods

#### `Funky.Table.init(container, options)`

Create a table instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string/Element | Yes | Container element or selector |
| options | object | No | Configuration options |

**Returns:** `TableInstance`

---

#### `Funky.Table.getInstance(id)`

Get table instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Container element ID |

**Returns:** `TableInstance` or `undefined`

---

### Configuration Options

#### Data Source

| Name | Type | Default | Description |
|------|------|---------|-------------|
| data | array | `null` | Array of row data objects |
| ajax | object | `null` | AJAX config: `{ url, method, data, dataSrc }` |
| ajaxUrl | string | `null` | Simple URL string (alternative to ajax object) |
| tableName | string | `null` | Table name for auto-detecting data key |
| dataSrc | function | `null` | Function to extract data from response |
| extraAjaxData | object | `null` | Extra data to send with AJAX requests |
| updateStats | function | `null` | Callback to update stats from response |

#### Columns

| Name | Type | Default | Description |
|------|------|---------|-------------|
| columns | array | `[]` | Column definitions array |

**Column Definition Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| data | string | `null` | Data property name or index |
| title | string | `''` | Column header text |
| name | string | `null` | Column identifier |
| className | string | `''` | CSS class for cells |
| orderable | boolean | `true` | Allow sorting |
| searchable | boolean | `true` | Include in search |
| visible | boolean | `true` | Column visibility |
| width | string | `null` | Column width (e.g., `'100px'`) |
| type | string | `'string'` | Data type: `'string'`, `'num'`, `'date'`, `'html'` |
| render | function | `null` | Custom render function `(data, type, row, meta)` |
| defaultContent | string | `''` | Default if data is null |
| responsivePriority | number | `undefined` | Lower = keep visible longer |

#### Paging

| Name | Type | Default | Description |
|------|------|---------|-------------|
| paging | boolean | `true` | Enable pagination |
| pageLength | number | `25` | Rows per page |
| lengthMenu | array | `[[10,25,50,100,-1],[10,25,50,100,'All']]` | Page size options |
| lengthChange | boolean | `true` | Allow length change |

#### Searching

| Name | Type | Default | Description |
|------|------|---------|-------------|
| searching | boolean | `true` | Enable search |
| searchDelay | number | `300` | Debounce delay (ms) |

#### Ordering

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ordering | boolean | `true` | Enable sorting |
| order | array | `[[0, 'asc']]` | Initial sort: `[[colIndex, 'asc'/'desc']]` |
| multiSort | boolean | `false` | Allow multi-column sort |

#### Server-Side

| Name | Type | Default | Description |
|------|------|---------|-------------|
| serverSide | boolean | `false` | Server-side processing |
| processing | boolean | `true` | Show processing indicator |
| deferLoading | number | `null` | Pre-set total count |

#### Selection

| Name | Type | Default | Description |
|------|------|---------|-------------|
| select | string | `false` | Selection mode: `false`, `'single'`, `'multi'`, `'os'` |
| selectAllCheckbox | boolean | `false` | Add select-all checkbox |

#### Features

| Name | Type | Default | Description |
|------|------|---------|-------------|
| enableColvis | boolean | `false` | Column visibility toggle |
| enableExport | boolean | `false` | Export buttons (CSV/Excel) |
| enableImport | boolean | `false` | Import button |
| buttons | array | `[]` | Custom button configs |

#### Responsive

| Name | Type | Default | Description |
|------|------|---------|-------------|
| responsive | boolean | `true` | Enable responsive mode |
| breakpoints | object | `{sm:576,md:768,lg:992,xl:1200}` | Breakpoint widths |

#### Appearance

| Name | Type | Default | Description |
|------|------|---------|-------------|
| scrollX | boolean | `false` | Horizontal scroll |
| scrollY | string | `null` | Vertical scroll height |
| autoWidth | boolean | `true` | Auto-calculate widths |
| fixedHeader | boolean | `true` | Sticky header |
| striped | boolean | `true` | Zebra striping |
| hover | boolean | `true` | Hover effect |
| bordered | boolean | `true` | Cell borders |
| compact | boolean | `false` | Compact mode |
| emptyMessage | string | `'No data available'` | Empty state message |

#### Conditional Formatting

| Name | Type | Default | Description |
|------|------|---------|-------------|
| conditionalFormatting.enabled | boolean | `false` | Enable conditional formatting |
| conditionalFormatting.rules | array | `[]` | Formatting rules array |
| conditionalFormatting.onRuleApplied | function | `null` | Callback when rule applied |

#### State

| Name | Type | Default | Description |
|------|------|---------|-------------|
| stateSave | boolean | `false` | Persist state |
| stateKey | string | `null` | Storage key |
| stateDuration | number | `7200` | State TTL (seconds) |

#### Accessibility

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ariaLabel | string | `'Data table'` | Accessible table label |
| infoTemplate | string | `'Showing {start} to {end} of {total} entries'` | Info text template |

#### Real-Time / Live Binding

| Name | Type | Default | Description |
|------|------|---------|-------------|
| websocket | object | `null` | WebSocket config for real-time updates |
| websocket.enabled | boolean | `false` | Enable WebSocket integration |
| websocket.entity | string | `null` | Entity type to listen for |
| websocket.events | object | `{}` | Event name mappings |
| websocket.filterCheck | function | `null` | Filter function for new rows |
| liveBinding | object | `null` | Live binding config |
| liveBinding.source | string | `null` | `'websocket'`, `'eventsource'`, or `'polling'` |
| liveBinding.websocket | object | `null` | WebSocket URL and options |
| liveBinding.eventsource | object | `null` | SSE URL and event types |
| liveBinding.polling | object | `null` | Polling interval and URL |

#### Aggregations

| Name | Type | Default | Description |
|------|------|---------|-------------|
| aggregations | object | `null` | Aggregation config |
| aggregations.enabled | boolean | `false` | Enable aggregations |
| aggregations.columns | object | `{}` | Column aggregation configs |
| aggregations.position | string | `'footer'` | `'footer'`, `'header'`, or `'both'` |
| aggregations.formatting | object | `{}` | Number/currency/percent formatting |
| aggregations.serverSide | object | `null` | Server-side aggregation config |
| aggregations.onCalculate | function | `null` | Callback after calculation |

**Aggregation Types:** `'sum'`, `'average'`, `'count'`, `'min'`, `'max'`, `'median'`

#### Column Profiles

| Name | Type | Default | Description |
|------|------|---------|-------------|
| columnProfiles | object | `null` | Column profiles config |
| columnProfiles.enabled | boolean | `false` | Enable column profiles |
| columnProfiles.storageKey | string | `tableName + '_column_profiles'` | localStorage key |
| columnProfiles.profiles | array | `[]` | Predefined profiles |
| columnProfiles.defaultProfile | string | `'Default'` | Default profile name |
| columnProfiles.buttonSelector | string | `null` | Custom button container |
| columnProfiles.serverSync | object | `null` | Server sync config |
| columnProfiles.onProfileChange | function | `null` | Profile change callback |

#### Animations

| Name | Type | Default | Description |
|------|------|---------|-------------|
| animations | object | `{}` | Animation config |
| animations.enabled | boolean | `true` | Enable row animations |
| animations.insertDuration | number | `300` | Insert animation duration (ms) |
| animations.removeDuration | number | `200` | Remove animation duration (ms) |
| animations.highlightDuration | number | `1500` | Highlight flash duration (ms) |

#### Callbacks

| Name | Type | Description |
|------|------|-------------|
| initComplete | function | Called after initialization: `(table)` |
| drawCallback | function | Called after each draw: `(table)` |
| rowCallback | function | Called for each row: `(row, data, index)` |
| createdRow | function | Called when row created: `(row, data, dataIndex)` |
| headerCallback | function | Called for header: `(thead, data, start, end, display)` |
| footerCallback | function | Called for footer: `(tfoot, data, start, end, display)` |
| onSelect | function | Selection changed: `(selectedData, table)` |
| onDeselect | function | Deselection changed: `(deselectedData, table)` |
| onOrder | function | Sort changed: `(order, table)` |
| onPage | function | Page changed: `(page, table)` |
| onSearch | function | Search changed: `(query, table)` |
| onError | function | Error occurred: `(error, table)` |

---

### Instance Methods

#### Data

##### `getData()`
**Returns:** Current data array.

```javascript
var allData = table.getData();
```

---

##### `setData(data)`
Replace all table data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | array | New data array |

```javascript
table.setData([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
]);
```

---

##### `addData(data)`
Add new rows to the table.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | array/object | Row(s) to add |

```javascript
table.addData({ id: 3, name: 'Item 3' });
table.addData([{ id: 4, name: 'Item 4' }, { id: 5, name: 'Item 5' }]);
```

---

##### `updateData(id, updates)`
Update a specific row by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string/number | Row ID |
| updates | object | Properties to update |

```javascript
table.updateData(5, { name: 'Updated Name', status: 'active' });
```

---

##### `removeData(ids)`
Remove rows by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | array/string/number | ID(s) to remove |

```javascript
table.removeData(5);
table.removeData([1, 2, 3]);
```

---

##### `clearData()`
Remove all data from the table.

```javascript
table.clearData();
```

---

##### `reload(resetPaging)`
Reload data from source.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| resetPaging | boolean | `false` | Reset to page 1 |

```javascript
table.reload();       // Keep current page
table.reload(true);   // Reset to page 1
```

---

##### `draw(resetPaging)`
Redraw the table.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| resetPaging | boolean | `false` | Reset to page 1 |

```javascript
table.draw();
```

---

##### `recalculate()`
Recalculate column widths and layout.

```javascript
table.recalculate();
```

---

#### Selection

##### `getSelectedIds()`
**Returns:** Set of selected row IDs.

```javascript
var ids = table.getSelectedIds(); // Set { '1', '3', '5' }
```

---

##### `getSelectedData()`
**Returns:** Array of selected row data objects.

```javascript
var selected = table.getSelectedData();
// [{ id: 1, name: 'Item 1' }, { id: 3, name: 'Item 3' }]
```

---

##### `select(ids)`
Select row(s) by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | array/string/number | ID(s) to select |

```javascript
table.select(5);
table.select([1, 2, 3]);
```

---

##### `deselect(ids)`
Deselect row(s) by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | array/string/number | ID(s) to deselect |

```javascript
table.deselect(5);
table.deselect([1, 2, 3]);
```

---

##### `toggleSelect(id)`
Toggle selection state of a row.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string/number | Row ID |

```javascript
table.toggleSelect(5);
```

---

##### `selectAll()`
Select all visible rows.

```javascript
table.selectAll();
```

---

##### `deselectAll()`
Deselect all rows.

```javascript
table.deselectAll();
```

---

#### Pagination

##### `page(pageNum)`
Go to specific page (1-based).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| pageNum | number/string | Page number, `'first'`, `'last'`, `'next'`, `'previous'` |

```javascript
table.page(3);
table.page('next');
table.page('last');
```

---

##### `pageLength(length)`
Get or set page length.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| length | number | (Optional) New page length |

**Returns:** Current page length if no argument provided.

```javascript
var len = table.pageLength();  // Get: 25
table.pageLength(50);          // Set to 50
```

---

#### Ordering

##### `order(newOrder)`
Get or set sort order.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| newOrder | array | (Optional) Array of `{ column, dir }` objects |

**Returns:** Current order if no argument provided.

```javascript
// Get current order
var current = table.order();
// [{ column: 0, dir: 'asc' }]

// Set new order
table.order([{ column: 1, dir: 'desc' }]);
```

---

##### `clearSort()`
Clear all sorting.

```javascript
table.clearSort();
```

---

#### Search

##### `search(query)`
Apply search filter.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| query | string | Search query |

```javascript
table.search('john');
```

---

##### `clearSearch()`
Clear search filter.

```javascript
table.clearSearch();
```

---

#### Filtering

##### `setFilter(filterName, value)`
Set a named filter.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| filterName | string | Filter identifier |
| value | any | Filter value |

```javascript
table.setFilter('status', 'active');
table.setFilter('department', 'sales');
```

---

##### `clearFilter(filterName)`
Clear a specific filter.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| filterName | string | Filter to clear |

```javascript
table.clearFilter('status');
```

---

##### `clearAllFilters()`
Clear all filters.

```javascript
table.clearAllFilters();
```

---

##### `getFilters()`
**Returns:** Object with all current filter values.

```javascript
var filters = table.getFilters();
// { status: 'active', department: 'sales' }
```

---

##### `setupGlobalSearch(searchInputSelector)`
Bind an external search input to the table.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| searchInputSelector | string | Selector for search input |

```javascript
table.setupGlobalSearch('#external-search');
```

---

##### `setupDateRangeFilter(dateRangeSelector, columnSelectSelector, extraAjaxData, dateColumns)`
Setup date range filtering with external inputs.

---

##### `setupClientFilter(selectSelector, extraAjaxData)`
Setup client-side filtering with external select.

---

#### Advanced Filtering

##### `openAdvancedFilter()`
Open the advanced filter modal (if enabled).

```javascript
table.openAdvancedFilter();
```

---

##### `getAdvancedFilters()`
**Returns:** Current advanced filter parameters.

```javascript
var params = table.getAdvancedFilters();
```

---

##### `setAdvancedFilters(params)`
Apply advanced filter parameters.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| params | object | Filter parameters |

```javascript
table.setAdvancedFilters({
  field: 'status',
  operator: 'equals',
  value: 'active'
});
```

---

##### `clearAdvancedFilters()`
Clear all advanced filters.

```javascript
table.clearAdvancedFilters();
```

---

##### `saveFilterTemplate(name)`
Save current filters as a named template.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| name | string | Template name |

```javascript
table.saveFilterTemplate('My Active Users');
```

---

##### `loadFilterTemplate(name)`
Load a saved filter template.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| name | string | Template name |

```javascript
table.loadFilterTemplate('My Active Users');
```

---

##### `getFilterUrl()`
**Returns:** URL with current filter state encoded.

```javascript
var url = table.getFilterUrl();
// '/page?filter[status]=active&filter[dept]=sales'
```

---

##### `copyFilterUrl()`
Copy the filter URL to clipboard.

```javascript
table.copyFilterUrl();
```

---

#### Column Visibility

##### `toggleColumn(colData)`
Toggle visibility of a column.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| colData | string/number | Column data property or index |

```javascript
table.toggleColumn('email');
table.toggleColumn(3);
```

---

##### `showColumn(colData)`
Show a hidden column.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| colData | string/number | Column data property or index |

```javascript
table.showColumn('email');
```

---

##### `hideColumn(colData)`
Hide a visible column.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| colData | string/number | Column data property or index |

```javascript
table.hideColumn('email');
```

---

##### `getVisibleColumns()`
**Returns:** Array of visible column data properties.

```javascript
var visible = table.getVisibleColumns();
// ['id', 'name', 'status']
```

---

##### `setVisibleColumns(columns)`
Set which columns are visible.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| columns | array | Column data properties to show |

```javascript
table.setVisibleColumns(['id', 'name', 'email']);
```

---

##### `setColumnVisibility(columnIndex, visible)`
Show/hide a column by index.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| columnIndex | number | Column index |
| visible | boolean | Visibility state |

```javascript
table.setColumnVisibility(2, false); // Hide column 2
```

---

#### Context Menu

##### `showContextMenu(rowId, x, y)`
Programmatically show context menu for a row.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| rowId | string/number | Row ID |
| x | number | X position |
| y | number | Y position |

```javascript
table.showContextMenu(5, event.clientX, event.clientY);
```

---

##### `closeContextMenu()`
Close the context menu.

```javascript
table.closeContextMenu();
```

---

##### `addContextMenuItem(item)`
Add an item to the context menu.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| item | object | `{ id, label, icon?, action, disabled? }` |

```javascript
table.addContextMenuItem({
  id: 'duplicate',
  label: 'Duplicate Row',
  icon: 'copy',
  action: function(row) { duplicateRow(row.id); }
});
```

---

##### `removeContextMenuItem(itemId)`
Remove a context menu item.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| itemId | string | Item ID to remove |

```javascript
table.removeContextMenuItem('duplicate');
```

---

##### `setContextMenuEnabled(enabled)`
Enable or disable the context menu.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| enabled | boolean | Enabled state |

```javascript
table.setContextMenuEnabled(false);
```

---

#### Conditional Formatting

##### `addFormattingRule(rule)`
Add a conditional formatting rule.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| rule | object | `{ id?, column, condition, value, style }` |

**Returns:** Rule ID.

```javascript
var ruleId = table.addFormattingRule({
  column: 'status',
  condition: 'equals',
  value: 'overdue',
  style: { backgroundColor: '#fee', color: '#c00' }
});
```

---

##### `removeFormattingRule(ruleId)`
Remove a formatting rule.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ruleId | string | Rule ID |

```javascript
table.removeFormattingRule(ruleId);
```

---

##### `updateFormattingRule(ruleId, updates)`
Update an existing rule.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ruleId | string | Rule ID |
| updates | object | Properties to update |

```javascript
table.updateFormattingRule(ruleId, { value: 'critical' });
```

---

##### `getFormattingRules()`
**Returns:** Array of all formatting rules.

```javascript
var rules = table.getFormattingRules();
```

---

##### `clearFormattingRules()`
Remove all formatting rules.

```javascript
table.clearFormattingRules();
```

---

##### `setFormattingRuleEnabled(ruleId, enabled)`
Enable or disable a specific rule.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ruleId | string | Rule ID |
| enabled | boolean | Enabled state |

```javascript
table.setFormattingRuleEnabled(ruleId, false);
```

---

#### Toolbar Buttons

##### `addButton(config)`
Add a custom button to the toolbar.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config | object | `{ text, icon?, className?, onClick }` |

```javascript
table.addButton({
  text: 'Refresh',
  icon: 'sync',
  className: 'btn-primary',
  onClick: function() { table.reload(); }
});
```

---

##### `removeButton(text)`
Remove a toolbar button by text.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Button text |

```javascript
table.removeButton('Refresh');
```

---

##### `getButton(text)`
Get a button element by text.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Button text |

**Returns:** Button element or null.

```javascript
var btn = table.getButton('Export');
```

---

##### `setButtonEnabled(text, enabled)`
Enable or disable a button.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Button text |
| enabled | boolean | Enabled state |

```javascript
table.setButtonEnabled('Delete', false);
```

---

#### Export

##### `export(format, options)`
Export table data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| format | string | `'csv'`, `'xlsx'`, `'json'` |
| options | object | Export options |

```javascript
table.export('csv', { filename: 'users', includeHidden: false });
```

---

#### Aggregations

##### `getAggregations()`
**Returns:** Object with calculated aggregation values for all columns

---

##### `getAggregation(column, type)`
Get specific aggregation value.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| column | string | Column data property |
| type | string | Aggregation type (for columns with multiple) |

**Returns:** Aggregation result object or value

---

##### `recalculateAggregations()`
Force recalculation of all aggregations.

---

##### `addAggregation(column, config)`
Add an aggregation to a column.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| column | string | Column data property |
| config | object | `{ type, format, label }` |

---

##### `removeAggregation(column, type)`
Remove an aggregation from a column.

---

##### `showAggregations(show)`
Show or hide aggregation footer/header.

---

##### `exportAggregations()`
**Returns:** Object with aggregation values for export

---

#### Column Profiles

##### `getProfiles()`
**Returns:** Array of all column profiles

---

##### `getActiveProfile()`
**Returns:** Currently active profile object

---

##### `applyProfile(profileName)`
Apply a saved profile by name.

---

##### `saveProfile(name, description)`
Save current column state as a new profile.

---

##### `deleteProfile(name)`
Delete a profile by name.

---

##### `exportProfiles()`
**Returns:** JSON string of all profiles

---

##### `importProfiles(json)`
Import profiles from JSON string.

---

#### Animations

##### `insertRowAnimated(rowData, options)`
Insert a row with animation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| rowData | object | Row data to insert |
| options | object | `{ position: 'start'/'end'/index, highlight: boolean }` |

```javascript
table.insertRowAnimated({ id: 100, name: 'New Item' }, {
  position: 'start',
  highlight: true
});
```

---

##### `updateRowAnimated(rowData)`
Update a row with highlight animation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| rowData | object | Row data (must include id) |

```javascript
table.updateRowAnimated({ id: 5, name: 'Updated', status: 'active' });
```

---

##### `removeRowAnimated(id, callback)`
Remove a row with fade-out animation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string/number | Row ID |
| callback | function | Called when animation completes |

```javascript
table.removeRowAnimated(50, function() {
  console.log('Row removed');
});
```

---

##### `removeRowsAnimated(ids, callback)`
Remove multiple rows with staggered animation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | array | Row IDs to remove |
| callback | function | Called when all animations complete |

```javascript
table.removeRowsAnimated([1, 2, 3], function() {
  console.log('All rows removed');
});
```

---

##### `highlightRow(id, type)`
Flash-highlight a row to draw attention.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string/number | Row ID |
| type | string | Highlight type: `'success'`, `'warning'`, `'error'`, `'info'` (default) |

```javascript
table.highlightRow(25);
table.highlightRow(25, 'success');
```

---

##### `highlightRows(ids, type)`
Flash-highlight multiple rows.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | array | Row IDs |
| type | string | Highlight type |

```javascript
table.highlightRows([1, 2, 3], 'warning');
```

---

#### Live Binding

##### `isLiveConnected()`
**Returns:** Boolean indicating if live binding is connected.

```javascript
if (table.isLiveConnected()) {
  console.log('Live updates active');
}
```

---

##### `pauseLiveBinding()`
Pause live updates (WebSocket/SSE/polling).

```javascript
table.pauseLiveBinding();
```

---

##### `resumeLiveBinding()`
Resume live updates.

```javascript
table.resumeLiveBinding();
```

---

##### `refreshLive()`
Force a refresh of live data.

```javascript
table.refreshLive();
```

---

##### `pushUpdate(data)`
Manually push an update (as if received from WebSocket).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| data | object | Row data with id |

```javascript
table.pushUpdate({ id: 5, price: 102.50, volume: 1500 });
```

---

##### `pushDelete(id)`
Manually push a delete (as if received from WebSocket).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string/number | Row ID to delete |

```javascript
table.pushDelete(5);
```

---

##### `destroyLiveBinding()`
Destroy live binding connections.

```javascript
table.destroyLiveBinding();
```

---

##### `getLiveStatus()`
**Returns:** Live binding status object.

```javascript
var status = table.getLiveStatus();
// { connected: true, source: 'websocket', paused: false, lastUpdate: Date }
```

---

##### `setLiveBindingSource(config)`
Change live binding configuration.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config | object | New live binding config |

```javascript
table.setLiveBindingSource({
  source: 'polling',
  polling: { interval: 10000, url: '/api/status' }
});
```

---

#### Accessibility

##### `trapFocus(enabled)`
Enable or disable focus trapping within the table.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| enabled | boolean | Enable focus trap |

```javascript
table.trapFocus(true);
```

---

#### Lifecycle

##### `destroy()`
Destroy the table instance and clean up.

```javascript
table.destroy();
```

---

## Static Methods

##### `Funky.Table.init(selector, options)`
Initialize a new table instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string/HTMLElement | Selector or element |
| options | object | Configuration options |

**Returns:** `TableInstance`

```javascript
var table = Funky.Table.init('#my-table', { ... });
```

---

##### `Funky.Table.getInstance(idOrElement)`
Get an existing table instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| idOrElement | string/HTMLElement | ID, selector, or element |

**Returns:** `TableInstance` or `null`

```javascript
var table = Funky.Table.getInstance('#my-table');
```

---

##### `Funky.Table.destroy(idOrElement)`
Destroy a specific table instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| idOrElement | string/HTMLElement | ID, selector, or element |

```javascript
Funky.Table.destroy('#my-table');
```

---

##### `Funky.Table.destroyAll()`
Destroy all table instances.

```javascript
Funky.Table.destroyAll();
```

---

##### `Funky.Table.getAll()`
Get all table instances.

**Returns:** Object with all instances keyed by ID.

```javascript
var all = Funky.Table.getAll();
```

---

## Events (PubSub)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:table:init` | `{ table, id }` | Table initialized |
| `funky:table:draw` | `{ table, id }` | Table redrawn |
| `funky:table:select` | `{ table, rows, ids }` | Row(s) selected |
| `funky:table:deselect` | `{ table, rows, ids }` | Row(s) deselected |
| `funky:table:order` | `{ table, order }` | Sort order changed |
| `funky:table:page` | `{ table, page }` | Page changed |
| `funky:table:search` | `{ table, query }` | Search applied |
| `funky:table:error` | `{ table, error }` | Error occurred |
| `funky:table:rowInserted` | `{ table, row, data }` | Row inserted (animated) |
| `funky:table:rowRemoved` | `{ table, id }` | Row removed (animated) |
| `funky:table:aggregationsCalculated` | `{ table, aggregations }` | Aggregations calculated |
| `funky:table:profileChange` | `{ table, profile }` | Column profile changed |
| `funky:table:liveUpdate` | `{ table, action, data }` | Live binding update received |

## Examples

### Custom Column Rendering

```javascript
Funky.Table.init('#users', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    {
      data: 'status',
      title: 'Status',
      render: function(data, type, row) {
        var badge = data === 'active' ? 'badge-success' : 'badge-secondary';
        return '<span class="badge ' + badge + '">' + data + '</span>';
      }
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      render: function(data, type, row) {
        return '<button class="btn btn-sm" data-action="edit" data-id="' + row.id + '">Edit</button>';
      }
    }
  ],
  ajaxUrl: '/api/users'
});
```

### Server-Side Processing

```javascript
Funky.Table.init('#large-dataset', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' }
  ],
  ajaxUrl: '/api/records',
  serverSide: true,
  processing: true,
  pageLength: 50
});
```

### Row Selection with Actions

```javascript
var table = Funky.Table.init('#selectable', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' }
  ],
  data: myData,
  select: 'multi',
  selectAllCheckbox: true,
  onSelect: function(selected, table) {
    console.log('Selected:', selected.length, 'rows');
    updateBulkActionButtons(selected.length > 0);
  }
});

// Get selected rows
document.getElementById('deleteBtn').onclick = function() {
  var selected = table.getSelected();
  deleteRecords(selected.map(r => r.id));
};
```

### Conditional Formatting

```javascript
Funky.Table.init('#metrics', {
  columns: [
    { data: 'metric', title: 'Metric' },
    { data: 'value', title: 'Value' },
    { data: 'change', title: 'Change %' }
  ],
  conditionalFormatting: {
    enabled: true,
    rules: [
      {
        column: 'change',
        condition: 'greaterThan',
        value: 0,
        style: { color: 'green' }
      },
      {
        column: 'change',
        condition: 'lessThan',
        value: 0,
        style: { color: 'red' }
      }
    ]
  }
});
```

### Responsive with Priority Columns

```javascript
Funky.Table.init('#responsive', {
  responsive: true,
  columns: [
    { data: 'id', title: 'ID', responsivePriority: 1 },
    { data: 'name', title: 'Name', responsivePriority: 1 },
    { data: 'email', title: 'Email', responsivePriority: 2 },
    { data: 'phone', title: 'Phone', responsivePriority: 3 },
    { data: 'address', title: 'Address', responsivePriority: 4 }
  ]
});
```

### Real-Time WebSocket Updates

Tables use the shared `Funky.WebSocket` for live binding. The WebSocket must be initialized and connected before the table is created.

```javascript
// Ensure WebSocket is initialized (typically done in app.js)
Funky.WebSocket.init();
Funky.WebSocket.connect();

// Create table with WebSocket live binding
Funky.Table.init('#live-trades', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'symbol', title: 'Symbol' },
    { data: 'price', title: 'Price' },
    { data: 'volume', title: 'Volume' }
  ],
  ajaxUrl: '/api/trades',
  liveBinding: {
    enabled: true,
    source: 'websocket',
    websocket: {
      channel: 'trades',  // Subscribe to this channel on shared WebSocket
      // channels: ['trades', 'fx_rates']  // Or multiple channels
    },
    onConnect: function() {
      console.log('Live updates connected');
    },
    onDisconnect: function(reason) {
      console.log('Live updates disconnected:', reason);
    }
  }
});
```

**Note:** The table no longer creates its own WebSocket connection. It uses the shared `Funky.WebSocket` and subscribes to the specified channel(s).

### Server-Sent Events (SSE)

```javascript
Funky.Table.init('#notifications', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'message', title: 'Message' },
    { data: 'timestamp', title: 'Time' }
  ],
  liveBinding: {
    source: 'eventsource',
    eventsource: {
      url: '/api/notifications/stream',
      events: ['created', 'updated', 'deleted'],
      onConnect: function() {
        console.log('SSE connected');
      },
      onDisconnect: function(reason) {
        console.log('SSE disconnected:', reason);
      }
    }
  }
});
```

### Polling Updates

```javascript
Funky.Table.init('#status-dashboard', {
  columns: [
    { data: 'service', title: 'Service' },
    { data: 'status', title: 'Status' },
    { data: 'uptime', title: 'Uptime' }
  ],
  liveBinding: {
    source: 'polling',
    polling: {
      interval: 5000,  // Poll every 5 seconds
      url: '/api/services/status'
    }
  }
});
```

### Aggregations (Footer Totals)

```javascript
Funky.Table.init('#sales-report', {
  columns: [
    { data: 'product', title: 'Product' },
    { data: 'quantity', title: 'Qty' },
    { data: 'price', title: 'Price' },
    { data: 'total', title: 'Total' }
  ],
  data: salesData,
  aggregations: {
    enabled: true,
    position: 'footer',
    columns: {
      quantity: { type: 'sum', label: 'Total' },
      price: { type: 'average', label: 'Avg', format: 'currency' },
      total: [
        { type: 'sum', label: 'Sum', format: 'currency' },
        { type: 'count', label: 'Count' }
      ]
    },
    formatting: {
      currency: { prefix: '$', decimals: 2 },
      thousandsSeparator: ','
    },
    onCalculate: function(aggregations) {
      console.log('Calculated:', aggregations);
    }
  }
});
```

### Column Profiles

```javascript
Funky.Table.init('#configurable-table', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'email', title: 'Email' },
    { data: 'phone', title: 'Phone' },
    { data: 'department', title: 'Department' },
    { data: 'salary', title: 'Salary' },
    { data: 'hireDate', title: 'Hire Date' }
  ],
  data: employees,
  columnProfiles: {
    enabled: true,
    storageKey: 'employee_table_profiles',
    defaultProfile: 'Default',
    profiles: [
      {
        name: 'Default',
        description: 'All columns visible',
        columns: ['id', 'name', 'email', 'phone', 'department', 'salary', 'hireDate']
      },
      {
        name: 'Contact Info',
        description: 'Name, email, phone only',
        columns: ['name', 'email', 'phone']
      },
      {
        name: 'HR View',
        description: 'HR-focused columns',
        columns: ['id', 'name', 'department', 'salary', 'hireDate']
      }
    ],
    serverSync: {
      loadUrl: '/api/profiles/employee_table',
      saveUrl: '/api/profiles/employee_table'
    },
    onProfileChange: function(profile) {
      console.log('Switched to profile:', profile.name);
    }
  }
});
```

### Animated Row Operations

```javascript
var table = Funky.Table.init('#animated-list', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' }
  ],
  data: items,
  animations: {
    enabled: true,
    insertDuration: 400,
    removeDuration: 300,
    highlightDuration: 2000
  }
});

// Insert with animation
table.insertRowAnimated({ id: 100, name: 'New Item' }, {
  position: 'start',
  highlight: true
});

// Remove with animation
table.removeRowAnimated(50, function() {
  console.log('Row removed');
});

// Highlight a row
table.highlightRow(25);

// Remove multiple rows with staggered animation
table.removeRowsAnimated([1, 2, 3], function() {
  console.log('All rows removed');
});
```

### Export with Custom Options

```javascript
var table = Funky.Table.init('#exportable', {
  columns: [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Name' },
    { data: 'createdAt', title: 'Created', exportRender: function(value) {
      return new Date(value).toLocaleDateString();
    }}
  ],
  data: records,
  buttons: {
    export: ['csv', 'xlsx', 'json']
  }
});

// Programmatic export
table.exportCSV({
  filename: 'my-export',
  includeHidden: false
});
```

## Accessibility

- Table uses `role="grid"` with proper ARIA attributes
- Headers use `role="columnheader"` with `aria-sort` indicators
- Keyboard navigation with arrow keys, Enter, Space
- Screen reader announcements for page changes, search results
- Sortable columns are focusable with keyboard activation
- Selection states announced to assistive technology

## Dependencies

- **Required:** `Funky.Dom`, `Funky.PubSub`
- **Optional:** `Funky.Keyboard` (keyboard navigation), `Funky.Announce` (screen reader), `Funky.ComboBox` (length menu), `Funky.ContextMenu` (right-click menus), `Funky.WebSocket` (real-time updates), `Funky.CacheSync` (cache invalidation), `Funky.Events` (WebSocket event handling)
