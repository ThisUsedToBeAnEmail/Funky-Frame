# Funky.NotificationCenter - In-App Notification System

Centralized notification center with bell icon, dropdown panel, badge counts, real-time updates, and LiveBinding support.

## Overview

`Funky.NotificationCenter` provides an in-app notification system for displaying alerts, messages, and activity updates. It features a bell icon trigger with unread count badge, dropdown list of notifications, mark as read functionality, category filtering, and optional desktop notifications with sound.

## Quick Start

### Basic Initialization

```javascript
// Initialize notification center
Funky.NotificationCenter.init({
    container: '#notification-bell',
    sound: true,
    maxVisible: 10
});

// Add a notification
Funky.NotificationCenter.add({
    title: 'Trade Executed',
    body: 'Your order for 100 AAPL has been filled',
    category: 'trade',
    iconColor: 'success'
});
```

### HTML Structure

```html
<!-- Container element -->
<div id="notification-bell"></div>

<!-- The component will render: -->
<div class="notification-center" data-notification-center>
    <button class="notification-center__trigger">
        <i class="fas fa-bell"></i>
        <span class="notification-center__badge">3</span>
    </button>
    <div class="notification-center__dropdown">
        <!-- Header, tabs, list, footer -->
    </div>
</div>
```

---

## API Reference

### Initialization

#### `NotificationCenter.init(options)`

Initialize the notification center.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | Yes | Configuration options |

**Core Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/element | null | Container selector or element |
| `api` | string | null | API endpoint for notifications |
| `websocket` | object | null | WebSocket instance |
| `channel` | string | null | WebSocket channel |
| `maxVisible` | number | 10 | Max notifications in dropdown |
| `instanceId` | string | null | Instance ID for LiveBinding |
| `loadOnInit` | boolean | true | Load notifications on init |

**Sound Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sound` | boolean | true | Enable sound |
| `soundVolume` | number | 0.5 | Sound volume (0-1) |
| `soundUrl` | string | '/assets/sound/notification.mp3' | Default sound URL |
| `sounds` | object | {...} | Per-type sound URLs: `{ default, success, warning, error, info }` |

**Desktop Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `desktop` | boolean | false | Enable desktop notifications |
| `desktopIcon` | string | '/favicon.ico' | Desktop notification icon |
| `desktopTimeout` | number | 5000 | Desktop notification timeout (ms) |

**Polling & Categories:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pollInterval` | number | 0 | Polling interval ms (0 = disabled) |
| `categories` | array | [] | Category definitions |
| `groupByCategory` | boolean | false | Group notifications by category |

**Behavior Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoMarkRead` | boolean | false | Auto-mark read on view |
| `persistReadState` | boolean | true | Persist read state to storage |
| `storageKey` | string | null | Storage key for persistence |
| `confirmDismiss` | boolean | false | Confirm before dismissing |
| `markReadOnAction` | boolean | true | Mark read when action clicked |
| `defaultActions` | array | `['view', 'dismiss']` | Default action buttons |

**API Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiHeaders` | object | {} | Headers to send with API requests |
| `transformResponse` | function | null | Transform API response data |

**WebSocket Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsEvents` | object | {...} | WebSocket event names: `{ new, read, remove, clear, count }` |
| `crossTabSync` | boolean | true | Sync notifications across browser tabs |

**Action Handlers:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `actionHandlers` | object | {} | Custom action handler functions |
| `onAction` | function | null | Callback when any action clicked |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
Funky.NotificationCenter.init({
    container: '#notification-bell',
    api: '/api/notifications',
    websocket: Funky.WebSocket,
    channel: 'user:123:notifications',
    sound: true,
    desktop: true,
    maxVisible: 15
});
```

---

### Adding Notifications

#### `NotificationCenter.add(notification)`

Add a notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| notification | object | Yes | Notification data |

**Notification Object:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | No | Unique ID (auto-generated if omitted) |
| `title` | string | Yes | Notification title |
| `body` | string | No | Description text |
| `category` | string | No | Category for filtering |
| `icon` | string | No | FontAwesome icon class |
| `iconColor` | string | No | 'success', 'warning', 'danger', 'info' |
| `href` | string | No | Click destination URL |
| `actions` | array | No | Action buttons |
| `timestamp` | Date/number | No | When notification occurred |
| `read` | boolean | No | Read state (default: false) |
| `sound` | string/boolean | No | Sound type or false to disable |
| `desktop` | boolean | No | Show desktop notification |

**Example:**
```javascript
Funky.NotificationCenter.add({
    title: 'Order Filled',
    body: 'Your order for 100 AAPL has been filled at $150.00',
    category: 'trade',
    iconColor: 'success',
    icon: 'fa-check-circle',
    href: '/trades/456',
    actions: [
        { label: 'View', href: '/trades/456' },
        { label: 'Dismiss', action: 'dismiss' }
    ],
    timestamp: Date.now()
});
```

---

### Reading Notifications

#### `NotificationCenter.markRead(id)`

Mark a notification as read.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Notification ID |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.markAllRead()`

Mark all notifications as read.

**Returns:** `Object` - this for chaining

---

### Removing Notifications

#### `NotificationCenter.remove(id)`

Remove a notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Notification ID |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.clear()`

Remove all notifications.

**Returns:** `Object` - this for chaining

---

### Filtering

#### `NotificationCenter.filter(filter)`

Filter notifications by category or read state.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| filter | string | Yes | 'all', 'unread', or category name |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.getFilter()`

Get the current filter.

**Returns:** `string` - Current filter value

**Example:**
```javascript
var currentFilter = Funky.NotificationCenter.getFilter();
// 'all', 'unread', or category name
```

**Example:**
```javascript
// Show only unread
Funky.NotificationCenter.filter('unread');

// Show trades only
Funky.NotificationCenter.filter('trade');

// Show all
Funky.NotificationCenter.filter('all');
```

---

### Dropdown Control

#### `NotificationCenter.open()`

Open the dropdown panel.

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.close()`

Close the dropdown panel.

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.toggle()`

Toggle the dropdown panel.

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.isOpen()`

Check if dropdown is open.

**Returns:** `boolean`

---

### Getting Data

#### `NotificationCenter.getUnreadCount()`

Get the number of unread notifications.

**Returns:** `number`

---

#### `NotificationCenter.getData()`

Get all notifications.

**Returns:** `Array` - Copy of notifications array

---

### Desktop Notifications

#### `NotificationCenter.requestDesktopPermission()`

Request permission for desktop notifications.

**Returns:** `Promise<string>` - Permission state ('granted', 'denied', 'default')

**Example:**
```javascript
Funky.NotificationCenter.requestDesktopPermission()
    .then(function(permission) {
        if (permission === 'granted') {
            console.log('Desktop notifications enabled');
        }
    });
```

---

#### `NotificationCenter.hasDesktopPermission()`

Check if desktop notifications are permitted.

**Returns:** `boolean` - True if permission is 'granted'

**Example:**
```javascript
if (Funky.NotificationCenter.hasDesktopPermission()) {
    console.log('Desktop notifications allowed');
}
```

---

#### `NotificationCenter.getDesktopPermission()`

Get the current desktop notification permission state.

**Returns:** `string` - 'granted', 'denied', 'default', or 'unsupported'

**Example:**
```javascript
var permission = Funky.NotificationCenter.getDesktopPermission();
```

---

#### `NotificationCenter.showDesktop(options)`

Show a desktop notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options.title | string | Yes | Notification title |
| options.body | string | No | Notification body |
| options.icon | string | No | Icon URL |
| options.onClick | function | No | Click handler |

**Returns:** `Notification|null` - Native Notification object or null

---

### Sound

#### `NotificationCenter.playSound(type)`

Play a notification sound.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | No | 'default', 'success', 'warning', 'error' |

---

#### `NotificationCenter.setSoundVolume(volume)`

Set the notification sound volume.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| volume | number | Yes | Volume level (0-1) |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
Funky.NotificationCenter.setSoundVolume(0.7);
```

---

#### `NotificationCenter.setSound(enabled)`

Enable or disable notification sounds.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| enabled | boolean | Yes | Enable/disable sounds |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
Funky.NotificationCenter.setSound(false); // Disable sounds
```

---

### Settings

#### `NotificationCenter.setSettings(settings)`

Update notification settings.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| settings.sound | boolean | No | Enable/disable sound |
| settings.soundVolume | number | No | Volume (0-1) |
| settings.desktop | boolean | No | Enable/disable desktop |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.getSettings()`

Get current settings.

**Returns:** `Object` - Settings object

---

### Actions

#### `NotificationCenter.registerAction(action, handler)`

Register a custom action handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name |
| handler | function | Yes | Handler function(notification, actionData) |

**Example:**
```javascript
Funky.NotificationCenter.registerAction('approve', function(notification, data) {
    Funky.Api.post('/api/trades/' + data.tradeId + '/approve')
        .then(function() {
            Funky.Toast.success('Trade approved');
            this.remove(notification.id);
        }.bind(this));
});
```

---

#### `NotificationCenter.unregisterAction(action)`

Unregister a custom action handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name to remove |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.getActionHandlers()`

Get all registered action handlers.

**Returns:** `Object` - Map of action names to handlers

---

#### `NotificationCenter.executeAction(action, notification, actionData)`

Execute an action on a notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name |
| notification | object | Yes | Notification object |
| actionData | object | No | Additional data for action |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
var notification = Funky.NotificationCenter.getData()[0];
Funky.NotificationCenter.executeAction('approve', notification, { tradeId: 123 });
```

---

#### `NotificationCenter.bulkAction(action, ids, actionData)`

Execute an action on multiple notifications by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name |
| ids | array | Yes | Array of notification IDs |
| actionData | object | No | Additional data for action |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
Funky.NotificationCenter.bulkAction('dismiss', ['id1', 'id2', 'id3']);
```

---

#### `NotificationCenter.actionAll(action, actionData)`

Execute an action on all notifications.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name |
| actionData | object | No | Additional data for action |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.actionFiltered(action, filter, actionData)`

Execute an action on notifications matching a filter.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| action | string | Yes | Action name |
| filter | string/function | Yes | Category name or filter function |
| actionData | object | No | Additional data for action |

**Returns:** `Object` - this for chaining

**Example:**
```javascript
// Dismiss all trade notifications
Funky.NotificationCenter.actionFiltered('dismiss', 'trade');

// Dismiss with custom filter
Funky.NotificationCenter.actionFiltered('dismiss', function(n) {
    return n.read === true;
});
```

---

#### `NotificationCenter.addActionButton(notificationId, action)`

Add an action button to a notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| notificationId | string | Yes | Notification ID |
| action | object | Yes | `{ id, label, icon?, handler? }` |

**Returns:** `Object` - this for chaining

---

#### `NotificationCenter.removeActionButton(notificationId, actionId)`

Remove an action button from a notification.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| notificationId | string | Yes | Notification ID |
| actionId | string | Yes | Action button ID |

**Returns:** `Object` - this for chaining

---

### Data Loading

#### `NotificationCenter.load(options)`

Load notifications from the API.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options.reset | boolean | No | Clear existing notifications |
| options.page | number | No | Page number for pagination |

**Returns:** `Promise`

---

#### `NotificationCenter.refresh()`

Refresh notifications from the API (shorthand for load with reset).

**Returns:** `Object` - this for chaining

---

### Accessibility

#### `NotificationCenter.announce(message)`

Announce a message to screen readers via the ARIA live region.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Message to announce |

**Example:**
```javascript
Funky.NotificationCenter.announce('3 new notifications');
```

---

### Static Methods

#### `NotificationCenter.getInstance(instanceId)`

Get a notification center instance by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| instanceId | string | Yes | Instance ID |

**Returns:** `Object` - NotificationCenter instance or null

---

#### `NotificationCenter.destroy()`

Destroy the notification center instance and clean up.

---

#### `NotificationCenter.addTransient(notification)`

Add a transient (non-persistent) notification that auto-dismisses.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| notification | object | Yes | Notification object with optional `duration` |

**Example:**
```javascript
Funky.NotificationCenter.addTransient({
    title: 'Quick message',
    body: 'This will disappear in 5 seconds',
    duration: 5000
});
```

---

### Presence Integration

#### `NotificationCenter.enablePresenceNotifications(options)`

Enable presence-based notification delivery (deliver when user is active).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options.batchWhenAway | boolean | No | Batch notifications while away |
| options.deliverOnReturn | boolean | No | Deliver batched on return |

**Example:**
```javascript
Funky.NotificationCenter.enablePresenceNotifications({
    batchWhenAway: true,
    deliverOnReturn: true
});
```

---

#### `NotificationCenter.disablePresenceNotifications()`

Disable presence-based notification delivery.

---

#### `NotificationCenter.isPresenceNotificationsEnabled()`

Check if presence notifications are enabled.

**Returns:** `boolean`

---

#### `NotificationCenter.enablePresenceDelivery()`

Enable presence-aware delivery (notifications held until user is present).

---

#### `NotificationCenter.disablePresenceDelivery()`

Disable presence-aware delivery.

---

#### `NotificationCenter.getBatchedCount()`

Get the count of batched notifications waiting for delivery.

**Returns:** `number`

---

#### `NotificationCenter.deliverBatched()`

Deliver all batched notifications immediately.

---

### LiveBinding Interface

The component implements the LiveBinding interface for reactive data updates.

#### Instance Registry

```javascript
// Access instance by ID
var instance = Funky.NotificationCenter.getInstance('my_instance');
```

#### Bindable Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setData(notifications)` | Array | Replace all notifications |
| `getData()` | - | Get current notifications |
| `addItem(notification)` | Object | Add single notification |
| `removeItem(id)` | string | Remove notification |
| `updateItem(id, updates)` | string, Object | Update notification |

#### Data Binding Example

```html
<!-- Bind to API -->
<div id="notification-bell"
     data-live-bind="api:/api/notifications"
     data-live-interval="30000">
</div>
```

```javascript
// Bind to state
Funky.LiveBinding.bind({
    source: { type: 'state', key: 'notifications' },
    target: {
        type: 'component',
        component: 'NotificationCenter',
        instance: 'header_notifications'
    }
});

// Update via state
Funky.LiveBinding.setState('notifications', [
    { id: '1', title: 'New notification', read: false }
]);
```

---

## Events

### PubSub Events (Colon Notation)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:notification:add` | `{ notification }` | Notification added |
| `funky:notification:read` | `{ id }` | Notification marked read |
| `funky:notification:remove` | `{ id }` | Notification removed |
| `funky:notification:click` | `{ notification }` | Notification clicked |
| `funky:notification:action` | `{ notification, action, data }` | Action executed |
| `funky:notification:filter` | `{ filter, count }` | Filter changed |

**Example:**
```javascript
Funky.PubSub.on('funky:notification:add', function(data) {
    console.log('New notification:', data.notification.title);
});
```

### DOM Events (Dot Notation)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.notification.open` | `{}` | Dropdown opened |
| `funky.notification.close` | `{}` | Dropdown closed |

**Example:**
```javascript
var container = document.getElementById('notification-bell');
container.addEventListener('funky.notification.open', function() {
    console.log('Notification panel opened');
});
```

---

## CSS Classes

| Class | Description |
|-------|-------------|
| `.notification-center` | Root container |
| `.notification-center__trigger` | Bell button |
| `.notification-center__badge` | Unread count badge |
| `.notification-center__badge--empty` | Badge when count is 0 |
| `.notification-center__dropdown` | Dropdown panel |
| `.notification-center__dropdown--open` | Open state |
| `.notification-center__header` | Panel header |
| `.notification-center__tabs` | Filter tabs |
| `.notification-center__list` | Notification list |
| `.notification-center__item` | Single notification |
| `.notification-center__item--unread` | Unread state |
| `.notification-center__icon` | Notification icon |
| `.notification-center__content` | Title/body container |
| `.notification-center__title` | Notification title |
| `.notification-center__body` | Notification body |
| `.notification-center__time` | Timestamp |
| `.notification-center__actions` | Action buttons |
| `.notification-center__dismiss` | Dismiss button |
| `.notification-center__empty` | Empty state |
| `.notification-center__footer` | Panel footer |

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter/Space` | Open dropdown / Activate item |
| `Escape` | Close dropdown |
| `Arrow Down/j` | Next item |
| `Arrow Up/k` | Previous item |
| `Home` | First item |
| `End` | Last item |
| `Delete` | Dismiss notification |
| `r` | Toggle read state |
| `Alt+N` | Toggle dropdown (global) |

---

## Accessibility

- Trigger button has `aria-haspopup`, `aria-expanded`, `aria-controls`
- Dropdown has `role="region"` with `aria-label`
- List has `role="list"` with `aria-live="polite"`
- Items have `role="listitem"` with accessible names
- Focus trapped in dropdown when open
- Focus returns to trigger on close
- Keyboard navigation fully supported
- Screen reader announces new notifications

---

## Dependencies

### Required
- `Funky.Dom` (D)
- `Funky.Events` (E)
- `Funky.PubSub`

### Optional
- `Funky.Api` - Server persistence
- `Funky.WebSocket` - Real-time updates
- `Funky.RelativeTime` - Time formatting
- `Funky.Storage` - Local persistence
- `Funky.Badge` - Badge utility
- `Funky.Animate` - Animations
- `Funky.LiveBinding` - Reactive binding

---

## See Also

- [LiveBinding Documentation](../core/live-binding.md)
- [WebSocket Documentation](../core/websocket.md)
- [Badge Component](./badge.md)
- [Toast Component](./toast.md)
