# Funky.Timing - Rate Limiting Utilities

Throttle and debounce functions for performance optimization.

## Overview

`Funky.Timing` provides utilities for controlling the rate of function execution. These are essential for handling high-frequency events like scrolling, resizing, and user input.

## API Reference

### Methods

#### `Timing.throttle(fn, limit)`

Throttle function execution - ensures function runs at most once per interval.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fn | function | Yes | Function to throttle |
| limit | number | Yes | Minimum time between calls (ms) |

**Returns:** `function` - Throttled function

**Example:**
```javascript
var throttledScroll = Funky.Timing.throttle(function() {
  console.log('Scroll position:', window.scrollY);
}, 100);

window.addEventListener('scroll', throttledScroll);
```

---

#### `Timing.debounce(fn, delay)`

Debounce function execution - delays execution until pause in calls.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fn | function | Yes | Function to debounce |
| delay | number | Yes | Delay in milliseconds |

**Returns:** `function` - Debounced function

**Example:**
```javascript
var debouncedSearch = Funky.Timing.debounce(function(query) {
  Funky.Api.get('/api/search?q=' + query);
}, 300);

searchInput.addEventListener('input', function(e) {
  debouncedSearch(e.target.value);
});
```

---

#### `Timing.raf(fn)`

RequestAnimationFrame wrapper with fallback.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fn | function | Yes | Function to call on next frame |

**Returns:** `number` - Animation frame ID

**Example:**
```javascript
function animate() {
  updatePosition();
  Funky.Timing.raf(animate);
}
Funky.Timing.raf(animate);
```

---

#### `Timing.cancelRaf(id)`

Cancel animation frame.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | number | Yes | Animation frame ID |

**Example:**
```javascript
var animationId = Funky.Timing.raf(animate);
// Later...
Funky.Timing.cancelRaf(animationId);
```

## Throttle vs Debounce

| Behavior | Throttle | Debounce |
|----------|----------|----------|
| First call | Executes immediately | Waits for delay |
| During activity | Executes every N ms | Keeps delaying |
| After activity | No trailing call | Executes once |
| Best for | Scroll, resize | Search, validation |

## Dependencies

None - this is a core module.

## Examples

### Resize Handler

```javascript
// Throttle: update layout max once per 200ms
var handleResize = Funky.Timing.throttle(function() {
  recalculateLayout();
}, 200);

window.addEventListener('resize', handleResize);
```

### Search Input

```javascript
// Debounce: wait for user to stop typing
var search = Funky.Timing.debounce(function(query) {
  Funky.Api.get('/api/search?q=' + encodeURIComponent(query))
    .then(function(results) {
      renderResults(results.data);
    });
}, 300);

document.getElementById('searchBox').addEventListener('input', function(e) {
  search(e.target.value);
});
```

### Scroll Spy

```javascript
// Update active nav item while scrolling
var updateActiveSection = Funky.Timing.throttle(function() {
  var sections = document.querySelectorAll('section');
  var current = '';
  
  sections.forEach(function(section) {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.id;
    }
  });
  
  highlightNavItem(current);
}, 100);

window.addEventListener('scroll', updateActiveSection);
```

### Form Validation

```javascript
// Validate after user stops typing
var validateField = Funky.Timing.debounce(function(field) {
  var value = field.value;
  var isValid = validateEmail(value);
  field.classList.toggle('is-invalid', !isValid);
}, 500);

emailInput.addEventListener('input', function() {
  validateField(this);
});
```
