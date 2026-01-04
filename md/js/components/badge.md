# Funky.Badge

Generic badge utility for attaching count/status indicators to any element.

## Overview

`Funky.Badge` provides a reusable badge component that can be attached to any element. Supports count badges, dot indicators, status types, and auto-updating from PubSub events.

## Quick Start

```javascript
// Attach a count badge
Funky.Badge.attach('#notifications-btn', 5);

// Update badge value
Funky.Badge.update('#notifications-btn', 10);

// Remove badge
Funky.Badge.remove('#notifications-btn');

// Auto-update from PubSub
Funky.Badge.subscribe('#notifications-btn', 'app:notifications:count');
```

## API Reference

### Core Methods

#### `attach(target, options)`

Attach a badge to an element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string/Element | Yes | Element or selector |
| options | number/string/Object | Yes | Value or options object |

**Options Object:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| value | number/string | - | Badge value |
| type | string | `'count'` | Badge type |
| animate | boolean | `true` | Animate on change |
| max | number | `99` | Maximum displayed (shows "99+") |
| position | string | `'top-right'` | Badge position |
| className | string | `''` | Additional CSS class |

**Example:**
```javascript
// Simple count
Funky.Badge.attach('#btn', 5);

// With options
Funky.Badge.attach('#btn', {
  value: 5,
  type: 'warning',
  max: 50,
  position: 'top-left'
});
```

---

#### `update(target, options)`

Update an existing badge.

```javascript
Funky.Badge.update('#btn', { value: 10, animate: true });
```

---

#### `remove(target)`

Remove badge from element.

```javascript
Funky.Badge.remove('#btn');
```

---

### Query Methods

#### `has(target)`

Check if element has a badge.

**Returns:** `boolean`

---

#### `getValue(target)`

Get current badge text.

**Returns:** `string|null`

---

#### `getType(target)`

Get current badge type.

**Returns:** `string|null`

---

### Subscription Methods

#### `subscribe(target, eventName, options)`

Auto-update badge from PubSub events.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string/Element | Yes | Element or selector |
| eventName | string | Yes | PubSub event name |
| options | Object | No | Default badge options |

**Returns:** `string` - Subscription ID

**Example:**
```javascript
// Subscribe to notification count
var subId = Funky.Badge.subscribe(
  '#notifications-btn',
  'app:notifications:count',
  { type: 'count', max: 99 }
);

// Emit from anywhere to update
Funky.PubSub.emit('app:notifications:count', { count: 15 });
```

---

#### `unsubscribe(subscriptionId)`

Unsubscribe by subscription ID.

```javascript
Funky.Badge.unsubscribe(subId);
```

---

#### `unsubscribeAll(target)`

Unsubscribe all subscriptions for an element.

---

#### `clearSubscriptions()`

Clear all badge subscriptions.

---

## Badge Types

| Type | Default Value | Description |
|------|---------------|-------------|
| `'count'` | Number | Numeric badge with max overflow |
| `'dot'` | None | Simple dot indicator |
| `'warning'` | `'!'` | Warning indicator |
| `'success'` | `'✓'` | Success indicator |
| `'info'` | `'i'` | Info indicator |

**Examples:**
```javascript
// Count badge (shows "5")
Funky.Badge.attach('#btn', { value: 5, type: 'count' });

// Dot indicator
Funky.Badge.attach('#btn', { type: 'dot' });

// Warning with custom text
Funky.Badge.attach('#btn', { value: '!', type: 'warning' });

// Success indicator
Funky.Badge.attach('#btn', { type: 'success' });
```

## Badge Positions

| Position | Description |
|----------|-------------|
| `'top-right'` | Top right corner (default) |
| `'top-left'` | Top left corner |
| `'bottom-right'` | Bottom right corner |
| `'bottom-left'` | Bottom left corner |

## PubSub Events

### Emitted Events

| Event | Data | Description |
|-------|------|-------------|
| `funky:badge:attached` | `{ element, value, type }` | Badge attached |
| `funky:badge:updated` | `{ element, value, type, previousValue }` | Badge updated |
| `funky:badge:removed` | `{ element }` | Badge removed |

### Subscription Data Format

When subscribing to events, the handler expects data in these formats:

```javascript
// Object with count
Funky.PubSub.emit('event:name', { count: 5 });

// Object with value
Funky.PubSub.emit('event:name', { value: 5 });

// Direct value
Funky.PubSub.emit('event:name', 5);
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.funky-badge` | Base badge class |
| `.funky-badge--count` | Count type modifier |
| `.funky-badge--dot` | Dot type modifier |
| `.funky-badge--warning` | Warning type modifier |
| `.funky-badge--success` | Success type modifier |
| `.funky-badge--info` | Info type modifier |
| `.funky-badge--top-right` | Position modifier |
| `.funky-badge--large` | Large badge (overflow) |
| `.funky-badge--animate` | Animation state |

## Accessibility

- Respects `prefers-reduced-motion` for animations
- Uses Funky.MediaQuery for shared motion preference listener
- Badges are purely visual - ensure meaningful content is accessible

## Usage Patterns

### Navigation with Badges

```javascript
// Setup
Funky.Badge.subscribe('#inbox-link', 'inbox:unread:count');
Funky.Badge.subscribe('#notifications', 'notifications:count');

// Update from anywhere
Funky.PubSub.emit('inbox:unread:count', { count: 3 });
```

### Form Validation Indicators

```javascript
// Show validation error
Funky.Badge.attach('#email-field', { type: 'warning' });

// Show success
Funky.Badge.attach('#email-field', { type: 'success' });
```

### Cart Badge

```javascript
function updateCart(count) {
  if (count > 0) {
    Funky.Badge.update('#cart-icon', { value: count, animate: true });
  } else {
    Funky.Badge.remove('#cart-icon');
  }
}
```

## Constants

```javascript
// Available types
Funky.Badge.TYPES // ['count', 'dot', 'warning', 'success', 'info']

// CSS class
Funky.Badge.CLASS // 'funky-badge'
```

## Dependencies

- `Funky.Dom` - DOM manipulation
- `Funky.PubSub` - Event bus
- `Funky.MediaQuery` - Motion preferences (optional)

## File Location

`/public/assets/js/components/badge.js`

## See Also

- [Funky.QuickNav](quick-nav.md) - Uses Badge for action indicators
- [Funky.PubSub](../core/pubsub.md) - Event bus for subscriptions
