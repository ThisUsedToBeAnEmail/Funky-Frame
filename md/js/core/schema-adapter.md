# Funky.SchemaAdapter

Generic schema conversion from external formats (OpenAPI, GraphQL, JSON Schema) to native Funky format.

## Overview

`Funky.SchemaAdapter` provides:
- Pluggable adapter system for different schema formats
- Auto-detection of schema type
- Built-in adapters for OpenAPI/JSON Schema, GraphQL, Array, and Shorthand formats
- Extensible for custom schema formats
- Used by Funky.Form, Funky.Table, and API validation

## Quick Start

```javascript
// Auto-detect and convert schema
var native = Funky.SchemaAdapter.convert(openApiSchema);

// Use with specific adapter
var native = Funky.SchemaAdapter.convertWith('openapi', schema);

// Create form from OpenAPI schema
var form = Funky.Form.create('#form', {
  schema: openApiSchema  // Auto-converted
});
```

## API Reference

### Module Methods

#### `Funky.SchemaAdapter.register(name, adapter)`

Register a schema adapter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Adapter name (e.g., `'openapi'`, `'graphql'`) |
| adapter | object | Yes | Adapter with `convert(schema, options)` method |

---

#### `Funky.SchemaAdapter.unregister(name)`

Remove a registered adapter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Adapter name |

---

#### `Funky.SchemaAdapter.get(name)`

Get adapter by name.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Adapter name |

**Returns:** Adapter object or `null`

---

#### `Funky.SchemaAdapter.has(name)`

Check if adapter exists.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Adapter name |

**Returns:** `boolean`

---

#### `Funky.SchemaAdapter.list()`

**Returns:** `string[]` - All registered adapter names

---

#### `Funky.SchemaAdapter.detect(schema)`

Automatically detect schema type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| schema | object/array | Yes | Input schema |

**Returns:** `string` - Schema type name

---

#### `Funky.SchemaAdapter.convert(schema, options)`

Convert schema to native format with auto-detection.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| schema | object/array | Yes | Input schema |
| options | object | No | Conversion options |

**Returns:** `{ fields: {...} }` - Native schema

---

#### `Funky.SchemaAdapter.convertWith(adapterName, schema, options)`

Convert schema using specific adapter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| adapterName | string | Yes | Adapter name to use |
| schema | object/array | Yes | Input schema |
| options | object | No | Conversion options |

**Returns:** `{ fields: {...} }` - Native schema

---

## Built-in Adapters

### OpenAPI / JSON Schema

Detects: `type: 'object'` with `properties`, or `$schema`/`definitions`

```javascript
// OpenAPI 3.0 schema
var schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 150 }
  }
};

var native = Funky.SchemaAdapter.convert(schema);
// { fields: { name: {...}, email: {...}, age: {...} } }
```

**Type Mapping:**

| JSON Schema | Funky Type |
|-------------|------------|
| `string` | `text` |
| `string` + `format: email` | `email` |
| `string` + `format: uri` | `url` |
| `string` + `format: date` | `date` |
| `string` + `format: date-time` | `datetime` |
| `string` + `format: password` | `password` |
| `number` | `number` |
| `integer` | `integer` |
| `boolean` | `checkbox` |
| `array` + `items.enum` | `select` (multiple) |
| `enum` | `select` |

**OpenAPI Extensions:**

| Extension | Description |
|-----------|-------------|
| `x-funky-field` | Merge custom field properties |
| `x-funky-type` | Override type detection |
| `x-funky-remote` | Remote data source config |
| `x-funky-dependsOn` | Field dependencies |
| `x-enum-descriptions` | Enum value labels |
| `x-enumNames` | Alternative enum labels |

---

### GraphQL

Detects: `__typename`, `kind: 'INPUT_OBJECT'`, or `inputFields` array

```javascript
// GraphQL introspection type
var schema = {
  kind: 'INPUT_OBJECT',
  name: 'UserInput',
  inputFields: [
    { name: 'name', type: { kind: 'NON_NULL', ofType: { kind: 'SCALAR', name: 'String' } } },
    { name: 'email', type: { kind: 'SCALAR', name: 'String' } }
  ]
};

var native = Funky.SchemaAdapter.convert(schema);
```

---

### Array

Detects: `Array.isArray(schema)`

```javascript
// Simple array of field definitions
var schema = [
  { name: 'firstName', type: 'text', label: 'First Name', required: true },
  { name: 'lastName', type: 'text', label: 'Last Name' }
];

var native = Funky.SchemaAdapter.convert(schema);
```

---

### Shorthand

Detects: Object with field names as keys

```javascript
// Object shorthand
var schema = {
  name: { type: 'text', required: true },
  email: { type: 'email' },
  bio: { type: 'textarea', rows: 4 }
};

var native = Funky.SchemaAdapter.convert(schema);
```

---

## Native Schema Format

The native format used by Funky components:

```javascript
{
  fields: {
    fieldName: {
      name: 'fieldName',
      type: 'text',
      label: 'Field Name',
      required: false,
      help: 'Help text',
      placeholder: 'Enter value...',
      defaultValue: null,
      // ... other field options
    }
  }
}
```

## Examples

### OpenAPI with Extensions

```javascript
var openApiSchema = {
  type: 'object',
  required: ['name', 'country'],
  properties: {
    name: {
      type: 'string',
      title: 'Full Name',
      description: 'Enter your full legal name',
      minLength: 2,
      maxLength: 100
    },
    country: {
      type: 'string',
      title: 'Country',
      'x-funky-type': 'combobox',
      'x-funky-remote': {
        url: '/api/countries',
        valueField: 'code',
        labelField: 'name'
      }
    },
    birthDate: {
      type: 'string',
      format: 'date',
      title: 'Date of Birth'
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'pending'],
      'x-enum-descriptions': ['Active', 'Inactive', 'Pending Review']
    }
  }
};

var native = Funky.SchemaAdapter.convert(openApiSchema);
```

### Custom Adapter

```javascript
// Register custom adapter for proprietary format
Funky.SchemaAdapter.register('myformat', {
  convert: function(schema, options) {
    var fields = {};

    schema.definitions.forEach(function(def) {
      fields[def.key] = {
        name: def.key,
        type: mapMyType(def.dataType),
        label: def.displayName,
        required: def.mandatory
      };
    });

    return { fields: fields };
  }
});

// Use custom adapter
var native = Funky.SchemaAdapter.convertWith('myformat', mySchema);
```

### Form from OpenAPI

```javascript
// Fetch OpenAPI spec and create form
fetch('/api/users/schema')
  .then(function(res) { return res.json(); })
  .then(function(schema) {
    var form = Funky.Form.create('#user-form', {
      schema: schema,
      onSubmit: function(data) {
        return fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
    });
  });
```

### Table Columns from Schema

```javascript
// Convert schema to table columns
var schema = Funky.SchemaAdapter.convert(openApiSchema);
var columns = Object.keys(schema.fields).map(function(name) {
  var field = schema.fields[name];
  return {
    data: name,
    title: field.label,
    visible: !field.hidden
  };
});

Funky.Table.init('#table', { columns: columns });
```

## Dependencies

- **Required:** None
- **Optional:** `Funky.register` (namespace registration)
