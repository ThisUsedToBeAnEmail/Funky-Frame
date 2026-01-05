# VisibilityObserver Utility - Implementation Plan

## Summary

Create a centralized IntersectionObserver utility (`Funky.VisibilityObserver`) that provides a consistent, reusable API for tracking element visibility across the framework.

## Rationale

Currently 5+ components create their own IntersectionObservers inline:
- `js/components/page-animate.js` (2 instances)
- `js/components/sticky-header.js`
- `js/components/table.js`
- `js/components/card-grid.js`

A shared utility provides:
- Consistent API across components
- Single pattern for visibility tracking
- Easier testing and debugging
- Follows existing patterns (like ScrollTracker, MediaQuery)

## Files to Create/Modify

| File | Action |
|------|--------|
| `js/core/visibility-observer.js` | **Create** - New utility |
| `js/components/page-animate.js` | Migrate to use VisibilityObserver |
| `js/components/sticky-header.js` | Migrate to use VisibilityObserver |
| `js/components/table.js` | Migrate to use VisibilityObserver |
| `js/components/card-grid.js` | Migrate to use VisibilityObserver |

## Phases

1. **Phase 1:** Create core VisibilityObserver utility
2. **Phase 2:** Migrate page-animate.js
3. **Phase 3:** Migrate sticky-header.js
4. **Phase 4:** Migrate table.js
5. **Phase 5:** Migrate card-grid.js
6. **Phase 6:** Testing and documentation

## API Preview

```javascript
// Create an observer
var observer = Funky.VisibilityObserver.create({
  threshold: 0.1,
  onVisible: function(element, entry) { },
  onHidden: function(element, entry) { }
});

// Observe elements
observer.observe('#my-element');
observer.observeOnce('.animate-on-scroll', callback);
observer.observeAll('.cards');

// Query state
observer.isVisible(element);
observer.getVisible();

// Cleanup
observer.unobserve(element);
observer.destroy();
```

## Reference Files

- `js/components/scroll-tracker.js` - Factory pattern reference
- `js/core/media-query.js` - Subscription pattern reference
