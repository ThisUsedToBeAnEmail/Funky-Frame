# Funky.NavPosition - Navigation Position System

Unified navigation position detection and dropdown/flyout behavior management for all four layout positions (left, right, top, bottom).

## Overview

`Funky.NavPosition` handles navigation positioning, dropdown menus, flyout submenus, and modal slide direction awareness. It automatically adapts behavior based on where the navigation bar is positioned.

## API Reference

### Constants

#### Positions

```javascript
Funky.NavPosition.POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom'
};
```

#### Slide Directions

```javascript
Funky.NavPosition.SLIDE_DIRECTIONS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  AUTO: 'auto'
};
```

### Methods

#### `NavPosition.init()`

Initialize the navigation system. Called automatically on DOM ready.

**Returns:** `NavPosition` - The instance (for chaining)

---

#### `NavPosition.getPosition()`

Get current navigation position.

**Returns:** `string` - One of: 'left', 'right', 'top', 'bottom'

**Example:**
```javascript
const pos = Funky.NavPosition.getPosition();
if (pos === 'left' || pos === 'right') {
  console.log('Vertical navigation');
}
```

---

#### `NavPosition.setPosition(position)`

Set navigation position (changes data attribute on body).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| position | string | Yes | One of: 'left', 'right', 'top', 'bottom' |

**Example:**
```javascript
Funky.NavPosition.setPosition('right');
```

---

#### `NavPosition.isVertical()`

Check if navigation is vertical (left or right).

**Returns:** `boolean`

---

#### `NavPosition.isHorizontal()`

Check if navigation is horizontal (top or bottom).

**Returns:** `boolean`

---

#### `NavPosition.isLeft()`

Check if navigation is positioned on the left.

**Returns:** `boolean`

---

#### `NavPosition.isRight()`

Check if navigation is positioned on the right.

**Returns:** `boolean`

---

#### `NavPosition.isTop()`

Check if navigation is positioned at the top.

**Returns:** `boolean`

---

#### `NavPosition.isBottom()`

Check if navigation is positioned at the bottom.

**Returns:** `boolean`

---

#### `NavPosition.getOppositeSide()`

Get the opposite side from current navigation position.

**Returns:** `string` - Opposite position ('left' → 'right', 'top' → 'bottom', etc.)

**Example:**
```javascript
var pos = Funky.NavPosition.getPosition();      // 'left'
var opposite = Funky.NavPosition.getOppositeSide(); // 'right'
```

---

#### `NavPosition.getModalSlideDirection()`

Get the recommended modal slide direction based on nav position.

**Returns:** `string` - Recommended slide direction

**Automatic Direction Logic:**
| Nav Position | Recommended Slide |
|--------------|-------------------|
| left | right |
| right | left |
| top | bottom |
| bottom | top |

---

#### `NavPosition.onPositionChange(callback)`

Register callback for position changes.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| callback | function | Yes | Called with `(newPosition, oldPosition)` |

**Returns:** `function` - Unsubscribe function

**Example:**
```javascript
const unsubscribe = Funky.NavPosition.onPositionChange(function(newPos, oldPos) {
  console.log('Navigation moved from', oldPos, 'to', newPos);
  updateLayout();
});
```

---

#### `NavPosition.openDropdown(groupElement)`

Open a navigation dropdown/flyout.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| groupElement | Element | Yes | The nav-group element |

---

#### `NavPosition.closeDropdown(groupElement)`

Close a navigation dropdown/flyout.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| groupElement | Element | Yes | The nav-group element |

---

#### `NavPosition.closeAllDropdowns()`

Close all open dropdowns.

---

### Modal Fullscreen Methods

#### `NavPosition.setModalSlideDirection(direction, save)`

Set the modal slide direction.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| direction | string | Yes | 'left', 'right', 'top', 'bottom', or 'auto' |
| save | boolean | No | Save preference to storage (default: false) |

---

#### `NavPosition.toggleModalFullscreen(modalOrId)`

Toggle fullscreen mode for a modal.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| modalOrId | string\|Element | Yes | Modal element or ID |

**Example:**
```javascript
Funky.NavPosition.toggleModalFullscreen('#editModal');
```

---

#### `NavPosition.setModalFullscreen(modalOrId, fullscreen)`

Set fullscreen state for a modal.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| modalOrId | string\|Element | Yes | Modal element or ID |
| fullscreen | boolean | Yes | Whether to enable fullscreen |

---

#### `NavPosition.initModalFullscreenToggles()`

Initialize fullscreen toggle buttons in modals. Called automatically, but can be called manually after dynamic content load.

---

#### `NavPosition.getModalSlideClass()`

Get the CSS class for modal slide animation based on current nav position.

**Returns:** `string` - CSS class (e.g., 'modal-slide-left', 'modal-slide-right')

---

### User Menu Methods

#### `NavPosition.initUserMenu()`

Initialize the user menu. Called automatically on init.

---

#### `NavPosition.toggleUserMenu()`

Toggle the user menu dropdown.

---

#### `NavPosition.openUserMenu()`

Open the user menu dropdown.

---

#### `NavPosition.closeUserMenu()`

Close the user menu dropdown.

---

### Sidebar Methods

#### `NavPosition.isSidebarCollapsed()`

Check if the sidebar is currently collapsed.

**Returns:** `boolean`

---

### Position Listeners

#### `NavPosition.addPositionListener(callback)`

Add a callback to be called when position changes. Alternative to `onPositionChange`.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| callback | function | Yes | Called with new position |

---

#### `NavPosition.removePositionListener(callback)`

Remove a previously added position listener.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| callback | function | Yes | The callback to remove |

---

### Lifecycle

#### `NavPosition.destroy()`

Destroy the NavPosition instance and clean up all event listeners and observers.

**Example:**
```javascript
// Clean up before re-initialization
Funky.NavPosition.destroy();
```

---

## Position-Specific Behavior

### Vertical Navigation (Left/Right)

- Dropdowns appear as flyout menus
- Flyouts open away from the edge (left nav → right flyout, right nav → left flyout)
- Hover-based opening with delay for better UX
- Click outside closes flyouts

### Horizontal Navigation (Top/Bottom)

- Dropdowns appear below/above the nav item
- Standard dropdown behavior
- Click-based opening

## Dependencies

- `Funky.Storage` - For position preference persistence
- `Funky.PubSub` - For event emission (optional)

## Examples

### Respond to Position Changes

```javascript
Funky.NavPosition.onPositionChange(function(position) {
  // Adjust content area margins
  const content = document.getElementById('content');
  content.className = 'content-' + position;
});
```

### Configure Modal Based on Position

```javascript
function openModal(options) {
  const slideDirection = Funky.NavPosition.getModalSlideDirection();
  
  Funky.Modal.show(Object.assign({
    slideFrom: slideDirection
  }, options));
}
```
