# Funky.StickyHeader - Sticky Page Headers

Keeps page headers visible on scroll using IntersectionObserver.

## Overview

`Funky.StickyHeader` provides sticky header functionality using modern IntersectionObserver API for efficient scroll detection without scroll event listeners.

## API Reference

### Methods

#### `StickyHeader.init(options)`

Initialize sticky headers. Called automatically on page load.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Configuration options |

**Example:**
```javascript
// Basic init
Funky.StickyHeader.init();

// With options
Funky.StickyHeader.init({
  showShadow: true,
  compactOnStick: true,
  hideOnScrollDown: true
});
```

---

#### `StickyHeader.initElement(element, options)`

Initialize a specific header element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| element | string/Element | Yes | Selector or DOM element |
| options | object | No | Configuration options |

**Returns:** Header instance data

---

#### `StickyHeader.destroy(headerElement)`

Remove sticky behavior from a header.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| headerElement | Element | Yes | The header element |

---

#### `StickyHeader.destroyAll()`

Remove all sticky headers.

---

### Configuration Options

| Name | Type | Default | Description |
|------|------|---------|-------------|
| showShadow | boolean | `true` | Add shadow when sticky |
| compactOnStick | boolean | `false` | Reduce header height when sticky |
| hideSubtitle | boolean | `true` | Hide subtitle when sticky (via CSS) |
| hideOnScrollDown | boolean | `false` | Hide header when scrolling down |
| showOnScroll | boolean | `false` | Start hidden, show when user scrolls |
| showOnScrollThreshold | number | `10` | Scroll distance before header appears (px) |
| scrollThreshold | number | `50` | Scroll distance before hide kicks in (px) |
| scrollDelta | number | `5` | Minimum scroll delta to trigger hide/show |
| scrollContainer | Element/string | `null` | Scroll container (null = window) |
| selector | string | `'.page-header-sticky'` | Selector for auto-init |
| onStick | function | `null` | Callback: `function(header, isSticky)` |
| onHide | function | `null` | Callback: `function(header, isHidden)` |
| onShow | function | `null` | Callback: `function(header)` |

---

## CSS Class

Add `.page-header-sticky` to headers that should be sticky:

```html
<header class="page-header page-header-sticky">
  <h1>Page Title</h1>
</header>
```

## Behavior

1. A sentinel element is created above the header
2. IntersectionObserver watches the sentinel
3. When sentinel scrolls out of view, `is-sticky` class is added
4. Header transitions to fixed positioning with CSS

## CSS Styling

```css
.page-header-sticky {
  transition: all 0.2s ease;
}

.page-header-sticky.is-sticky {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
```

## Dependencies

None - uses native IntersectionObserver.

## Examples

### Basic Usage

```html
<header class="page-header page-header-sticky">
  <div class="d-flex justify-content-between align-items-center">
    <h1>Trades</h1>
    <button class="btn btn-primary">New Trade</button>
  </div>
</header>

<div class="page-content">
  <!-- Long content that scrolls -->
</div>
```

### Re-Initialize After SPA

```javascript
Funky.PubSub.on('funky:spa:loaded', function() {
  Funky.StickyHeader.init();
});
```

### Conditional Sticky

```javascript
// Only make sticky on large screens
if (window.innerWidth >= 992) {
  document.querySelector('.page-header').classList.add('page-header-sticky');
  Funky.StickyHeader.init();
}
```
