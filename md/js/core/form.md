# Funky.Form

Native form component with schema-agnostic field rendering, validation, and LiveBinding support.

## Features

- **Schema Agnostic** - Native schema format, OpenAPI/JSON Schema via adapter, or simple field arrays
- **LiveBinding Compatible** - Implements Bindable interface (`setData`/`getData`)
- **Extensible Fields** - Built-in types + custom field registration
- **Layout System** - Linear, sections, columns, grid, fieldsets, tabs
- **Field Dependencies** - Show/hide fields based on other field values
- **Async Validation** - Built-in validators + custom async validators
- **No jQuery** - Pure vanilla JavaScript

---

## Quick Start

### Basic Form

```javascript
var form = Funky.Form.create('#my-container', {
  schema: {
    fields: {
      name: { type: 'text', label: 'Name', required: true },
      email: { type: 'email', label: 'Email', required: true },
      role: {
        type: 'select',
        label: 'Role',
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'user', label: 'User' }
        ]
      }
    }
  },
  data: { name: 'John Doe' },
  onSubmit: function(data) {
    console.log('Form submitted:', data);
  }
});
```

### With OpenAPI Schema

```javascript
var form = Funky.Form.create('#my-container', {
  schemaPath: 'CreateUser',  // Loaded via Funky.Schema
  onSubmit: function(data) {
    return fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
});
```

### Simple Field Array

```javascript
var form = Funky.Form.create('#container', {
  fields: [
    { name: 'username', type: 'text', label: 'Username', required: true },
    { name: 'password', type: 'password', label: 'Password', required: true },
    { name: 'remember', type: 'checkbox', label: 'Remember me' }
  ]
});
```

---

## API Reference

### Factory Methods

#### `Funky.Form.create(container, options)`

Create a new form instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| container | string\|Element | Container selector or element |
| options | Object | Form configuration |

**Returns:** `FormInstance` (or `Promise<FormInstance>` if using `schemaPath`)

```javascript
// Synchronous (native schema)
var form = Funky.Form.create('#container', { schema: {...} });

// Asynchronous (OpenAPI schema)
Funky.Form.create('#container', { schemaPath: 'CreateUser' })
  .then(function(form) {
    console.log('Form ready');
  });
```

#### `Funky.Form.getInstance(id)`

Get existing form instance by ID or container.

```javascript
var form = Funky.Form.getInstance('my-form-id');
var form = Funky.Form.getInstance('#container');
var form = Funky.Form.getInstance(containerElement);
```

#### `Funky.Form.get(id)`

Alias for `getInstance`.

#### `Funky.Form.setData(id, data)`

Set data on form instance.

```javascript
Funky.Form.setData('my-form', { name: 'Jane Doe' });
```

#### `Funky.Form.getData(id)`

Get data from form instance.

```javascript
var data = Funky.Form.getData('my-form');
```

#### `Funky.Form.destroy(id)`

Destroy form instance.

```javascript
Funky.Form.destroy('my-form');
```

#### `Funky.Form.destroyAll()`

Destroy all form instances.

---

### Instance Methods

#### Data Operations (Bindable Interface)

| Method | Description |
|--------|-------------|
| `setData(data)` | Set multiple field values |
| `getData()` | Get all field values as object |
| `addData(key, value)` | Set single field value |
| `removeData(key)` | Clear field value |

```javascript
// Set multiple values
form.setData({ name: 'John', email: 'john@example.com' });

// Get all values
var data = form.getData();
// { name: 'John', email: 'john@example.com' }

// Set single value
form.addData('name', 'Jane');

// Clear value
form.removeData('email');
```

#### Field Operations

| Method | Description |
|--------|-------------|
| `setFieldValue(name, value)` | Set single field value |
| `getFieldValue(name)` | Get single field value |
| `getField(name)` | Get field instance |
| `showField(name)` | Show hidden field |
| `hideField(name)` | Hide field |
| `enableField(name)` | Enable disabled field |
| `disableField(name)` | Disable field |

```javascript
form.setFieldValue('name', 'John');
var name = form.getFieldValue('name');

form.hideField('advanced_options');
form.showField('advanced_options');

form.disableField('submit_date');
form.enableField('submit_date');
```

#### Validation

| Method | Description |
|--------|-------------|
| `validate()` | Validate all fields, returns `{ valid, errors }` |
| `validateField(name)` | Validate single field |
| `validateAsync()` | Async validation, returns Promise |
| `validateFieldAsync(name)` | Async validation for single field |
| `setErrors(errors)` | Set server-side errors |
| `setFieldError(name, error)` | Set error on field |
| `clearFieldError(name)` | Clear field error |
| `clearErrors()` | Clear all errors |

```javascript
// Validate all
var result = form.validate();
if (!result.valid) {
  console.log(result.errors);
  // { email: ['Email is required'], age: ['Must be at least 18'] }
}

// Async validation (for remote validators)
form.validateAsync().then(function(result) {
  if (result.valid) {
    form.submit();
  }
});

// Server-side errors
form.setErrors({
  email: ['Email already exists'],
  username: ['Username taken']
});

// Single field error
form.setFieldError('email', 'Invalid format');
form.clearFieldError('email');
```

#### Section Operations

| Method | Description |
|--------|-------------|
| `expandSection(sectionId)` | Expand a collapsed section |
| `collapseSection(sectionId)` | Collapse an expanded section |

```javascript
form.expandSection('advanced');
form.collapseSection('basic');
```

#### Lifecycle

| Method | Description |
|--------|-------------|
| `submit()` | Trigger form submission |
| `reset()` | Reset to initial values |
| `destroy()` | Cleanup and remove form |

```javascript
form.submit();  // Validates and calls onSubmit
form.reset();   // Restores initial data
form.destroy(); // Removes form and cleanup
```

---

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | auto | Form instance ID |
| `schema` | object | null | Native schema definition |
| `schemaPath` | string | null | OpenAPI schema path (async) |
| `fields` | array | null | Simple field array |
| `data` | object | `{}` | Initial form data |
| `mode` | string | `'create'` | Form mode: `create` / `edit` / `view` |
| `validateOnChange` | boolean | `true` | Validate on field change |
| `validateOnBlur` | boolean | `true` | Validate on field blur |
| `showErrorsInline` | boolean | `true` | Show errors below fields |
| `submitOnEnter` | boolean | `false` | Submit on Enter key |
| `disabled` | boolean | `false` | Disable all fields |
| `readonly` | boolean | `false` | Make all fields readonly |
| `messages` | object | `{}` | Custom validation messages |

---

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onChange` | `({ field, value, data })` | Field value changed |
| `onSubmit` | `(data)` | Form submitted (return Promise for async) |
| `onError` | `({ errors })` | Validation error occurred |
| `onReset` | `({ form })` | Form reset |
| `onInit` | `({ form })` | Form initialized |

```javascript
Funky.Form.create('#container', {
  schema: {...},
  onChange: function(detail) {
    console.log('Field changed:', detail.field, detail.value);
  },
  onSubmit: function(data) {
    // Sync
    saveData(data);

    // Or async - return Promise
    return fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }).then(function(res) {
      if (!res.ok) {
        // Server errors are set on form
        return res.json().then(function(err) {
          throw { errors: err.validation };
        });
      }
    });
  },
  onError: function(detail) {
    console.log('Validation errors:', detail.errors);
  }
});
```

---

### Events

Events are emitted on the container element and via `Funky.Events`/`Funky.PubSub`.

| Event | Detail | Description |
|-------|--------|-------------|
| `funky-form:init` | `{ form }` | Form initialized |
| `funky-form:change` | `{ field, value, data }` | Field changed |
| `funky-form:submit` | `{ data }` | Form submitted |
| `funky-form:validate` | `{ valid, errors }` | Validation complete |
| `funky-form:error` | `{ errors }` | Validation error |
| `funky-form:reset` | `{ form }` | Form reset |
| `funky-form:destroy` | `{ form }` | Form destroyed |
| `funky-form:section:toggle` | `{ sectionId, collapsed }` | Section toggled |
| `funky-form:tab:change` | `{ tabId }` | Tab changed |

```javascript
document.getElementById('container').addEventListener('funky-form:change', function(e) {
  console.log('Field changed:', e.detail.field);
});

// Via PubSub
Funky.PubSub.subscribe('form:change', function(detail) {
  console.log('Form change:', detail);
});
```

---

## Field Types

### Basic Fields

| Type | Description | Renders As |
|------|-------------|------------|
| `text` | Single-line text input | `<input type="text">` |
| `email` | Email input with validation | `<input type="email">` |
| `password` | Password input | `<input type="password">` |
| `tel` | Telephone input | `<input type="tel">` |
| `url` | URL input with validation | `<input type="url">` |
| `number` | Numeric input | `<input type="number">` |
| `integer` | Whole number input | `<input type="number" step="1">` |
| `textarea` | Multi-line text | `<textarea>` |
| `checkbox` | Boolean checkbox | `<input type="checkbox">` |
| `boolean` | Alias for checkbox | `<input type="checkbox">` |
| `radio` | Radio button group | Radio group |
| `select` | Dropdown select | `<select>` |
| `hidden` | Hidden input | `<input type="hidden">` |

### Advanced Fields

| Type | Description | Integration |
|------|-------------|-------------|
| `combobox` | Searchable select with remote | Funky.ComboBox (falls back to select) |
| `date` | Date picker | Funky.DatePicker (falls back to native) |
| `datetime` | Date + time picker | Funky.DatePicker (falls back to native) |
| `time` | Time picker | Native `<input type="time">` |
| `file` | File upload with drag & drop | Custom implementation |
| `range` / `slider` | Range slider with value display | Native `<input type="range">` |
| `color` | Color picker with hex display | Native `<input type="color">` |
| `search` | Search input with clear button | Custom implementation |
| `currency` / `money` | Formatted currency input | Custom with symbols |
| `phone` | Phone with country code | Custom with formatting |
| `tags` | Multi-value tag input | Custom tag manager |
| `rating` | Star rating (1-5 or custom) | Custom star picker |
| `signature` | Signature capture | Funky.Signature |
| `code` | Code editor | Funky.CodePreview |

### Field Configuration

```javascript
{
  // Required
  type: 'text',           // Field type

  // Display
  label: 'Field Label',   // Label text (false to hide)
  help: 'Help text',      // Help/description below field
  placeholder: '',        // Placeholder text

  // Validation
  required: false,        // Is required
  minLength: null,        // Min string length
  maxLength: null,        // Max string length
  min: null,              // Min numeric value
  max: null,              // Max numeric value
  pattern: null,          // Regex pattern
  validators: [],         // Custom validators array

  // Options (select/radio/combobox)
  options: [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B', disabled: true }
  ],

  // Remote data (combobox)
  remote: {
    url: '/api/search',
    searchParam: 'q',
    valueField: 'id',
    labelField: 'name'
  },

  // Dependencies
  dependsOn: {
    field: 'other_field',
    equals: 'some_value'
  },

  // State
  defaultValue: null,
  disabled: false,
  readonly: false,
  visible: true
}
```

### Custom Field Types

Register custom field types by extending `BaseField`:

```javascript
// Define custom field class
function RatingField(config, form) {
  Funky.Form.BaseField.call(this, config, form);
  this.maxStars = config.maxStars || 5;
}
RatingField.prototype = Object.create(Funky.Form.BaseField.prototype);
RatingField.prototype.constructor = RatingField;

RatingField.prototype._renderInput = function() {
  var container = this._createElement('div', {
    className: 'rating-stars'
  });
  // ... render stars
  return container;
};

// Register with FieldRegistry
Funky.Form.FieldRegistry.register('rating', {
  class: RatingField,
  defaults: { maxStars: 5 }
});

// Use in schema
{
  fields: {
    rating: { type: 'rating', label: 'Your Rating', maxStars: 10 }
  }
}
```

---

## Native Schema Format

```javascript
{
  fields: {
    fieldName: {
      type: 'text',
      label: 'Field Label',
      // ... field configuration
    }
  },

  fieldOrder: ['field1', 'field2'],  // Optional explicit order

  layout: {
    type: 'sections',  // or 'columns', 'grid', 'fieldsets', 'tabs'
    // ... layout configuration
  }
}
```

---

## Layout Options

### Linear (Default)

Fields rendered in order, one per row.

```javascript
{
  fields: { name: {...}, email: {...} }
  // No layout property = linear
}
```

### Sections

Collapsible groups of fields.

```javascript
layout: {
  type: 'sections',
  sections: [
    {
      id: 'basic',
      title: 'Basic Info',
      icon: 'fa-user',
      collapsed: false,
      collapsible: true,
      fields: ['name', 'email']
    },
    {
      id: 'advanced',
      title: 'Advanced',
      collapsed: true,
      fields: ['api_key', 'timeout'],
      layout: {
        type: 'columns',
        columns: 2
      }
    }
  ]
}
```

### Columns

CSS grid multi-column layout.

```javascript
layout: {
  type: 'columns',
  columns: 2,  // 2, 3, or 4
  fields: ['first_name', 'last_name', 'email', 'phone']
}
```

### Grid

Explicit rows with custom column widths (Bootstrap 12-column grid).

```javascript
layout: {
  type: 'grid',
  rows: [
    { fields: ['first_name', 'last_name'] },  // 50% each
    { fields: ['city', 'state', 'zip'], widths: [6, 3, 3] }  // Custom widths
  ]
}
```

### Fieldsets

HTML fieldset groups with legends.

```javascript
layout: {
  type: 'fieldsets',
  fieldsets: [
    { legend: 'Contact Info', fields: ['email', 'phone'] },
    { legend: 'Address', fields: ['street', 'city', 'zip'] }
  ]
}
```

### Tabs

Tabbed layout (integrates with Funky.Tabbed if available).

```javascript
layout: {
  type: 'tabs',
  tabs: [
    { id: 'general', label: 'General', icon: 'fa-info', fields: ['name', 'email'] },
    { id: 'security', label: 'Security', icon: 'fa-lock', fields: ['password', '2fa'] }
  ]
}
```

---

## Field Dependencies

Show/hide fields based on other field values.

```javascript
{
  fields: {
    has_manager: {
      type: 'checkbox',
      label: 'Has Manager'
    },
    manager_id: {
      type: 'combobox',
      label: 'Manager',
      dependsOn: {
        field: 'has_manager',
        truthy: true
      }
    },
    client_type: {
      type: 'select',
      label: 'Type',
      options: ['individual', 'corporate']
    },
    company_name: {
      type: 'text',
      label: 'Company',
      dependsOn: {
        field: 'client_type',
        equals: 'corporate'
      }
    }
  }
}
```

### Dependency Operators

| Operator | Description |
|----------|-------------|
| `equals` | Value equals specified value |
| `notEquals` | Value does not equal |
| `in` | Value is in array |
| `notIn` | Value is not in array |
| `truthy` | Value is truthy |
| `falsy` | Value is falsy |
| `matches` | Value matches regex |
| `fn` | Custom function `(value, data) => boolean` |

```javascript
dependsOn: {
  field: 'status',
  in: ['active', 'pending']
}

dependsOn: {
  field: 'country',
  notEquals: 'US'
}

dependsOn: {
  field: 'email',
  matches: /@company\\.com$/
}

dependsOn: {
  field: 'age',
  fn: function(value, data) {
    return value >= 18 && data.country === 'US';
  }
}
```

---

## Validation

### Built-in Validators

| Validator | Options | Description |
|-----------|---------|-------------|
| `required` | boolean | Field must have value |
| `minLength` | number | Min string length |
| `maxLength` | number | Max string length |
| `min` | number | Min numeric value |
| `max` | number | Max numeric value |
| `pattern` | string/regex | Regex pattern |
| `email` | boolean | Email format |
| `url` | boolean | URL format |
| `numeric` | boolean | Must be number |
| `integer` | boolean | Must be whole number |
| `alpha` | boolean | Letters only |
| `alphanumeric` | boolean | Letters and numbers |
| `matches` | string | Match another field |
| `different` | string | Different from another field |
| `in` | array | Value in allowed list |
| `notIn` | array | Value not in list |
| `between` | `{min, max}` | Number in range |
| `length` | number | Exact length |
| `phone` | boolean | Phone number format |
| `creditCard` | boolean | Credit card (Luhn) |
| `fileSize` | number | Max file size in bytes |
| `fileType` | array | Allowed file types |
| `dateRange` | `{min, max}` | Date range |

### Custom Validators

```javascript
// Register global validator
Funky.Validator.register('zipCode', function(value, options, context) {
  if (value && !/^\\d{5}(-\\d{4})?$/.test(value)) {
    return 'Please enter a valid ZIP code';
  }
  return true;
});

// Use in field
{
  zip: {
    type: 'text',
    label: 'ZIP Code',
    validators: ['zipCode']
  }
}
```

### Inline Validators

```javascript
{
  username: {
    type: 'text',
    validators: [
      { name: 'minLength', options: 3 },
      { name: 'pattern', options: '^[a-z0-9_]+$' }
    ]
  }
}
```

### Async Validation

```javascript
{
  email: {
    type: 'email',
    validators: [
      function(value, context) {
        return fetch('/api/check-email?email=' + encodeURIComponent(value))
          .then(function(res) { return res.json(); })
          .then(function(data) {
            return data.available ? true : 'Email already registered';
          });
      }
    ]
  }
}
```

### Custom Messages

```javascript
{
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'We need your email address',
      email: 'That doesn\\'t look like a valid email'
    }
  }
}

// Or form-level
Funky.Form.create('#container', {
  schema: {...},
  messages: {
    required: '{label} cannot be empty',
    minLength: '{label} must be at least {value} characters'
  }
});
```

---

## FormModal Integration

Use Funky.Form inside FormModal:

```javascript
Funky.FormModal.show({
  title: 'Create User',
  useNativeForm: true,  // Use Funky.Form instead of JSONEditor
  schema: {
    fields: {
      name: { type: 'text', label: 'Name', required: true },
      email: { type: 'email', label: 'Email', required: true }
    }
  },
  onSubmit: function(data) {
    return fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  onSuccess: function() {
    Funky.Toast.success('User created');
  }
});
```

---

## LiveBinding Integration

Forms are automatically registered with LiveBinding:

```html
<div id="user-form"
     data-bind="form"
     data-bind-source="User"
     data-bind-key="currentUser">
</div>
```

```javascript
// Form created automatically from binding
Funky.LiveBinding.update('User', 'currentUser', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

---

## CSS Customization

Override CSS custom properties:

```css
.funky-form {
  --form-gap: 1.5rem;
  --form-field-gap: 1rem;
  --form-label-gap: 0.5rem;
  --form-label-color: #333;
  --form-label-font-size: 0.875rem;
  --form-label-font-weight: 500;

  --form-input-height: 42px;
  --form-input-padding: 0.625rem 0.875rem;
  --form-input-bg: #fff;
  --form-input-border: 1px solid #ddd;
  --form-input-border-radius: 0.375rem;

  --form-focus-color: #007bff;
  --form-focus-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);

  --form-error-color: #dc3545;
  --form-success-color: #28a745;
  --form-warning-color: #ffc107;

  --form-required-color: #dc3545;
  --form-help-color: #6c757d;
}
```

### Dark Theme

```css
[data-theme="dark"] .funky-form {
  --form-label-color: #e0e0e0;
  --form-input-bg: #2d2d2d;
  --form-input-border: 1px solid #444;
  --form-help-color: #999;
}
```

### Density Variants

```css
.funky-form--compact {
  --form-gap: 0.75rem;
  --form-input-height: 32px;
  --form-input-padding: 0.375rem 0.625rem;
}

.funky-form--spacious {
  --form-gap: 2rem;
  --form-input-height: 48px;
}
```

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful fallback for advanced fields when dependencies unavailable
- Full accessibility support (ARIA, keyboard navigation)

---

## Advanced Field Types Reference

### Time Field

Time-only input for selecting hours and minutes.

```javascript
{
  appointment_time: {
    type: 'time',
    label: 'Appointment Time',
    min: '09:00',
    max: '17:00',
    step: 900  // 15 minutes in seconds
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | string | null | Minimum time (HH:MM) |
| `max` | string | null | Maximum time (HH:MM) |
| `step` | number | 60 | Step in seconds |

---

### Range / Slider Field

Range slider with value display.

```javascript
{
  volume: {
    type: 'range',
    label: 'Volume',
    min: 0,
    max: 100,
    step: 5,
    showValue: true,
    showMinMax: true,
    suffix: '%'
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | number | 0 | Minimum value |
| `max` | number | 100 | Maximum value |
| `step` | number | 1 | Step increment |
| `showValue` | boolean | true | Show current value |
| `showMinMax` | boolean | true | Show min/max labels |
| `prefix` | string | null | Value prefix (e.g., '$') |
| `suffix` | string | null | Value suffix (e.g., '%') |
| `formatValue` | function | null | Custom value formatter |

---

### Color Field

Color picker with hex value display.

```javascript
{
  theme_color: {
    type: 'color',
    label: 'Theme Color',
    showHex: true,
    swatches: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showHex` | boolean | true | Show hex value |
| `swatches` | array | null | Preset color swatches |

---

### Search Field

Search input with icon and clear button.

```javascript
{
  query: {
    type: 'search',
    label: 'Search',
    placeholder: 'Search users...'
  }
}
```

Emits additional events:
- `form:search` - On input change with `{ field, query }`
- `form:search:submit` - On Enter key with `{ field, query }`

---

### Currency / Money Field

Formatted currency input with symbol and code.

```javascript
{
  price: {
    type: 'currency',
    label: 'Price',
    currency: 'USD',
    decimals: 2,
    min: 0,
    max: 10000,
    showCurrencyCode: true
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `currency` | string | 'USD' | Currency code (USD, EUR, GBP, etc.) |
| `symbol` | string | auto | Override currency symbol |
| `decimals` | number | 2 | Decimal places |
| `locale` | string | 'en-US' | Locale for formatting |
| `showCurrencyCode` | boolean | true | Show currency code suffix |
| `min` | number | null | Minimum amount |
| `max` | number | null | Maximum amount |

Supported currencies: USD ($), EUR (€), GBP (£), JPY (¥), CNY (¥), INR (₹), KRW (₩), RUB (₽), BRL (R$), AUD (A$)

---

### Phone Field

Phone input with country code selector.

```javascript
{
  mobile: {
    type: 'phone',
    label: 'Mobile Number',
    defaultCountryCode: '+1',
    showCountryCode: true,
    countries: [
      { code: '+1', name: 'US', flag: '🇺🇸' },
      { code: '+44', name: 'UK', flag: '🇬🇧' }
    ]
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showCountryCode` | boolean | true | Show country dropdown |
| `defaultCountryCode` | string | '+1' | Default country code |
| `countries` | array | built-in | Available countries |
| `placeholder` | string | '(555) 123-4567' | Placeholder text |

Phone numbers are auto-formatted as `(XXX) XXX-XXXX`.
`getValue()` returns full number with country code: `+1 (555) 123-4567`

---

### Tags Field

Multi-value tag input with suggestions.

```javascript
{
  keywords: {
    type: 'tags',
    label: 'Keywords',
    maxTags: 5,
    minTags: 1,
    suggestions: ['JavaScript', 'Python', 'Go', 'Rust'],
    placeholder: 'Type and press Enter'
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTags` | number | 10 | Maximum tags allowed |
| `minTags` | number | null | Minimum tags required |
| `suggestions` | array | null | Autocomplete suggestions |
| `placeholder` | string | 'Type and press Enter' | Input placeholder |

- Type and press **Enter** or **comma** to add tag
- Press **Backspace** on empty input to remove last tag
- Duplicate tags are ignored
- `getValue()` returns array: `['tag1', 'tag2']`
- `setValue()` accepts array or comma-separated string

---

### Rating Field

Star rating input.

```javascript
{
  satisfaction: {
    type: 'rating',
    label: 'Satisfaction',
    max: 5,
    showValue: true,
    required: true
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | number | 5 | Maximum rating (number of stars) |
| `showValue` | boolean | true | Show "3/5" value label |
| `allowHalf` | boolean | false | Allow half-star ratings |

- Click stars to set rating
- Hover to preview rating
- Keyboard: Arrow left/right to navigate
- `getValue()` returns number

---

### Signature Field

Signature capture using Funky.Signature component.

```javascript
{
  signature: {
    type: 'signature',
    label: 'Signature',
    required: true,
    width: 400,
    height: 150,
    penColor: '#000000',
    backgroundColor: '#ffffff',
    showTypedOption: true
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | number | 400 | Canvas width |
| `height` | number | 150 | Canvas height |
| `penColor` | string | '#000000' | Drawing color |
| `penWidth` | number | 2 | Line width |
| `backgroundColor` | string | '#ffffff' | Canvas background |
| `showTypedOption` | boolean | true | Allow typed signature |

- `getValue()` returns data URL: `data:image/png;base64,...`
- Clear button to reset
- Requires `Funky.Signature` component

---

### Code Field

Code editor using Funky.CodePreview component.

```javascript
{
  snippet: {
    type: 'code',
    label: 'Code Snippet',
    language: 'javascript',
    lineNumbers: true,
    maxHeight: 300,
    defaultValue: 'function hello() {\n  return "Hello World";\n}'
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | string | 'javascript' | Syntax highlighting |
| `lineNumbers` | boolean | true | Show line numbers |
| `showCopy` | boolean | true | Show copy button |
| `showLanguage` | boolean | true | Show language label |
| `maxHeight` | number | 300 | Max height in pixels |
| `wrapLines` | boolean | false | Wrap long lines |
| `tabSize` | number | 2 | Tab size in spaces |
| `minLength` | number | null | Minimum code length |

- Full syntax highlighting
- Tab indentation
- `getValue()` returns code string
- Requires `Funky.CodePreview` component

---

## See Also

- [FormModal](../components/form-modal.md) - Modal form dialog
- [Validator](validator.md) - Validation engine
- [ComboBox](../components/combobox.md) - Searchable select
- [DatePicker](../components/date-picker.md) - Date picker
- [Signature](../components/signature.md) - Signature component
- [CodePreview](../components/code-preview.md) - Code preview component
- [LiveBinding](live-binding.md) - Data binding system
