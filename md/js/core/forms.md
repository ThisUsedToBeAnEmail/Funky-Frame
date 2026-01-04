# Funky.Forms - Form Enhancement Utilities

Auto-initializes Funky.ComboBox on `<select>` elements with data attribute configuration and SPA lifecycle integration.

## Overview

`Funky.Forms` provides utilities for initializing and managing form controls. It automatically converts standard `<select>` elements into enhanced `Funky.ComboBox` dropdowns with search, clear, tags, and remote data support.

## Quick Start

```html
<select data-placeholder="Select a client..." data-clearable="true">
  <option value="">Select...</option>
  <option value="1">Client A</option>
  <option value="2">Client B</option>
</select>

<script>
// Initialize all selects in #spaContent
Funky.Forms.initComboBox();
</script>
```

---

## API Reference

### Methods

#### `Forms.initComboBox(container)`

Initialize ComboBox on all `<select>` elements within a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | No | CSS selector or element (defaults to `#spaContent`) |

**Example:**
```javascript
// Initialize all selects in default container
Funky.Forms.initComboBox();

// Initialize in specific container
Funky.Forms.initComboBox('#myForm');
Funky.Forms.initComboBox(document.getElementById('newForm'));
```

---

#### `Forms.destroyComboBox(container)`

Destroy ComboBox instances within a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|Element | No | CSS selector or element (defaults to `#spaContent`) |

**Example:**
```javascript
// Cleanup before removing form
Funky.Forms.destroyComboBox('#myForm');
formElement.remove();
```

---

#### `Forms.refreshComboBox(selector)`

Refresh a specific ComboBox instance after dynamic option changes.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string\|Element | Yes | CSS selector or select element |

**Example:**
```javascript
// After adding new options to a select
var select = document.getElementById('clientSelect');
select.appendChild(newOption);
Funky.Forms.refreshComboBox(select);
```

---

#### `Forms.setComboBoxValue(selector, value, silent)`

Set ComboBox value programmatically.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| selector | string\|Element | Yes | CSS selector or select element |
| value | any | Yes | Value to set |
| silent | boolean | No | Suppress change event (default: false) |

**Example:**
```javascript
// Set value and trigger change event
Funky.Forms.setComboBoxValue('#clientSelect', '123');

// Set value without triggering change
Funky.Forms.setComboBoxValue('#clientSelect', '123', true);
```

---

## Data Attributes

Configure ComboBox behavior via data attributes on `<select>` elements:

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-placeholder` | string | Placeholder text (also enables clear button) |
| `data-clearable` | boolean | Show clear button (`"true"` or `"false"`) |
| `data-searchable` | boolean | Show search box (`"true"` or `"false"`, default: true) |
| `data-tags` | boolean | Allow creating new entries (`"true"`) |
| `data-min-search-length` | number | Minimum characters before search triggers |
| `data-remote-url` | string | URL for remote/AJAX data source |
| `data-no-combobox` | - | Skip ComboBox initialization for this element |

---

## Configuration Examples

### Basic Searchable Select

```html
<select data-placeholder="Select a status...">
  <option value="">Select...</option>
  <option value="active">Active</option>
  <option value="pending">Pending</option>
  <option value="closed">Closed</option>
</select>
```

### Clearable Select

```html
<select data-placeholder="Choose client..." data-clearable="true">
  <option value="">None selected</option>
  <option value="1">Client A</option>
  <option value="2">Client B</option>
</select>
```

### Tags Mode (Allow New Entries)

```html
<select data-placeholder="Add tags..." data-tags="true" multiple>
  <option value="urgent">Urgent</option>
  <option value="review">Review</option>
</select>
```

### Remote/AJAX Data

```html
<select data-remote-url="/api/clients/search" 
        data-placeholder="Search clients..."
        data-min-search-length="2">
</select>
```

### Skip ComboBox (Keep Native Select)

```html
<select data-no-combobox>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Multi-Select

```html
<select multiple data-placeholder="Select multiple...">
  <option value="1">Item 1</option>
  <option value="2">Item 2</option>
  <option value="3">Item 3</option>
</select>
```

---

## SPA Integration

Forms module integrates with `Funky.SPA` lifecycle:

- ComboBox is automatically initialized after SPA page loads
- Instances are automatically destroyed on SPA navigation cleanup

```javascript
// Manual initialization after dynamic content load
Funky.Forms.initComboBox('#dynamicContent');

// Manual cleanup before removing content
Funky.Forms.destroyComboBox('#dynamicContent');
```

---

## Modal Support

When a select is inside a `.modal` element, the dropdown automatically uses the modal as its parent container to prevent z-index issues.

```html
<div class="modal" id="myModal">
  <div class="modal-body">
    <!-- Dropdown will render inside the modal -->
    <select data-placeholder="Select...">
      <option value="1">Option 1</option>
    </select>
  </div>
</div>
```

---

## Deprecated Methods

These methods are deprecated aliases that log warnings. Use the ComboBox equivalents:

| Deprecated | Use Instead |
|------------|-------------|
| `Forms.initSelect2()` | `Forms.initComboBox()` |
| `Forms.destroySelect2()` | `Forms.destroyComboBox()` |
| `Forms.refreshSelect2()` | `Forms.refreshComboBox()` |
| `Forms.setSelect2Value()` | `Forms.setComboBoxValue()` |

---

## Dependencies

- `Funky.ComboBox` - Enhanced dropdown component (required)
- `Funky.SPA` - For lifecycle integration (optional)

## See Also

- [Funky.ComboBox](../components/combobox.md) - Full ComboBox API documentation
