# Phase 5: Migrate card-grid.js

Migrate `js/components/card-grid.js` to use `Funky.VisibilityObserver`.

## Current Implementation

**Location:** Lines 2744-2756

```javascript
} else if ('IntersectionObserver' in window) {
  // Fallback: Intersection Observer
  this._scrollObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !self.isLoading && self.hasMorePages) {
      self.loadMore();
    }
  }, {
    rootMargin: '100px'
  });

  this._scrollObserver.observe(this.els.scrollTrigger.el);

  this._cleanups.push(function() {
    if (self._scrollObserver) {
      self._scrollObserver.disconnect();
    }
  });
}
```

**Context:** This is a fallback when `Funky.ScrollTracker` is not available. It's used for infinite scroll - loading more cards when user scrolls near the bottom.

**Purpose:** Detect when a "scroll trigger" element (placed at the bottom of the grid) becomes visible, then load more content.

## Checklist

- [x] Add VisibilityObserver to the fallback chain
- [x] Replace raw IntersectionObserver with VisibilityObserver
- [x] Preserve `rootMargin: '100px'` for pre-loading before trigger is visible
- [x] Update cleanup to use `destroy()` method
- [x] Test infinite scroll still works

## Migration

### Before
```javascript
_initInfiniteScroll: function() {
  var self = this;

  // Create scroll trigger element
  this.els.scrollTrigger = D.div()
    .class('card-grid-scroll-trigger')
    .appendTo(this.els.container);

  // Preferred: use ScrollTracker
  if (Funky.ScrollTracker) {
    this._scrollTracker = Funky.ScrollTracker.create({
      thresholds: [/* ... */],
      onThreshold: function(data) {
        if (!self.isLoading && self.hasMorePages) {
          self.loadMore();
        }
      }
    });

    this._cleanupFns.push(function() {
      if (self._scrollTracker && self._scrollTracker.destroy) {
        self._scrollTracker.destroy();
      }
    });
  } else if ('IntersectionObserver' in window) {
    // Fallback: Intersection Observer
    this._scrollObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !self.isLoading && self.hasMorePages) {
        self.loadMore();
      }
    }, {
      rootMargin: '100px'
    });

    this._scrollObserver.observe(this.els.scrollTrigger.el);

    this._cleanupFns.push(function() {
      if (self._scrollObserver) {
        self._scrollObserver.disconnect();
      }
    });
  }
}
```

### After
```javascript
_initInfiniteScroll: function() {
  var self = this;

  // Create scroll trigger element
  this.els.scrollTrigger = D.div()
    .class('card-grid-scroll-trigger')
    .appendTo(this.els.container);

  // Preferred: use ScrollTracker
  if (Funky.ScrollTracker) {
    this._scrollTracker = Funky.ScrollTracker.create({
      thresholds: [/* ... */],
      onThreshold: function(data) {
        if (!self.isLoading && self.hasMorePages) {
          self.loadMore();
        }
      }
    });

    this._cleanupFns.push(function() {
      if (self._scrollTracker && self._scrollTracker.destroy) {
        self._scrollTracker.destroy();
      }
    });
  } else if (Funky.VisibilityObserver) {
    // Fallback: VisibilityObserver
    this._scrollObserver = Funky.VisibilityObserver.create({
      rootMargin: '100px',
      onVisible: function(el) {
        if (!self.isLoading && self.hasMorePages) {
          self.loadMore();
        }
      }
    });

    this._scrollObserver.observe(this.els.scrollTrigger.el);

    this._cleanupFns.push(function() {
      if (self._scrollObserver) {
        self._scrollObserver.destroy();
      }
    });
  }
}
```

## Notes

- This is a fallback path - primary method uses ScrollTracker
- `rootMargin: '100px'` causes the trigger to fire 100px before the element is visible (pre-loading)
- Only needs `onVisible` callback
- Could potentially use `observeOnce` but since loadMore adds more content, the trigger moves and needs to be re-observed
