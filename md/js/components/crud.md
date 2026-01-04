# Funky.CRUD - Complete CRUD Controller

Orchestrates all Phase 6 components into a unified CRUD interface with WebSocket integration.

## Overview

`Funky.CRUD` provides a complete Create-Read-Update-Delete interface by integrating:
- **DataTable** for listing entities
- **StatsBar** for computed statistics
- **ViewModal** for read-only details
- **FormModal** for create/edit forms (supports schemaPath for OpenAPI integration)
- **Import** for bulk file imports
- **Nested CRUD** for parent-child entity relationships
- **Smart Row Updates** for in-memory edits without full page reload

It also handles WebSocket-based real-time updates via CacheSync integration.

**Key Features:**
- Schema loading from OpenAPI spec via `schemaPath` or direct `schema`
- Dynamic schema enhancement with `enhanceSchema` callback
- Automatic cache integration for data and invalidation
- WebSocket-triggered smart updates (edits update in-memory, creates/deletes reload)
- **Nested CRUD support** for managing child entities in modal dialogs

**Smart Update Behavior:**
- **Edits**: Updates row in-memory (no reload needed, row is already visible)
- **Creates**: Reloads table (server-side pagination/sorting determines position)
- **Deletes**: Reloads table (server provides next row for pagination)
- **WebSocket updates**: Fetches only the changed row and updates in-memory

## Registration

**File:** `public/assets/js/components/crud.js`

Registered as `Funky.CRUD` via the component registry.

## API Reference

### Methods

#### `CRUD.init(config)`

Initialize a complete CRUD controller.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| config.entity | string | - | Entity type (required) |
| config.entityLabel | string | - | Display label |
| config.apiUrl | string | - | API endpoint base URL |
| config.tableSelector | string | - | DataTable selector (required) |
| config.schema | object | - | JSON Schema for forms (direct) |
| config.schemaPath | string | - | Schema path in OpenAPI spec (e.g., 'CreateClient') |
| config.enhanceSchema | function | - | `fn(schema, data)` - Enhance schema dynamically |
| config.columns | Array | - | DataTable column definitions |
| config.features | object | - | Feature flags (create, edit, delete, view, import, audit) |
| config.statsSelector | string | null | StatsBar container selector |
| config.stats | Array | null | StatsBar stat configurations |
| config.viewFields | Array | null | ViewModal field configurations |
| config.reloadDebounce | number | 500 | Debounce time for WS reloads (ms) |
| config.nested | object | null | Nested CRUD configurations (see Nested CRUD section) |

**Note:** Provide either `schema` (direct) or `schemaPath` (loads from `Funky.Schema`). Using `schemaPath` is recommended for DRY code.

**Returns:** CRUD controller instance

**Example with schemaPath (recommended):**
```javascript
Funky.CRUD.init({
    entity: 'client',
    entityLabel: 'Client',
    apiUrl: '/api/clients',
    
    // DataTable
    tableSelector: '#clientsTable',
    columns: [
        { data: 'id', title: 'ID', render: 'id' },
        { data: 'name', title: 'Name', render: 'bold' },
        { data: 'email', title: 'Email' },
        { data: 'is_active', title: 'Status', render: 'activeStatus' },
        { data: 'created_at', title: 'Created', render: 'datetime' }
    ],
    
    // Schema from OpenAPI spec
    schemaPath: 'CreateClient',
    enhanceSchema: function(schema, data) {
        return Funky.Schema.enhance(schema, {
            properties: {
                parent_id: {
                    enum: parentClients.map(c => c.id),
                    options: { enum_titles: parentClients.map(c => c.name) }
                }
            }
        });
    },
    
    // Features
    features: { create: true, edit: true, delete: true, view: true },
    
    // Stats Bar
    statsSelector: '#clientStats',
    stats: [
        { id: 'total', icon: 'fa-users', label: 'Total', variant: 'primary', compute: 'count' },
        { id: 'active', icon: 'fa-check', label: 'Active', variant: 'success', 
          compute: 'countWhere', field: 'is_active', value: true }
    ],
    
    // View Modal fields
    viewFields: [
        { key: 'id', label: 'ID', render: 'id' },
        { key: 'name', label: 'Name', render: 'bold' },
        { key: 'email', label: 'Email' },
        { key: 'is_active', label: 'Status', render: 'activeStatus' }
    ]
});
```

**Example with direct schema:**
```javascript
Funky.CRUD.init({
    entity: 'client',
    entityLabel: 'Client',
    apiUrl: '/api/clients',
    tableSelector: '#clientsTable',
    columns: [
        { data: 'id', title: 'ID', render: 'id' },
        { data: 'name', title: 'Name', render: 'bold' },
        { data: 'is_active', title: 'Status', render: 'activeStatus' }
    ],
    schema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
            name: { type: 'string', title: 'Name' },
            email: { type: 'string', title: 'Email', format: 'email' },
            is_active: { type: 'boolean', title: 'Active', default: true }
        }
    },
    features: { create: true, edit: true, delete: true }
});
```

---

#### `CRUD.get(entity)`

Get CRUD controller instance by entity.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |

**Returns:** CRUD controller instance or null

---

#### `CRUD.create(entity, defaultData)`

Open create form modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| defaultData | object | Optional default values |

**Example:**
```javascript
$('#btnNewClient').click(function() {
    Funky.CRUD.create('client');
});

// With defaults
Funky.CRUD.create('client', { is_active: true, country: 'US' });
```

---

#### `CRUD.edit(entity, id)`

Open edit form modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Entity ID to edit |

**Example:**
```javascript
$('#clientsTable').on('click', '.btn-edit', function() {
    var id = $(this).data('id');
    Funky.CRUD.edit('client', id);
});
```

---

#### `CRUD.view(entity, id)`

Open view modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Entity ID to view |

---

#### `CRUD.delete(entity, id, name)`

Delete entity with confirmation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Entity ID to delete |
| name | string | Display name for confirmation |

**Example:**
```javascript
$('#clientsTable').on('click', '.btn-delete', function() {
    var id = $(this).data('id');
    var name = $(this).data('name');
    Funky.CRUD.delete('client', id, name);
});
```

---

#### `CRUD.showImport(entity)`

Open import modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |

---

#### `CRUD.reload(entity)`

Reload DataTable data from server.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |

---

#### `CRUD.updateRow(entity, id, data)`

Update a specific row in-memory without server reload. Useful when you already have the updated data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Row ID to update |
| data | object | Updated row data |

**Returns:** `boolean` - Whether the row was found and updated

**Example:**
```javascript
// Update a row with new data you already have
Funky.CRUD.updateRow('client', 123, {
    id: 123,
    name: 'Updated Name',
    is_active: true
});
```

---

#### `CRUD.fetchAndUpdateRow(entity, id)`

Fetch a single row from the API and update it in the table. Used by WebSocket handlers for real-time updates.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Row ID to fetch and update |

**Example:**
```javascript
// Fetch latest data for a row and update it
Funky.CRUD.fetchAndUpdateRow('client', 123);
```

---

#### `CRUD.addRow(entity, data)`

Add a new row to the table in-memory. Note: For server-side paginated tables, use `reload()` instead to ensure proper positioning.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| data | object | New row data |

---

#### `CRUD.removeRow(entity, id)`

Remove a row from the table in-memory. Note: For server-side paginated tables, use `reload()` instead to fetch the next row.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |
| id | string/number | Row ID to remove |

**Returns:** `boolean` - Whether the row was found and removed

---

#### `CRUD.destroy(entity)`

Destroy CRUD controller and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |

---

#### `CRUD.destroyAll()`

Destroy all CRUD controller instances and clean up.

**Example:**
```javascript
// Clean up all CRUD instances on page unload
Funky.CRUD.destroyAll();
```

---

#### `CRUD.getInstance(entity)`

Get CRUD controller instance by entity (alias for `CRUD.get`).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| entity | string | Entity identifier |

**Returns:** CRUD controller instance or null

**Example:**
```javascript
var crud = Funky.CRUD.getInstance('client');
if (crud) {
    crud.reload();
}
```

## Usage Examples

### Complete Page Setup

```html
<!-- Stats Bar -->
<div id="clientStats" class="mb-4"></div>

<!-- Toolbar -->
<div class="d-flex justify-content-between mb-3">
    <div>
        <button id="btnNewClient" class="btn btn-primary">
            <i class="fas fa-plus me-1"></i>New Client
        </button>
        <button id="btnImportClients" class="btn btn-outline-secondary ms-2">
            <i class="fas fa-upload me-1"></i>Import
        </button>
    </div>
</div>

<!-- DataTable -->
<table id="clientsTable" class="table table-striped">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
        </tr>
    </thead>
</table>

<script>
$(document).ready(function() {
    // Initialize CRUD
    Funky.CRUD.init({
        entity: 'client',
        tableSelector: '#clientsTable',
        tableConfig: {
            ajax: '/api/clients',
            columns: [
                { data: 'id', render: Funky.Renderers.id() },
                { data: 'name', render: Funky.Renderers.bold() },
                { data: 'email' },
                { data: 'is_active', render: Funky.Renderers.activeStatus() },
                { data: 'created_at', render: Funky.Renderers.datetime() },
                { data: null, render: Funky.Renderers.actions({ view: true, edit: true, delete: true }) }
            ]
        },
        statsSelector: '#clientStats',
        stats: [
            { id: 'total', icon: 'fa-users', label: 'Total', compute: 'count' },
            { id: 'active', icon: 'fa-check', label: 'Active', compute: 'countWhere', field: 'is_active', value: true }
        ],
        view: {
            fields: [
                { key: 'id', label: 'ID', render: 'id' },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'is_active', label: 'Status', render: 'activeStatus' }
            ]
        },
        form: {
            schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                    name: { type: 'string', title: 'Name' },
                    email: { type: 'string', title: 'Email', format: 'email' },
                    is_active: { type: 'boolean', title: 'Active', default: true }
                }
            }
        },
        import: {
            endpoint: '/api/clients/import',
            templateUrl: '/api/clients/import/template'
        }
    });
    
    // Button handlers
    $('#btnNewClient').click(function() { Funky.CRUD.create('client'); });
    $('#btnImportClients').click(function() { Funky.CRUD.showImport('client'); });
});
</script>
```

### Minimal Setup (Table Only)

```javascript
Funky.CRUD.init({
    entity: 'log',
    tableSelector: '#logsTable',
    tableConfig: {
        ajax: '/api/logs',
        columns: [
            { data: 'timestamp', render: Funky.Renderers.datetime() },
            { data: 'level' },
            { data: 'message', render: Funky.Renderers.truncate(100) }
        ]
    }
    // No stats, view, form, or import
});
```

### Custom Endpoints

```javascript
Funky.CRUD.init({
    entity: 'trade',
    endpoints: {
        list: '/api/trades',           // GET list
        get: '/api/trades/:id',        // GET single
        create: '/api/trades',         // POST create
        update: '/api/trades/:id',     // PUT update
        delete: '/api/trades/:id',     // DELETE
        import: '/api/trades/import'   // POST import
    },
    // ... other config
});
```

### Custom Action Buttons

```javascript
Funky.CRUD.init({
    entity: 'order',
    tableConfig: {
        ajax: '/api/orders',
        columns: [
            // ... data columns
            {
                data: null,
                render: function(data, type, row) {
                    var buttons = '';
                    
                    // Standard actions
                    buttons += Funky.Renderers.actions({ view: true, edit: row.status === 'draft' })(data, type, row);
                    
                    // Custom approve button
                    if (row.status === 'pending') {
                        buttons += '<button class="btn btn-sm btn-success btn-approve ms-1" data-id="' + row.id + '">' +
                                   '<i class="fas fa-check"></i></button>';
                    }
                    
                    return buttons;
                }
            }
        ]
    },
    // ...
});

// Custom action handler
$('#ordersTable').on('click', '.btn-approve', function() {
    var id = $(this).data('id');
    $.post('/api/orders/' + id + '/approve')
        .done(function() {
            Funky.Toast.success('Order approved');
            Funky.CRUD.reload('order');
        });
});
```

## Nested CRUD

For parent-child entity relationships (e.g., Client → Client Relationships), use the `nested` config to enable CRUD operations on child entities within a modal dialog.

### Nested Config Structure

```javascript
nested: {
    nestedName: {
        entity: 'child_entity',           // Entity type name
        entityLabel: 'Child Entity',      // Display label
        apiUrl: '/api/child_entities',    // API endpoint
        tableName: 'child_entities',      // API data key (if different from entity + 's')
        parentKey: 'parent_id',           // Filter parameter for API
        parentLabelFn: function(row) {},  // Modal title context function
        schemaPath: 'NewChildEntity',     // Schema path in OpenAPI spec
        enhanceSchema: function(schema, data) {}, // Dynamic schema enhancement
        modalSize: 'modal-slide-panel-xl', // Modal size class
        columns: [...],                   // DataTable columns
        features: {...},                  // Feature flags
        order: [[0, 'desc']],            // Default sort order
        pageLength: 10                    // Rows per page
    }
}
```

### Example: Client with Relationships

```javascript
Funky.CRUD.init({
    entity: 'client',
    entityLabel: 'Client',
    apiUrl: '/api/clients',
    tableSelector: '#clientsTable',
    schemaPath: 'NewClient',
    
    columns: [
        { data: 'code', title: 'Code', render: 'bold' },
        { data: 'name', title: 'Name' },
        { data: 'is_active', title: 'Status', render: Funky.Renderers.activeStatus() },
        {
            data: null,
            title: 'Actions',
            render: Funky.Renderers.actions({
                entity: 'client',  // Required for nested actions
                nested: [
                    { 
                        name: 'relationships', 
                        icon: 'fa-link', 
                        title: 'Manage Relationships', 
                        btnClass: 'btn-primary' 
                    }
                ],
                view: true,
                edit: true,
                delete: true
            })
        }
    ],
    
    features: { create: true, edit: true, delete: true, view: true },
    
    // Nested CRUD for client relationships
    nested: {
        relationships: {
            entity: 'client_relationship',
            entityLabel: 'Relationship',
            apiUrl: '/api/client_relationships',
            tableName: 'client_relationships',
            parentKey: 'client_id',
            parentLabelFn: function(row) { 
                return row.name + ' (' + row.code + ')'; 
            },
            schemaPath: 'NewClientRelationship',
            modalSize: 'modal-slide-panel-xl',
            
            // Dynamic dropdown population
            enhanceSchema: function(schema, data) {
                return Funky.Api.fetchAllClients().then(function(clients) {
                    var enhanced = JSON.parse(JSON.stringify(schema));
                    
                    // Populate client dropdown
                    enhanced.properties.client_id.enum = clients.map(function(c) { return c.id; });
                    enhanced.properties.client_id.options = {
                        enum_titles: clients.map(function(c) { return c.name + ' (' + c.code + ')'; })
                    };
                    
                    return enhanced;
                });
            },
            
            columns: [
                { data: 'related_client_name', title: 'Related Client' },
                { data: 'cpty_cd', title: 'CPTY Code' },
                { data: 'is_active', title: 'Status', render: Funky.Renderers.activeStatus() }
            ],
            
            features: { create: true, edit: true, delete: true, import: true }
        }
    }
});
```

### Nested CRUD Methods

#### `CRUD.openNested(parentEntity, nestedName, parentRow)`

Open a nested CRUD modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| parentEntity | string | Parent entity name |
| nestedName | string | Nested config key |
| parentRow | object | Parent row data |

**Example:**
```javascript
// Typically called via action button, but can be manual:
Funky.CRUD.openNested('client', 'relationships', { id: 123, name: 'ACME Corp', code: 'ACME' });
```

---

#### `CRUD.getNested(parentEntity, nestedName)`

Get nested CRUD instance.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| parentEntity | string | Parent entity name |
| nestedName | string | Nested config key |

**Returns:** NestedCRUDInstance or null

### NestedCRUDInstance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `show()` | `this` | Show the nested CRUD modal |
| `hide()` | `this` | Hide the nested CRUD modal |
| `toggle()` | `this` | Toggle visibility |
| `reload()` | - | Reload the nested table |
| `create()` | - | Open create form |
| `updateRow(id, data)` | `boolean` | Update row in-memory |
| `addRow(data)` | - | Add row without reload |
| `removeRow(id)` | `boolean` | Remove row without reload |

### How Nested CRUD Works

1. **Action Button**: Row action with `nested: [{name: 'relationships', ...}]` triggers `Funky.CRUD.openNested()`
2. **Modal Creation**: Dynamic modal is created with DataTable filtered by `parentKey`
3. **Parent Context**: Modal title shows parent label via `parentLabelFn`
4. **CRUD Operations**: FormModal, Import, Delete all route through nested instance
5. **Action Routing**: Global handlers (`editRow`, `deleteRow`) detect nested context and route appropriately

## WebSocket Integration

CRUD automatically subscribes to WebSocket entity_change events for real-time updates with smart row handling:

```javascript
// When WebSocket receives entity_change:
{
    type: 'entity_change',
    entity: 'client',
    id: 123,
    action: 'updated'  // 'created', 'updated', or 'deleted'
}

// CRUD responds based on action:
// - 'updated': Fetches just that row via API and updates in-memory (no full reload)
// - 'created': Reloads table (server determines position based on sort/pagination)
// - 'deleted': Reloads table (server provides next row for pagination)
```

### Smart Row Updates

For edit operations, only the affected row is updated:

```javascript
// User on another browser edits client 123
// WebSocket broadcasts: { entity: 'client', id: 123, action: 'updated' }
// CRUD automatically:
1. Calls GET /api/clients/123 to fetch updated data
2. Finds row with id=123 in the DataTable
3. Updates that row's data in-memory
4. Redraws table (no server round-trip for full data)
5. Recomputes stats if configured
```

This is more efficient than full reloads, especially for large tables.

### Manual Reload Control

```javascript
// Disable auto-reload
Funky.CRUD.init({
    entity: 'trade',
    reloadDebounce: false,  // Disable WS-triggered reloads
    // ...
});

// Manual reload when needed
Funky.CRUD.reload('trade');
```

## Instance Methods

Get instance for advanced control:

```javascript
var crud = Funky.CRUD.get('client');

// Access DataTable
var table = crud.getTable();
table.search('term').draw();

// Access StatsBar
crud.updateStats({ total: 100 });

// Access form editor
var editor = crud.getFormEditor();

// Programmatic actions
crud.create();
crud.edit(123);
crud.view(123);
crud.delete(123, 'Client Name');
crud.showImport();
crud.reload();
```

## Events

CRUD triggers events for customization:

```javascript
$(document).on('funky:crud:init', function(e, data) {
    console.log('CRUD initialized:', data.entity);
});

$(document).on('funky:crud:beforeCreate', function(e, data) {
    // Modify default values
    data.defaults.source = 'web';
});

$(document).on('funky:crud:afterSave', function(e, data) {
    console.log('Saved:', data.entity, data.id, data.isCreate);
});

$(document).on('funky:crud:afterDelete', function(e, data) {
    console.log('Deleted:', data.entity, data.id);
});

$(document).on('funky:crud:reload', function(e, data) {
    console.log('Reloading:', data.entity, data.reason);
});
```

## Component IDs

CRUD creates components with predictable IDs:

| Component | ID Pattern | Example |
|-----------|------------|---------|
| StatsBar | `{entity}Stats` | `clientStats` |
| ViewModal | `view{Entity}` | `viewClient` |
| FormModal | `{entity}Form` | `clientForm` |
| Import | `{entity}Import` | `clientImport` |

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Schema` (schema.js) - for schemaPath loading (optional)
- `Funky.Cache` (cache.js)
- `Funky.CacheSync` (cache-sync.js)
- `Funky.Renderers` (column-renderers.js)
- `Funky.StatsBar` (stats-bar.js)
- `Funky.ViewModal` (view-modal.js)
- `Funky.FormModal` (form-modal.js)
- `Funky.Import` (import.js)
- `Funky.Toast` (toast.js)
- `Funky.Confirm` (confirm.js)
- DataTables
- Bootstrap 5
- jQuery

## See Also

- [schema.md](schema.md) - Schema management and enhancement
- [column-renderers.md](column-renderers.md) - Column render functions
- [stats-bar.md](stats-bar.md) - Statistics bar
- [view-modal.md](view-modal.md) - View modal
- [form-modal.md](form-modal.md) - Form modal
- [import.md](import.md) - Import component
- [cache.md](../core/cache.md) - Cache layer
- [cache-sync.md](../core/cache-sync.md) - WebSocket cache sync
