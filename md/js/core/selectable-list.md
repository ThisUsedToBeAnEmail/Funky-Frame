# Funky.SelectableList

Core accessible list with keyboard navigation, selection, and grouping for building list-based UIs.

## Overview

`Funky.SelectableList` is a foundational module providing:
- Single and multi-selection modes
- Keyboard navigation (arrow keys, Home/End, PageUp/Down)
- Type-ahead search
- Item grouping
- Custom item rendering
- Touch gesture support
- ARIA accessibility with screen reader announcements
- Vim key bindings (optional)

**Used by:** CommandPalette, SideNav, WidgetCatalog

## Quick Start

```javascript
// Basic list
var list = Funky.SelectableList.init('#my-list', {
  items: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ],
  renderItem: function(item, index, state) {
    return '<span>' + item.name + '</span>';
  },
  onActivate: function(item, index) {
    console.log('Activated:', item.name);
  }
});

// Multi-select with grouping
var grouped = Funky.SelectableList.init('#grouped-list', {
  items: myItems,
  selectable: 'multi',
  groupBy: function(item) { return item.category; },
  onSelect: function(items, ids) {
    console.log('Selected:', ids);
  }
});
```

## API Reference

### Factory Methods

#### `Funky.SelectableList.init(container, options)`

Create a selectable list instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string/Element | Yes | Container element or selector |
| options | object | No | Configuration options |

**Returns:** `SelectableListInstance`

---

#### `Funky.SelectableList.getInstance(id)`

Get instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Instance ID |

**Returns:** `SelectableListInstance` or `undefined`

---

#### `Funky.SelectableList.destroyAll()`

Destroy all instances and clean up.

---

### Configuration Options

#### Data

| Name | Type | Default | Description |
|------|------|---------|-------------|
| items | array | `[]` | Array of item objects |
| getItemKey | function | `(item, index) => item.id || index` | Extract unique key from item |

#### Rendering

| Name | Type | Default | Description |
|------|------|---------|-------------|
| renderItem | function | `null` | Custom render: `(item, index, state) => HTML` |
| itemClass | string | `''` | Additional CSS class for items |

#### Selection

| Name | Type | Default | Description |
|------|------|---------|-------------|
| selectable | string | `'single'` | `'none'`, `'single'`, or `'multi'` |
| selectedIds | array | `[]` | Initially selected item IDs |
| allowDeselect | boolean | `true` | Allow deselecting in single mode |
| selectOnFocus | boolean | `false` | Auto-select when navigating |

#### Grouping

| Name | Type | Default | Description |
|------|------|---------|-------------|
| groupBy | function | `null` | Group items: `(item) => groupKey` |
| renderGroupHeader | function | `null` | Render header: `(groupKey, items) => HTML` |

#### Empty State

| Name | Type | Default | Description |
|------|------|---------|-------------|
| emptyMessage | string | `'No items to display'` | Empty state message |
| emptyTemplate | string | `null` | Custom empty state HTML |
| emptyIcon | string | `null` | FontAwesome icon class |

#### Keyboard

| Name | Type | Default | Description |
|------|------|---------|-------------|
| keyboard | boolean | `true` | Enable keyboard navigation |
| useKeyboardModule | boolean | `true` | Use Funky.Keyboard if available |
| keyboardScope | string | `null` | Custom keyboard scope name |
| pageSize | number | `10` | Items to skip for PageUp/Down |
| typeAhead | boolean | `true` | Enable type-ahead search |
| typeAheadTimeout | number | `500` | ms to reset type buffer |
| vimKeys | boolean | `false` | Enable j/k navigation |
| handleDefaultActions | boolean | `true` | Register default event handlers |

#### Gestures

| Name | Type | Default | Description |
|------|------|---------|-------------|
| gestures | boolean | `false` | Enable touch gesture support |
| swipeSelectAction | string | `'toggle'` | `'toggle'`, `'select'`, `'deselect'` |

#### Accessibility

| Name | Type | Default | Description |
|------|------|---------|-------------|
| ariaLabel | string | `'List'` | Accessible list label |
| ariaDescription | string | `null` | Additional screen reader description |
| announceOnFocus | boolean | `true` | Announce item when focused |
| announceOnSelect | boolean | `true` | Announce selection changes |
| showInstructions | boolean | `true` | Add screen reader instructions |

#### Behavior

| Name | Type | Default | Description |
|------|------|---------|-------------|
| wrapAround | boolean | `true` | Wrap navigation at list ends |
| scrollBehavior | string | `'smooth'` | `'smooth'`, `'auto'`, `'instant'` |
| isItemDisabled | function | `null` | Check if item disabled: `(item) => boolean` |

#### Theming

| Name | Type | Default | Description |
|------|------|---------|-------------|
| density | string | `'default'` | `'compact'`, `'default'`, `'comfortable'` |
| variant | string | `null` | `'bordered'`, `'cards'`, `'striped'`, `'checkboxes'` |

#### Callbacks

| Name | Type | Description |
|------|------|-------------|
| onSelect | function | Selection changed: `(selectedItems, selectedIds)` |
| onBeforeSelect | function | Before selection: `(item, action) => boolean` (can cancel) |
| onActivate | function | Item activated (Enter/click): `(item, index)` |
| onFocus | function | Focus changed: `(item, index)` |
| onNavigate | function | Navigation: `(direction, newIndex, oldIndex)` |
| onCancel | function | Escape pressed: `()` |
| onChange | function | Items changed: `(items)` |

---

### Instance Methods

#### Navigation

##### `setFocusedIndex(index)`
Set focused item by index.

---

##### `navigateBy(delta)`
Move focus by delta (positive = down, negative = up).

---

##### `focusItem(id)`
Focus item by ID.

---

##### `focus()`
Focus the list container.

---

#### Selection

##### `select(ids, options)`
Select item(s) by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| ids | any/array | ID(s) to select |
| options | object | `{ silent: boolean }` |

---

##### `deselect(ids, options)`
Deselect item(s) by ID.

---

##### `toggleSelection(ids, options)`
Toggle selection for item(s).

---

##### `selectRange(fromIndex, toIndex)`
Select all items between indices (inclusive).

---

##### `selectAll(options)`
Select all items (multi-select mode only).

---

##### `clearSelection(options)`
Clear all selections.

---

##### `setSelection(ids)`
Set selection to exactly these IDs.

---

#### Queries

##### `getItems()`
**Returns:** Current items array

---

##### `getSelected()`
**Returns:** Array of selected item objects

---

##### `getSelectedIds()`
**Returns:** Set of selected IDs

---

##### `isSelected(id)`
**Returns:** `boolean` - Whether item is selected

---

##### `getFocused()`
**Returns:** Currently focused item object or `null`

---

##### `getFocusedIndex()`
**Returns:** Currently focused index (-1 if none)

---

#### Data

##### `setItems(items)`
Replace all items and re-render.

---

#### Theming

##### `setDensity(density)`
Change density (`'compact'`, `'default'`, `'comfortable'`).

---

##### `setVariant(variant)`
Change variant (`null`, `'bordered'`, `'cards'`, etc.).

---

##### `getDensity()`
**Returns:** Current density string

---

##### `getVariant()`
**Returns:** Current variant string or `null`

---

#### Accessibility

##### `announce(message, priority)`
Announce message to screen readers.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| message | string | - | Message to announce |
| priority | string | `'polite'` | `'polite'` or `'assertive'` |

---

#### Lifecycle

##### `refresh()`
Re-render the list.

---

##### `destroy()`
Destroy instance and clean up.

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Up` / `k` (vim) | Move focus up |
| `Down` / `j` (vim) | Move focus down |
| `Home` | Focus first item |
| `End` | Focus last item |
| `PageUp` | Move focus up by pageSize |
| `PageDown` | Move focus down by pageSize |
| `Enter` | Activate focused item |
| `Space` | Toggle selection (multi) / Select (single) |
| `Escape` | Cancel / close |
| `Ctrl+A` | Select all (multi-select only) |
| Type characters | Type-ahead search |

## Events (PubSub)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:list:select` | `{ list, items, ids }` | Selection changed |
| `funky:list:activate` | `{ list, item, index }` | Item activated |
| `funky:list:focus` | `{ list, item, index }` | Focus changed |
| `funky:list:cancel` | `{ list }` | Escape pressed |
| `funky:list:keyboard:{action}` | `{ list, action }` | Keyboard action |

## Examples

### Basic List with Custom Rendering

```javascript
var list = Funky.SelectableList.init('#users', {
  items: users,
  renderItem: function(user, index, state) {
    var classes = state.isSelected ? 'selected' : '';
    return '<div class="user-item ' + classes + '">' +
           '<img src="' + user.avatar + '" class="avatar">' +
           '<span class="name">' + user.name + '</span>' +
           '</div>';
  },
  onActivate: function(user) {
    navigateTo('/users/' + user.id);
  }
});
```

### Multi-Select with Grouped Items

```javascript
var fileList = Funky.SelectableList.init('#files', {
  items: files,
  selectable: 'multi',
  groupBy: function(file) {
    return file.type; // 'Documents', 'Images', etc.
  },
  renderGroupHeader: function(type, items) {
    return '<h3>' + type + ' (' + items.length + ')</h3>';
  },
  variant: 'checkboxes',
  onSelect: function(selected, ids) {
    updateBulkActions(selected.length > 0);
  }
});

// Select all
document.getElementById('selectAll').onclick = function() {
  fileList.selectAll();
};

// Delete selected
document.getElementById('delete').onclick = function() {
  var ids = Array.from(fileList.getSelectedIds());
  deleteFiles(ids);
};
```

### Type-Ahead Search

```javascript
var contacts = Funky.SelectableList.init('#contacts', {
  items: contactList,
  typeAhead: true,
  typeAheadTimeout: 800,
  renderItem: function(contact) {
    return '<span class="contact">' + contact.name + '</span>';
  }
});

// User types "jo" quickly - jumps to first item starting with "Jo"
```

### Conditional Item Disabling

```javascript
var tasks = Funky.SelectableList.init('#tasks', {
  items: taskList,
  isItemDisabled: function(task) {
    return task.status === 'completed';
  },
  renderItem: function(task, index, state) {
    var classes = state.isDisabled ? 'disabled' : '';
    return '<span class="' + classes + '">' + task.title + '</span>';
  }
});
```

### Vim Key Bindings

```javascript
var codeList = Funky.SelectableList.init('#snippets', {
  items: snippets,
  vimKeys: true,  // Enable j/k navigation
  keyboard: true,
  onActivate: function(snippet) {
    insertSnippet(snippet.code);
  }
});
```

## Accessibility

- Container uses `role="listbox"` with proper ARIA attributes
- Items use `role="option"` with `aria-selected` state
- Multi-select uses `aria-multiselectable="true"`
- Groups use `role="group"` with `aria-labelledby`
- Live region for screen reader announcements
- Keyboard instructions provided via `aria-describedby`
- Focus management with visible focus indicator

## CSS Classes

| Class | Description |
|-------|-------------|
| `.selectable-list` | Main wrapper |
| `.selectable-list__item` | Individual item |
| `.selectable-list__item--focused` | Focused item |
| `.selectable-list__item--selected` | Selected item |
| `.selectable-list__item--disabled` | Disabled item |
| `.selectable-list__group` | Group container |
| `.selectable-list__group-header` | Group header |
| `.selectable-list__empty` | Empty state |
| `.selectable-list--compact` | Compact density |
| `.selectable-list--comfortable` | Comfortable density |
| `.selectable-list--bordered` | Bordered variant |
| `.selectable-list--cards` | Card variant |
| `.selectable-list--striped` | Striped variant |
| `.selectable-list--checkboxes` | Checkbox variant |

## Dependencies

- **Required:** `Funky.Dom`
- **Optional:** `Funky.PubSub` (events), `Funky.Keyboard` (enhanced keyboard handling), `Funky.GestureTracker` (touch gestures)
