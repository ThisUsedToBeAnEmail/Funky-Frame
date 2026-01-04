# Funky.AuditViewer - Audit Trail Visualization

Interactive audit trail viewer with diff viewing, timeline rendering, and comprehensive audit display.

## Overview

`Funky.AuditViewer` provides a complete audit log viewing experience with change diffs, timeline visualization, and filtering capabilities.

## API Reference

### Methods

#### `AuditViewer.init()`

Initialize the audit viewer page.

**Example:**
```javascript
// Called on audit log page load
Funky.AuditViewer.init();
```

---

#### `AuditViewer.showDiff(entryId)`

Show diff modal for a specific audit entry.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| entryId | number | Yes | Audit entry ID |

---

#### `AuditViewer.toggleDiffView(view)`

Toggle between diff view modes.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| view | string | Yes | 'split' or 'unified' |

---

#### `AuditViewer.loadStats()`

Load and display audit statistics.

---

#### `AuditViewer.loadRecentTimeline()`

Load recent activity timeline.

---

#### `AuditViewer.exportAuditLog(format)`

Export audit log data.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| format | string | Yes | 'csv' or 'json' |

### Configuration

#### Operation Colors

```javascript
AuditViewer.operationColors = {
  create: { bg: '#10b981', text: '#ffffff', label: 'Created' },
  update: { bg: '#f59e0b', text: '#ffffff', label: 'Updated' },
  delete: { bg: '#ef4444', text: '#ffffff', label: 'Deleted' }
};
```

#### Table Icons

```javascript
AuditViewer.tableIcons = {
  trades: 'fa-exchange-alt',
  clients: 'fa-building',
  securities: 'fa-chart-line',
  users: 'fa-users',
  // ...
};
```

## Features

### Diff Viewing

- **Split View**: Side-by-side comparison
- **Unified View**: Inline diff with +/- indicators
- **Field Highlighting**: Changed fields highlighted
- **JSON Formatting**: Nested objects displayed nicely

### Timeline

- Visual timeline of recent changes
- Color-coded by operation type
- Grouped by date
- Quick navigation to entries

### Filtering

- Filter by table/entity
- Filter by operation (create/update/delete)
- Filter by user
- Date range filtering
- Full-text search

## Dependencies

- jQuery
- DataTables
- `Funky.Api`
- DateRangePicker (optional)

## Examples

### Page Integration

```html
<div id="auditLogContainer">
  <div id="auditStats"></div>
  <div id="auditTimeline"></div>
  <table id="auditTable"></table>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  Funky.AuditViewer.init();
});
</script>
```

### View Single Entry

```javascript
// From a table row action
$('#auditTable').on('click', '.view-diff', function() {
  var entryId = $(this).data('id');
  Funky.AuditViewer.showDiff(entryId);
});
```

### Export Data

```javascript
$('#exportCsv').on('click', function() {
  Funky.AuditViewer.exportAuditLog('csv');
});
```

---

## Bindable Interface (LiveBinding)

AuditViewer implements the **Bindable Interface** for integration with `Funky.LiveBinding`.

### Implemented Methods

| Method | Description |
|--------|-------------|
| `setData(data)` | Replace all audit entries with the provided data array |
| `getData()` | Retrieve the current audit entries |
| `addData(entries)` | Append new audit entries to the viewer |
| `clearData()` | Remove all audit entries from the viewer |

### Instance Registration

Instances are registered in `Funky.AuditViewer._instances[containerId]`.

### Usage with LiveBinding

```javascript
// Bind audit viewer to a WebSocket source for real-time updates
Funky.LiveBinding.bindComponent('#auditLogContainer', {
  source: 'websocket',
  channel: 'audit-trail'
});

// Bind to API polling
Funky.LiveBinding.bindComponent('#auditLogContainer', {
  source: 'api',
  endpoint: '/api/audit/recent',
  interval: 30000
});
```
