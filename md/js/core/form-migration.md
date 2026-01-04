# Migrating from JSONEditor to Funky.Form

This guide covers migrating forms from JSONEditor to the native Funky.Form component.

## Overview

Funky.Form provides a native alternative to JSONEditor for form rendering. Migration can be done gradually using the `useNativeForm` option in FormModal.

---

## Why Migrate?

| Benefit | Description |
|---------|-------------|
| **No external dependencies** | JSONEditor library is removed from bundle |
| **Schema flexibility** | Not tied to OpenAPI/JSON Schema versions |
| **Better integration** | Uses native Funky components (ComboBox, DatePicker) |
| **Consistent styling** | Follows Funky theme system and CSS variables |
| **Smaller bundle** | Reduced JavaScript payload |
| **LiveBinding** | Full Bindable interface support |

---

## Migration Strategy

### Phase A: Opt-in (Current)

Default behavior uses JSONEditor. Add `useNativeForm: true` to opt-in:

```javascript
// Before (JSONEditor)
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  onSave: function(data) { ... }
});

// After (Funky.Form opt-in)
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  useNativeForm: true,  // Add this
  onSubmit: function(data) { ... }  // Renamed from onSave
});
```

### Phase B: Opt-out (Future)

Default will switch to Funky.Form. Add `useLegacyEditor: true` to keep JSONEditor:

```javascript
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  useLegacyEditor: true,  // Opt-out to JSONEditor
  onSave: function(data) { ... }
});
```

### Phase C: JSONEditor Removal (Future)

JSONEditor will be removed entirely. All forms use Funky.Form.

---

## Step-by-Step Migration

### Step 1: Enable Native Form

Add `useNativeForm: true` to your FormModal configuration:

```javascript
// JSONEditor
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  onSave: function(data) {
    saveClient(data);
  }
});

// Funky.Form
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  useNativeForm: true,
  onSubmit: function(data) {
    saveClient(data);
  }
});
```

### Step 2: Update Callbacks

| JSONEditor | Funky.Form | Notes |
|------------|------------|-------|
| `onSave` | `onSubmit` | Called on form submission |
| `onChange` | `onChange` | Same signature, different detail object |
| `onReady` | `onInit` | Called after form initialization |

**onChange Detail Changes:**

```javascript
// JSONEditor onChange
onChange: function(editor) {
  var data = editor.getValue();
}

// Funky.Form onChange
onChange: function(detail) {
  var field = detail.field;   // Field that changed
  var value = detail.value;   // New value
  var data = detail.data;     // All form data
}
```

### Step 3: Update Error Handling

```javascript
// JSONEditor
editor.validate();
editor.setError('email', 'Email exists');

// Funky.Form
form.validate();
form.setFieldError('email', 'Email exists');

// Or set multiple errors
form.setErrors({
  email: ['Email exists'],
  username: ['Username taken', 'Must be lowercase']
});
```

### Step 4: Update Data Access

```javascript
// JSONEditor
var data = editor.getValue();
editor.setValue({ name: 'John' });

// Funky.Form
var data = form.getData();
form.setData({ name: 'John' });

// Single field
var name = form.getFieldValue('name');
form.setFieldValue('name', 'John');
```

### Step 5: Custom Field Types

If using JSONEditor custom editors, register equivalent Funky.Form fields:

```javascript
// JSONEditor custom editor
JSONEditor.defaults.editors.myField = JSONEditor.AbstractEditor.extend({
  // ...
});

// Funky.Form custom field
function MyField(config, form) {
  Funky.Form.BaseField.call(this, config, form);
}
MyField.prototype = Object.create(Funky.Form.BaseField.prototype);
MyField.prototype._renderInput = function() {
  // ...
};

Funky.Form.FieldRegistry.register('myField', {
  class: MyField
});
```

---

## Schema Compatibility

OpenAPI schemas work automatically via the schema adapter. The adapter converts JSON Schema to native format.

### OpenAPI/JSON Schema (Works as-is)

```javascript
// This OpenAPI schema...
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "title": "Client Name",
      "minLength": 2
    },
    "email": {
      "type": "string",
      "format": "email"
    }
  }
}

// ...is converted to native schema:
{
  fields: {
    name: {
      type: 'text',
      label: 'Client Name',
      required: true,
      minLength: 2
    },
    email: {
      type: 'email',
      label: 'Email'
    }
  }
}
```

### Native Schema (Recommended)

For new forms or when refactoring, use native schema directly:

```javascript
Funky.FormModal.show({
  title: 'Create Client',
  useNativeForm: true,
  schema: {
    fields: {
      name: { type: 'text', label: 'Name', required: true },
      email: { type: 'email', label: 'Email' },
      type: {
        type: 'select',
        label: 'Client Type',
        options: [
          { value: 'corporate', label: 'Corporate' },
          { value: 'individual', label: 'Individual' }
        ]
      }
    },
    layout: {
      type: 'sections',
      sections: [
        { title: 'Basic Info', fields: ['name', 'email'] },
        { title: 'Details', fields: ['type'] }
      ]
    }
  }
});
```

---

## Field Type Mapping

| JSON Schema | JSONEditor | Funky.Form |
|-------------|------------|------------|
| `string` | text | `text` |
| `string` + `format: email` | text | `email` |
| `string` + `format: uri` | text | `url` |
| `string` + `format: date` | flatpickr | `date` |
| `string` + `format: date-time` | flatpickr | `datetime` |
| `integer` | number | `integer` |
| `number` | number | `number` |
| `boolean` | checkbox | `checkbox` |
| `string` + `enum` | select | `select` |
| `array` | array editor | `select` (multiple) |

### Special Cases

**Select2 / ComboBox:**

```javascript
// JSONEditor with Select2
{
  "type": "string",
  "enum": ["a", "b", "c"],
  "options": {
    "select2": { "allowClear": true }
  }
}

// Funky.Form
{
  type: 'combobox',
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' }
  ],
  clearable: true,
  searchable: true
}
```

**Remote Data:**

```javascript
// JSONEditor Select2 AJAX
{
  "options": {
    "select2": {
      "ajax": { "url": "/api/search" }
    }
  }
}

// Funky.Form ComboBox
{
  type: 'combobox',
  remote: {
    url: '/api/search',
    searchParam: 'q',
    valueField: 'id',
    labelField: 'name'
  }
}
```

---

## Layout Migration

### JSONEditor Grid Layout

```javascript
// JSONEditor
{
  "options": {
    "grid_columns": 2
  }
}

// Funky.Form
{
  layout: {
    type: 'columns',
    columns: 2
  }
}
```

### JSONEditor Tabs

```javascript
// JSONEditor
{
  "format": "tabs",
  "properties": {
    "tab1": { "type": "object", "properties": {...} },
    "tab2": { "type": "object", "properties": {...} }
  }
}

// Funky.Form
{
  fields: { ... },
  layout: {
    type: 'tabs',
    tabs: [
      { id: 'tab1', label: 'Tab 1', fields: ['field1', 'field2'] },
      { id: 'tab2', label: 'Tab 2', fields: ['field3', 'field4'] }
    ]
  }
}
```

---

## Validation Migration

### JSONEditor Validators

```javascript
// JSONEditor custom validator
JSONEditor.defaults.custom_validators.push(function(schema, value, path) {
  var errors = [];
  if (schema.format === 'phone' && value && !/^\d{10}$/.test(value)) {
    errors.push({
      path: path,
      message: 'Invalid phone number'
    });
  }
  return errors;
});

// Funky.Form validator
Funky.Validator.register('phone', function(value, options, context) {
  if (value && !/^\d{10}$/.test(value)) {
    return 'Invalid phone number';
  }
  return true;
});

// Use in schema
{
  phone: {
    type: 'tel',
    validators: ['phone']
  }
}
```

### Async Validation

```javascript
// JSONEditor (not directly supported)

// Funky.Form
{
  email: {
    type: 'email',
    validators: [
      function(value, context) {
        return fetch('/api/check-email?email=' + value)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            return data.available ? true : 'Email taken';
          });
      }
    ]
  }
}
```

---

## Event Migration

### JSONEditor Events

```javascript
// JSONEditor
editor.on('change', function() {
  console.log('Changed');
});

editor.on('ready', function() {
  console.log('Ready');
});
```

### Funky.Form Events

```javascript
// Callbacks
Funky.Form.create('#container', {
  onChange: function(detail) {
    console.log('Changed:', detail.field);
  },
  onInit: function(detail) {
    console.log('Ready');
  }
});

// DOM Events
container.addEventListener('funky-form:change', function(e) {
  console.log('Changed:', e.detail.field);
});

// PubSub
Funky.PubSub.subscribe('form:change', function(detail) {
  console.log('Changed:', detail.field);
});
```

---

## Rollback

If issues occur during migration, remove `useNativeForm: true` to revert to JSONEditor:

```javascript
// Funky.Form (issues encountered)
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  useNativeForm: true,  // Remove this line
  onSubmit: function(data) { ... }
});

// Rollback to JSONEditor
Funky.FormModal.init({
  schemaPath: 'CreateClient',
  onSave: function(data) { ... }  // Rename back to onSave
});
```

---

## Complete Migration Example

### Before (JSONEditor)

```javascript
Funky.FormModal.init({
  schemaPath: 'UpdateClient',
  data: existingClientData,
  onSave: function(data) {
    return Funky.api.put('/clients/' + data.id, data)
      .then(function() {
        Funky.Toast.success('Client updated');
        refreshTable();
      })
      .catch(function(err) {
        // Manual error handling
        if (err.response && err.response.validation) {
          Object.keys(err.response.validation).forEach(function(field) {
            editor.setError(field, err.response.validation[field]);
          });
        }
      });
  },
  onChange: function(editor) {
    var data = editor.getValue();
    updatePreview(data);
  }
});
```

### After (Funky.Form)

```javascript
Funky.FormModal.show({
  title: 'Edit Client',
  useNativeForm: true,
  schemaPath: 'UpdateClient',
  mode: 'edit',
  data: existingClientData,
  onSubmit: function(data) {
    return Funky.api.put('/clients/' + data.id, data);
    // Errors automatically set on form via Promise rejection
  },
  onSuccess: function() {
    Funky.Toast.success('Client updated');
    refreshTable();
  },
  onError: function(detail) {
    // Errors auto-displayed on form fields
    console.log('Validation errors:', detail.errors);
  },
  onChange: function(detail) {
    updatePreview(detail.data);
  }
});
```

---

## Testing Migration

1. **Enable native form** on a single, non-critical form
2. **Test all interactions**: create, edit, validation, submit
3. **Verify styling** matches your application theme
4. **Check accessibility**: keyboard navigation, screen readers
5. **Monitor for errors** in browser console
6. **Rollback if needed** by removing `useNativeForm: true`

---

## Getting Help

- [Funky.Form Documentation](form.md)
- [Field Types Reference](form.md#field-types)
- [Validation System](form.md#validation)
- [Layout Options](form.md#layout-options)
