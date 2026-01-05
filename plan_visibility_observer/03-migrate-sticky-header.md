# Phase 3: Migrate sticky-header.js

Migrate `js/components/sticky-header.js` to use `Funky.VisibilityObserver`.

## Current Implementation

**Location:** Lines 186-212

```javascript
observeHeader: function(instance) {
  var header = instance.element;
  var config = instance.config;

  // Create a sentinel element above the header
  var sentinel = document.createElement('div');
  sentinel.className = 'page-header-sentinel';
  sentinel.style.cssText = 'height: 1px; width: 100%; position: absolute; top: 0; left: 0; pointer-events: none;';

  if (header.parentNode) {
    header.parentNode.insertBefore(sentinel, header);
  }

  instance.sentinel = sentinel;

  // Create observer
  var observer = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        var wasSticky = instance.isSticky;
        instance.isSticky = !entry.isIntersecting;

        if (instance.isSticky) {
          header.classList.add('is-sticky');
        } else {
          header.classList.remove('is-sticky');
          // Also remove hidden state when not sticky
        }
        // ... more logic
      });
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
  instance.observer = observer;
}
```

**Purpose:** Detects when header becomes "sticky" by observing a sentinel element. When sentinel scrolls out of view, header is sticky.

**Pattern:** Uses `visibleInViewport: false` - triggers when element is NOT visible.

## Checklist

- [x] Add VisibilityObserver dependency check
- [x] Refactor `observeHeader` to use VisibilityObserver
- [x] Use `onHidden` callback (sentinel out of view = sticky)
- [x] Use `onVisible` callback (sentinel in view = not sticky)
- [x] Update cleanup in `destroy` method
- [x] Test sticky behavior still works

## Migration

### Before
```javascript
observeHeader: function(instance) {
  var header = instance.element;
  var config = instance.config;

  // Create a sentinel element above the header
  var sentinel = document.createElement('div');
  sentinel.className = 'page-header-sentinel';
  sentinel.style.cssText = 'height: 1px; width: 100%; position: absolute; top: 0; left: 0; pointer-events: none;';

  if (header.parentNode) {
    header.parentNode.insertBefore(sentinel, header);
  }

  instance.sentinel = sentinel;

  var observer = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        var wasSticky = instance.isSticky;
        instance.isSticky = !entry.isIntersecting;

        if (instance.isSticky) {
          header.classList.add('is-sticky');
        } else {
          header.classList.remove('is-sticky');
        }

        // Callback
        if (config.onStickyChange && wasSticky !== instance.isSticky) {
          config.onStickyChange(instance.isSticky, header);
        }
      });
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);
  instance.observer = observer;
}
```

### After
```javascript
observeHeader: function(instance) {
  var header = instance.element;
  var config = instance.config;

  // Check for VisibilityObserver
  if (!Funky.VisibilityObserver) {
    console.warn('[StickyHeader] VisibilityObserver not available');
    return;
  }

  // Create a sentinel element above the header
  var sentinel = document.createElement('div');
  sentinel.className = 'page-header-sentinel';
  sentinel.style.cssText = 'height: 1px; width: 100%; position: absolute; top: 0; left: 0; pointer-events: none;';

  if (header.parentNode) {
    header.parentNode.insertBefore(sentinel, header);
  }

  instance.sentinel = sentinel;

  var observer = Funky.VisibilityObserver.create({
    threshold: 0,
    onVisible: function(el) {
      // Sentinel visible = header NOT sticky
      var wasSticky = instance.isSticky;
      instance.isSticky = false;
      header.classList.remove('is-sticky');

      if (config.onStickyChange && wasSticky !== instance.isSticky) {
        config.onStickyChange(instance.isSticky, header);
      }
    },
    onHidden: function(el) {
      // Sentinel hidden = header IS sticky
      var wasSticky = instance.isSticky;
      instance.isSticky = true;
      header.classList.add('is-sticky');

      if (config.onStickyChange && wasSticky !== instance.isSticky) {
        config.onStickyChange(instance.isSticky, header);
      }
    }
  });

  observer.observe(sentinel);
  instance.visibilityObserver = observer;
}
```

### Cleanup Update

**Before:**
```javascript
destroy: function(header) {
  // ...
  if (instance.observer) {
    instance.observer.disconnect();
  }
  // ...
}
```

**After:**
```javascript
destroy: function(header) {
  // ...
  if (instance.visibilityObserver) {
    instance.visibilityObserver.destroy();
  }
  // ...
}
```

## Notes

- This is a good example of using visibility observer for "inverse" detection
- The sentinel pattern is preserved - we just observe it with VisibilityObserver
- `threshold: 0` means any visibility change triggers callback
