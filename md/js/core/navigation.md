# Funky.Navigation - Sidebar Navigation Utilities

Handles sidebar scroll position persistence across page loads and SPA navigation.

## Overview

`Funky.Navigation` preserves the sidebar scroll position when navigating between pages, ensuring users don't lose their place in long navigation menus.

## API Reference

### Methods

#### `Navigation.saveScrollPosition()`

Save current sidebar scroll position to sessionStorage.

**Example:**
```javascript
// Called automatically on link clicks, but can be called manually
Funky.Navigation.saveScrollPosition();
```

---

#### `Navigation.restoreScrollPosition()`

Restore sidebar scroll position from sessionStorage.

**Example:**
```javascript
// Called automatically on page load
Funky.Navigation.restoreScrollPosition();
```

---

#### `Navigation.init()`

Initialize scroll persistence handlers. Called automatically on DOM ready.

## Automatic Behavior

The module automatically:

1. **Saves scroll position** when:
   - Any sidebar link is clicked
   - User scrolls in the sidebar (debounced)
   - Page is about to unload

2. **Restores scroll position** when:
   - DOM is ready
   - Page load is complete
   - SPA navigation completes

## Storage

Uses `sessionStorage` with key `funky_nav_scroll_position`.

## Dependencies

None - this is a core module.

## Examples

### Manual Save/Restore

```javascript
// Before programmatic navigation
Funky.Navigation.saveScrollPosition();
window.location.href = '/new-page';

// Or with SPA
Funky.Navigation.saveScrollPosition();
Funky.SPA.navigate('/new-page');
```

### Force Scroll to Top

```javascript
// Clear saved position to start at top
sessionStorage.removeItem('funky_nav_scroll_position');
```

### Scroll to Specific Section

```javascript
// Scroll to specific nav item
var navItem = document.querySelector('.nav-link[href="/trades"]');
if (navItem) {
  navItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
  Funky.Navigation.saveScrollPosition();
}
```
