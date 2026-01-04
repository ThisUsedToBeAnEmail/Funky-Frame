# Funky.FileManager - Professional File Management UI

Grid/list file views with preview, batch operations, and comprehensive file management.

## Overview

`Funky.FileManager` provides a full-featured file management interface with grid and list views, file preview, filtering, batch operations, and status tracking.

## API Reference

### Factory Methods

#### `Funky.FileManager.init(config)`

Create a file manager instance.

**Config Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| containerSelector | string | '#fileManagerContainer' | Container element selector |
| gridSelector | string | '#filesGridView' | Grid view container selector |
| listSelector | string | '#filesListView' | List view container selector |
| statsSelector | string | '.stats-row' | Stats row selector |
| searchSelector | string | '#globalSearch' | Search input selector |
| clientFilterSelector | string | '#clientFilter' | Client filter selector |
| statusFilterSelector | string | '#statusFilter' | Status filter selector |
| mimeFilterSelector | string | '#mimeFilter' | MIME type filter selector |
| dateRangeSelector | string | '#dateRangeFilter' | Date range filter selector |
| viewToggleSelector | string | '[data-view]' | View toggle buttons selector |
| apiBaseUrl | string | '/api/generated_files' | API base URL for files |
| pageLength | number | 24 | Files per page |
| enableSelection | boolean | true | Enable file selection |
| enablePreview | boolean | true | Enable file preview |
| enableBulkActions | boolean | true | Enable bulk operations |
| demoMode | boolean | false | Skip API calls, use setData instead |
| demoData | array | null | Initial demo files array |
| demoStats | object | null | Initial demo stats object |
| demoFilterOptions | object | null | Initial demo filter options |

**Returns:** `FileManager` instance

**Example:**
```javascript
var fileManager = Funky.FileManager.init({
  containerSelector: '#fileManagerContainer',
  apiBaseUrl: '/api/generated_files',
  pageLength: 24
});
```

---

#### `Funky.FileManager.create(config)`

Alias for `init()`. Deprecated, use `init()` instead.

---

#### `Funky.FileManager.getInstance(id)`

Get an existing file manager instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Container element ID |

**Returns:** `FileManager|null`

---

#### `Funky.FileManager.destroy(id)`

Destroy a file manager instance by container ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Container element ID |

---

#### `Funky.FileManager.destroyAll()`

Destroy all file manager instances.

---

### Instance Methods

#### Selection Methods

##### `fileManager.toggleSelection(fileId)`

Toggle selection state of a file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | string | Yes | File identifier |

---

##### `fileManager.selectAll()`

Select all currently visible files.

---

##### `fileManager.clearSelection()`

Clear all selected files.

---

##### `fileManager.rangeSelect(startIndex, endIndex)`

Select a range of files (for Shift+click support).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| startIndex | number | Yes | Start index in files array |
| endIndex | number | Yes | End index in files array |

---

#### File Operations

##### `fileManager.downloadFile(fileId)`

Download a single file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | string | Yes | File identifier |

---

##### `fileManager.previewFile(fileId)`

Open file preview modal. Supports CSV, JSON, XML, text, and image files.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | string | Yes | File identifier |

---

##### `fileManager.confirmDeleteFile(fileId)`

Show delete confirmation for a single file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | string | Yes | File identifier |

---

##### `fileManager.deleteFile(fileId)`

Delete a single file via API.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | string | Yes | File identifier |

---

#### Bulk Operations

##### `fileManager.confirmBulkDelete()`

Show bulk delete confirmation for selected files.

---

##### `fileManager.bulkDelete()`

Delete all selected files.

---

##### `fileManager.downloadSelected()`

Download all selected files.

---

#### Data Management

##### `fileManager.refresh()`

Reload file list from API or refresh current data.

---

##### `fileManager.setData(data)`

Set file list data directly. Used for demo mode or external data sources.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| data | array | Yes | Array of file objects |

**Example:**
```javascript
fileManager.setData([
  { id: '1', filename: 'report.csv', mime_type: 'text/csv', status: 'completed' },
  { id: '2', filename: 'data.json', mime_type: 'application/json', status: 'pending' }
]);
```

---

##### `fileManager.getData()`

Get the current file list data.

**Returns:** `array` - Current files array

---

##### `fileManager.destroy()`

Destroy the instance and clean up resources.

---

#### View and UI Methods

##### `fileManager.loadGridView()`

Load files in grid view.

---

##### `fileManager.renderGridView()`

Render the grid view with current file data.

---

##### `fileManager.renderPagination()`

Render pagination controls.

---

##### `fileManager.updateSelectionUI()`

Update visual selection state of file cards.

---

##### `fileManager.updateBulkActionsBar()`

Update bulk actions bar visibility and count.

---

#### Stats and Filters

##### `fileManager.loadStats()`

Load statistics from API.

---

##### `fileManager.renderStats()`

Render stats display.

---

##### `fileManager.loadFilterOptions()`

Load filter dropdown options from API.

---

##### `fileManager.populateFilterDropdowns()`

Populate filter dropdowns with loaded options.

---

### MIME Type Configuration

| MIME Type | Icon | Label | Previewable |
|-----------|------|-------|-------------|
| application/pdf | 📄 | PDF | No |
| text/csv | 📊 | CSV | Yes |
| application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | 📈 | Excel | No |
| application/json | 📋 | JSON | Yes |
| text/xml | 📃 | XML | Yes |
| text/plain | 📝 | Text | Yes |
| image/png | 🖼️ | PNG | Yes |
| image/jpeg | 🖼️ | JPEG | Yes |
| application/zip | 📦 | ZIP | No |

### Status Badges

| Status | Badge | Icon |
|--------|-------|------|
| pending | warning | ⏳ |
| processing | info | ⚙️ |
| completed | success | ✅ |
| failed | danger | ❌ |

---

## Bindable Interface (LiveBinding)

FileManager implements the **Bindable Interface** for integration with `Funky.LiveBinding`.

### Implemented Methods

| Method | Description |
|--------|-------------|
| `setData(data)` | Replace the file list with the provided data array |
| `getData()` | Retrieve the current file list data |

### Instance Registration

Instances are registered in `Funky.FileManager._instances[containerId]`.

### Usage with LiveBinding

```javascript
// Bind file manager to a WebSocket source for real-time updates
Funky.LiveBinding.bindComponent('#fileManagerContainer', {
  source: 'websocket',
  channel: 'file-updates'
});

// Bind to API polling
Funky.LiveBinding.bindComponent('#fileManagerContainer', {
  source: 'api',
  endpoint: '/api/generated_files',
  interval: 15000
});
```

---

## Examples

### Basic Setup

```javascript
var fileManager = Funky.FileManager.init({
  containerSelector: '#fileManagerContainer',
  apiBaseUrl: '/api/generated_files',
  pageLength: 24
});
```

### Demo Mode (No API)

```javascript
var fileManager = Funky.FileManager.init({
  containerSelector: '#fileManagerContainer',
  demoMode: true,
  demoData: [
    { id: '1', filename: 'report.csv', mime_type: 'text/csv', status: 'completed', size: 1024 },
    { id: '2', filename: 'data.json', mime_type: 'application/json', status: 'pending', size: 2048 }
  ]
});
```

### Bulk Download

```javascript
document.getElementById('downloadSelectedBtn').addEventListener('click', function() {
  fileManager.downloadSelected();
});
```

### Bulk Delete

```javascript
document.getElementById('deleteSelectedBtn').addEventListener('click', function() {
  fileManager.confirmBulkDelete();
});
```

---

## Dependencies

- `Funky.Dom`
- `Funky.Api`
- `Funky.Toast`
- `Funky.ComboBox` (for filter dropdowns)
- Bootstrap 5
