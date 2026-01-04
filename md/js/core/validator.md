# Funky.Validator

Generic validation engine for forms, tables, API data, and any data validation needs.

## Overview

`Funky.Validator` provides:
- Reusable validation system (not form-specific)
- Built-in validators for common cases
- Custom validator registration
- Async validation support
- Contextual error messages with interpolation
- Field definition rule extraction

## Quick Start

```javascript
// Validate a single value
var result = Funky.Validator.validate('test@example.com', {
  required: true,
  email: true
});
// { valid: true, errors: [] }

// Validate with context
var result = Funky.Validator.validate('abc', {
  required: true,
  minLength: 5
}, {
  field: { label: 'Username' }
});
// { valid: false, errors: ['Username must be at least 5 characters'] }

// Async validation
Funky.Validator.validateAsync(value, {
  required: true,
  async: checkUsernameAvailable
}).then(function(result) {
  console.log(result.valid, result.errors);
});
```

## API Reference

### Module Methods

#### `Funky.Validator.register(name, fn)`

Register a custom validator.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Validator name |
| fn | function | Yes | Validator function |

**Validator Function Signature:**
```javascript
function(value, ruleValue, context) {
  // Return true if valid
  // Return error message string if invalid
  // Return Promise for async validation
}
```

---

#### `Funky.Validator.unregister(name)`

Remove a registered validator.

---

#### `Funky.Validator.get(name)`

Get validator function by name.

**Returns:** `function` or `null`

---

#### `Funky.Validator.has(name)`

Check if validator exists.

**Returns:** `boolean`

---

#### `Funky.Validator.list()`

**Returns:** `string[]` - All registered validator names

---

#### `Funky.Validator.validate(value, rules, context)`

Validate a value synchronously.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | any | Yes | Value to validate |
| rules | object | Yes | Validation rules `{ ruleName: ruleValue }` |
| context | object | No | Context object |

**Returns:** `{ valid: boolean, errors: string[] }`

---

#### `Funky.Validator.validateAsync(value, rules, context)`

Validate a value with async support.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | any | Yes | Value to validate |
| rules | object | Yes | Validation rules |
| context | object | No | Context object |

**Returns:** `Promise<{ valid: boolean, errors: string[] }>`

---

#### `Funky.Validator.extractRules(fieldDef)`

Extract validation rules from a field definition.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fieldDef | object | Yes | Field definition object |

**Returns:** `object` - Rules object

---

#### `Funky.Validator.getMessage(ruleName, context)`

Get formatted error message for a rule.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ruleName | string | Yes | Rule name |
| context | object | No | Context with field, ruleValue, etc. |

**Returns:** `string` - Error message

---

## Built-in Validators

### String Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `required` | `true` | Value must not be empty |
| `minLength` | `number` | Minimum string length |
| `maxLength` | `number` | Maximum string length |
| `length` | `number` | Exact length |
| `pattern` | `string/RegExp` | Must match regex |
| `alpha` | `true` | Letters only |
| `alphanumeric` | `true` | Letters and numbers only |

### Number Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `numeric` | `true` | Must be a number |
| `integer` | `true` | Must be a whole number |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `between` | `[min, max]` | Value must be in range |

### Format Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `email` | `true` | Valid email format |
| `url` | `true` | Valid URL format |
| `phone` | `true` | Basic phone format |
| `creditCard` | `true` | Luhn algorithm check |

### Comparison Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `matches` | `fieldName` | Must match another field's value |
| `different` | `fieldName` | Must differ from another field |
| `in` | `array` | Value must be in array |
| `notIn` | `array` | Value must not be in array |

### Date Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `dateRange` | `{ min, max }` | Date must be in range |

**Date Range Options:**
- `min`: Minimum date (ISO string or `'today'`)
- `max`: Maximum date (ISO string or `'today'`)

### File Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `fileSize` | `bytes` | Maximum file size |
| `fileType` | `array` | Allowed types (`.ext` or MIME) |

### Custom Validators

| Name | Rule Value | Description |
|------|------------|-------------|
| `custom` | `function` | Custom sync validator |
| `async` | `function/array` | Async validator(s) |

---

## Context Object

The context object provides information to validators:

```javascript
{
  field: {
    name: 'username',
    label: 'Username',
    type: 'text',
    // ... other field properties
  },
  data: {
    // All form/object data for cross-field validation
    username: 'john',
    email: 'john@example.com'
  },
  form: formInstance,  // Optional form reference
  ruleValue: 5         // Current rule value (set by getMessage)
}
```

---

## Rules Definition

```javascript
var rules = {
  required: true,
  minLength: 5,
  maxLength: 20,
  pattern: /^[a-z]+$/,
  email: true,
  custom: function(value, opts, context) {
    return value !== 'admin' || 'Username "admin" is reserved';
  },
  async: [
    asyncValidator,
    { validator: checkUnique, options: { endpoint: '/api/check' } }
  ],
  _messages: {
    required: 'Please provide a {label}',
    minLength: '{label} is too short'
  }
};
```

---

## Message Interpolation

Error messages support placeholders:

| Placeholder | Value |
|-------------|-------|
| `{label}` | Field label or name |
| `{name}` | Field name |
| `{value}` | Rule value (e.g., minLength number) |

```javascript
// Custom message with interpolation
var rules = {
  minLength: 8,
  _messages: {
    minLength: '{label} must have at least {value} characters'
  }
};
// "Password must have at least 8 characters"
```

## Examples

### Basic Validation

```javascript
// Email validation
var result = Funky.Validator.validate('invalid-email', { email: true });
// { valid: false, errors: ['Please enter a valid email address'] }

// Number range
var result = Funky.Validator.validate(150, {
  numeric: true,
  min: 0,
  max: 100
});
// { valid: false, errors: ['This field must be no more than 100'] }
```

### Custom Validator

```javascript
// Register custom validator
Funky.Validator.register('noSpaces', function(value, options, context) {
  if (value && value.indexOf(' ') !== -1) {
    var label = context.field ? context.field.label : 'Value';
    return label + ' cannot contain spaces';
  }
  return true;
});

// Use it
var result = Funky.Validator.validate('hello world', {
  noSpaces: true
});
```

### Async Validation

```javascript
// Check if username is available
function checkUsername(value, options, context) {
  return fetch('/api/users/check?username=' + value)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      return data.available ? true : 'Username is already taken';
    });
}

// Validate with async
Funky.Validator.validateAsync('johndoe', {
  required: true,
  minLength: 3,
  async: checkUsername
}).then(function(result) {
  if (!result.valid) {
    showErrors(result.errors);
  }
});
```

### Password Confirmation

```javascript
var result = Funky.Validator.validate('password456', {
  required: true,
  minLength: 8,
  matches: 'password'
}, {
  field: { label: 'Confirm Password' },
  data: {
    password: 'password123',
    confirmPassword: 'password456'
  }
});
// { valid: false, errors: ['Confirm Password must match password'] }
```

### File Validation

```javascript
var file = document.getElementById('upload').files[0];

var result = Funky.Validator.validate(file, {
  required: true,
  fileSize: 5 * 1024 * 1024,  // 5MB
  fileType: ['.pdf', '.doc', '.docx', 'application/pdf']
});
```

### Extract Rules from Field Definition

```javascript
var fieldDef = {
  name: 'email',
  type: 'email',
  label: 'Email Address',
  required: true,
  maxLength: 255
};

var rules = Funky.Validator.extractRules(fieldDef);
// { required: true, maxLength: 255, email: true }
```

### Credit Card Validation

```javascript
Funky.Validator.register('creditCard', function(value, options, context) {
  if (!value) return true;

  // Remove spaces and dashes
  var num = value.replace(/[\s-]/g, '');

  // Luhn algorithm
  var sum = 0;
  var isEven = false;

  for (var i = num.length - 1; i >= 0; i--) {
    var digit = parseInt(num[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0 || 'Invalid credit card number';
});
```

## Dependencies

- **Required:** None (fully self-contained)
