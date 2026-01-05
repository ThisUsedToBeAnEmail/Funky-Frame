# Funky.VisibilityObserver - Element Visibility Tracking

A centralized utility for tracking element visibility using IntersectionObserver.

## Overview

`Funky.VisibilityObserver` provides a consistent, reusable API for tracking when elements enter or leave the viewport. It replaces scattered IntersectionObserver implementations across components with a unified pattern.

## Key Features

- **Factory Pattern** - Create multiple observer instances with different configurations
- **Chainable API** - Methods return `this` for method chaining
- **One-Shot Observation** - `observeOnce()` for animations that should only trigger once
- **PubSub Integration** - Emits events on visibility changes
- **Instance Registry** - Track and manage all observer instances
- **Graceful Degradation** - Handles missing IntersectionObserver support

## API Reference

### Factory Methods

#### `VisibilityObserver.init(options)`

Create a new observer instance.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options.threshold | number | 0.1 | Visibility threshold (0-1) |
| options.rootMargin | string | '0px' | Margin around viewport |
| options.root | Element | null | Scroll container (null = viewport) |
| options.onVisible | function | null | Global callback when element becomes visible |
| options.onHidden | function | null | Global callback when element becomes hidden |

**Returns:** `VisibilityObserverInstance`

**Example:**
```javascript
var observer = Funky.VisibilityObserver.init({
  threshold: 0.1,
  rootMargin: '50px',
  onVisible: function(element, entry) {
    console.log('Element visible:', element);
  },
  onHidden: function(element, entry) {
    console.log('Element hidden:', element);
  }
});
```

---

#### `VisibilityObserver.getInstance(id)`

Get an observer instance by ID.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | The observer ID |

**Returns:** `VisibilityObserverInstance|null`

---

#### `VisibilityObserver.getAll()`

Get all active observer instances.

**Returns:** `VisibilityObserverInstance[]`

---

#### `VisibilityObserver.destroyAll()`

Destroy all observer instances.

---

### Instance Methods

#### `observer.observe(selector, options)`

Start observing an element for visibility changes.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string\|HTMLElement | CSS selector or element reference |
| options.onVisible | function | Per-element visible callback |
| options.onHidden | function | Per-element hidden callback |
| options.once | boolean | Unobserve after first visibility |

**Returns:** `this` (chainable)

**Example:**
```javascript
observer.observe('#my-element', {
  onVisible: function(el) {
    el.classList.add('in-view');
  },
  onHidden: function(el) {
    el.classList.remove('in-view');
  }
});
```

---

#### `observer.observeOnce(selector, callback)`

Observe an element until it becomes visible once, then auto-unobserve.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string\|HTMLElement | CSS selector or element reference |
| callback | function | Called when element becomes visible |

**Returns:** `this` (chainable)

**Example:**
```javascript
observer.observeOnce('.animate-on-scroll', function(el) {
  el.classList.add('animated');
});
```

---

#### `observer.observeAll(selector, options)`

Observe multiple elements matching a selector.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string | CSS selector for multiple elements |
| options | object | Same options as `observe()` |

**Returns:** `this` (chainable)

**Example:**
```javascript
observer.observeAll('.lazy-image', {
  onVisible: function(el) {
    el.src = el.dataset.src;
  },
  once: true
});
```

---

#### `observer.unobserve(selector)`

Stop observing an element.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| selector | string\|HTMLElement | CSS selector or element reference |

**Returns:** `this` (chainable)

---

#### `observer.isVisible(element)`

Check if an element is currently visible.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| element | HTMLElement | Element to check |

**Returns:** `boolean`

---

#### `observer.getVisible()`

Get all currently visible elements.

**Returns:** `HTMLElement[]`

---

#### `observer.count()`

Get the number of observed elements.

**Returns:** `number`

---

#### `observer.getId()`

Get the observer's unique ID.

**Returns:** `string`

---

#### `observer.destroy()`

Clean up the observer and release all resources.

---

## PubSub Events

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:visibility:visible` | `{ element, entry, observerId }` | Element became visible |
| `funky:visibility:hidden` | `{ element, entry, observerId }` | Element became hidden |

**Example:**
```javascript
Funky.PubSub.on('funky:visibility:visible', function(data) {
  console.log('Element visible:', data.element);
  console.log('Observer ID:', data.observerId);
});
```

---

## Usage Examples

### Scroll-Triggered Animations

```javascript
var animObserver = Funky.VisibilityObserver.init({
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px'
});

// Animate elements when they scroll into view
animObserver.observeAll('[data-animate]', {
  onVisible: function(el) {
    var animClass = el.dataset.animate || 'fade-in';
    el.classList.add(animClass);
  },
  once: true
});
```

### Lazy Loading Images

```javascript
var lazyObserver = Funky.VisibilityObserver.init({
  rootMargin: '100px' // Load 100px before visible
});

lazyObserver.observeAll('img[data-src]', {
  onVisible: function(img) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  },
  once: true
});
```

### Sticky Header Detection

```javascript
var stickyObserver = Funky.VisibilityObserver.init({
  threshold: 0,
  onVisible: function(sentinel) {
    header.classList.remove('is-sticky');
  },
  onHidden: function(sentinel) {
    header.classList.add('is-sticky');
  }
});

stickyObserver.observe(sentinelElement);
```

### Infinite Scroll

```javascript
var scrollObserver = Funky.VisibilityObserver.init({
  rootMargin: '200px'
});

scrollObserver.observe(loadMoreTrigger, {
  onVisible: function() {
    if (!isLoading && hasMoreContent) {
      loadMoreContent();
    }
  }
});
```

---

## Components Using VisibilityObserver

- `PageAnimate` - Scroll-triggered animations
- `StickyHeader` - Sticky state detection
- `Table` - Responsive breakpoint recalculation
- `CardGrid` - Infinite scroll fallback

---

## Dependencies

- `js/core/namespace.js`
- `js/core/registry.js`
- `js/core/pubsub.js` (optional, for events)
