# Phase 2: Migrate page-animate.js

Migrate `js/components/page-animate.js` to use `Funky.VisibilityObserver`.

## Current Implementation

The component creates 2 IntersectionObserver instances:

### 1. Scroll Animations (`initScrollAnimations`)
**Location:** Lines 118-162

```javascript
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      var el = entry.target;
      if (el.classList.contains('animated')) return;

      var animClass = el.getAttribute('data-animate') || 'fade-in-up';
      // ... trigger animation

      if (el.getAttribute('data-animate-once') === 'true') {
        observer.unobserve(el);
      }
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});
```

**Purpose:** Triggers animations when elements with `data-animate-trigger="in-view"` enter viewport.

### 2. Stagger Animations (`animateStaggerOnScroll`)
**Location:** Lines 220-230 (approx)

```javascript
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      Animate.stagger(selector + ' > *', opts);
      observer.unobserve(list);
    }
  });
}, { threshold: 0.1 });
```

**Purpose:** Triggers stagger animations for lists when they enter viewport (one-shot).

## Checklist

- [x] Add VisibilityObserver dependency check
- [x] Refactor `initScrollAnimations` to use VisibilityObserver
- [x] Refactor `animateList` (was `animateStaggerOnScroll`) to use `observeOnce`
- [x] Handle `rootMargin` option
- [x] Preserve `data-animate-once` behavior
- [x] Test scroll animations still work
- [x] Test stagger animations still work

## Migration

### Before (initScrollAnimations)
```javascript
initScrollAnimations: function(container) {
  var containerEl = container ? D.one(container) : document;
  var el = containerEl && containerEl.el ? containerEl.el : containerEl;
  var elements = el.querySelectorAll('[data-animate-trigger="in-view"]');

  if (!elements.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        if (el.classList.contains('animated')) return;

        var animClass = el.getAttribute('data-animate') || 'fade-in-up';
        var duration = el.getAttribute('data-animate-duration');

        el.classList.add('animating');

        Animate.animate(el, {
          class: animClass,
          duration: duration ? parseInt(duration, 10) : null,
          onEnd: function() {
            el.classList.remove('animating');
            el.classList.add('animated');

            if (el.getAttribute('data-animate-once') === 'true') {
              observer.unobserve(el);
            }
          }
        });
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(function(el) {
    observer.observe(el);
  });

  return observer;
}
```

### After (initScrollAnimations)
```javascript
initScrollAnimations: function(container) {
  var containerEl = container ? D.one(container) : document;
  var el = containerEl && containerEl.el ? containerEl.el : containerEl;
  var elements = el.querySelectorAll('[data-animate-trigger="in-view"]');

  if (!elements.length) return;

  // Check for VisibilityObserver
  if (!Funky.VisibilityObserver) {
    console.warn('[PageAnimate] VisibilityObserver not available');
    return;
  }

  var observer = Funky.VisibilityObserver.create({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    onVisible: function(el) {
      // Skip if already animated
      if (el.classList.contains('animated')) return;

      var animClass = el.getAttribute('data-animate') || 'fade-in-up';
      var duration = el.getAttribute('data-animate-duration');
      var isOnce = el.getAttribute('data-animate-once') === 'true';

      el.classList.add('animating');

      Animate.animate(el, {
        class: animClass,
        duration: duration ? parseInt(duration, 10) : null,
        onEnd: function() {
          el.classList.remove('animating');
          el.classList.add('animated');

          if (isOnce) {
            observer.unobserve(el);
          }
        }
      });
    }
  });

  elements.forEach(function(el) {
    observer.observe(el);
  });

  return observer;
}
```

### Before (animateStaggerOnScroll)
```javascript
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      Animate.stagger(selector + ' > *', opts);
      observer.unobserve(list);
    }
  });
}, { threshold: 0.1 });

observer.observe(list);
```

### After (animateStaggerOnScroll)
```javascript
if (!Funky.VisibilityObserver) {
  console.warn('[PageAnimate] VisibilityObserver not available');
  return;
}

var observer = Funky.VisibilityObserver.create({ threshold: 0.1 });

observer.observeOnce(list, function(el) {
  Animate.stagger(selector + ' > *', opts);
});
```

## Notes

- Need to ensure VisibilityObserver supports `rootMargin` option (it does in Phase 1)
- The `observeOnce` pattern is perfect for stagger animations
- Return value should still be the observer for potential external cleanup
