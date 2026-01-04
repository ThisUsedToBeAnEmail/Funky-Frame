# Funky.ComboBox

Select2 replacement with native ES5, search, keyboard navigation, and remote data support.

## Overview

`Funky.ComboBox` creates a fully-featured dropdown/select component with:
- Single and multi-select modes
- Search filtering with fuzzy matching
- Custom templates for dropdown items, selection display, and tags
- Remote data support (AJAX)
- Keyboard navigation
- Tag creation
- LiveBinding integration for reactive updates
- Full ARIA accessibility

## Quick Start

```javascript
// Basic single-select
var combo = Funky.ComboBox.init('#my-select', {
  placeholder: 'Select an option...',
  items: [
    { id: 'apple', name: 'Apple' },
    { id: 'banana', name: 'Banana' },
    { id: 'cherry', name: 'Cherry' }
  ]
});

// Multi-select with tags
var multi = Funky.ComboBox.init('#multi', {
  mode: 'multi',
  maxTags: 3,
  items: colors
});

// From existing <select> element
Funky.ComboBox.init('[data-combobox]');
```

## API Reference

### Factory Methods

#### `Funky.ComboBox.init(element, options)`

Create a ComboBox instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | string/Element | Yes | Select element or selector |
| options | object | No | Configuration options |

**Returns:** `ComboBoxInstance`

---

#### `Funky.ComboBox.getInstance(elementOrId)` / `Funky.ComboBox.get(elementOrId)`

Get existing instance by element or ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| elementOrId | string/Element | Yes | Element, selector, or instance ID |

**Returns:** `ComboBoxInstance` or `null`

---

#### `Funky.ComboBox.initAll(container)`

Auto-initialize all `[data-combobox]` elements in container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | Element | No | Container to search (default: document) |

**Returns:** `ComboBoxInstance[]`

---

#### `Funky.ComboBox.destroyAll(container)`

Destroy all instances in container.

---

#### `Funky.ComboBox.getAll()`

Get all active ComboBox instances.

**Returns:** `Object` - Map of all instances keyed by ID

---

### Configuration Options

#### Data Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| items | array | `[]` | Array of item objects |
| valueKey | string | `'id'` | Property to use as value |
| textKey | string | `'name'` | Property to use as display text |

#### Behavior Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| mode | string | `'single'` | `'single'` or `'multi'` |
| searchable | boolean | `true` | Enable search input |
| clearable | boolean | `true` | Show clear button |
| disabled | boolean | `false` | Disable the component |
| placeholder | string | `'Select...'` | Placeholder text |

#### Dropdown Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| dropdownParent | Element | `null` | Parent for dropdown (modals) |
| maxHeight | number | `300` | Max dropdown height (px) |
| minWidth | number | `null` | Min dropdown width |
| dropdownFitContent | boolean | `false` | If true, dropdown width fits content instead of trigger width |

#### Search Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| searchPlaceholder | string | `'Search...'` | Search input placeholder |
| minSearchLength | number | `0` | Min chars before search |
| fuzzyThreshold | number | `0.3` | Fuzzy match threshold |

#### Remote Data Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| remote | object | `null` | Remote configuration |
| remote.url | string | - | API endpoint URL |
| remote.method | string | `'GET'` | HTTP method |
| remote.searchParam | string | `'search'` | Query param for search |
| remote.dataKey | string | `'data'` | Response property for items |
| remote.delay | number | `300` | Debounce delay (ms) |

#### Multi-Select Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| maxSelection | number | `null` | Max selected items |
| maxTags | number | `5` | Max visible tags before "+N more" |
| showSelectAll | boolean | `false` | Show "Select All" option |
| tags | boolean | `false` | Allow creating new tags |
| createTag | function | `null` | Custom tag creation |
| scrollTags | boolean | `false` | Horizontal scroll for tags |

#### Sizing Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| fixedWidth | number/string | `null` | Fixed width (px or CSS value) |

#### Template Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| templateResult | function | `null` | Custom dropdown item template |
| templateSelection | function | `null` | Custom selected value display |
| templateTag | function | `null` | Custom tag content (multi) |
| groupBy | function | `null` | Group items by property |

#### Accessibility Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| ariaLabel | string | `null` | Accessible label |

#### Callbacks
| Name | Type | Default | Description |
|------|------|---------|-------------|
| onChange | function | `null` | Called on value change |
| onOpen | function | `null` | Called when dropdown opens |
| onClose | function | `null` | Called when dropdown closes |
| onSearch | function | `null` | Called on search input |
| onClear | function | `null` | Called on clear |

---

### Template Functions

#### `templateResult(item, state)`

Customize how dropdown items are rendered.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| item | object | The item data object |
| state | object | Render state object |
| state.isSelected | boolean | Whether item is selected |
| state.isDisabled | boolean | Whether item is disabled |
| state.isHighlighted | boolean | Whether item is keyboard-highlighted |
| state.index | number | Item index |
| state.displayText | string | Pre-escaped display text (in list mode) |

**Returns:** `string | HTMLElement | Funky.Dom | jQuery`

```javascript
Funky.ComboBox.init('#select', {
  items: users,
  templateResult: function(item, state) {
    return '<div class="user-option">' +
      '<img src="' + item.avatar + '" class="avatar" />' +
      '<div class="user-info">' +
        '<strong>' + item.name + '</strong>' +
        '<small>' + item.email + '</small>' +
      '</div>' +
    '</div>';
  }
});
```

---

#### `templateSelection(item)`

Customize how the selected value displays in the trigger.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| item | object | The selected item data |

**Returns:** `string | HTMLElement | Funky.Dom | jQuery`

```javascript
Funky.ComboBox.init('#select', {
  items: users,
  templateSelection: function(item) {
    return item.name + ' (' + item.email + ')';
  }
});
```

---

#### `templateTag(item, state)`

Customize tag content in multi-select mode. The remove button is added automatically.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| item | object | The tag item data |
| state | object | Contains `index` |

**Returns:** `string | HTMLElement | Funky.Dom | jQuery`

```javascript
Funky.ComboBox.init('#multi', {
  mode: 'multi',
  items: colors,
  templateTag: function(item) {
    return '<span style="color:' + item.hex + ';">' +
      '<i class="fa fa-circle"></i> ' + item.name +
    '</span>';
  }
});
```

---

### Instance Methods

#### Value Management

##### `getValue()`
Get current value (single value or array for multi).

##### `setValue(value)`
Set value programmatically. Accepts single value or array.

##### `getSelectedItems()`
Get full item objects for selected values.

##### `clear()`
Clear all selections.

##### `getText()`
Get comma-separated display text of selected items.

---

#### Items Management

##### `getItems()`
Get all available items.

##### `setItems(items)`
Replace all items.

##### `getFilteredItems()`
Get items matching current search.

---

#### Dropdown Control

##### `open()`
Open the dropdown.

##### `close()`
Close the dropdown.

##### `toggle()`
Toggle dropdown state.

##### `isOpen()`
Check if dropdown is open.

##### `selectAll()`
Select all items (multi-select mode only).

---

#### State Management

##### `enable()`
Enable the component.

##### `disable()`
Disable the component.

##### `isDisabled()`
Check disabled state.

---

#### Lifecycle

##### `refresh()`
Re-render the component.

##### `destroy()`
Remove component and cleanup.

##### `validate()`
Validate selection against required rules. Returns validation result.

##### `focus()`
Programmatically focus the trigger element.

---

#### Event Management

##### `on(eventName, handler)`
Register event listener.

##### `off(eventName, handler)`
Unregister event listener.

##### `once(eventName, handler)`
Register one-time event listener.

---

#### Remote Data

##### `loadMore()`
Manually trigger loading the next page of remote data.

##### `clearCache()`
Clear the remote data cache, forcing fresh fetch on next request.

##### `isLoading()`
Check if remote data is currently being loaded.

---

### Events

Events can be listened to via `addEventListener` on the wrapper element or using `Funky.Events`.

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value, items }` | Selection changed |
| `open` | `{}` | Dropdown opened |
| `close` | `{}` | Dropdown closed |
| `search` | `{ query, minLength }` | Search performed |
| `clear` | `{}` | Selection cleared |
| `focus` | `{}` | Trigger gained focus |
| `blur` | `{}` | Trigger lost focus |
| `tagcreate` | `{ item, text }` | New tag created |
| `tagremove` | `{ value }` | Tag removed |
| `maxreached` | `{ max }` | Max selection limit hit |
| `load` | `{ items, total, page, query }` | Remote data loaded |
| `error` | `{ error }` | Remote load failed |

```javascript
combo.on('change', function(e) {
  console.log('Selected:', e.detail.value);
});

// Or via DOM addEventListener (dot notation)
combo.element.addEventListener('funky.combobox.change', handler);

// Or via PubSub (colon notation)
Funky.PubSub.on('funky:combobox:change', handler);
```

---

## LiveBinding Integration

ComboBox registers with `Funky.LiveBinding` for reactive data binding.

### Basic Usage

```javascript
var binding = Funky.LiveBinding.bind('#my-combo', {
  source: 'ajax',
  url: '/api/items',
  transform: function(data) {
    return { items: data.results };
  }
});
```

### Adapter Methods

The ComboBox adapter supports:

| Method | Description |
|--------|-------------|
| `update(data)` | Update items or value. Accepts array (items) or object `{ items, value }` |
| `getData()` | Get current value |
| `getItems()` | Get selected item objects |
| `destroy()` | Cleanup binding |

---

## Select2 Migration Guide

### Option Mapping

| Select2 | ComboBox | Notes |
|---------|----------|-------|
| `placeholder` | `placeholder` | Same |
| `allowClear` | `clearable` | Same behavior |
| `multiple` | `mode: 'multi'` | Use mode option |
| `minimumInputLength` | `minSearchLength` | Same behavior |
| `minimumResultsForSearch` | `searchable: false` | Set to -1 in Select2 = false here |
| `dropdownParent` | `dropdownParent` | Same |
| `ajax` | `remote` | Different structure |
| `templateResult` | `templateResult` | Same signature |
| `templateSelection` | `templateSelection` | Same signature |
| `closeOnSelect` | - | Multi always keeps open |
| `data` | `items` | Renamed |

### AJAX Migration

```javascript
// Select2
$('#select').select2({
  ajax: {
    url: '/api/search',
    dataType: 'json',
    delay: 250,
    data: function(params) {
      return { q: params.term };
    },
    processResults: function(data) {
      return { results: data.items };
    }
  }
});

// ComboBox
Funky.ComboBox.init('#select', {
  remote: {
    url: '/api/search',
    searchParam: 'q',
    dataKey: 'items',
    delay: 250
  }
});
```

### Template Migration

```javascript
// Select2
$('#select').select2({
  templateResult: function(item) {
    if (!item.id) return item.text;
    var $el = $('<span><img src="' + item.icon + '"/> ' + item.text + '</span>');
    return $el;
  }
});

// ComboBox (same signature, but also accepts plain strings)
Funky.ComboBox.init('#select', {
  templateResult: function(item, state) {
    return '<span><img src="' + item.icon + '"/> ' + item.name + '</span>';
  }
});
```

---

## Accessibility

ComboBox implements full ARIA combobox pattern:

- `role="combobox"` on trigger
- `aria-expanded` state
- `aria-haspopup="listbox"` 
- `aria-activedescendant` for keyboard navigation
- `role="listbox"` on dropdown
- `role="option"` on items
- `aria-selected` state
- Live region announcements

### Keyboard Support

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open dropdown / Select item |
| `Escape` | Close dropdown |
| `↓` / `↑` | Navigate items |
| `Home` / `End` | Jump to first/last |
| `Backspace` | Remove last tag (multi) |
| Type to search | Filter items |

---

## CSS Customization

ComboBox uses CSS custom properties for theming:

```css
:root {
  --combobox-bg: var(--pro-bg-primary);
  --combobox-border: var(--pro-border-color);
  --combobox-text: var(--pro-text-primary);
  --combobox-placeholder: var(--pro-text-muted);
  --combobox-focus-border: var(--pro-accent-primary);
  --combobox-focus-ring: 0 0 0 3px rgba(88, 166, 255, 0.3);
  --combobox-dropdown-bg: var(--pro-bg-elevated);
  --combobox-item-hover-bg: var(--pro-bg-secondary);
  --combobox-item-selected-bg: var(--pro-accent-subtle);
  --combobox-tag-bg: var(--pro-bg-secondary);
  --combobox-tag-border: var(--pro-border-color);
}
```

### Modifier Classes

| Class | Description |
|-------|-------------|
| `.combobox--fixed-width` | Apply fixed width with ellipsis |
| `.combobox--scroll-tags` | Horizontal scrolling tags |

---

## Examples

### Rich Item Templates

```javascript
Funky.ComboBox.init('#user-select', {
  items: users,
  templateResult: function(user, state) {
    var D = Funky.Dom;
    return D.create('div')
      .classAdd('user-option')
      .append(
        D.create('img')
          .classAdd('avatar')
          .attr('src', user.avatar)
      )
      .append(
        D.create('div')
          .classAdd('user-info')
          .append(D.create('strong').text(user.name))
          .append(D.create('small').text(user.role))
      );
  },
  templateSelection: function(user) {
    return user.name + ' (' + user.role + ')';
  }
});
```

### Multi-Select with Colored Tags

```javascript
Funky.ComboBox.init('#color-picker', {
  mode: 'multi',
  scrollTags: true,
  items: [
    { id: 'red', name: 'Red', hex: '#e74c3c' },
    { id: 'blue', name: 'Blue', hex: '#3498db' },
    { id: 'green', name: 'Green', hex: '#2ecc71' }
  ],
  templateTag: function(color) {
    return '<span style="display:flex;align-items:center;gap:4px;">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:' + color.hex + '"></span>' +
      color.name +
    '</span>';
  }
});
```

### Fixed Width in Modals

```javascript
Funky.ComboBox.init('#modal-select', {
  fixedWidth: 300,
  dropdownParent: document.querySelector('#my-modal'),
  items: options
});
```
