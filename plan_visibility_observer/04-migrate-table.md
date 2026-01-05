# Phase 4: Migrate table.js

Migrate `js/components/table.js` to use `Funky.VisibilityObserver`.

## Current Implementation

**Location:** Lines 989-1000

```javascript
// Visibility observer for responsive - recalculate when table becomes visible
if (this.config.responsive && typeof IntersectionObserver !== 'undefined') {
  this._visibilityObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // Table just became visible - force recalculate responsive
        self._determineBreakpoint(true);
      }
    });
  }, { threshold: 0.01 });

  var observeTarget = this.wrapper && this.wrapper.el ? this.wrapper.el : this.container;
  this._visibilityObserver.observe(observeTarget);

  this._cleanups.push(function() {
    if (self._visibilityObserver) {
      self._visibilityObserver.disconnect();
    }
  });
}
```

**Purpose:** When a table becomes visible (e.g., switching tabs), recalculate responsive breakpoints since the table may now have different dimensions.

## Checklist

- [x] Add VisibilityObserver dependency check
- [x] Refactor visibility observer creation
- [x] Use `onVisible` callback to trigger breakpoint recalculation
- [x] Update cleanup to use `destroy()` method
- [x] Test responsive recalculation still works when table becomes visible

## Migration

### Before
```javascript
TableInstance.prototype._bindEvents = function() {
  var self = this;

  // ... other bindings ...

  // Visibility observer for responsive - recalculate when table becomes visible
  if (this.config.responsive && typeof IntersectionObserver !== 'undefined') {
    this._visibilityObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Table just became visible - force recalculate responsive
          self._determineBreakpoint(true);
        }
      });
    }, { threshold: 0.01 });

    var observeTarget = this.wrapper && this.wrapper.el ? this.wrapper.el : this.container;
    this._visibilityObserver.observe(observeTarget);

    this._cleanups.push(function() {
      if (self._visibilityObserver) {
        self._visibilityObserver.disconnect();
      }
    });
  }
};
```

### After
```javascript
TableInstance.prototype._bindEvents = function() {
  var self = this;

  // ... other bindings ...

  // Visibility observer for responsive - recalculate when table becomes visible
  if (this.config.responsive && Funky.VisibilityObserver) {
    this._visibilityObserver = Funky.VisibilityObserver.create({
      threshold: 0.01,
      onVisible: function(el) {
        // Table just became visible - force recalculate responsive
        self._determineBreakpoint(true);
      }
    });

    var observeTarget = this.wrapper && this.wrapper.el ? this.wrapper.el : this.container;
    this._visibilityObserver.observe(observeTarget);

    this._cleanups.push(function() {
      if (self._visibilityObserver) {
        self._visibilityObserver.destroy();
      }
    });
  }
};
```

## Notes

- Simple migration - just replacing IntersectionObserver with VisibilityObserver
- Only needs `onVisible` callback (doesn't care about hidden state)
- Low threshold (0.01) to trigger as soon as table is barely visible
- Used for tables inside tabs, accordions, or other hidden containers
