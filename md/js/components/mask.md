# Funky.Mask

Input masking for formatted data entry with real-time formatting and cursor management.

> See [Component Base Interface](../core/component-interface.md) for standard API patterns.

## Overview

`Funky.Mask` provides input formatting with:
- Real-time pattern-based formatting
- Preset patterns for common formats (phone, credit card, date, etc.)
- Custom pattern definitions
- Full cursor position management
- Paste handling with format correction
- Case transformation
- Validation integration
- ARIA accessibility
- Declarative data attribute setup

## Pattern Characters

| Character | Matches | Description |
|-----------|---------|-------------|
| `9` | `[0-9]` | Any digit |
| `A` | `[A-Za-z]` | Any letter |
| `*` | `[A-Za-z0-9]` | Any alphanumeric |
| `X` | `.` | Any character |
| Other | Literal | Inserted automatically |

## Quick Start

```html
<!-- Declarative usage -->
<input type="tel" data-mask="phone" placeholder="(___) ___-____">
<input type="text" data-mask="(999) 999-9999">
<input type="text" data-mask="credit-card">
```

```javascript
// Programmatic usage
var mask = Funky.Mask.init('#phone', {
  pattern: 'phone'
});

// Get values
mask.getRaw();       // "5551234567"
mask.getFormatted(); // "(555) 123-4567"

// Custom pattern
var custom = Funky.Mask.init('#serial', {
  pattern: 'AAA-9999-****',
  transform: 'uppercase'
});
```

## API Reference

### Factory Methods

#### `Funky.Mask.init(element, options)`

Create a mask instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | string/Element | Yes | Input element or selector |
| options | object | No | Configuration options |

**Returns:** `MaskInstance`

---

### Static Methods

#### `Funky.Mask.init()`

Auto-initialize all elements with `data-mask` attribute (without arguments).

---

#### `Funky.Mask.get(element)`

Get mask instance for an element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | string\|Element | Yes | Input element or selector |

**Returns:** `MaskInstance` or `null`

---

#### `Funky.Mask.destroyAll()`

Destroy all mask instances on the page.

---

#### `Funky.Mask.registerPattern(name, config)`

Register a custom pattern for reuse.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Pattern name |
| config | string\|object | Yes | Pattern string or config object |

**Example:**
```javascript
// Simple pattern string
Funky.Mask.registerPattern('invoice', 'AAA-9999-****');

// Full config with validation
Funky.Mask.registerPattern('taxId', {
  pattern: '99-9999999',
  validate: 'ein',
  inputMode: 'numeric',
  autocomplete: 'off'
});
```

---

#### `Funky.Mask.registerValidator(name, fn)`

Register a custom validator function.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Validator name |
| fn | function | Yes | Validator function (raw) → { valid, error } |

**Example:**
```javascript
Funky.Mask.registerValidator('ein', function(raw) {
  if (raw.length !== 9) {
    return { valid: false, error: 'EIN must be 9 digits' };
  }
  return { valid: true, error: null };
});
```

---

#### `Funky.Mask.detectCardType(number)`

Detect credit card type from card number.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| number | string | Yes | Raw card number digits |

**Returns:** `string|null` - Card type: 'visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', or null

---

#### `Funky.Mask.format(raw, patternName)`

Format a value using a mask pattern without input binding.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| raw | string | Yes | Raw unformatted value |
| patternName | string | Yes | Pattern name or pattern string |

**Returns:** `string` - Formatted value

**Example:**
```javascript
Funky.Mask.format('5551234567', 'phone');
// Returns: '(555) 123-4567'
```

---

#### `Funky.Mask.redactValue(value, options)`

Redact a value for display (utility function).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | string | Yes | Value to redact |
| options | object | No | Redact options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| char | string | '•' | Redaction character |
| showFirst | number | 0 | Characters to show at start |
| showLast | number | 0 | Characters to show at end |
| pattern | string | null | Apply pattern formatting after redaction |

**Returns:** `string` - Redacted value

**Example:**
```javascript
Funky.Mask.redactValue('4242424242424242', { showLast: 4, char: '*' });
// Returns: '************4242'
```

---

### Static Properties

#### `Funky.Mask.PATTERNS`

Registry of built-in and custom patterns. Keys are pattern names.

---

#### `Funky.Mask.VALIDATORS`

Registry of built-in and custom validators. Keys are validator names.

---

#### `Funky.Mask.Instance`

Reference to the `MaskInstance` constructor for advanced usage.

---

#### `Funky.Mask.Redact`

Reference to the `RedactInstance` constructor for advanced usage.

---

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| pattern | string | `null` | Pattern string or preset name |
| placeholder | string | `'_'` | Placeholder character for unfilled positions |
| definitions | object | `null` | Custom character definitions (merged with defaults) |
| transform | string | `null` | `'uppercase'`, `'lowercase'`, or `null` |
| eager | boolean | `true` | Eagerly add literals as user types |
| showMask | boolean | `false` | Show placeholder mask in empty input |
| clearIncomplete | boolean | `false` | Clear value on blur if incomplete |
| validate | string | `null` | Validator name for additional validation |

---

### Built-in Patterns

| Name | Pattern | Example | Description |
|------|---------|---------|-------------|
| `phone` | `(999) 999-9999` | (555) 123-4567 | US phone number |
| `phone-intl` | `+9 (999) 999-9999` | +1 (555) 123-4567 | International phone |
| `credit-card` | `9999 9999 9999 9999` | 4242 4242 4242 4242 | Credit card |
| `cvv` | `999` or `9999` | 123 | Card CVV |
| `expiry` | `99/99` | 12/25 | Card expiry MM/YY |
| `date` | `99/99/9999` | 12/31/2024 | US date format |
| `date-iso` | `9999-99-99` | 2024-12-31 | ISO date format |
| `time` | `99:99` | 14:30 | 24-hour time |
| `time-12` | `99:99 AA` | 02:30 PM | 12-hour time |
| `ssn` | `999-99-9999` | 123-45-6789 | Social Security Number |
| `zip` | `99999` | 12345 | US ZIP code |
| `zip-plus4` | `99999-9999` | 12345-6789 | ZIP+4 |
| `ip` | `999.999.999.999` | 192.168.1.1 | IP address |
| `currency` | `$9,999,999.99` | $1,234.56 | Currency |
| `percent` | `999%` | 50% | Percentage |

---

### Instance Methods

#### Value

##### `getRaw()`
**Returns:** Unformatted value (digits/letters only)

---

##### `getFormatted()`
**Returns:** Formatted value with literals

---

##### `setValue(value)`
Set value programmatically (raw or formatted accepted).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | string | Yes | Value to set |

---

##### `clear()`
Clear the input value.

---

#### State

##### `isComplete()`
**Returns:** `boolean` - Whether all mask positions are filled

---

##### `isValid()`
**Returns:** `boolean` - Whether value passes validation (shorthand for validate().valid)

---

##### `validate()`
**Returns:** `{ valid: boolean, error: string|null }` - Validation result

---

#### Element Access

##### `getElement()`
**Returns:** `HTMLInputElement` - The underlying input element

---

##### `getOptions()`
**Returns:** `object` - The options object used to configure the mask

---

#### Lifecycle

##### `destroy()`
Destroy the mask instance and restore original input.

---

## Redact Sub-API

`Funky.Mask.Redact` provides display-time redaction for sensitive data with reveal/hide functionality.

### Redact Quick Start

```html
<!-- Declarative usage -->
<span data-redact data-value="4242424242424242" data-show-last="4">
  ••••••••••••4242
</span>

<!-- With toggle button -->
<span data-redact data-value="123-45-6789" data-pattern="ssn" data-trigger="click">
  •••-••-••••
</span>
<button data-redact-toggle>Show/Hide</button>
```

```javascript
// Programmatic usage
var redact = Funky.Mask.redact('#ssn-display', {
  showLast: 4,
  trigger: 'click'
});

redact.reveal();  // Show full value
redact.hide();    // Re-redact
```

### Redact Factory Methods

#### `Funky.Mask.redact(selector, options)`

Create redact instance(s).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string\|Element\|NodeList | Yes | Elements to redact |
| options | object | No | Configuration options |

**Returns:** `RedactInstance` or `Array<RedactInstance>`

---

#### `Funky.Mask.initRedact()`

Auto-initialize all elements with `data-redact` attribute.

---

#### `Funky.Mask.getRedact(element)`

Get redact instance for an element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | string\|Element | Yes | Element or selector |

**Returns:** `RedactInstance` or `null`

---

#### `Funky.Mask.destroyAllRedact()`

Destroy all redact instances on the page.

---

### Redact Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| char | string | '•' | Redaction character |
| showFirst | number | 0 | Characters to show at start |
| showLast | number | 0 | Characters to show at end |
| pattern | string | null | Pattern name for formatting |
| trigger | string | 'none' | Reveal trigger: 'click', 'hover', 'focus', 'none' |
| autoHide | number | 0 | Auto-hide after ms (0 = never) |
| auditLog | boolean | false | Log reveal/hide to server |

### Redact Instance Methods

#### `reveal()`
Show the full unredacted value.

---

#### `hide()`
Hide (re-redact) the value.

---

#### `toggle()`
Toggle between revealed and hidden state.

---

#### `copy(revealed)`
Copy value to clipboard.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| revealed | boolean | No | If true, copy full value; if false, copy redacted |

---

#### `getValue()`
**Returns:** `string` - The full unredacted value

---

#### `setValue(value)`
Set a new value.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| value | string | Yes | New value |

---

#### `isRevealed()`
**Returns:** `boolean` - Whether value is currently revealed

---

#### `getElement()`
**Returns:** `HTMLElement` - The underlying element

---

#### `destroy()`
Destroy the redact instance.

---

### Redact Events (PubSub)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:redact:reveal` | `{ element, value }` | Value revealed |
| `funky:redact:hide` | `{ element }` | Value hidden |
| `funky:redact:copy` | `{ element, revealed }` | Value copied |

---

## Events (PubSub)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:mask:input` | `{ element, raw, formatted }` | Value changed |
| `funky:mask:complete` | `{ element, raw, formatted }` | All positions filled |
| `funky:mask:incomplete` | `{ element, raw, formatted }` | Became incomplete |
| `funky:mask:validate` | `{ element, valid, error }` | Validation performed |

## Examples

### Phone Number

```javascript
var phone = Funky.Mask.init('#phone', {
  pattern: 'phone'
});

// Or with custom format
var ukPhone = Funky.Mask.init('#uk-phone', {
  pattern: '+44 9999 999 9999'
});
```

### Credit Card with Validation

```javascript
var card = Funky.Mask.init('#card-number', {
  pattern: 'credit-card',
  validate: 'creditCard'  // Uses Luhn algorithm
});

card.isValid();  // Checks Luhn validity
```

### Custom Pattern

```javascript
// Product serial number: ABC-1234-XY9Z
var serial = Funky.Mask.init('#serial', {
  pattern: 'AAA-9999-****',
  transform: 'uppercase',
  definitions: {
    // Custom definition for hex characters
    'H': /[0-9A-Fa-f]/
  }
});
```

### Date with Validation

```javascript
var date = Funky.Mask.init('#birthdate', {
  pattern: 'date',
  clearIncomplete: true,
  validate: 'date'
});
```

### Dynamically Getting Values

```javascript
var mask = Funky.Mask.init('#field', { pattern: '999-AAA' });

document.getElementById('submit').onclick = function() {
  var raw = mask.getRaw();        // "123ABC"
  var formatted = mask.getFormatted();  // "123-ABC"

  if (mask.isComplete()) {
    submitForm({ value: raw });
  } else {
    showError('Please complete the field');
  }
};
```

### Form Integration

```javascript
// Auto-init all masked inputs
document.addEventListener('DOMContentLoaded', function() {
  Funky.Mask.init();
});

// Form submission - get raw values
document.getElementById('form').onsubmit = function(e) {
  var phone = Funky.Mask.getInstance(document.getElementById('phone'));
  var card = Funky.Mask.getInstance(document.getElementById('card'));

  // Submit raw values
  submitData({
    phone: phone.getRaw(),
    card: card.getRaw()
  });
};
```

## Accessibility

- Input maintains proper `inputmode` based on pattern (e.g., `numeric` for phone)
- Automatically sets `autocomplete` attribute when appropriate
- Creates visually hidden format hint linked via `aria-describedby`
- Sets `aria-invalid` based on validation state
- Announces completion state changes to screen readers
- Works with screen readers and keyboard-only navigation

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-mask-hint` | Hidden format hint element |
| `[data-mask-initialized]` | Applied to initialized inputs |

## Dependencies

- **Required:** `Funky.Dom`
- **Optional:** `Funky.PubSub` (events), `Funky.Validator` (validation)
