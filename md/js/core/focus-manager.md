# Focus Manager

Centralized focus history and region-based keyboard navigation with mobile virtual keyboard support.

## Features

- **Focus History** - Stack-based "back button" navigation with Escape key
- **Region Navigation** - Jump between page sections with Tab/keyboard
- **Input Completion** - Smart handling of filter/search inputs with mobile keyboard dismissal
- **Screen Reader Support** - Announces region changes and navigation actions
- **Composes Existing Modules** - Uses `Funky.History` for focus stack, `Funky.Announce` for a11y

---

## Quick Start

### Focus and Push to History

```javascript
// Push current focus to history, focus new element
var modal = document.querySelector('.modal-body button');
Funky.FocusManager.focusAndPush(modal, {
  label: 'Modal dialog'
});

// Later, return to previous focus (e.g., on Escape)
Funky.FocusManager.popFocus();
```

### Region Navigation

```html
<!-- Define regions with data attributes -->
<nav data-nav-region="sidebar" data-nav-order="1">
  <button>Nav item 1</button>
</nav>

<main data-nav-region="main" data-nav-order="2">
  <h1>Main content</h1>
</main>
```

```javascript
// Regions are auto-discovered on page load
// Navigate programmatically:
Funky.FocusManager.nextRegion();
Funky.FocusManager.prevRegion();
Funky.FocusManager.focusRegion('main');
```

### Filter Input Completion

```javascript
// For filter/search inputs - dismisses mobile keyboard
filterInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    Funky.FocusManager.completeInput({
      element: filterInput,
      returnFocus: true
    });
  }
});
```

---

## API Reference

### Focus History

#### `focusAndPush(element, options)`

Push current focus to history and focus a new element.

| Parameter | Type | Description |
|-----------|------|-------------|
| `element` | Element | Element to focus |
| `options.preventScroll` | boolean | Don't scroll to element (default: false) |
| `options.label` | string | Label for screen reader announcement |

```javascript
Funky.FocusManager.focusAndPush(button, {
  label: 'Search results',
  preventScroll: true
});
```

#### `popFocus()`

Return to previous focus from history.

**Returns:** `boolean` - True if focus was restored, false if history empty.

```javascript
if (Funky.FocusManager.popFocus()) {
  console.log('Returned to previous focus');
}
```

#### `clearHistory()`

Clear the focus history stack.

```javascript
Funky.FocusManager.clearHistory();
```

#### `getHistoryLength()`

Get current history stack size.

**Returns:** `number`

```javascript
if (Funky.FocusManager.getHistoryLength() > 0) {
  // Show "Go Back" button
}
```

---

### Region Navigation

#### `registerRegion(region)`

Register a navigation region.

| Parameter | Type | Description |
|-----------|------|-------------|
| `region.name` | string | Unique region identifier |
| `region.element` | Element\|string | Element or selector |
| `region.order` | number | Tab order (lower = earlier) |

```javascript
Funky.FocusManager.registerRegion({
  name: 'sidebar',
  element: document.querySelector('#sidebar'),
  order: 1
});
```

#### `discoverRegions()`

Auto-discover regions from `data-nav-region` attributes.

```html
<nav data-nav-region="sidebar" data-nav-order="1">...</nav>
<main data-nav-region="main" data-nav-order="2">...</main>
```

```javascript
Funky.FocusManager.discoverRegions();
```

#### `getRegions()`

Get all registered regions.

**Returns:** `Array<{name, element, order}>`

#### `getCurrentRegion()`

Get the region containing the currently focused element.

**Returns:** `Object|null`

```javascript
var region = Funky.FocusManager.getCurrentRegion();
if (region) {
  console.log('Currently in:', region.name);
}
```

#### `nextRegion()` / `prevRegion()`

Navigate to next/previous region.

**Returns:** `boolean` - True if navigation succeeded.

```javascript
Funky.FocusManager.nextRegion();  // Move forward
Funky.FocusManager.prevRegion();  // Move backward
```

#### `focusRegion(region)`

Focus a specific region by name or object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `region` | string\|Object | Region name or region object |

**Returns:** `boolean` - True if region was focused.

```javascript
Funky.FocusManager.focusRegion('main');
```

---

### Input Completion

#### `isFilterInput(element)`

Check if element is a filter/search input.

**Returns:** `boolean`

Matches:
- `[data-filter-input]`
- `[data-search-input]`
- `input[type="search"]`
- `.filter-toolbar input`
- `.search-box input`

```javascript
if (Funky.FocusManager.isFilterInput(element)) {
  // Enable special Enter/Escape handling
}
```

#### `completeInput(options)`

Complete input and return focus (dismisses mobile keyboard).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.element` | Element | required | Input element |
| `options.returnFocus` | boolean | true | Return to previous focus |
| `options.clearValue` | boolean | false | Clear input value |
| `options.focusTarget` | Element | null | Specific element to focus |

```javascript
// Complete search and return to previous element
Funky.FocusManager.completeInput({
  element: searchInput,
  returnFocus: true
});

// Clear filter and focus specific element
Funky.FocusManager.completeInput({
  element: filterInput,
  clearValue: true,
  focusTarget: resultsContainer
});
```

---

### Utility Functions

#### `getFocusableElements(container)`

Get all focusable elements in a container.

**Returns:** `NodeList`

```javascript
var focusables = Funky.FocusManager.getFocusableElements(modal);
focusables[0].focus();  // Focus first element
```

#### `isFocusable(element)`

Check if element is focusable.

**Returns:** `boolean`

```javascript
if (Funky.FocusManager.isFocusable(element)) {
  element.focus();
}
```

---

## Constants

### `FOCUSABLE_SELECTORS`

Selector string for focusable elements:

```javascript
'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]),
 select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]),
 [contenteditable="true"]'
```

### `FILTER_INPUT_SELECTORS`

Selector string for filter/search inputs:

```javascript
'[data-filter-input], [data-search-input], input[type="search"],
 .filter-toolbar input, .search-box input'
```

---

## Global Escape Handler

FocusManager integrates with `Funky.Keyboard` to provide a global Escape handler with this priority:

1. **Command Palette** - Close sub-palette or palette
2. **Modal** - Close open modal
3. **Input Field** - Blur and pop focus
4. **Focus History** - Pop to previous element
5. **Main Region** - Focus main content as fallback

This creates a "back button" feel for keyboard users.

---

## Integration with Components

### Modal

```javascript
// Modal.show() uses focusAndPush
_focusFirstElement: function() {
  if (Funky.FocusManager) {
    Funky.FocusManager.focusAndPush(firstElement, {
      label: modalTitle
    });
  }
}

// Modal.hide() uses popFocus
hide: function() {
  if (Funky.FocusManager) {
    Funky.FocusManager.popFocus();
  }
}
```

### Command Palette

```javascript
open: function() {
  if (Funky.FocusManager) {
    Funky.FocusManager.focusAndPush(input, {
      label: 'Command Palette'
    });
  }
}

close: function() {
  if (Funky.FocusManager) {
    Funky.FocusManager.popFocus();
  }
}
```

### SideNav Filter

```javascript
// Enter on filter completes input
_handleSearchKeydown: function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    Funky.FocusManager.completeInput({
      element: this.elements.search,
      returnFocus: true
    });
  }
}
```

---

## CSS Focus Indicators

FocusManager works with CSS in `keyboard.css` for visual focus:

```css
/* Keyboard-only focus ring */
:focus-visible {
  outline: 2px solid var(--color-accent, #3b82f6);
  outline-offset: 2px;
}

/* Region indicator */
[data-nav-region]:focus-within {
  border-left: 3px solid var(--color-accent);
}

/* Active region (programmatic) */
.nav-region-active {
  outline: 2px solid var(--color-accent);
}
```

### Debug Mode

Add `debug-regions` class to body to see region labels:

```html
<body class="debug-regions">
```

---

## Preferences

Region Tab navigation is controlled by user preference:

```javascript
// Check if Tab should jump between regions
var enabled = Funky.Preferences.get('keyboard.regionTabNavigation');

// Default: false (standard browser Tab order)
```

---

## Accessibility

- **Screen Reader Announcements** - Region changes announced via `Funky.Announce`
- **Focus Visibility** - `:focus-visible` styling for keyboard users only
- **WCAG 2.4.3** - Logical focus order via region ordering
- **WCAG 2.4.7** - Visible focus indicators
- **High Contrast** - Respects `prefers-contrast: high`
- **Reduced Motion** - Respects `prefers-reduced-motion: reduce`

---

## Events

FocusManager does not emit its own events, but integrates with:

- `Funky.Announce.polite()` for screen reader announcements
- `Funky.PubSub.subscribe('spa.pageLoaded')` to rediscover regions on navigation
