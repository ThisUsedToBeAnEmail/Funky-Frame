# Funky.A11yValidator - Accessibility Validator

Development mode accessibility validator that checks for common WCAG 2.1 violations.

## Overview

`Funky.A11yValidator` is a development tool that scans the page for accessibility issues and reports them in the browser console. It helps catch WCAG violations early during development.

## Activation

### URL Parameter

Add `?a11y=1` to any page URL:

```
https://yoursite.com/page?a11y=1
```

### Storage Flag

Enable persistent validation across page loads:

```javascript
Funky.Storage.set('a11y_mode', true);
```

### Manual Validation

Run validation programmatically:

```javascript
Funky.A11yValidator.validate();
```

## API Reference

### Methods

#### `A11yValidator.validate(root)`

Run all enabled validation checks on the specified root element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| root | Element | No | Root element to validate (default: document.body) |

**Returns:** `Object` - Results summary

```javascript
{
  errors: 2,
  warnings: 1,
  info: 0,
  total: 3,
  issues: [...]
}
```

**Example:**
```javascript
// Validate entire page
var results = Funky.A11yValidator.validate();

// Validate specific container
var modal = document.getElementById('myModal');
Funky.A11yValidator.validate(modal);
```

---

#### `A11yValidator.configure(config)`

Configure validation rules.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| config | Object | Yes | Rule configuration object |

**Example:**
```javascript
Funky.A11yValidator.configure({
  lowContrast: { severity: 'error' },
  missingLandmarks: { severity: 'warning', enabled: true }
});
```

---

#### `A11yValidator.disable(ruleName)`

Disable a specific validation rule.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ruleName | string | Yes | Name of rule to disable |

**Example:**
```javascript
Funky.A11yValidator.disable('brokenFocusOrder');
```

---

#### `A11yValidator.enable(ruleName)`

Enable a previously disabled rule.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| ruleName | string | Yes | Name of rule to enable |

**Example:**
```javascript
Funky.A11yValidator.enable('brokenFocusOrder');
```

---

#### `A11yValidator.getResults()`

Get the results from the last validation run.

**Returns:** `Object` - Results summary with issues array

**Example:**
```javascript
var results = Funky.A11yValidator.getResults();
console.log('Total issues:', results.total);
```

## Validation Rules

| Rule | Default Severity | Description |
|------|-----------------|-------------|
| `missingAlt` | error | Images without `alt` attributes |
| `missingLabels` | error | Form inputs without associated labels |
| `emptyButtons` | warning | Buttons without accessible names |
| `lowContrast` | warning | Text with insufficient contrast ratio |
| `duplicateIds` | error | Multiple elements with the same ID |
| `invalidAria` | error | Invalid ARIA roles or missing required attributes |
| `brokenFocusOrder` | warning | Positive tabindex or focusable elements in aria-hidden |
| `missingLandmarks` | info | Missing main, nav, or header landmarks |

### Rule Details

#### missingAlt

Checks for:
- `<img>` elements without `alt` attribute
- Elements with `role="img"` without `aria-label` or `aria-labelledby`

#### missingLabels

Checks form inputs (`<input>`, `<select>`, `<textarea>`) for:
- Associated `<label>` via `for` attribute
- Wrapping `<label>` element
- `aria-label` attribute
- `aria-labelledby` attribute
- `title` attribute (fallback)

Excludes: `hidden`, `submit`, `reset`, `button`, `image` input types.

#### emptyButtons

Checks `<button>` and `[role="button"]` elements for:
- Text content
- `aria-label` attribute
- `aria-labelledby` reference
- `title` attribute
- Child `<img>` with `alt` text

#### lowContrast

Uses `Funky.Util.checkContrast()` to verify:
- Normal text meets 4.5:1 ratio
- Large text (18pt+ or 14pt+ bold) meets 3:1 ratio

Limited to 100 elements per validation for performance.

#### duplicateIds

Finds elements with duplicate `id` attributes, which break ARIA references.

#### invalidAria

Checks for:
- Invalid `role` attribute values
- Missing required ARIA attributes for roles (e.g., `aria-checked` for `checkbox`)
- `aria-labelledby` references to non-existent IDs
- `aria-describedby` references to non-existent IDs
- `aria-controls` references to non-existent IDs

#### brokenFocusOrder

Checks for:
- Positive `tabindex` values (anti-pattern)
- Focusable elements inside `aria-hidden="true"` containers

#### missingLandmarks

Checks for presence of:
- `<main>` or `[role="main"]`
- `<nav>` or `[role="navigation"]`
- `<header>` or `[role="banner"]`

Also warns when multiple `<nav>` elements lack `aria-label` to distinguish them.

## Exclusions

### Automatic Exclusions

Third-party libraries are automatically excluded:

| Selector | Library |
|----------|---------|
| `.je-object` | json-editor |
| `.wysimark` | wysimark editor |
| `.select2` | Select2 |
| `.funky-table-wrapper` | Funky.Table internals |

### Custom Exclusions

Add `data-a11y-ignore` to exclude elements:

```html
<div data-a11y-ignore>
  <!-- Content here is excluded from validation -->
</div>
```

## Console Output

Results are grouped by severity with color coding:

```
[A11yValidator] Found 3 accessibility issues (12.5ms):
  ERRORS (2)
    ERROR: <img> missing alt attribute at #product-image
    ERROR: Duplicate ID "submit-btn" found 2 times at #submit-btn
  WARNINGS (1)
    WARNING: Low contrast (3.2:1) - needs 4.5:1 at span.sidebar-text
```

Click on the logged element reference to inspect it in DevTools.

## Events

### a11y:validation

Dispatched on `document` when validation completes:

```javascript
document.addEventListener('a11y:validation', function(e) {
  console.log('Errors:', e.detail.errors);
  console.log('Warnings:', e.detail.warnings);
  console.log('Issues:', e.detail.issues);
});
```

## Dependencies

- `Funky.register` (core registry)
- `Funky.Storage` (for persistent activation)
- `Funky.Util.checkContrast` (for contrast checking)

## Examples

### CI Integration

```javascript
// Run validation and fail if errors found
document.addEventListener('DOMContentLoaded', function() {
  if (location.search.includes('a11y=1')) {
    setTimeout(function() {
      var results = Funky.A11yValidator.getResults();
      if (results.errors > 0) {
        console.error('Accessibility validation failed with ' + results.errors + ' errors');
        // Could integrate with testing framework
      }
    }, 1000);
  }
});
```

### Custom Rule Configuration

```javascript
// Strict mode: treat all issues as errors
Funky.A11yValidator.configure({
  emptyButtons: { severity: 'error' },
  lowContrast: { severity: 'error' },
  brokenFocusOrder: { severity: 'error' },
  missingLandmarks: { severity: 'error' }
});

Funky.A11yValidator.validate();
```

### Validate After Dynamic Content

```javascript
function loadContent() {
  fetch('/api/content')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      renderContent(data);

      // Re-validate after new content is rendered
      if (Funky.Storage.get('a11y_mode')) {
        setTimeout(function() {
          Funky.A11yValidator.validate();
        }, 100);
      }
    });
}
```

## Best Practices

1. **Enable during development** - Keep `?a11y=1` in your development URL.
2. **Fix errors first** - Errors indicate definite WCAG violations.
3. **Review warnings** - Warnings may or may not be issues depending on context.
4. **Test with real assistive technology** - The validator catches common issues but isn't a substitute for real screen reader testing.
5. **Don't ship to production** - This is a development tool; don't include it in production bundles.

## WCAG Coverage

This validator helps identify violations of:

- **1.1.1 Non-text Content (Level A)** - missingAlt
- **1.3.1 Info and Relationships (Level A)** - missingLabels, invalidAria
- **1.4.3 Contrast (Minimum) (Level AA)** - lowContrast
- **2.4.1 Bypass Blocks (Level A)** - missingLandmarks
- **2.4.3 Focus Order (Level A)** - brokenFocusOrder
- **4.1.1 Parsing (Level A)** - duplicateIds
- **4.1.2 Name, Role, Value (Level A)** - emptyButtons, invalidAria
