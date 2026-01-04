# Funky.Schema - Centralized OpenAPI Schema Management

Fetch, cache, and manage JSON schemas from the OpenAPI specification.

## Overview

`Funky.Schema` provides centralized access to JSON schemas defined in the OpenAPI spec (`/api.json`). It eliminates schema duplication across templates by fetching schemas once, caching them, and providing utilities for resolution, cloning, and runtime enhancement.

## Registration

**File:** `public/assets/js/components/schema.js`

Registered as `Funky.Schema` via the component registry.

Auto-initialized on app load in `layouts/app.html.ep`.

## API Reference

### Methods

#### `Schema.init(url)`

Fetch and cache the OpenAPI spec.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| url | string | '/api.json' | Optional custom URL for the spec |

**Returns:** Promise that resolves when spec is loaded

**Example:**
```javascript
// Usually called automatically in app.html.ep
Funky.Schema.init();

// Custom URL
Funky.Schema.init('/custom/api-spec.json');
```

---

#### `Schema.ready()`

Wait for schema to be fully loaded.

**Returns:** Promise that resolves with `Funky.Schema` when ready

**Example:**
```javascript
Funky.Schema.ready().then(function() {
    var schema = Funky.Schema.get('CreateClient');
    // Use schema...
});

// Or with async/await
await Funky.Schema.ready();
var schema = Funky.Schema.get('CreateClient');
```

---

#### `Schema.isReady()`

Check if schemas are loaded.

**Returns:** boolean

---

#### `Schema.get(path)`

Get a schema by name or path. **Returns a reference - do not modify!**

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| path | string | Schema name or path |

**Path Formats Accepted:**
- `'CreateClient'` - Schema name only
- `'components/schemas/CreateClient'` - Path without hash
- `'#/components/schemas/CreateClient'` - Full $ref path

**Returns:** Schema object (reference) or null

**Example:**
```javascript
// All equivalent:
var schema = Funky.Schema.get('CreateClient');
var schema = Funky.Schema.get('components/schemas/CreateClient');
var schema = Funky.Schema.get('#/components/schemas/CreateClient');
```

---

#### `Schema.clone(path)`

Get a deep copy of a schema (safe to modify).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| path | string | Schema name or path |

**Returns:** Deep-cloned schema object or null

**Example:**
```javascript
var schema = Funky.Schema.clone('CreateClient');
schema.properties.custom_field = { type: 'string', title: 'Custom' };
// Original schema unchanged
```

---

#### `Schema.resolve(schemaOrPath)`

Resolve all `$ref` values in a schema recursively.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| schemaOrPath | string/Object | Schema name or schema object |

**Returns:** Fully resolved schema (cloned) with all $refs inlined

**Example:**
```javascript
// Schema with $ref:
// { "allOf": [{ "$ref": "#/components/schemas/BaseEntity" }, { ... }] }

var resolved = Funky.Schema.resolve('CreateTrade');
// Returns schema with BaseEntity properties inlined
```

---

#### `Schema.enhance(schemaOrPath, enhancements)`

Clone and enhance a schema with runtime data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| schemaOrPath | string/Object | Schema name or schema object |
| enhancements | Object | Properties to merge/add |

**Enhancement Options:**
| Property | Description |
|----------|-------------|
| `properties` | Object with property enhancements (deep merged) |
| `required` | Override required array |
| Other keys | Merged at top level |

**Returns:** Enhanced schema copy

**Example:**
```javascript
var clients = [{ id: 1, name: 'Acme' }, { id: 2, name: 'Beta' }];

var enhanced = Funky.Schema.enhance('CreateTrade', {
    properties: {
        client_id: {
            enum: clients.map(function(c) { return c.id; }),
            options: {
                enum_titles: clients.map(function(c) { return c.name; })
            }
        }
    },
    required: ['client_id', 'quantity']  // Override required fields
});
```

---

#### `Schema.getResolved(path, enhancements)`

Convenience method: clone, resolve $refs, and enhance in one call.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| path | string | Schema name or path |
| enhancements | Object | Optional enhancements |

**Returns:** Fully processed schema

**Example:**
```javascript
// Get fully resolved and enhanced schema
var schema = Funky.Schema.getResolved('CreateTrade', {
    properties: {
        client_id: { enum: clientIds }
    }
});
```

---

#### `Schema.list()`

Get all available schema names.

**Returns:** Array of schema name strings

**Example:**
```javascript
var names = Funky.Schema.list();
// ['Client', 'CreateClient', 'Trade', 'CreateTrade', ...]
```

---

#### `Schema.search(pattern)`

Search for schemas matching a pattern.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| pattern | string/RegExp | Pattern to match |

**Returns:** Array of matching schema names

**Example:**
```javascript
Funky.Schema.search('Client');     // ['Client', 'CreateClient', 'UpdateClient']
Funky.Schema.search(/^Create/);    // ['CreateClient', 'CreateTrade', ...]
```

---

#### `Schema.getSpec()`

Get the raw OpenAPI specification object.

**Returns:** Full OpenAPI spec or null

---

#### `Schema.getPaths(pathPattern)`

Get API paths from the spec.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| pathPattern | string | Optional regex pattern to filter |

**Returns:** Object with matching paths

**Example:**
```javascript
var clientPaths = Funky.Schema.getPaths('/api/clients');
```

---

#### `Schema.clearCache()`

Clear the resolved schema cache.

---

#### `Schema.reload(url)`

Re-fetch the OpenAPI spec.

**Returns:** Promise

## Usage Examples

### Basic Schema Usage

```javascript
// Wait for ready, then get schema
Funky.Schema.ready().then(function() {
    var schema = Funky.Schema.get('CreateClient');
    
    var editor = new JSONEditor(container, {
        schema: schema
    });
});
```

### With FormModal Integration

```javascript
// Using schemaPath - FormModal handles schema loading
Funky.FormModal.init({
    modalId: 'clientModal',
    entity: 'client',
    entityLabel: 'Client',
    schemaPath: 'CreateClient',  // Uses Funky.Schema
    apiUrl: '/api/clients',
    onSave: function() { table.ajax.reload(); }
});

// Or with enhancement callback
Funky.FormModal.init({
    modalId: 'tradeModal',
    entity: 'trade',
    entityLabel: 'Trade',
    schemaPath: 'CreateTrade',
    apiUrl: '/api/trades',
    enhanceSchema: function(schema, data) {
        return Funky.Schema.enhance(schema, {
            properties: {
                client_id: {
                    enum: activeClients.map(function(c) { return c.id; }),
                    options: { enum_titles: activeClients.map(function(c) { return c.name; }) }
                }
            }
        });
    }
});
```

### Dynamic Dropdown Options

```javascript
// Fetch options and enhance schema
Promise.all([
    Funky.Schema.ready(),
    fetch('/api/clients?active=true').then(function(r) { return r.json(); })
]).then(function(results) {
    var clients = results[1];
    
    var schema = Funky.Schema.enhance('CreateTrade', {
        properties: {
            client_id: {
                type: 'integer',
                title: 'Client',
                enum: clients.map(function(c) { return c.id; }),
                options: {
                    enum_titles: clients.map(function(c) { return c.name; })
                }
            }
        }
    });
    
    // Use enhanced schema
});
```

### Resolving $ref References

```javascript
// Original schema in api.json:
// {
//   "CreateTrade": {
//     "allOf": [
//       { "$ref": "#/components/schemas/TradeBase" },
//       { "properties": { "special_field": { ... } } }
//     ]
//   }
// }

// Resolve flattens $refs
var resolved = Funky.Schema.resolve('CreateTrade');
// Now has all TradeBase properties directly embedded
```

## Before/After Comparison

### Before (Inline Schema)

```javascript
// Schema duplicated in every template file
var schema = {
    type: 'object',
    title: 'New Client',
    required: ['name', 'code'],
    properties: {
        name: { type: 'string', title: 'Name', minLength: 1 },
        code: { type: 'string', title: 'Code', pattern: '^[A-Z0-9]+$' },
        is_active: { type: 'boolean', title: 'Active', default: true },
        parent_id: { type: 'integer', title: 'Parent' }
    }
};

// 20+ lines repeated in every template
```

### After (Using Funky.Schema)

```javascript
// Schema from OpenAPI spec
var schema = Funky.Schema.enhance('CreateClient', {
    properties: {
        parent_id: {
            enum: parentClients.map(function(c) { return c.id; }),
            options: { enum_titles: parentClients.map(function(c) { return c.name; }) }
        }
    }
});

// 5 lines, DRY, consistent with API validation
```

## Initialization Timing

Schema is initialized early in app load:

```html
<!-- In app.html.ep after registry.js -->
<script src="/assets/js/components/schema.js"></script>
<script>
  if (Funky.Schema) { Funky.Schema.init(); }
</script>
```

By the time page scripts run, schemas are typically loaded. Use `Schema.ready()` for guaranteed availability:

```javascript
$(document).ready(function() {
    Funky.Schema.ready().then(function() {
        // Safe to use Schema.get(), etc.
    });
});
```

## Error Handling

```javascript
Funky.Schema.init()
    .then(function() {
        console.log('Schemas loaded');
    })
    .catch(function(err) {
        console.error('Failed to load schemas:', err);
        // Show fallback UI or retry
    });
```

## Dependencies

- `Funky.register` (registry.js)
- `/api.json` (OpenAPI specification)

## See Also

- [form-modal.md](form-modal.md) - Form modal with schemaPath support
- [crud.md](crud.md) - CRUD controller
- [API Documentation](/docs/api.html) - OpenAPI spec viewer
