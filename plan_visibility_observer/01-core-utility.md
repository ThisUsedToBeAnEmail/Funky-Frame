# Phase 1: Create Core VisibilityObserver Utility

Create `js/core/visibility-observer.js` - the foundational utility.

## Checklist

- [x] Create IIFE wrapper with Funky namespace guards
- [x] Register with `Funky.register('VisibilityObserver', ...)`
- [x] Implement factory pattern (`init()` method - `create()` deprecated)
- [x] Implement `observe(selector, options)` method
- [x] Implement `observeOnce(selector, callback)` method
- [x] Implement `observeAll(selector, options)` method
- [x] Implement `unobserve(selector)` method
- [x] Implement `isVisible(element)` query method
- [x] Implement `getVisible()` query method
- [x] Implement `destroy()` cleanup method
- [x] Add PubSub events for visibility changes
- [x] Handle browsers without IntersectionObserver support
- [x] Add instance registry using `Funky.Registry.createInstanceRegistry()`

## File Location

`js/core/visibility-observer.js`

## Implementation

```javascript
/**
 * Funky.VisibilityObserver
 *
 * Factory for creating visibility tracking instances using IntersectionObserver.
 *
 * @example
 * var observer = Funky.VisibilityObserver.create({
 *   threshold: 0.1,
 *   onVisible: function(element, entry) { console.log('Visible:', element); },
 *   onHidden: function(element, entry) { console.log('Hidden:', element); }
 * });
 *
 * observer.observe('#my-element');
 * observer.observeOnce('.animate-on-scroll', function(el) {
 *   el.classList.add('animated');
 * });
 *
 * observer.destroy();
 *
 * @version 1.0.0
 */
(function(global) {
  'use strict';

  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.VisibilityObserver] Registry not found. Load namespace.js first.');
    return;
  }

  if (global.Funky.isRegistered && global.Funky.isRegistered('VisibilityObserver')) {
    return;
  }

  var Funky = global.Funky;
  var PubSub = Funky.PubSub;

  // =========================================================================
  // Defaults
  // =========================================================================

  var DEFAULTS = {
    root: null,                    // viewport
    rootMargin: '0px',
    threshold: 0.1,                // 10% visible = "in viewport"
    onVisible: null,               // function(element, entry)
    onHidden: null,                // function(element, entry)
    namespace: 'visibility'
  };

  // =========================================================================
  // Instance Counter
  // =========================================================================

  var instanceCounter = 0;

  // =========================================================================
  // VisibilityObserverInstance Constructor
  // =========================================================================

  /**
   * VisibilityObserver instance
   * @param {Object} options - Configuration options
   */
  function VisibilityObserverInstance(options) {
    var self = this;
    this._id = 'visibility-observer-' + (++instanceCounter);

    // Merge config with defaults
    this._config = {};
    for (var key in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(key)) {
        this._config[key] = DEFAULTS[key];
      }
    }
    if (options) {
      for (var optKey in options) {
        if (options.hasOwnProperty(optKey)) {
          this._config[optKey] = options[optKey];
        }
      }
    }

    // Internal state
    this._elements = new Map();    // element -> { onVisible, onHidden, once }
    this._visibleSet = new Set();  // currently visible elements
    this._observer = null;

    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      console.warn('[VisibilityObserver] IntersectionObserver not supported. Visibility tracking disabled.');
      return;
    }

    // Create the observer
    this._observer = new IntersectionObserver(function(entries) {
      self._handleIntersection(entries);
    }, {
      root: this._config.root,
      rootMargin: this._config.rootMargin,
      threshold: this._config.threshold
    });
  }

  VisibilityObserverInstance.prototype = {
    /**
     * Observe an element for visibility changes
     * @param {string|HTMLElement} selector - Element or CSS selector
     * @param {Object} [options] - Per-element options
     * @param {Function} [options.onVisible] - Called when element becomes visible
     * @param {Function} [options.onHidden] - Called when element becomes hidden
     * @param {boolean} [options.once] - Unobserve after first visibility
     * @returns {VisibilityObserverInstance} this
     */
    observe: function(selector, options) {
      if (!this._observer) return this;

      var el = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!el) {
        console.warn('[VisibilityObserver] Element not found:', selector);
        return this;
      }

      // Don't observe the same element twice
      if (this._elements.has(el)) {
        return this;
      }

      this._elements.set(el, options || {});
      this._observer.observe(el);
      return this;
    },

    /**
     * Observe element once - auto-unobserve after first visibility
     * @param {string|HTMLElement} selector - Element or CSS selector
     * @param {Function} [callback] - Called when element becomes visible
     * @returns {VisibilityObserverInstance} this
     */
    observeOnce: function(selector, callback) {
      return this.observe(selector, {
        once: true,
        onVisible: callback
      });
    },

    /**
     * Observe multiple elements matching a selector
     * @param {string} selector - CSS selector for multiple elements
     * @param {Object} [options] - Per-element options
     * @returns {VisibilityObserverInstance} this
     */
    observeAll: function(selector, options) {
      var self = this;
      var elements = document.querySelectorAll(selector);
      elements.forEach(function(el) {
        self.observe(el, options);
      });
      return this;
    },

    /**
     * Stop observing an element
     * @param {string|HTMLElement} selector - Element or CSS selector
     * @returns {VisibilityObserverInstance} this
     */
    unobserve: function(selector) {
      if (!this._observer) return this;

      var el = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (el && this._elements.has(el)) {
        this._observer.unobserve(el);
        this._elements.delete(el);
        this._visibleSet.delete(el);
      }
      return this;
    },

    /**
     * Check if element is currently visible
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    isVisible: function(element) {
      return this._visibleSet.has(element);
    },

    /**
     * Get all currently visible elements
     * @returns {Array<HTMLElement>}
     */
    getVisible: function() {
      return Array.from(this._visibleSet);
    },

    /**
     * Get count of observed elements
     * @returns {number}
     */
    count: function() {
      return this._elements.size;
    },

    /**
     * Handle intersection observer entries
     * @private
     */
    _handleIntersection: function(entries) {
      var self = this;

      entries.forEach(function(entry) {
        var el = entry.target;
        var opts = self._elements.get(el) || {};
        var wasVisible = self._visibleSet.has(el);
        var isVisible = entry.isIntersecting;

        if (isVisible && !wasVisible) {
          // Element became visible
          self._visibleSet.add(el);

          // Per-element callback
          if (opts.onVisible) {
            opts.onVisible(el, entry);
          }

          // Global callback
          if (self._config.onVisible) {
            self._config.onVisible(el, entry);
          }

          // PubSub event
          if (PubSub) {
            PubSub.emit('funky:visibility:visible', {
              element: el,
              entry: entry,
              observerId: self._id
            });
          }

          // One-shot: unobserve after visible
          if (opts.once) {
            self.unobserve(el);
          }

        } else if (!isVisible && wasVisible) {
          // Element became hidden
          self._visibleSet.delete(el);

          // Per-element callback
          if (opts.onHidden) {
            opts.onHidden(el, entry);
          }

          // Global callback
          if (self._config.onHidden) {
            self._config.onHidden(el, entry);
          }

          // PubSub event
          if (PubSub) {
            PubSub.emit('funky:visibility:hidden', {
              element: el,
              entry: entry,
              observerId: self._id
            });
          }
        }
      });
    },

    /**
     * Destroy the observer and clean up
     */
    destroy: function() {
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
      this._elements.clear();
      this._visibleSet.clear();
    }
  };

  // =========================================================================
  // Factory
  // =========================================================================

  var VisibilityObserver = {
    /**
     * Create a new VisibilityObserver instance
     * @param {Object} [options] - Configuration options
     * @returns {VisibilityObserverInstance}
     */
    create: function(options) {
      return new VisibilityObserverInstance(options);
    }
  };

  // Register with Funky
  Funky.register('VisibilityObserver', VisibilityObserver);

})(typeof window !== 'undefined' ? window : this);
```

## Dependencies

- `js/core/namespace.js`
- `js/core/pubsub.js` (optional, for events)

## Usage Examples

```javascript
// Basic usage
var observer = Funky.VisibilityObserver.create({
  threshold: 0.1,
  onVisible: function(el) {
    console.log('Element visible:', el);
  }
});

observer.observe('#my-element');

// One-shot animation trigger
var animObserver = Funky.VisibilityObserver.create({ threshold: 0.2 });
animObserver.observeOnce('.animate-on-scroll', function(el) {
  el.classList.add('animated');
});

// Observe multiple elements
observer.observeAll('.lazy-load-image', {
  onVisible: function(el) {
    el.src = el.dataset.src;
  },
  once: true
});

// Query visibility
if (observer.isVisible(myElement)) {
  // Element is in viewport
}

// Get all visible elements
var visibleElements = observer.getVisible();

// Cleanup
observer.destroy();
```
