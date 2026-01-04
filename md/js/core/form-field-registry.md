# Funky.Form.FieldRegistry

Extensible field type registration system for Funky.Form with BaseField abstract class.

## Overview

`Funky.Form.FieldRegistry` provides:
- Pluggable field type system
- BaseField abstract class for custom fields
- Built-in field types (text, email, number, select, etc.)
- Consistent validation and state management
- ARIA accessibility support
- DOM element lifecycle management

## Quick Start

```javascript
// Register a custom field type
Funky.Form.FieldRegistry.register('currency', {
  extends: 'number',
  render: function() {
    // Custom rendering
  },
  format: function(value) {
    return '$' + parseFloat(value).toFixed(2);
  }
});

// Use in form schema
var form = Funky.Form.create('#myForm', {
  fields: {
    price: { type: 'currency', label: 'Price' },
    name: { type: 'text', label: 'Name', required: true }
  }
});
```

## API Reference

### Registry Methods

#### `Funky.Form.FieldRegistry.register(type, definition)`

Register a new field type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Field type name |
| definition | object/class | Yes | Field definition or class extending BaseField |

---

#### `Funky.Form.FieldRegistry.get(type)`

Get a registered field type definition.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Field type name |

**Returns:** Field definition or `undefined`

---

#### `Funky.Form.FieldRegistry.has(type)`

Check if a field type is registered.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Field type name |

**Returns:** `boolean`

---

#### `Funky.Form.FieldRegistry.create(type, config, form)`

Create a field instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Field type name |
| config | object | Yes | Field configuration |
| form | Form | Yes | Parent form instance |

**Returns:** Field instance

---

#### `Funky.Form.FieldRegistry.types()`

Get list of all registered field types.

**Returns:** `string[]` - Array of type names

---

#### `Funky.Form.FieldRegistry.unregister(type)`

Remove a registered field type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Field type name |

---

#### `Funky.Form.FieldRegistry.clear()`

Clear all registered field types.

---

#### `Funky.Form.FieldRegistry.BaseField`

Access the BaseField class for extending.

---

## Built-in Field Types

| Type | Description | Input Type |
|------|-------------|------------|
| `text` | Basic text input | `<input type="text">` |
| `email` | Email with validation | `<input type="email">` |
| `password` | Password input | `<input type="password">` |
| `tel` | Phone number | `<input type="tel">` |
| `url` | URL input | `<input type="url">` |
| `number` | Numeric input | `<input type="number">` |
| `integer` | Integer only | `<input type="number">` |
| `textarea` | Multi-line text | `<textarea>` |
| `checkbox` | Boolean toggle | `<input type="checkbox">` |
| `select` | Dropdown list | `<select>` |
| `hidden` | Hidden field | `<input type="hidden">` |
| `radio` | Radio button group | `<input type="radio">` |
| `combobox` | Searchable dropdown | Funky.ComboBox |
| `date` | Date picker | Funky.DatePicker |
| `datetime` | Date & time picker | Funky.DatePicker |
| `file` | File upload | `<input type="file">` |

---

## Field Configuration

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | Field name (required) |
| type | string | `'text'` | Field type |
| label | string | name | Display label |
| defaultValue | any | `null` | Initial value |
| required | boolean | `false` | Whether field is required |
| disabled | boolean | `false` | Whether field is disabled |
| readonly | boolean | `false` | Whether field is read-only |
| visible | boolean | `true` | Whether field is visible |
| placeholder | string | - | Input placeholder |
| help | string | - | Help text below field |
| maxLength | number | - | Maximum input length |
| minLength | number | - | Minimum input length |
| pattern | string | - | Regex pattern for validation |
| autocomplete | string | - | HTML autocomplete attribute |

**Type-Specific Options:**

| Type | Option | Description |
|------|--------|-------------|
| number/integer | min | Minimum value |
| number/integer | max | Maximum value |
| number/integer | step | Step increment |
| textarea | rows | Number of rows |
| select/radio | options | Array of `{ value, label }` |
| select | multiple | Allow multiple selection |
| combobox | remote | Remote data source config |
| date/datetime | format | Date format |
| file | accept | Accepted file types |
| file | multiple | Allow multiple files |

---

## BaseField Class

### Properties

| Property | Type | Description |
|----------|------|-------------|
| form | Form | Parent form instance |
| name | string | Field name |
| config | object | Field configuration |
| element | HTMLElement | Field wrapper element |
| inputElement | HTMLElement | Input element |
| errorElement | HTMLElement | Error display element |
| labelElement | HTMLElement | Label element |

### Methods

#### Rendering

##### `render()`
Render the field DOM structure.

**Returns:** `HTMLElement` - The field wrapper element

---

##### `_renderInput()`
Override in subclasses to render custom input.

**Returns:** `HTMLElement` - The input element

---

#### Value

##### `getValue()`
**Returns:** Current field value

---

##### `setValue(value, options)`
Set field value.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| value | any | Value to set |
| options | object | `{ silent: boolean }` - Skip change event |

---

##### `_parseValue(rawValue)`
Override to transform raw input value.

**Returns:** Parsed value

---

#### State

##### `show()`
Show the field.

---

##### `hide()`
Hide the field.

---

##### `isVisible()`
**Returns:** `boolean` - Whether field is visible

---

##### `enable()`
Enable the field.

---

##### `disable()`
Disable the field.

---

##### `isEnabled()`
**Returns:** `boolean` - Whether field is enabled

---

##### `isPristine()`
**Returns:** `boolean` - Whether field is unchanged

---

##### `isDirty()`
**Returns:** `boolean` - Whether field has been modified

---

##### `markPristine()`
Mark field as pristine (unchanged).

---

#### Validation

##### `validate()`
Validate the field.

**Returns:** `{ valid: boolean, errors: string[] }`

---

##### `showError(errors)`
Display error message(s).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| errors | string/string[] | Error message(s) |

---

##### `clearError()`
Clear displayed errors.

---

##### `isValid()`
**Returns:** `boolean` - Whether field is valid

---

#### Focus

##### `focus()`
Focus the field input.

---

##### `blur()`
Blur the field input.

---

#### Lifecycle

##### `destroy()`
Destroy field and clean up DOM.

---

##### `reset()`
Reset field to default value.

---

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `field:change` | `{ field, value }` | Field value changed |
| `field:blur` | `{ field, value }` | Field lost focus |
| `field:focus` | `{ field, value }` | Field gained focus |

## Examples

### Custom Field Type

```javascript
// Create a star rating field
function StarRatingField(config, form) {
  Funky.Form.FieldRegistry.BaseField.call(this, config, form);
  this._maxStars = config.maxStars || 5;
}

// Inherit from BaseField
StarRatingField.prototype = Object.create(
  Funky.Form.FieldRegistry.BaseField.prototype
);
StarRatingField.prototype.constructor = StarRatingField;

// Override _renderInput
StarRatingField.prototype._renderInput = function() {
  var self = this;
  var container = document.createElement('div');
  container.className = 'star-rating';

  for (var i = 1; i <= this._maxStars; i++) {
    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    star.dataset.value = i;
    star.innerHTML = '&#9733;';
    star.onclick = function() {
      self.setValue(parseInt(this.dataset.value));
    };
    container.appendChild(star);
  }

  return container;
};

// Override _updateInput
StarRatingField.prototype._updateInput = function() {
  var stars = this.inputElement.querySelectorAll('.star');
  stars.forEach(function(star, index) {
    star.classList.toggle('active', index < this._value);
  }, this);
};

// Register the field type
Funky.Form.FieldRegistry.register('star-rating', StarRatingField);

// Use it
var form = Funky.Form.create('#form', {
  fields: {
    rating: { type: 'star-rating', label: 'Rating', maxStars: 5 }
  }
});
```

### Extending Built-in Type

```javascript
// Phone field with masking
Funky.Form.FieldRegistry.register('phone', {
  extends: 'tel',
  _renderInput: function() {
    var input = Funky.Form.FieldRegistry.BaseField.prototype._renderInput.call(this);

    // Apply mask
    if (Funky.Mask) {
      new Funky.Mask(input, { pattern: 'phone' });
    }

    return input;
  }
});
```

### Field with Custom Validation

```javascript
Funky.Form.FieldRegistry.register('username', {
  extends: 'text',
  validate: function() {
    var result = Funky.Form.FieldRegistry.BaseField.prototype.validate.call(this);

    // Add custom validation
    var value = this.getValue();
    if (value && !/^[a-z0-9_]+$/.test(value)) {
      result.valid = false;
      result.errors.push('Username can only contain lowercase letters, numbers, and underscores');
    }

    return result;
  }
});
```

## Accessibility

- Labels properly associated via `for` attribute
- Required fields marked with `aria-required`
- Error messages linked via `aria-describedby`
- Invalid state indicated with `aria-invalid`
- Help text linked via `aria-describedby`
- Error containers use `role="alert"` and `aria-live="polite"`

## Dependencies

- **Required:** None (Funky.Dom optional fallback)
- **Optional:** `Funky.Dom` (enhanced DOM manipulation), `Funky.ComboBox` (combobox type), `Funky.DatePicker` (date types), `Funky.Mask` (input masking)
