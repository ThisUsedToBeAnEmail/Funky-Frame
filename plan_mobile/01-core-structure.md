# Phase 1: Core JavaScript Structure

Create the foundational component structure in `js/components/mobile-core.js`.

## Checklist

- [x] Create IIFE wrapper with Funky namespace guards
- [x] Register component with `Funky.register('MobileCore', ...)`
- [x] Define state object (initialized, visible, element refs, scroll state)
- [x] Define config object with defaults
- [x] Implement `init(options)` function
- [x] Implement `destroy()` function for cleanup
- [x] Add MediaQuery subscription for mobile breakpoint
- [x] Implement `show()` / `hide()` methods
- [x] Add scroll listener for hide-on-scroll-down behavior (using ScrollTracker)
- [x] Add auto-init on DOMContentLoaded

## Code Template

```javascript
(function(global) {
  'use strict';

  if (!global.Funky || !global.Funky.register) {
    console.error('[Funky.MobileCore] Registry not found.');
    return;
  }

  if (global.Funky.isRegistered && global.Funky.isRegistered('MobileCore')) {
    return;
  }

  var Funky = global.Funky;
  var D = Funky.Dom;
  var PubSub = Funky.PubSub;

  // State
  var state = {
    initialized: false,
    visible: false,
    hidden: false,              // Hidden due to scroll
    element: null,
    actionsContainer: null,
    overflowPanel: null,
    overflowOpen: false,
    scrollTracker: null,        // Funky.ScrollTracker instance
    observer: null,             // IntersectionObserver for viewport-reactive actions
    observedElements: new Map() // element -> [actionIds]
  };

  // Config
  var config = {
    breakpoint: 'mobile',
    maxVisibleActions: 5,
    autoRegister: true,
    defaultActions: {
      commandPalette: true,
      keyboardHelp: true,
      skipLinks: true,
      sidenavToggle: true
    },
    moreIcon: 'fas fa-ellipsis-h',
    moreLabel: 'More',
    ariaLabel: 'Mobile navigation',
    zIndex: 1050,
    // Scroll behavior
    hideOnScroll: true,         // Hide on scroll down, show on scroll up
    scrollThreshold: 10         // Minimum scroll delta to trigger hide/show
  };

  // ... implementation

  Funky.register('MobileCore', {
    init: init,
    destroy: destroy,
    show: show,
    hide: hide,
    isVisible: function() { return state.visible; }
  });

})(typeof window !== 'undefined' ? window : this);
```

## Scroll Behavior Implementation (using Funky.ScrollTracker)

```javascript
function setupScrollTracker() {
  if (!config.hideOnScroll || !Funky.ScrollTracker) return;

  state.scrollTracker = Funky.ScrollTracker.create({
    trackDirection: true,
    onScroll: function(data) {
      // Only act on significant scroll with direction
      if (!data.direction) return;

      if (data.direction === 'down' && data.scrollY > 56) {
        hideBar();
      } else if (data.direction === 'up') {
        showBar();
      }
    }
  });
}

function destroyScrollTracker() {
  if (state.scrollTracker) {
    state.scrollTracker.destroy();
    state.scrollTracker = null;
  }
}

function hideBar() {
  if (state.hidden || !state.visible) return;
  state.hidden = true;
  state.element.classAdd('mobile-core--hidden');
}

function showBar() {
  if (!state.hidden || !state.visible) return;
  state.hidden = false;
  state.element.classRemove('mobile-core--hidden');
}
```

## Dependencies

- `js/core/namespace.js`
- `js/core/dom.js`
- `js/core/media-query.js`
- `js/core/pubsub.js`
- `js/components/scroll-tracker.js` (for hide-on-scroll)
