# Funky.FormModal - Create/Edit Entity Forms

Modal component for creating and editing entities with native Funky.Form integration, cache support, and OpenAPI schema integration.

## Overview

`Funky.FormModal` provides Bootstrap modals with embedded Funky.Form forms for entity creation and editing. It handles data fetching, schema-based form generation, validation, and API submission with automatic cache invalidation.

**Key Features:**
- Native Funky.Form rendering for better accessibility and consistent styling
- Direct schema or `schemaPath` for loading from OpenAPI spec via `Funky.Schema`
- Automatic OpenAPI to native schema conversion via `Funky.SchemaAdapter`
- Cache integration for fetching and invalidating entity data
- Dynamic schema enhancement with `enhanceSchema` callback
- Create and edit modes with automatic API method selection

## Registration

**File:** `public/assets/js/components/form-modal.js`

Registered as `Funky.FormModal` via the component registry.

## API Reference

### Methods

#### `FormModal.init(config)`

Initialize a form modal configuration.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| config.modalId | string | - | Modal element ID (required) |
| config.entity | string | - | Entity type for caching (required) |
| config.entityLabel | string | - | Display label (e.g., 'Client') |
| config.apiUrl | string | - | API endpoint base URL (required) |
| config.schema | object | - | Form schema (native or OpenAPI format) |
| config.schemaPath | string | - | Schema name in OpenAPI spec (e.g., 'CreateClient') |
| config.modalSize | string | 'modal-lg' | Modal size class |
| config.enhanceSchema | function | null | `fn(schema, data)` - Enhance schema dynamically |
| config.transformData | function | null | `fn(data, mode)` - Transform before submit |
| config.onSave | function | null | `fn(result, mode)` - Callback after save |
| config.onChange | function | null | `fn(field, value, data)` - Field change callback |

**Note:** Provide either `schema` (direct) or `schemaPath` (loads from `Funky.Schema`). OpenAPI schemas are automatically converted to native format via `Funky.SchemaAdapter`.

**Returns:** Modal instance

**Example with schemaPath (recommended):**
```javascript
Funky.FormModal.init({
    modalId: 'clientModal',
    entity: 'client',
    entityLabel: 'Client',
    schemaPath: 'CreateClient',  // Loaded from Funky.Schema
    apiUrl: '/api/clients',
    enhanceSchema: function(schema, data) {
        // Add dynamic dropdown options
        return Funky.Schema.enhance(schema, {
            properties: {
                parent_id: {
                    enum: activeClients.map(function(c) { return c.id; }),
                    options: { enum_titles: activeClients.map(function(c) { return c.name; }) }
                }
            }
        });
    },
    onSave: function(result, mode) {
        Funky.Toast.success('Client ' + (mode === 'create' ? 'created' : 'updated'));
        table.reload();
    }
});
```

**Example with direct schema:**
```javascript
Funky.FormModal.init({
    modalId: 'clientModal',
    entity: 'client',
    entityLabel: 'Client',
    apiUrl: '/api/clients',
    schema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
            name: { type: 'string', title: 'Client Name', minLength: 1 },
            email: { type: 'string', title: 'Email', format: 'email' },
            phone: { type: 'string', title: 'Phone' },
            is_active: { type: 'boolean', title: 'Active', default: true }
        }
    },
    onSave: function(result, mode) {
        table.ajax.reload();
    }
});
```

---

#### `FormModal.create(modalId, defaultData)`

Open modal for creating new entity.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| defaultData | object | Optional default values |

**Example:**
```javascript
// Open empty form
Funky.FormModal.create('clientModal');

// With default values
Funky.FormModal.create('clientModal', {
    is_active: true,
    country: 'US'
});
```

---

#### `FormModal.edit(modalId, id)`

Open modal for editing existing entity.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| id | string/number | Entity ID to edit |

**Behavior:**
1. Checks `Funky.Cache` for cached data
2. If not cached, fetches from fetchEndpoint
3. Caches the response
4. Populates form and shows modal

**Example:**
```javascript
// Edit client with ID 123
Funky.FormModal.edit('clientForm', 123);

// From Funky.Table action button
$('#clientsTable').on('click', '.btn-edit', function() {
    var id = $(this).data('id');
    Funky.FormModal.edit('clientForm', id);
});
```

---

#### `FormModal.save(modalId)`

Validate and submit the form.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Behavior:**
1. Validates form via Funky.Form
2. Calls transform function if defined
3. POSTs (create) or PUTs (edit) to API
4. Invalidates cache on success
5. Triggers onSave callback
6. Closes modal

**Note:** Usually triggered by the modal's Save button, not called directly.

---

#### `FormModal.hide(modalId)`

Hide an open modal without saving.

---

#### `FormModal.destroy(modalId)`

Remove modal and clean up.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

---

#### `FormModal.destroyAll()`

Destroy all form modal instances and clean up.

**Example:**
```javascript
// Clean up all form modals on page unload
Funky.FormModal.destroyAll();
```

---

#### `FormModal.getInstance(modalId)`

Get a form modal instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Instance object or `null`

**Example:**
```javascript
var modal = Funky.FormModal.getInstance('clientModal');
if (modal) {
    console.log('Modal entity:', modal.config.entity);
}
```

---

#### `FormModal.getEditor(modalId)`

Get the Funky.Form instance.

**Returns:** Funky.Form instance or null

**Example:**
```javascript
var form = Funky.FormModal.getEditor('clientForm');
var data = form.getData();
form.setData({ name: 'Updated' });
```

---

#### `FormModal.getData(modalId)`

Get current form data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Object with current form data

**Example:**
```javascript
var data = Funky.FormModal.getData('clientForm');
console.log('Current values:', data);
```

---

#### `FormModal.setData(modalId, data)`

Set form data programmatically.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| data | object | Data to populate form with |

**Example:**
```javascript
Funky.FormModal.setData('clientForm', {
    name: 'Acme Corp',
    email: 'contact@acme.com'
});
```

---

#### `FormModal.getConfig(modalId)`

Get the configuration for a modal.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Configuration object or null

**Example:**
```javascript
var config = Funky.FormModal.getConfig('clientForm');
console.log('Entity:', config.entity);
console.log('API URL:', config.apiUrl);
```

---

#### `FormModal.rebuildEditor(modalId, schema, overrideValues)`

Rebuild the form with a new schema.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| schema | object | New schema to use |
| overrideValues | object | Optional values to set after rebuild |

**Example:**
```javascript
// Rebuild with updated schema
Funky.FormModal.rebuildEditor('clientForm', newSchema, {
    status: 'active'
});
```

---

#### `FormModal.updateFieldOptions(modalId, fieldPath, options)`

Update options for a specific field (e.g., select dropdown options).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |
| fieldPath | string | Path to field (e.g., 'category_id') |
| options | array | New options array |

**Example:**
```javascript
// Update dropdown options dynamically
Funky.FormModal.updateFieldOptions('clientForm', 'country', [
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' }
]);
```

---

#### `FormModal.getNativeForm(modalId)`

Get the native Funky.Form instance (for native form modals).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Funky.Form instance or null

**Example:**
```javascript
var nativeForm = Funky.FormModal.getNativeForm('clientForm');
```

---

#### `FormModal.isNativeForm(modalId)`

Check if a modal is using native Funky.Form rendering.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| modalId | string | Modal identifier |

**Returns:** Boolean

**Example:**
```javascript
if (Funky.FormModal.isNativeForm('clientForm')) {
    console.log('Using native form rendering');
}
```

---

#### `FormModal.show(config)`

Show a one-off form modal without prior initialization.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| config | object | Full configuration including schema |

**Returns:** Instance object with `show`, `hide`, `getData`, `setData`, `getEditor`, `destroy` methods

**Example:**
```javascript
var modal = Funky.FormModal.show({
    title: 'Quick Feedback',
    schema: {
        type: 'object',
        properties: {
            rating: { type: 'integer', title: 'Rating', minimum: 1, maximum: 5 },
            comment: { type: 'string', title: 'Comment' }
        }
    },
    onSubmit: function(data) {
        console.log('Submitted:', data);
        modal.hide();
    }
});
```

## Usage Examples

### Basic Form Modal

```javascript
Funky.FormModal.init({
    id: 'userForm',
    entity: 'user',
    createEndpoint: '/api/users',
    updateEndpoint: '/api/users/:id',
    fetchEndpoint: '/api/users/:id',
    title: { create: 'New User', edit: 'Edit User' },
    schema: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
            username: { type: 'string', title: 'Username' },
            email: { type: 'string', title: 'Email', format: 'email' },
            role: { 
                type: 'string', 
                title: 'Role',
                enum: ['admin', 'user', 'viewer'],
                default: 'user'
            }
        }
    }
});

// Buttons
$('#btnNewUser').click(function() {
    Funky.FormModal.create('userForm');
});
```

### Advanced Schema Options

```javascript
Funky.FormModal.init({
    id: 'tradeForm',
    entity: 'trade',
    createEndpoint: '/api/trades',
    updateEndpoint: '/api/trades/:id',
    fetchEndpoint: '/api/trades/:id',
    schema: {
        type: 'object',
        required: ['client_id', 'quantity', 'price'],
        properties: {
            client_id: {
                type: 'integer',
                title: 'Client',
                // Select with AJAX options
                format: 'select',
                links: [{
                    href: '/api/clients/options',
                    rel: 'options'
                }]
            },
            trade_date: {
                type: 'string',
                title: 'Trade Date',
                format: 'date'
            },
            quantity: {
                type: 'number',
                title: 'Quantity',
                minimum: 0.01
            },
            price: {
                type: 'number',
                title: 'Price',
                minimum: 0
            },
            currency: {
                type: 'string',
                title: 'Currency',
                enum: ['USD', 'EUR', 'GBP'],
                default: 'USD'
            },
            notes: {
                type: 'string',
                title: 'Notes',
                format: 'textarea'
            }
        }
    },
    editorOptions: {
        disable_edit_json: true,
        disable_properties: true,
        no_additional_properties: true
    }
});
```

### Data Transformation

```javascript
Funky.FormModal.init({
    id: 'orderForm',
    entity: 'order',
    createEndpoint: '/api/orders',
    updateEndpoint: '/api/orders/:id',
    fetchEndpoint: '/api/orders/:id',
    schema: { /* ... */ },
    transform: function(data, isCreate) {
        // Add computed fields
        data.total = data.quantity * data.price;
        
        // Format dates
        if (data.order_date) {
            data.order_date = moment(data.order_date).format('YYYY-MM-DD');
        }
        
        // Remove read-only fields on update
        if (!isCreate) {
            delete data.created_by;
        }
        
        return data;
    }
});
```

### With Validation Feedback

```javascript
Funky.FormModal.init({
    id: 'clientForm',
    entity: 'client',
    createEndpoint: '/api/clients',
    updateEndpoint: '/api/clients/:id',
    fetchEndpoint: '/api/clients/:id',
    schema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
            name: {
                type: 'string',
                title: 'Name',
                minLength: 2,
                maxLength: 100,
                options: {
                    inputAttributes: {
                        placeholder: 'Enter client name'
                    }
                }
            },
            email: {
                type: 'string',
                title: 'Email',
                format: 'email',
                options: {
                    inputAttributes: {
                        placeholder: 'email@example.com'
                    }
                }
            }
        }
    },
    onSave: function(response, isCreate) {
        Funky.Toast.success('Client ' + (isCreate ? 'created' : 'updated'));
        // Reload table
        Funky.Table.getInstance('#clientsTable').reload();
    }
});
```

### Conditional Fields

```javascript
Funky.FormModal.init({
    id: 'paymentForm',
    entity: 'payment',
    schema: {
        type: 'object',
        properties: {
            payment_type: {
                type: 'string',
                title: 'Payment Type',
                enum: ['card', 'bank', 'cash']
            },
            card_number: {
                type: 'string',
                title: 'Card Number',
                options: {
                    dependencies: {
                        payment_type: 'card'
                    }
                }
            },
            bank_account: {
                type: 'string',
                title: 'Bank Account',
                options: {
                    dependencies: {
                        payment_type: 'bank'
                    }
                }
            }
        }
    }
});
```

## Cache Integration

FormModal integrates with `Funky.Cache`:

### On Edit (fetching data)
```javascript
1. Check: Funky.Cache.get('client', 123)
2. If hit: Use cached data
3. If miss: Fetch from API, then cache
```

### On Save (invalidation)
```javascript
// After successful save:
Funky.Cache.invalidate('client', savedData.id);

// If cache sync is enabled, WebSocket broadcast
// also triggers invalidation on other clients
```

## Modal Structure

```html
<div class="modal fade" id="modal-clientForm" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">New Client</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="editor-clientForm"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary btn-save">
                    <i class="fas fa-save me-1"></i>Save
                </button>
            </div>
        </div>
    </div>
</div>
```

## Error Handling

### Validation Errors
Funky.Form validates against schema before submit. Invalid forms show inline errors.

### API Errors
```javascript
// On API error (4xx, 5xx):
1. Parse error response
2. Show Toast error with message
3. Keep modal open for correction

// Server validation errors
{
    "error": true,
    "message": "Validation failed",
    "errors": {
        "email": "Email already exists"
    }
}
// Displays field-specific errors in form
```

## Dependencies

- `Funky.register` (registry.js)
- `Funky.Form` (form.js) - for form rendering (required)
- `Funky.Schema` (schema.js) - for loading schemas from OpenAPI spec (optional)
- `Funky.SchemaAdapter` (schema-adapter.js) - for OpenAPI to native conversion (optional)
- `Funky.Cache` (cache.js) - for data caching
- `Funky.Api` (api.js) - for API calls (optional, falls back to fetch)
- `Funky.Toast` (toast.js) - for notifications
- Bootstrap 5 Modal

## See Also

- [schema.md](schema.md) - Schema management and enhancement
- [view-modal.md](view-modal.md) - Read-only display modal
- [crud.md](crud.md) - CRUD controller integration
- [cache.md](../core/cache.md) - Cache layer
- [toast.md](toast.md) - Toast notifications

---

## Bindable Interface (LiveBinding)

`Funky.FormModal` implements the bindable interface, allowing it to be used as a target for LiveBinding data sources. This enables automatic form population from WebSocket updates, API responses, or other reactive data sources.

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(data)` | `data: Object` | Sets form field values from the provided data object. Populates the form with the given data. |
| `getData()` | - | Returns the current form data as an object. |

### Instance Registry

FormModal instances are registered in `Funky.FormModal._instances[modalId]` upon initialization. This allows LiveBinding adapters to locate and bind to specific modal instances.

### Usage with LiveBinding

```javascript
// Initialize the form modal
Funky.FormModal.init({
    modalId: 'clientModal',
    entity: 'client',
    schemaPath: 'CreateClient',
    apiUrl: '/api/clients'
});

// Bind to a WebSocket data source
Funky.LiveBinding.bind({
    source: {
        type: 'websocket',
        channel: 'client:123'
    },
    target: {
        type: 'component',
        component: 'FormModal',
        instance: 'clientModal'
    },
    transform: function(data) {
        return data.client;
    }
});

// Manual instance access
var instance = Funky.FormModal._instances['clientModal'];
instance.setData({ name: 'Acme Corp', email: 'contact@acme.com' });
var currentData = instance.getData();
```
