# Funky.ViewModal - Read-Only Entity Display

Modal component for displaying entity details in read-only format with cache integration.

## Overview

`Funky.ViewModal` creates Bootstrap modals for viewing entity details. It fetches data from the API (with cache support), formats fields, and displays them in a clean read-only layout. Supports custom templates and field rendering.

## Registration

**File:** `public/assets/js/components/view-modal.js`

Registered as `Funky.ViewModal` via the component registry.

## API Reference

### Methods

#### `ViewModal.init(config)`

Initialize a view modal configuration.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| config.id | string | - | Modal identifier (required) |
| config.title | string | 'View Details' | Modal title |
| config.entity | string | - | Entity type for API/cache (required) |
| config.endpoint | string | - | API endpoint pattern with `:id` placeholder |
| config.fields | Array | - | Field definitions for display |
| config.size | string | 'lg' | Modal size: 'sm', 'md', 'lg', 'xl' |
| config.template | string | null | Custom HTML template |

**Field Configuration:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| key | string | - | Data field key |
| label | string | key | Display label |
| render | string/function | null | Renderer name or function |
| section | string | null | Group under section heading |
| colClass | string | 'col-md-6' | Bootstrap column class |

**Returns:** Modal instance

**Example:**
```javascript
Funky.ViewModal.init({
    id: 'viewClient',
    title: 'Client Details',
    entity: 'client',
    endpoint: '/api/clients/:id',
    size: 'lg',
    fields: [
        { key: 'id', label: 'ID', render: 'id', colClass: 'col-md-4' },
        { key: 'name', label: 'Name', render: 'bold', colClass: 'col-md-8' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'is_active', label: 'Status', render: 'activeStatus' },
        { key: 'created_at', label: 'Created', render: 'datetime' },
        { key: 'notes', label: 'Notes', colClass: 'col-12', section: 'Additional Information' }
    ]
});
```

---

#### `ViewModal.show(modalId, id)`

Fetch entity data and display modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier (from init) |
| id | string/number | Entity ID to fetch |

**Behavior:**
1. Checks `Funky.Cache` for cached data
2. If not cached, fetches from API endpoint
3. Caches the response
4. Renders fields and shows modal

**Example:**
```javascript
// Show client with ID 123
Funky.ViewModal.show('viewClient', 123);

// From DataTable row click
$('#clientsTable tbody').on('click', 'tr', function() {
    var id = $(this).data('id');
    Funky.ViewModal.show('viewClient', id);
});
```

---

#### `ViewModal.showWithData(modalId, data)`

Display modal with pre-loaded data (skips fetch).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| data | object | Entity data to display |

**Example:**
```javascript
// When you already have the data
var client = { id: 123, name: 'Acme Corp', email: 'info@acme.com' };
Funky.ViewModal.showWithData('viewClient', client);
```

---

#### `ViewModal.hide(modalId)`

Hide an open modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

---

#### `ViewModal.destroy(modalId)`

Remove modal and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

---

#### `ViewModal.getInstance(modalId)`

Get a view modal instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Instance object or `null`

---

#### `ViewModal.destroyAll()`

Destroy all view modal instances.

## Usage Examples

### Basic View Modal

```javascript
// Initialize
Funky.ViewModal.init({
    id: 'viewUser',
    title: 'User Details',
    entity: 'user',
    endpoint: '/api/users/:id',
    fields: [
        { key: 'username', label: 'Username', render: 'bold' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'is_active', label: 'Active', render: 'yesNo' },
        { key: 'last_login', label: 'Last Login', render: 'datetime' }
    ]
});

// Add view button to DataTable
columns: [
    // ... other columns
    {
        data: null,
        render: function(data, type, row) {
            return '<button class="btn btn-sm btn-info btn-view" data-id="' + row.id + '">' +
                   '<i class="fas fa-eye"></i></button>';
        }
    }
]

// Handle button click
$('#usersTable').on('click', '.btn-view', function() {
    var id = $(this).data('id');
    Funky.ViewModal.show('viewUser', id);
});
```

### Sectioned Layout

```javascript
Funky.ViewModal.init({
    id: 'viewTrade',
    title: 'Trade Details',
    entity: 'trade',
    endpoint: '/api/trades/:id',
    size: 'xl',
    fields: [
        // Basic Info Section
        { key: 'id', label: 'Trade ID', render: 'id', section: 'Basic Information' },
        { key: 'trade_date', label: 'Date', render: 'date' },
        { key: 'client_name', label: 'Client', render: 'bold' },
        
        // Financial Section
        { key: 'quantity', label: 'Quantity', section: 'Financial Details' },
        { key: 'price', label: 'Price', render: 'currency:USD:2' },
        { key: 'total_value', label: 'Total', render: 'currency:USD:2' },
        
        // Status Section
        { key: 'status', label: 'Status', section: 'Status' },
        { key: 'created_at', label: 'Created', render: 'datetime' },
        { key: 'updated_at', label: 'Updated', render: 'datetime' }
    ]
});
```

### Custom Field Renderer

```javascript
Funky.ViewModal.init({
    id: 'viewOrder',
    entity: 'order',
    endpoint: '/api/orders/:id',
    fields: [
        { key: 'id', label: 'Order #' },
        { 
            key: 'status', 
            label: 'Status',
            render: function(value, data) {
                var colors = {
                    'pending': 'warning',
                    'approved': 'success',
                    'rejected': 'danger'
                };
                return '<span class="badge bg-' + (colors[value] || 'secondary') + '">' + 
                       value.toUpperCase() + '</span>';
            }
        },
        {
            key: 'items',
            label: 'Items',
            colClass: 'col-12',
            render: function(items) {
                if (!items || !items.length) return '<em>No items</em>';
                return '<ul class="mb-0">' + 
                    items.map(function(i) { 
                        return '<li>' + i.name + ' (x' + i.qty + ')</li>'; 
                    }).join('') + '</ul>';
            }
        }
    ]
});
```

### Custom Template

```javascript
Funky.ViewModal.init({
    id: 'viewProfile',
    entity: 'profile',
    endpoint: '/api/profiles/:id',
    size: 'lg',
    template: `
        <div class="text-center mb-4">
            <img id="profile-avatar" class="rounded-circle" width="100" height="100">
            <h4 id="profile-name" class="mt-2"></h4>
            <p id="profile-title" class="text-muted"></p>
        </div>
        <div class="row" id="profile-fields"></div>
    `,
    onRender: function(data, $modal) {
        $modal.find('#profile-avatar').attr('src', data.avatar_url || '/assets/img/default-avatar.png');
        $modal.find('#profile-name').text(data.name);
        $modal.find('#profile-title').text(data.job_title);
    },
    fields: [
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'department', label: 'Department' }
    ]
});
```

## Cache Integration

ViewModal integrates with `Funky.Cache` for performance:

```javascript
// On show():
1. Check: Funky.Cache.get('client', 123)
2. If cache hit: Use cached data, no API call
3. If cache miss: Fetch from API
4. After fetch: Funky.Cache.set('client', data)

// Cache is invalidated automatically via CacheSync
// when WebSocket receives entity_change events
```

### Manual Cache Control

```javascript
// Force refresh (bypass cache)
Funky.Cache.invalidate('client', 123);
Funky.ViewModal.show('viewClient', 123); // Will fetch fresh data

// Pre-populate cache
Funky.Cache.set('client', clientData);
Funky.ViewModal.show('viewClient', clientData.id); // Uses cache
```

## Field Renderers

ViewModal uses `Funky.Renderers` for field rendering. Available renderers:

| Renderer | Description |
|----------|-------------|
| `id` | Monospace ID styling |
| `bold` | Bold text |
| `currency:CUR:decimals` | Formatted currency |
| `percent:decimals` | Percentage with symbol |
| `date` | Date only |
| `datetime` | Full date/time |
| `activeStatus` | Active/Inactive badge |
| `yesNo` | Yes/No badge |
| `truncate:length` | Truncated text |

See [column-renderers.md](column-renderers.md) for full renderer documentation.

## Modal Structure

```html
<div class="modal fade" id="modal-viewClient" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Client Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <!-- Rendered fields -->
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label text-muted small">ID</label>
                        <div class="mb-3"><code>123</code></div>
                    </div>
                    <!-- ... more fields ... -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
```

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Cache` (cache.js) - for data caching
- `Funky.Renderers` (column-renderers.js) - for field rendering
- Bootstrap 5 Modal
- jQuery

## See Also

- [form-modal.md](form-modal.md) - Create/edit modal
- [crud.md](crud.md) - CRUD controller integration
- [column-renderers.md](column-renderers.md) - Renderer functions
- [cache.md](../core/cache.md) - Cache layer

---

## Bindable Interface (LiveBinding)

`Funky.ViewModal` implements the bindable interface, allowing it to be used as a target for LiveBinding data sources. This enables automatic display updates from WebSocket updates, API responses, or other reactive data sources.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(data)` | `data: Object` | Sets the modal content by re-rendering all fields with the provided data object. Updates the display without requiring a new API fetch. |

### Instance Registry

ViewModal instances are registered in `Funky.ViewModal._instances[modalId]` upon initialization. This allows LiveBinding adapters to locate and bind to specific modal instances.

### Usage with LiveBinding

```javascript
// Initialize the view modal
Funky.ViewModal.init({
    id: 'viewClient',
    title: 'Client Details',
    entity: 'client',
    endpoint: '/api/clients/:id',
    fields: [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status', render: 'activeStatus' }
    ]
});

// Bind to a WebSocket data source for live updates
Funky.LiveBinding.bind({
    source: {
        type: 'websocket',
        channel: 'funky:client:updates'
    },
    target: {
        type: 'component',
        component: 'ViewModal',
        instance: 'viewClient'
    },
    transform: function(data) {
        return data.client;
    }
});

// Manual instance access
var instance = Funky.ViewModal._instances['viewClient'];
instance.setData({ name: 'Updated Name', email: 'new@email.com', status: 'active' });
```
