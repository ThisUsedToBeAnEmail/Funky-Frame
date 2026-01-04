# Funky.Morph

FLIP-based animation engine for smooth element transitions, shared element morphs, and list animations.

## Overview

Funky.Morph provides fluid animations using the FLIP (First, Last, Invert, Play) technique. Perfect for:
- Card-to-modal expansions
- Thumbnail-to-lightbox transitions
- Animated list add/remove/reorder
- Shared element transitions

## Quick Start

### Basic Morph

```javascript
// Expand card to modal
Funky.Morph.to({
  from: '#card',
  to: '#modal',
  preset: 'expand',
  onComplete: function() {
    console.log('Morph complete!');
  }
});

// Reverse (close modal)
Funky.Morph.reverse('#modal');
```

### Shared Element Transition

```javascript
Funky.Morph.shared({
  from: '.card',
  to: '.modal',
  children: ['image', 'title', 'description'],
  duration: 400
});
```

### List Animations

```javascript
var list = Funky.Morph.list('#my-list', {
  enterFrom: 'right',
  exitTo: 'left',
  stagger: 50
});

list.add('<li>New Item</li>');
list.remove('[data-item="old"]');
list.reorder(['c', 'a', 'b']);
```

## API Reference

### Funky.Morph.to(config)

Morph from one element to another.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `from` | string\|Element | required | Source element or selector |
| `to` | string\|Element | required | Target element or selector |
| `preset` | string | - | Animation preset name |
| `duration` | number | `300` | Duration in ms |
| `easing` | string | `'ease-out'` | CSS easing or named easing |
| `scale` | boolean | `true` | Animate scale changes |
| `opacity` | boolean | `true` | Animate opacity |
| `manageFocus` | boolean | `true` | Auto manage focus |
| `enableEscapeClose` | boolean | `true` | Escape key reverses |
| `trapFocus` | boolean | `false` | Trap focus in target |
| `announceToScreenReader` | boolean | `true` | Enable announcements |
| `onStart` | function | - | Start callback |
| `onComplete` | function | - | Complete callback |
| `onCancel` | function | - | Cancel callback |

**Returns:** Controller with `{ id, cancel() }`

### Funky.Morph.reverse(target, options)

Reverse a morph back to source.

```javascript
Funky.Morph.reverse('#modal');
Funky.Morph.reverse('#modal', { duration: 200 });
```

### Funky.Morph.shared(config)

Shared element transition with matched children.

```javascript
Funky.Morph.shared({
  from: '.card',
  to: '.modal',
  children: ['image', 'title'],  // Match by data-morph-child
  stagger: 50,
  duration: 400
});
```

### Funky.Morph.list(container, options)

Create an animated list manager.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | `300` | Animation duration |
| `stagger` | number | `50` | Delay between items |
| `enterFrom` | string | `'bottom'` | Enter direction |
| `exitTo` | string | `'top'` | Exit direction |
| `itemSelector` | string | `'[data-morph-item]'` | Item selector |
| `swipeToRemove` | boolean | `false` | Enable swipe gesture |

**Directions:** `'left'`, `'right'`, `'top'`, `'bottom'`, `'scale'`, `'fade'`

#### List Methods

```javascript
var list = Funky.Morph.list('#list');

list.add('<li>Item</li>');          // Add at end
list.add(element, { position: 0 }); // Add at position
list.remove(0);                     // Remove by index
list.remove('[data-id="x"]');       // Remove by selector
list.reorder(['b', 'a', 'c']);      // Reorder by IDs
list.batch(function() {             // Batch operations
  this.add(item1);
  this.add(item2);
  this.remove(old);
});
list.getOrder();                    // Get current order
list.count();                       // Get item count
list.destroy();                     // Cleanup
```

### Funky.Morph.cancel(morphId)

Cancel an active morph by ID.

### Funky.Morph.cancelAll()

Cancel all active morphs.

## Presets

| Preset | Description | Use Case |
|--------|-------------|----------|
| `expand` | Scale from center with fade | Cards to modals |
| `slide` | Slide from position | Panel transitions |
| `fade` | Cross-fade only | Subtle swaps |
| `flip` | 3D card flip | Card reveals |
| `morph` | Full FLIP | Complex transitions |
| `zoom` | Scale with bounce | Attention |
| `hero` | Optimized for images | Galleries |

```javascript
// Use preset
Funky.Morph.to({
  from: '#card',
  to: '#modal',
  preset: 'expand'
});

// Register custom preset
Funky.Morph.registerPreset('custom', {
  duration: 400,
  easing: 'bounce',
  scale: true
});

// Get available presets
Funky.Morph.getPresets(); // ['expand', 'slide', ...]
```

## Easings

Named easings with cubic-bezier values:

| Name | Description |
|------|-------------|
| `standard` | Material standard |
| `decelerate` | Fast start |
| `accelerate` | Slow start |
| `overshoot` | Bounce past target |
| `bounce` | Elastic bounce |
| `anticipate` | Pull back first |
| `easeIn/Out/InOut` | Standard curves |
| `backIn/Out/InOut` | Overshoot curves |

```javascript
Funky.Morph.to({
  from: '#a',
  to: '#b',
  easing: 'overshoot'
});

Funky.Morph.getEasings(); // All available
```

## Spring Animation

Physics-based spring animation:

```javascript
Funky.Morph.spring({
  from: 0,
  to: 1,
  stiffness: 120,  // Spring stiffness
  damping: 14,     // Damping ratio
  mass: 1,         // Mass
  onUpdate: function(progress, position) {
    element.style.transform = 'scale(' + progress + ')';
  },
  onComplete: function() {
    console.log('Settled!');
  }
});
```

## Shared Elements

Match elements between source and target using `data-morph-child`:

```html
<!-- Source -->
<div class="card" data-morph-id="product-1">
  <img data-morph-child="image" src="thumb.jpg">
  <h3 data-morph-child="title">Product</h3>
</div>

<!-- Target -->
<div class="modal" data-morph-id="product-1">
  <img data-morph-child="image" src="large.jpg">
  <h2 data-morph-child="title">Product Details</h2>
</div>
```

```javascript
Funky.Morph.shared({
  from: '.card',
  to: '.modal',
  children: ['image', 'title']
});
```

## Accessibility

### Reduced Motion

Automatically respects `prefers-reduced-motion`:

```javascript
Funky.Morph.prefersReducedMotion(); // Check preference

// Configure per-morph
Funky.Morph.to({
  from: '#a',
  to: '#b',
  respectMotion: true,        // Default
  reducedMotionDuration: 100  // Quick fade fallback
});
```

### Focus Management

Focus is automatically managed:
- Saved before morph
- Moved to target after complete
- Returned on reverse

Control with markers:
```html
<div class="modal">
  <button data-morph-focus>First focus</button>
  <input autofocus>
</div>
```

### Keyboard

- **Escape** - Reverses open morph (uses Funky.Keyboard if available)

### Screen Reader

Announcements via ARIA live region:
- "Opening [content name]"
- "[Content name] opened"
- "Closing content"

## CSS Variables

```css
/* Timing */
--morph-duration: 300ms;
--morph-easing: cubic-bezier(0.4, 0, 0.2, 1);
--morph-stagger: 50ms;

/* Clone styling */
--morph-clone-shadow: var(--pro-shadow-lg);
--morph-clone-radius: var(--pro-radius-md);

/* Overlay */
--morph-overlay-bg: rgba(0, 0, 0, 0.5);
--morph-overlay-blur: 4px;

/* Z-index */
--morph-z-overlay: 9998;
--morph-z-clone: 10000;
--morph-z-target: 10001;
```

## Theme Support

Automatically adapts to themes:
- Light theme: lighter overlay
- Even Funkyer: gradient overlay, neon clone shadows
- High contrast: solid borders, no shadows

## Events

```javascript
// Via Funky.Events
E.on(document, 'morph:start', handler);
E.on(document, 'morph:complete', handler);
E.on(document, 'morph:reverse', handler);
E.on(document, 'morph:cancel', handler);

// List events
E.on(document, 'morphlist:add', handler);
E.on(document, 'morphlist:remove', handler);
E.on(document, 'morphlist:reorder', handler);
E.on(document, 'morphlist:batch', handler);
```

## Utilities

```javascript
Funky.Morph.isMorphing(element);    // Check if morphing
Funky.Morph.getActiveMorph(element); // Get active morph
Funky.Morph.resolveEasing('bounce'); // Get CSS value
Funky.Morph.createFocusTrap(el);     // Manual focus trap
Funky.Morph.announce('Message');     // Screen reader
Funky.Morph.watchReducedMotion(fn);  // Listen for changes
```

## Dependencies

**Required:**
- Funky.Dom
- Funky.Events

**Optional (enhanced features):**
- Funky.Keyboard - Scoped escape key handling
- Funky.GestureTracker - Swipe-to-remove in lists
- Funky.PubSub - Cross-component events
- Funky.Preferences - User animation settings

## Examples

### Card to Modal Expansion

```html
<!-- Product card -->
<article class="product-card" data-morph-id="product-123">
  <img data-morph-child="image" src="thumb.jpg" alt="Product">
  <h3 data-morph-child="title">Widget Pro</h3>
  <p data-morph-child="price">$99.00</p>
  <button class="view-details">View Details</button>
</article>

<!-- Product modal (hidden initially) -->
<div class="product-modal" data-morph-id="product-123" style="visibility: hidden;">
  <img data-morph-child="image" src="large.jpg" alt="Product">
  <h2 data-morph-child="title">Widget Pro</h2>
  <p data-morph-child="price">$99.00</p>
  <p class="description">Full product description...</p>
  <button data-morph-close>Close</button>
</div>
```

```javascript
// Open product modal
document.querySelectorAll('.view-details').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var card = this.closest('.product-card');
    var modal = document.querySelector('.product-modal[data-morph-id="' + 
                card.dataset.morphId + '"]');
    
    Funky.Morph.shared({
      from: card,
      to: modal,
      children: ['image', 'title', 'price'],
      preset: 'expand'
    });
  });
});

// Close modal (escape key works automatically)
document.querySelectorAll('[data-morph-close]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    Funky.Morph.reverse(this.closest('.product-modal'));
  });
});
```

### Image Lightbox

```javascript
// Initialize lightbox
var lightbox = document.getElementById('lightbox');
var lightboxImg = lightbox.querySelector('img');

document.querySelectorAll('.gallery-thumb').forEach(function(thumb) {
  thumb.addEventListener('click', function() {
    lightboxImg.src = this.dataset.fullsize;
    
    Funky.Morph.to({
      from: this,
      to: lightbox,
      preset: 'hero',
      duration: 450,
      onComplete: function() {
        lightbox.focus();
      }
    });
  });
});

// Close on click
lightbox.addEventListener('click', function() {
  Funky.Morph.reverse(lightbox);
});
```

### Animated Notification List

```javascript
// Create notification manager
var notificationList = Funky.Morph.list('#notifications', {
  enterFrom: 'right',
  exitTo: 'right',
  stagger: 30,
  swipeToRemove: true,
  onRemove: function(data) {
    console.log('Notification dismissed:', data.item);
  }
});

// Add notification
function notify(message, type) {
  var html = '<div class="notification notification-' + type + '" data-morph-item>' +
             '<span>' + message + '</span>' +
             '<button class="dismiss">×</button>' +
             '</div>';
  
  notificationList.add(html, { position: 0 });
  
  // Auto-dismiss after 5 seconds
  setTimeout(function() {
    notificationList.remove(0);
  }, 5000);
}
```

### Navigation Transitions

```javascript
// Page transition between views
function navigateTo(viewId) {
  var current = document.querySelector('.view.active');
  var next = document.getElementById(viewId);
  
  Funky.Morph.to({
    from: current,
    to: next,
    preset: 'slide',
    duration: 250,
    onComplete: function() {
      current.classList.remove('active');
      next.classList.add('active');
    }
  });
}
```

## Integration Guides

### With Funky.Modal

```javascript
// Morph card into modal
Funky.Modal.create({
  content: buildModalContent(product),
  beforeShow: function(modal) {
    return Funky.Morph.to({
      from: productCard,
      to: modal.element,
      preset: 'expand'
    });
  },
  beforeHide: function(modal) {
    return new Promise(function(resolve) {
      Funky.Morph.reverse(modal.element, {
        onComplete: resolve
      });
    });
  }
});
```

### With Funky.Carousel

```javascript
// Expand carousel slide to fullscreen
carousel.on('slideClick', function(slide, index) {
  var fullscreen = document.getElementById('fullscreen-viewer');
  fullscreen.innerHTML = slide.innerHTML;
  
  Funky.Morph.to({
    from: slide,
    to: fullscreen,
    preset: 'hero',
    children: ['image', 'caption']
  });
});
```

### With Funky.SlidePanel

```javascript
// Animate panel content entry
Funky.SlidePanel.create({
  id: 'details-panel',
  onOpen: function(panel) {
    var items = panel.querySelectorAll('.panel-item');
    var list = Funky.Morph.list(panel.querySelector('.panel-items'));
    
    items.forEach(function(item, i) {
      setTimeout(function() {
        list.add(item);
      }, i * 50);
    });
  }
});
```

### Custom Component Integration

```javascript
// Base pattern for morph-enabled components
function MorphableComponent(config) {
  this.el = config.element;
  this.expandedView = config.expandedView;
  
  var self = this;
  
  this.expand = function() {
    return Funky.Morph.to({
      from: self.el,
      to: self.expandedView,
      preset: config.preset || 'expand',
      manageFocus: true,
      trapFocus: true,
      onComplete: config.onExpand
    });
  };
  
  this.collapse = function() {
    return Funky.Morph.reverse(self.expandedView, {
      onComplete: config.onCollapse
    });
  };
}
```

## Troubleshooting

### Morph appears janky or jumps

**Cause:** Layout shifts during animation.

**Solution:** Ensure both elements have defined dimensions and avoid layout changes during the morph.

```css
/* Pin dimensions during morph */
[data-morph-active] {
  min-width: var(--element-width);
  min-height: var(--element-height);
}
```

### Shared elements not matching

**Cause:** `data-morph-child` attributes don't match or elements are nested differently.

**Solution:** Ensure matching attribute values and that elements exist in both source and target.

```html
<!-- Must match exactly -->
<img data-morph-child="hero-image" ...>  <!-- Source -->
<img data-morph-child="hero-image" ...>  <!-- Target -->
```

### Focus not moving to target

**Cause:** No focusable elements in target or `manageFocus: false`.

**Solution:** Add focusable element or `data-morph-focus` marker.

```html
<div class="modal">
  <button data-morph-focus>First focusable element</button>
</div>
```

### Escape key not working

**Cause:** Another handler preventing propagation or `enableEscapeClose: false`.

**Solution:** Check for competing handlers, ensure option is enabled.

```javascript
Funky.Morph.to({
  from: '#a',
  to: '#b',
  enableEscapeClose: true  // Ensure enabled
});
```

### List animation stuttering

**Cause:** Too many items animating at once.

**Solution:** Use `batch()` for bulk operations and increase stagger.

```javascript
list.batch(function() {
  this.add(item1);
  this.add(item2);
  this.add(item3);
});

// Or increase stagger
var list = Funky.Morph.list('#list', {
  stagger: 100  // More delay between items
});
```

### Animation disabled unexpectedly

**Cause:** User has `prefers-reduced-motion` enabled.

**Solution:** This is expected accessibility behavior. Test with:

```javascript
if (Funky.Morph.prefersReducedMotion()) {
  console.log('Animations reduced for accessibility');
}
```

## Performance Tips

### Use `will-change` sparingly

The component automatically adds `will-change` during animations. Avoid adding it permanently:

```css
/* ❌ Don't do this */
.card {
  will-change: transform, opacity;
}

/* ✅ Component handles it automatically */
[data-morph-active] {
  will-change: transform, opacity;
}
```

### Minimize DOM during morph

Hide non-essential content during transitions:

```javascript
Funky.Morph.to({
  from: card,
  to: modal,
  onStart: function() {
    modal.querySelector('.heavy-content').style.visibility = 'hidden';
  },
  onComplete: function() {
    modal.querySelector('.heavy-content').style.visibility = 'visible';
  }
});
```

### Batch list operations

Multiple adds/removes should use `batch()`:

```javascript
// ❌ Slow - triggers multiple animations
items.forEach(function(item) {
  list.add(item);
});

// ✅ Fast - single coordinated animation
list.batch(function() {
  var self = this;
  items.forEach(function(item) {
    self.add(item);
  });
});
```

### Prefer CSS transforms

The FLIP technique uses transforms which are GPU-accelerated. Avoid animating layout properties:

```css
/* ✅ Good - transforms are fast */
[data-morph-active] {
  transform: translate(0, 0) scale(1);
}

/* ❌ Avoid - triggers layout */
.animating {
  width: 100px;
  height: 100px;
  left: 50px;
}
```

### Use appropriate presets

Choose the right preset for your use case:

| Scenario | Recommended Preset |
|----------|-------------------|
| Card → Modal | `expand` or `morph` |
| Image gallery | `hero` |
| Tab/panel switch | `fade` or `slide` |
| Attention-grabbing | `zoom` |
| Large content | `hero` (no opacity) |

### Reduce stagger for many items

For lists with many items, reduce or disable stagger:

```javascript
var list = Funky.Morph.list('#list', {
  stagger: 0,  // No stagger for instant feel
  duration: 200  // Shorter duration
});
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Graceful degradation for reduced motion
- High contrast mode support
- Forced colors mode support
