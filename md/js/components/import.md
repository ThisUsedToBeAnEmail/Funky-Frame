# Funky.Import - File Import Component

CSV and Excel file import with drag-drop, progress display, and results summary.

## Overview

`Funky.Import` provides a complete file import workflow: file selection via drag-drop or file picker, upload progress, and detailed results display including success/error counts and per-row error details. Integrates with cache layer for automatic invalidation after import.

## Registration

**File:** `public/assets/js/components/import.js`

Registered as `Funky.Import` via the component registry.

## API Reference

### Methods

#### `Import.init(config)`

Initialize an import configuration.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| config.id | string | - | Import identifier (required) |
| config.entity | string | - | Entity type for cache invalidation (required) |
| config.endpoint | string | - | POST endpoint for file upload (required) |
| config.title | string | 'Import' | Modal title |
| config.accept | string | '.csv,.xlsx,.xls' | Accepted file types |
| config.maxSize | number | 10485760 | Max file size in bytes (10MB) |
| config.templateUrl | string | null | URL for download template |
| config.instructions | string | null | Help text to display |
| config.onComplete | function | null | Callback after successful import |
| config.additionalData | object/function | null | Extra data to send with upload |

**Returns:** Import instance

**Example:**
```javascript
Funky.Import.init({
    id: 'clientImport',
    entity: 'client',
    endpoint: '/api/clients/import',
    title: 'Import Clients',
    accept: '.csv,.xlsx',
    maxSize: 5 * 1024 * 1024, // 5MB
    templateUrl: '/api/clients/import/template',
    instructions: 'Upload a CSV or Excel file with client data. Required columns: name, email.',
    onComplete: function(result) {
        $('#clientsTable').DataTable().ajax.reload();
        Funky.Toast.success('Imported ' + result.imported + ' clients');
    }
});
```

---

#### `Import.show(importId)`

Open the import modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| importId | string | Import identifier |

**Example:**
```javascript
$('#btnImportClients').click(function() {
    Funky.Import.show('clientImport');
});
```

---

#### `Import.hide(importId)`

Close the import modal.

---

#### `Import.destroy(importId)`

Remove import modal and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| importId | string | Import identifier |

---

#### `Import.getInstance(importId)`

Get an import instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| importId | string | Import identifier |

**Returns:** Instance object or `null`

---

#### `Import.destroyAll()`

Destroy all import instances.

## Usage Examples

### Basic Import

```javascript
// Initialize
Funky.Import.init({
    id: 'tradeImport',
    entity: 'trade',
    endpoint: '/api/trades/import',
    title: 'Import Trades'
});

// Button to open
$('#btnImport').click(function() {
    Funky.Import.show('tradeImport');
});
```

### With Template Download

```javascript
Funky.Import.init({
    id: 'userImport',
    entity: 'user',
    endpoint: '/api/users/import',
    title: 'Import Users',
    templateUrl: '/api/users/import/template',
    instructions: `
        <strong>Instructions:</strong>
        <ul>
            <li>Download the template to see required format</li>
            <li>Required columns: username, email, role</li>
            <li>Optional columns: first_name, last_name, phone</li>
            <li>Role must be one of: admin, user, viewer</li>
        </ul>
    `,
    onComplete: function(result) {
        if (result.errors && result.errors.length > 0) {
            Funky.Toast.warning('Import completed with ' + result.errors.length + ' errors');
        } else {
            Funky.Toast.success('Imported ' + result.imported + ' users');
        }
    }
});
```

### With Additional Data

```javascript
// Static additional data
Funky.Import.init({
    id: 'allocationImport',
    entity: 'allocation',
    endpoint: '/api/allocations/import',
    additionalData: {
        source: 'manual',
        year: 2024
    }
});

// Dynamic additional data
Funky.Import.init({
    id: 'tradeImport',
    entity: 'trade',
    endpoint: '/api/trades/import',
    additionalData: function() {
        return {
            account_id: $('#accountSelect').val(),
            import_date: moment().format('YYYY-MM-DD')
        };
    }
});
```

### With CRUD Controller

```javascript
// CRUD controller integrates Import automatically
Funky.CRUD.init({
    entity: 'client',
    // ... other config
    import: {
        endpoint: '/api/clients/import',
        templateUrl: '/api/clients/import/template',
        instructions: 'Required columns: name, email'
    }
});

// Import button calls:
Funky.CRUD.get('client').showImport();
```

## Modal Layout

```html
<div class="modal fade" id="modal-import-clientImport">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Import Clients</h5>
                <button class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <!-- Instructions -->
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Upload a CSV or Excel file...
                </div>
                
                <!-- Template Download -->
                <div class="mb-3">
                    <a href="/api/clients/import/template" class="btn btn-outline-secondary">
                        <i class="fas fa-download me-1"></i>Download Template
                    </a>
                </div>
                
                <!-- Drop Zone -->
                <div class="import-dropzone" id="dropzone-clientImport">
                    <div class="dropzone-content">
                        <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                        <p>Drag & drop file here or click to browse</p>
                        <p class="text-muted small">Accepts: .csv, .xlsx, .xls (max 10MB)</p>
                    </div>
                    <input type="file" class="d-none" accept=".csv,.xlsx,.xls">
                </div>
                
                <!-- Progress (hidden initially) -->
                <div class="import-progress d-none">
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated"></div>
                    </div>
                    <p class="text-center mt-2">Uploading...</p>
                </div>
                
                <!-- Results (hidden initially) -->
                <div class="import-results d-none">
                    <!-- Shown after upload completes -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
```

## Drop Zone Styling

```css
.import-dropzone {
    border: 2px dashed var(--bs-border-color);
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.import-dropzone:hover,
.import-dropzone.dragover {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.import-dropzone.dragover {
    transform: scale(1.02);
}

.import-dropzone .dropzone-content i {
    color: var(--bs-secondary);
}
```

## Results Display

After upload completes, results are shown:

### Success Summary
```html
<div class="alert alert-success">
    <h5><i class="fas fa-check-circle me-2"></i>Import Complete</h5>
    <p class="mb-0">Successfully imported 150 records.</p>
</div>
```

### With Errors
```html
<div class="alert alert-warning">
    <h5><i class="fas fa-exclamation-triangle me-2"></i>Import Completed with Errors</h5>
    <p>Imported: 145 | Errors: 5</p>
</div>

<table class="table table-sm table-bordered">
    <thead>
        <tr>
            <th>Row</th>
            <th>Error</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>12</td><td>Invalid email format</td></tr>
        <tr><td>45</td><td>Name is required</td></tr>
        <!-- ... -->
    </tbody>
</table>
```

## API Response Format

Expected response from import endpoint:

### Success
```json
{
    "success": true,
    "imported": 150,
    "total": 150,
    "message": "All records imported successfully"
}
```

### Partial Success
```json
{
    "success": true,
    "imported": 145,
    "total": 150,
    "errors": [
        { "row": 12, "message": "Invalid email format" },
        { "row": 45, "message": "Name is required" },
        { "row": 67, "message": "Duplicate entry" }
    ]
}
```

### Failure
```json
{
    "success": false,
    "error": true,
    "message": "Invalid file format"
}
```

## Cache Integration

After successful import:

```javascript
// Clears the entity cache list
Funky.Cache.clear('client');

// If CacheSync is connected, WebSocket broadcast
// triggers cache clear on other connected clients
```

## File Validation

Before upload:
1. **File type** - Checked against `accept` option
2. **File size** - Checked against `maxSize` option
3. **Empty file** - Rejected with error message

```javascript
// Validation error display
Funky.Toast.error('File too large. Maximum size is 10MB.');
Funky.Toast.error('Invalid file type. Please upload a CSV or Excel file.');
```

## Events

The import component triggers events:

```javascript
// After initialization
$(document).trigger('funky:import:init', { id: 'clientImport' });

// File selected
$(document).trigger('funky:import:fileSelected', { id: 'clientImport', file: fileObject });

// Upload started
$(document).trigger('funky:import:uploadStart', { id: 'clientImport' });

// Upload progress
$(document).trigger('funky:import:progress', { id: 'clientImport', percent: 45 });

// Upload complete
$(document).trigger('funky:import:complete', { id: 'clientImport', result: resultObject });

// Upload error
$(document).trigger('funky:import:error', { id: 'clientImport', error: errorMessage });
```

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Cache` (cache.js) - for cache invalidation
- `Funky.Toast` (toast.js) - for notifications
- Bootstrap 5 Modal
- jQuery

## See Also

- [crud.md](crud.md) - CRUD controller with import integration
- [cache.md](../core/cache.md) - Cache layer
- [toast.md](toast.md) - Toast notifications

---

## Bindable Interface (LiveBinding)

`Funky.Import` implements the bindable interface, allowing it to be used as a target for LiveBinding data sources. This enables automatic updates to file info displays and validation results from WebSocket updates or other reactive data sources.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(data)` | `data: Object` | Sets the import modal state including file information and validation results. Can update `file` (name, size, type), `validation` (errors, warnings), and `progress` (percent, status). |

### Instance Registry

Import instances are registered in `Funky.Import._instances[modalId]` upon initialization. This allows LiveBinding adapters to locate and bind to specific import instances.

### Usage with LiveBinding

```javascript
// Initialize the import modal
Funky.Import.init({
    id: 'clientImport',
    entity: 'client',
    endpoint: '/api/clients/import',
    title: 'Import Clients'
});

// Bind to a WebSocket for server-side validation progress
Funky.LiveBinding.bind({
    source: {
        type: 'websocket',
        channel: 'import:validation:session123'
    },
    target: {
        type: 'component',
        component: 'Import',
        instance: 'clientImport'
    },
    transform: function(data) {
        return {
            validation: {
                errors: data.errors,
                warnings: data.warnings,
                rowsProcessed: data.processed,
                totalRows: data.total
            },
            progress: {
                percent: (data.processed / data.total) * 100,
                status: data.status
            }
        };
    }
});

// Manual instance access
var instance = Funky.Import._instances['clientImport'];
instance.setData({
    file: { name: 'clients.csv', size: 1024 },
    validation: { errors: [], warnings: ['Row 5: Email format unusual'] }
});
```
