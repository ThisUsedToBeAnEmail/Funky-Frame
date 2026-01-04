# Funky.QuickNav

Floating navigation widget for quick access to page sections and custom actions.

## Overview

`Funky.QuickNav` provides a floating action button (FAB) with expandable action list. Features include back-to-top scrolling, skip link detection, custom actions with badges, and SPA support.

## Quick Start

```javascript
// Initialize with default settings
Funky.QuickNav.init();

// Add a custom action
Funky.QuickNav.addAction({
  id: 'help',
  icon: 'fas fa-question',
  label: 'Help',
  onClick: function() { showHelp(); }
});
```

## API Reference

### Initialization

#### `Funky.QuickNav.init(options)`

Initialize the quick nav widget.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| position | string | `'bottom-right'` | Widget position |
| container | string | `'body'` | Container selector |
| offset | object | `{ x: 16, y: 16 }` | Offset from corner |
| zIndex | number | `1020` | CSS z-index |
| collapsed | boolean | `true` | Start collapsed |
| collapseDelay | number | `3000` | Auto-collapse delay (ms) |
| backToTop | boolean | `true` | Show back-to-top button |
| sections | boolean | `true` | Detect page sections |
| fabIcon | string | `'fas fa-compass'` | FAB icon class |
| closeIcon | string | `'fas fa-times'` | Close icon class |
| ariaLabel | string | `'Quick navigation'` | Accessibility label |
| scrollOffset | number | `0` | Scroll offset in pixels for sticky headers |
| scrollOffsetSelector | string | `null` | Selector for element whose height to use as scroll offset |
| showTrigger | string | `'always'` | `'always'`, `'scroll'`, `'manual'` |
| scrollThreshold | number | `200` | Scroll px before showing |
| scrollDirection | string | `'down'` | `'down'`, `'up'`, `'both'` |
| hideOnInactive | boolean | `false` | Hide after inactivity |
| inactiveTimeout | number | `5000` | Inactivity timeout (ms) |
| animation | string | `'slide'` | `'slide'`, `'fade'`, `'scale'`, `'none'` |
| animationDuration | number | `200` | Animation duration (ms) |
| builtinActions | string[] | `[]` | Built-in actions to include |
| preferences | object | `{ enabled: true, key: 'quicknav', persist: ['position'] }` | Preferences config |

**Returns:** `QuickNav` for chaining

**Example:**
```javascript
Funky.QuickNav.init({
  position: 'bottom-right',
  backToTop: true,
  showTrigger: 'scroll',
  scrollThreshold: 300,
  builtinActions: ['theme-toggle', 'help']
});
```

**Example with Sticky Header:**
```javascript
// Option 1: Use a selector to auto-calculate header height
Funky.QuickNav.init({
  position: 'bottom-right',
  backToTop: true,
  scrollOffsetSelector: '.sticky-header'  // Uses element's offsetHeight
});

// Option 2: Use a fixed pixel value
Funky.QuickNav.init({
  position: 'bottom-right',
  backToTop: true,
  scrollOffset: 60  // Fixed 60px offset
});
```

---

#### `Funky.QuickNav.destroy()`

Destroy the widget and clean up all event listeners.

---

### Actions

#### `addAction(options)`

Add a custom action to the quick nav.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Unique action identifier |
| icon | string | Yes | Icon class (Font Awesome) |
| label | string | Yes | Action label (tooltip) |
| onClick | function | No | Click handler |
| emit | string | No | PubSub event to emit on click |
| emitData | any | No | Data to pass with emit |
| order | number | No | Sort order (lower = first) |
| badge | number/string | No | Badge value |
| badgeType | string | No | `'count'`, `'dot'`, `'indicator'` |
| badgeSource | string | No | PubSub event to update badge |
| hidden | boolean | No | Start hidden |
| disabled | boolean | No | Start disabled |
| className | string | No | Additional CSS class |

**Example:**
```javascript
Funky.QuickNav.addAction({
  id: 'notifications',
  icon: 'fas fa-bell',
  label: 'Notifications',
  badge: 5,
  badgeType: 'count',
  onClick: function() { openNotifications(); }
});
```

---

#### `removeAction(actionId)`

Remove an action by ID.

---

#### `updateAction(actionId, updates)`

Update an existing action.

```javascript
Funky.QuickNav.updateAction('notifications', { badge: 10 });
```

---

#### `getAction(actionId)`

Get action by ID.

**Returns:** `Object|null`

---

#### `getActions()`

Get all actions sorted by order.

**Returns:** `Array`

---

#### `hideAction(actionId)` / `showAction(actionId)`

Show/hide action without removing.

---

#### `setBadge(actionId, options)`

Update action badge.

```javascript
// Simple value
Funky.QuickNav.setBadge('notifications', 15);

// With options
Funky.QuickNav.setBadge('notifications', {
  value: 15,
  type: 'count',
  animate: true
});
```

---

#### `clearBadge(actionId)`

Remove badge from action.

---

### Visibility & State

#### `show()` / `hide()`

Show or hide the widget.

---

#### `toggleVisibility()`

Toggle widget visibility.

---

#### `expand()` / `collapse()`

Expand or collapse the action list.

---

#### `toggle()`

Toggle expanded/collapsed state.

---

#### `isVisible()` / `isExpanded()`

Check current state.

**Returns:** `boolean`

---

### SPA Integration

#### `reset(options)`

Reset QuickNav state for SPA navigation.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| options | boolean/Object | - | `true` for full reset, or options object |
| options.sections | boolean | `true` | Re-detect page sections |
| options.badges | boolean | `false` | Clear all action badges |
| options.customActions | boolean | `false` | Remove non-persistent custom actions |
| options.expand | boolean | `false` | Collapse if expanded |

**Examples:**
```javascript
// Re-detect sections only (default)
Funky.QuickNav.reset();

// Full reset to initial state
Funky.QuickNav.reset(true);

// Custom reset
Funky.QuickNav.reset({
  sections: true,
  badges: true,
  customActions: false
});
```

---

### SPA Configuration

Configure SPA behavior via init options:

```javascript
Funky.QuickNav.init({
  spa: {
    autoRefresh: true,      // Re-detect sections on route change
    persistActions: true,   // Keep custom actions across pages
    persistBadges: false    // Clear badges on navigation
  }
});
```

### Persistent Actions

Actions can be marked as persistent to survive `reset()`:

```javascript
// This action survives reset({ customActions: true })
Funky.QuickNav.addAction({
  id: 'cart',
  icon: 'fas fa-shopping-cart',
  label: 'Cart',
  persistent: true,
  badge: 3
});

// This action is cleared on reset({ customActions: true })
Funky.QuickNav.addAction({
  id: 'page-help',
  icon: 'fas fa-question',
  label: 'Page Help',
  persistent: false  // default
});
```

---

### Navigation

#### `navigateTo(sectionId)`

Scroll to a detected page section.

```javascript
Funky.QuickNav.navigateTo('features');
```

---

#### `refreshSections()`

Re-detect page sections (call after DOM changes).

---

#### `getSections()`

Get list of detected sections.

**Returns:** `Array`

---

### Position & Z-Index

#### `setPosition(position)`

Change widget position.

**Positions:** `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`

---

#### `getPosition()`

Get current position.

**Returns:** `string`

---

#### `setZIndex(value)` / `resetZIndex()`

Manage z-index (useful when modals open).

---

### Preferences

#### `getPreferences()`

Get current preferences (position, collapsed state based on persist config).

**Returns:** `Object` - Current preferences

---

#### `savePreferences()`

Manually save current preferences to `Funky.Preferences`.

**Returns:** `QuickNav` for chaining

---

#### `clearPreferences()`

Clear all saved preferences.

**Returns:** `QuickNav` for chaining

---

## Preferences Integration

QuickNav can persist user preferences (position, collapsed state) via `Funky.Preferences`.

### Configuration

```javascript
Funky.QuickNav.init({
  preferences: {
    enabled: true,           // Enable persistence
    key: 'quicknav',         // Storage key
    persist: ['position']    // What to persist: 'position', 'collapsed'
  }
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| enabled | boolean | `true` | Enable preference persistence |
| key | string | `'quicknav'` | Storage key for preferences |
| persist | string[] | `['position']` | Settings to persist |

### Persist Options

- `'position'` - Save position (top-left, bottom-right, etc.)
- `'collapsed'` - Save expanded/collapsed state

### Auto-Save Behavior

When preferences are enabled, changes are automatically saved:
- Position changes via `setPosition()`
- Expand/collapse state changes

### Events

| Event | Data | Description |
|-------|------|-------------|
| `funky:quick-nav:preferences:loaded` | `{ position?, collapsed? }` | Preferences loaded |
| `funky:quick-nav:preferences:saved` | `{ position?, collapsed? }` | Preferences saved |
| `funky:quick-nav:preferences:cleared` | `{}` | Preferences cleared |

### Cross-Tab Sync

Preferences sync across tabs via the `preferences:changed` PubSub event from `Funky.Preferences`.

### Graceful Degradation

If `Funky.Preferences` is not available, preferences features are silently disabled without errors.

---

## Built-in Actions

| ID | Description |
|----|-------------|
| `'theme-toggle'` | Toggle light/dark theme |
| `'help'` | Emit help event |

```javascript
Funky.QuickNav.init({
  builtinActions: ['theme-toggle', 'help']
});
```

## PubSub Events

### Emitted Events

| Event | Data | Description |
|-------|------|-------------|
| `funky:quick-nav:initialized` | `{}` | Widget initialized |
| `funky:quick-nav:destroyed` | `{}` | Widget destroyed |
| `funky:quick-nav:shown` | `{}` | Widget shown |
| `funky:quick-nav:hidden` | `{}` | Widget hidden |
| `funky:quick-nav:expanded` | `{}` | List expanded |
| `funky:quick-nav:collapsed` | `{}` | List collapsed |
| `funky:quick-nav:action:added` | `{ id }` | Action added |
| `funky:quick-nav:action:removed` | `{ id }` | Action removed |
| `funky:quick-nav:action:updated` | `{ id, updates }` | Action updated |
| `funky:quick-nav:action:clicked` | `{ id, action }` | Action clicked |
| `funky:quick-nav:section:navigated` | `{ id }` | Section navigated |
| `funky:quick-nav:reset` | `{ sections, badges, customActions, expand }` | State reset |
| `funky:quick-nav:route:changed` | `{ url }` | SPA route changed |
| `funky:quick-nav:preferences:loaded` | `{ position?, collapsed? }` | Preferences loaded |
| `funky:quick-nav:preferences:saved` | `{ position?, collapsed? }` | Preferences saved |
| `funky:quick-nav:preferences:cleared` | `{}` | Preferences cleared |

### Subscribed Events (PubSub)

| Event | Description |
|-------|-------------|
| `funky:spa:navigated` | Triggers section refresh |
| `funky:spa:before:navigate` | Collapses widget |
| `funky:preferences:changed` | Reloads preferences from other tabs |

### Listening Example

```javascript
Funky.PubSub.on('funky:quick-nav:action:clicked', function(data) {
  console.log('Action clicked:', data.id);
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.quick-nav` | Main container |
| `.quick-nav--top-left` | Position modifier |
| `.quick-nav--expanded` | Expanded state |
| `.quick-nav--hidden` | Hidden state |
| `.quick-nav__fab` | FAB button |
| `.quick-nav__list` | Action list container |
| `.quick-nav__action` | Action button |
| `.quick-nav__action--hidden` | Hidden action |
| `.quick-nav__action--disabled` | Disabled action |
| `.quick-nav__badge` | Badge element |

## Accessibility

- Full keyboard navigation (Tab, Enter, Escape)
- ARIA attributes on all elements
- Screen reader announcements for navigation
- Respects `prefers-reduced-motion`

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.Events` - Event handling
- `Funky.PubSub` - Event bus
- `Funky.ScrollTracker` - Scroll detection
- `Funky.ActionRegistry` - Action management
- `Funky.MediaQuery` - Motion preferences (optional)
- `Funky.Preferences` - User preferences persistence (optional)

## File Location

`/public/assets/js/components/quick-nav.js`

## See Also

- [Funky.ActionRegistry](action-registry.md) - Action management
- [Funky.ScrollTracker](scroll-tracker.md) - Scroll tracking
- [Funky.Badge](badge.md) - Badge component
