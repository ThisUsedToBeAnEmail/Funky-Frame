# Funky.PageAnimate

**File:** `public/assets/js/components/page-animate.js`

High-level page animation management with SPA integration.

---

## Overview

Funky.PageAnimate provides page-level animation orchestration, including entrance/exit transitions, scroll-triggered animations, and list stagger effects. It integrates seamlessly with Funky.SPA and Funky.Pages to enhance page transitions.

### Why Use Funky.PageAnimate?

- **Declarative Configuration** - Configure entire page animations via HTML attributes or JavaScript
- **SPA Integration** - Automatic page transition animations during navigation
- **Scroll Triggers** - IntersectionObserver-based scroll animations
- **Preset Library** - Common animation patterns ready to use
- **Flexible API** - Three ways to configure: JavaScript, attributes, or presets
- **Zero Configuration** - Works automatically with fallback to standard SPA transitions

---

## Features

- Page entrance/exit animation configuration
- Scroll-triggered animations (IntersectionObserver)
- Stagger animations for lists
- Preset pattern library
- Auto-initialization on page load and SPA navigation
- Attribute-based configuration
- Custom animation functions
- SPA/PWA integration

---

## API Reference

### Methods

#### register(pageName, config)

Register page animation configuration.

**Parameters:**
- `pageName` (string) - Name of the page (matches `data-page` attribute)
- `config` (Object) - Animation configuration
  - `enter` (Object|Function) - Entrance animation config or function
  - `exit` (Object|Function) - Exit animation config or function

**Returns:** `Object` - PageAnimate instance (chainable)

**Example:**
```javascript
// Simple configuration
Funky.PageAnimate.register('dashboard', {
  enter: { class: 'fade-in-up', duration: 400 },
  exit: { class: 'fade-out', duration: 300 }
});

// Custom function
Funky.PageAnimate.register('reports', {
  enter: function(page) {
    var header = page.querySelector('.page-header');
    var content = page.querySelector('.page-content');

    Funky.Animate.sequence([
      { element: header, options: { class: 'fade-in' } },
      { element: content, options: { class: 'slide-in-up', delay: 100 } }
    ]).start();
  },
  exit: { class: 'fade-out', duration: 200 }
});
```

---

#### getConfig(pageName)

Get configuration for a page.

**Parameters:**
- `pageName` (string) - Name of the page

**Returns:** `Object` - Animation configuration (or 'default' config, or empty object)

**Example:**
```javascript
var config = Funky.PageAnimate.getConfig('dashboard');
```

---

#### enter(pageElement, pageName)

Animate page entrance.

**Parameters:**
- `pageElement` (HTMLElement) - Page element
- `pageName` (string) - Name of the page

**Example:**
```javascript
var page = document.querySelector('[data-page="dashboard"]');
Funky.PageAnimate.enter(page, 'dashboard');
```

---

#### exit(pageElement, pageName, onComplete)

Animate page exit.

**Parameters:**
- `pageElement` (HTMLElement) - Page element
- `pageName` (string) - Name of the page
- `onComplete` (Function) - Callback when animation completes

**Example:**
```javascript
var page = document.querySelector('[data-page="dashboard"]');
Funky.PageAnimate.exit(page, 'dashboard', function() {
  console.log('Exit animation complete');
});
```

---

#### initScrollAnimations(container)

Initialize scroll-triggered animations using IntersectionObserver.

**Parameters:**
- `container` (string|HTMLElement) - Container to search in (default: document)

**Returns:** `IntersectionObserver` - Observer instance

**Example:**
```javascript
// Initialize for entire document
Funky.PageAnimate.initScrollAnimations();

// Initialize for specific container
Funky.PageAnimate.initScrollAnimations('#main-content');
```

**HTML Usage:**
```html
<div data-animate="fade-in-up" data-animate-trigger="in-view">
  Animates when scrolled into view
</div>

<div data-animate="slide-in-right"
     data-animate-trigger="in-view"
     data-animate-once="true"
     data-animate-duration="600">
  Animates once with custom duration
</div>
```

---

#### animateList(selector, options)

Animate list with stagger effect.

**Parameters:**
- `selector` (string|NodeList|Array) - Elements to animate
- `options` (Object)
  - `class` (string) - Animation class (default: 'fade-in-up')
  - `stagger` (number) - Delay between items (default: 75ms)
  - `trigger` (string) - 'immediate' or 'in-view' (default: 'immediate')

**Returns:** `Object` - Stagger control or IntersectionObserver

**Example:**
```javascript
// Animate immediately
Funky.PageAnimate.animateList('.trade-list .trade-item', {
  class: 'fade-in-up',
  stagger: 50
});

// Animate when scrolled into view
Funky.PageAnimate.animateList('.recent-activity', {
  class: 'slide-in-left',
  stagger: 100,
  trigger: 'in-view'
});
```

---

#### usePreset(pageName, presetName)

Apply a preset animation to a page.

**Parameters:**
- `pageName` (string) - Name of the page
- `presetName` (string) - Name of the preset

**Returns:** `Object` - PageAnimate instance (chainable)

**Example:**
```javascript
Funky.PageAnimate.usePreset('trades', 'slideRight');
Funky.PageAnimate.usePreset('dashboard', 'dashboard');
```

---

#### initAutoAnimateChildren(container)

Auto-add animation attributes to child text elements within containers.

**Parameters:**
- `container` (string|HTMLElement) - Container to search in (default: document)

**Example:**
```javascript
// Initialize for entire document (done automatically in init())
Funky.PageAnimate.initAutoAnimateChildren();

// Initialize for specific container
Funky.PageAnimate.initAutoAnimateChildren('#dynamic-content');
```

**HTML Usage:**
```html
<!-- All text elements inside will animate on scroll -->
<section data-animate-children="in-view">
  <h1>Auto-animates with default fade-in</h1>
  <p>This paragraph also animates</p>
  <p>And this one too</p>
</section>

<!-- Custom animation class -->
<section data-animate-children="in-view" data-animate-class="slide-in-right">
  <h2>Slides in from right</h2>
  <p>So does this text</p>
</section>

<!-- Override specific elements -->
<section data-animate-children="in-view">
  <h1>Uses default fade-in</h1>
  <p data-animate="scale-fade-in">Uses scale animation instead!</p>
  <p>Back to default</p>
</section>
```

**Supported Elements:**
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `li`, `blockquote`

**Features:**
- Respects existing `data-animate` attributes (allows overrides)
- Defaults to `fade-in` animation
- Defaults to `in-view` trigger
- Automatically sets `data-animate-once="true"` for scroll-triggered animations

---

#### init(container)

Auto-initialize scroll animations and attribute-based configurations.

**Parameters:**
- `container` (string|HTMLElement) - Container to initialize in (default: document)

**Example:**
```javascript
// Initialize on page load (done automatically)
Funky.PageAnimate.init();

// Initialize for dynamically loaded content
Funky.PageAnimate.init('#dynamic-content');
```

**Note:** This method automatically calls `initAutoAnimateChildren()`, `initScrollAnimations()`, and `initStagger()`.

---

## Presets

Built-in animation patterns:

### fade
Simple fade in/out transitions.
```javascript
{
  enter: { class: 'fade-in', duration: 300 },
  exit: { class: 'fade-out', duration: 200 }
}
```

### slideRight
Slide in from right, slide out to left (mobile-style).
```javascript
{
  enter: { class: 'slide-in-right', duration: 400 },
  exit: { class: 'slide-out-left', duration: 300 }
}
```

### slideLeft
Slide in from left, slide out to right.
```javascript
{
  enter: { class: 'slide-in-left', duration: 400 },
  exit: { class: 'slide-out-right', duration: 300 }
}
```

### scale
Scale and fade transition.
```javascript
{
  enter: { class: 'scale-fade-in', duration: 400 },
  exit: { class: 'scale-fade-out', duration: 300 }
}
```

### dashboard
Sequential header then content animation.
```javascript
{
  enter: function(page) {
    var header = page.querySelector('.page-header');
    var content = page.querySelector('.page-content');

    if (header && content) {
      Funky.Animate.sequence([
        { element: header, options: { class: 'fade-in' } },
        { element: content, options: { class: 'fade-in-up', delay: 100 } }
      ]).start();
    } else {
      Funky.Animate.animate(page, { class: 'fade-in' });
    }
  },
  exit: { class: 'fade-out', duration: 200 }
}
```

---

## Attribute-Based API

Configure animations directly in HTML:

### Page Animation Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-page` | Page name | Page identifier |
| `data-page-animate` | Preset name | Apply preset animation |
| `data-animate` | CSS class | Animation class to use |
| `data-animate-trigger` | `in-view`, `immediate` | When to trigger |
| `data-animate-duration` | Milliseconds | Custom duration |
| `data-animate-once` | `true`, `false` | Animate only once |
| `data-animate-stagger` | Milliseconds | Stagger child animations (CSS-only) |
| `data-animate-children` | `in-view`, `immediate` | Auto-animate child text elements |
| `data-animate-class` | CSS class | Custom class for auto-animated children |

### Examples

**Page with Preset:**
```html
<div class="page-content" data-page="dashboard" data-page-animate="dashboard">
  <div class="page-header">
    <h1>Dashboard</h1>
  </div>
  <div class="page-content">
    <!-- Content -->
  </div>
</div>
```

**Scroll-Triggered:**
```html
<div data-animate="fade-in-up" data-animate-trigger="in-view">
  Animates when scrolled into view
</div>

<div data-animate="slide-in-right"
     data-animate-trigger="in-view"
     data-animate-once="true">
  Animates once only
</div>
```

**Stagger Children:**
```html
<div class="metrics-grid" data-animate-stagger="100">
  <div data-animate="fade-in-up">Metric 1</div>
  <div data-animate="fade-in-up">Metric 2</div>
  <div data-animate="fade-in-up">Metric 3</div>
</div>
```

**Auto-Animate Children:**
```html
<!-- All text inside animates automatically -->
<section data-animate-children="in-view">
  <h2>This heading animates</h2>
  <p>This paragraph animates</p>
  <p>And this one too</p>
</section>

<!-- With custom animation class -->
<section data-animate-children="in-view" data-animate-class="slide-in-right">
  <h2>Slides in from right</h2>
  <p>So does this</p>
</section>

<!-- With overrides -->
<section data-animate-children="in-view">
  <h2>Default fade-in</h2>
  <p data-animate="scale-fade-in">Custom scale animation!</p>
  <p>Back to default</p>
</section>
```

---

## Integration

### SPA Integration

PageAnimate hooks into SPA page transitions automatically:

**In `spa.js`:**
- Exit animation runs before page navigation
- Enter animation runs after new content loaded
- Falls back to standard CSS transitions if PageAnimate unavailable

**How it works:**
```javascript
// On navigation, SPA calls:
Funky.PageAnimate.exit(currentPage, pageName, function() {
  // Load new content
  Funky.PageAnimate.enter(newPage, pageName);
});
```

### Pages Integration

PageAnimate hooks into Funky.Pages lifecycle:

**In `pages.js`:**
- `PageAnimate.enter()` called on page mount
- `PageAnimate.init()` called to setup scroll animations
- Exit animations handled by SPA before unmount

**How it works:**
```javascript
// When page mounts:
Funky.PageAnimate.enter(pageElement, pageId);
Funky.PageAnimate.init(pageElement);
```

### Auto-Initialization

PageAnimate auto-initializes on:
- `DOMContentLoaded` - Initial page load
- `spa:pageload` - SPA navigation

---

## Complete Examples

### Example 1: Dashboard Page

**JavaScript:**
```javascript
Funky.PageAnimate.register('dashboard', {
  enter: { class: 'fade-in-up', duration: 400 },
  exit: { class: 'fade-out', duration: 300 }
});
```

**HTML:**
```html
<div data-page="dashboard">
  <h1>Dashboard</h1>
  <div class="metrics" data-animate-stagger="75">
    <div data-animate="fade-in-up">Metric 1</div>
    <div data-animate="fade-in-up">Metric 2</div>
    <div data-animate="fade-in-up">Metric 3</div>
  </div>
</div>
```

---

### Example 2: Using Presets

**JavaScript:**
```javascript
// Apply preset via JavaScript
Funky.PageAnimate.usePreset('trades', 'slideRight');
```

**HTML (Alternative):**
```html
<!-- Apply preset via HTML attribute -->
<div data-page="trades" data-page-animate="slideRight">
  <h1>Trades</h1>
</div>
```

---

### Example 3: Custom Animation Function

**JavaScript:**
```javascript
Funky.PageAnimate.register('reports', {
  enter: function(page) {
    // Custom entrance sequence
    var header = page.querySelector('.page-header');
    var tabs = page.querySelector('.report-tabs');
    var content = page.querySelector('.report-content');

    Funky.Animate.sequence([
      { element: header, options: { class: 'fade-in' } },
      { element: tabs, options: { class: 'slide-in-right', delay: 100 } },
      { element: content, options: { class: 'fade-in-up', delay: 200 } }
    ]).start();
  },
  exit: function(page, onComplete) {
    // Custom exit animation
    Funky.Animate.fade(page, 'out', {
      duration: 200,
      onEnd: onComplete
    });
  }
});
```

---

### Example 4: Scroll Animations

**HTML:**
```html
<div class="page-content">
  <!-- Scroll-triggered sections -->
  <section data-animate="fade-in-up" data-animate-trigger="in-view">
    <h2>Section 1</h2>
  </section>

  <section data-animate="slide-in-left"
           data-animate-trigger="in-view"
           data-animate-once="true">
    <h2>Section 2</h2>
  </section>

  <!-- Stagger list when scrolled into view -->
  <div class="activity-list" data-animate-stagger="100">
    <div data-animate="fade-in-up">Activity 1</div>
    <div data-animate="fade-in-up">Activity 2</div>
    <div data-animate="fade-in-up">Activity 3</div>
  </div>
</div>
```

---

## IntersectionObserver

PageAnimate uses IntersectionObserver for efficient scroll-triggered animations:

**Configuration:**
```javascript
{
  threshold: 0.1,              // Trigger when 10% visible
  rootMargin: '0px 0px -50px 0px'  // Trigger slightly before viewport
}
```

**Benefits:**
- Performance: Only monitors visibility, no scroll listeners
- Battery-friendly: Native browser API
- Automatic cleanup: Observers can be unobserved after animation

---

## Performance

### Optimization Strategies

1. **IntersectionObserver** - Efficient scroll animation triggers
2. **Once-only animations** - Use `data-animate-once="true"` to unobserve after first animation
3. **Graceful fallback** - Falls back to CSS transitions if PageAnimate unavailable
4. **No animation overhead** - Only elements with attributes are observed

### Performance Verification

```bash
# Verify IntersectionObserver usage
grep -n "IntersectionObserver" public/assets/js/components/page-animate.js

# Verify SPA integration
grep -n "PageAnimate" public/assets/js/core/spa.js
grep -n "PageAnimate" public/assets/js/core/pages.js
```

---

## Dependencies

- **Funky.Animate** - Core animation primitives
- **Funky.Dom** - DOM manipulation utilities
- **Funky.Events** - Event system

---

## See Also

- [Funky.Animate](../core/animate.md) - Core animation API
- [Funky.SPA](../core/spa.md) - Single Page Application
- [Funky.Pages](../core/pages.md) - Page lifecycle management
- [CSS Keyframes](/assets/css/animate.css) - Animation definitions
