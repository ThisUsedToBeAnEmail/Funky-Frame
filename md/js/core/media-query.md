# Funky.MediaQuery - Centralized Media Query Manager

Provides shared matchMedia listeners with named breakpoints for responsive and accessibility-aware components.

## Overview

`Funky.MediaQuery` is a singleton service that centralizes media query management. Multiple components can subscribe to the same query, sharing a single `matchMedia` listener. This reduces duplicate code and ensures consistent breakpoint handling across the application.

## Key Features

- **Shared Listeners** - One matchMedia listener per unique query
- **Named Breakpoints** - Predefined breakpoints for consistency
- **PubSub Integration** - Emits events on media query changes
- **Lazy Initialization** - Only creates listeners when subscribed
- **Automatic Cleanup** - Removes listeners when last subscriber leaves

## API Reference

### Methods

#### `MediaQuery.subscribe(options)`

Subscribe to a media query.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options.breakpoint | string | No* | Named breakpoint (e.g., 'mobile') |
| options.query | string | No* | Custom query string |
| options.namespace | string | Yes | Unique identifier for cleanup |
| options.onChange | function | Yes | Callback function(matches) |
| options.immediate | boolean | No | Call onChange immediately (default: true) |

*One of `breakpoint` or `query` is required.

**Returns:** `boolean` - Success

**Example:**
```javascript
Funky.MediaQuery.subscribe({
  breakpoint: 'mobile',
  namespace: 'my-component',
  onChange: function(matches) {
    console.log('Mobile mode:', matches);
  }
});
```

---

#### `MediaQuery.unsubscribe(namespace)`

Remove subscription by namespace.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| namespace | string | Yes | The namespace to unsubscribe |

**Returns:** `boolean` - Success

**Example:**
```javascript
Funky.MediaQuery.unsubscribe('my-component');
```

---

#### `MediaQuery.matches(nameOrQuery)`

Check if a media query currently matches without subscribing.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| nameOrQuery | string | Yes | Breakpoint name or query string |

**Returns:** `boolean`

**Example:**
```javascript
if (Funky.MediaQuery.matches('mobile')) {
  // Apply mobile layout
}

if (Funky.MediaQuery.matches('(min-width: 1400px)')) {
  // Custom query check
}
```

---

#### `MediaQuery.getBreakpoints()`

Get all predefined breakpoints.

**Returns:** `Object` - Map of name to query string

**Example:**
```javascript
var breakpoints = Funky.MediaQuery.getBreakpoints();
console.log(breakpoints.mobile); // '(max-width: 767px)'
```

---

#### `MediaQuery.addBreakpoint(name, query)`

Add a custom named breakpoint.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | Yes | Breakpoint name |
| query | string | Yes | Media query string |

**Returns:** `boolean` - Success (false if name exists)

**Example:**
```javascript
Funky.MediaQuery.addBreakpoint('sidebar-collapse', '(max-width: 900px)');
```

---

#### `MediaQuery.isSubscribed(namespace)`

Check if namespace is currently subscribed.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| namespace | string | Yes | Namespace to check |

**Returns:** `boolean`

---

#### `MediaQuery.getSubscriptions()`

Get all active subscriptions.

**Returns:** `Object` - Map of namespace to query string

## Predefined Breakpoints

| Name | Query | Use Case |
|------|-------|----------|
| `mobile` | `(max-width: 767px)` | Mobile devices |
| `tablet` | `(max-width: 1023px)` | Tablets and below |
| `tablet-only` | `(min-width: 768px) and (max-width: 1023px)` | Tablets only |
| `desktop` | `(min-width: 1024px)` | Desktop and above |
| `large` | `(min-width: 1200px)` | Large screens |
| `xlarge` | `(min-width: 1440px)` | Extra large screens |
| `portrait` | `(orientation: portrait)` | Portrait orientation |
| `landscape` | `(orientation: landscape)` | Landscape orientation |
| `touch` | `(pointer: coarse)` | Touch devices |
| `mouse` | `(pointer: fine)` | Mouse/trackpad devices |
| `hover` | `(hover: hover)` | Devices with hover support |
| `reduced-motion` | `(prefers-reduced-motion: reduce)` | Accessibility preference |
| `dark-mode` | `(prefers-color-scheme: dark)` | Dark theme preference |
| `light-mode` | `(prefers-color-scheme: light)` | Light theme preference |
| `high-contrast` | `(prefers-contrast: more)` | High contrast preference |

## PubSub Events

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:mediaquery:change` | `{ query, matches, breakpoint }` | Any query change |
| `funky:mediaquery:{name}` | `{ matches }` | Named breakpoint change |

**Example:**
```javascript
Funky.PubSub.on('funky:mediaquery:mobile', function(data) {
  console.log('Mobile mode:', data.matches);
});

Funky.PubSub.on('funky:mediaquery:change', function(data) {
  console.log('Query changed:', data.query, data.matches);
});
```

## Usage Patterns

### Responsive Components

```javascript
function MyComponent() {
  var self = this;
  this.isMobile = false;
  
  Funky.MediaQuery.subscribe({
    breakpoint: 'mobile',
    namespace: 'mycomponent-' + this.id,
    onChange: function(matches) {
      self.isMobile = matches;
      self.updateLayout();
    }
  });
}

MyComponent.prototype.destroy = function() {
  Funky.MediaQuery.unsubscribe('mycomponent-' + this.id);
};
```

### Accessibility: Reduced Motion

```javascript
function prefersReducedMotion() {
  if (Funky.MediaQuery) {
    return Funky.MediaQuery.matches('reduced-motion');
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Use in animations
if (prefersReducedMotion()) {
  element.style.transition = 'none';
}
```

### Theme Detection

```javascript
Funky.MediaQuery.subscribe({
  breakpoint: 'dark-mode',
  namespace: 'theme-auto',
  onChange: function(matches) {
    document.body.setAttribute('data-theme', matches ? 'dark' : 'light');
  }
});
```

### One-Time Check

```javascript
// No subscription needed for simple checks
if (Funky.MediaQuery.matches('touch')) {
  enableTouchOptimizations();
}
```

## Integration with Funky Core

- **Funky.PubSub** - Emits events on query changes
- **Funky.Registry** - Registered as singleton service

## Browser Support

Uses modern `addEventListener('change')` API with fallback to deprecated `addListener()` for older browsers.

## File Location

`/public/assets/js/core/media-query.js`

## See Also

- [Funky.PubSub](pubsub.md) - Event bus for subscriptions
- [THEMING.md](/docs/THEMING.md) - Theme and density system
