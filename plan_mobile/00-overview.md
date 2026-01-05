# Mobile Core Component - Implementation Plan

## Summary

Create a `MobileCore` component providing a fixed bottom navigation bar for mobile/tablet users, exposing keyboard-only features as touch-accessible buttons.

## Key Features

- Auto-enables on mobile breakpoint (< 768px)
- Dynamic action registration from any component
- Default actions: sidenav toggle, search, shortcuts, skip navigation
- Overflow "More" menu for excess actions
- **Viewport-reactive actions** - show/hide based on what's visible on screen
- **Hide on scroll down** - slides out when scrolling down, reappears on scroll up
- Follows existing Funky patterns (ActionRegistry, MediaQuery, PubSub)

## Files to Create

| File | Purpose |
|------|---------|
| `js/components/mobile-core.js` | Main component |
| `css/mobile-core.css` | Styles |

## Prerequisites

- **VisibilityObserver utility** - See `plan_visibility_observer/` directory
  - Must be implemented first for viewport-reactive actions

## Phases

1. **Phase 1:** Core JavaScript component structure
2. **Phase 2:** Action registry and default actions
3. **Phase 3:** Component detection, PubSub, and viewport reactivity
4. **Phase 4:** CSS and DOM rendering
5. **Phase 5:** Overflow menu handling
6. **Phase 6:** Testing and build integration

## Reference Files

- `js/components/quick-nav.js` - ActionRegistry pattern
- `js/components/action-registry.js` - Registry factory
- `js/components/scroll-tracker.js` - Scroll direction tracking
- `js/core/media-query.js` - Breakpoint subscription
- `js/core/keyboard.js` - Scope management
- `js/components/sidenav.js` - Toggle pattern
