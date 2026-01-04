# Funky.PushNotification - Browser Push Notifications

Browser push notification wrapper that provides a clean API for requesting permissions and sending notifications via the Service Worker.

## Overview

`Funky.PushNotification` wraps the browser's Notification API and Service Worker messaging to provide a simple, unified interface for push notifications. Notifications are sent through the Service Worker, allowing them to persist even after navigating away from the page.

## Requirements

- Browser with Notification API support
- Active Service Worker with `SHOW_NOTIFICATION` message handler
- User permission for notifications

## API Reference

### Properties

#### `PushNotification.DEFAULTS`

Default notification options.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| icon | string | '/assets/img/icon-192.png' | Notification icon URL |
| badge | string | '/assets/img/badge-72.png' | Badge icon URL (mobile) |
| vibrate | array | [200, 100, 200] | Vibration pattern |
| tag | string | null | Grouping tag |
| renotify | boolean | true | Vibrate again if same tag |
| requireInteraction | boolean | false | Keep visible until interaction |
| silent | boolean | false | Suppress sound/vibration |
| delay | number | 0 | Delay in seconds |
| data | object | {} | Custom data for click handler |

---

### Methods

#### `PushNotification.isSupported()`

Check if push notifications are supported in the browser.

**Returns:** `boolean`

**Example:**
```javascript
if (Funky.PushNotification.isSupported()) {
    console.log('Push notifications are supported');
} else {
    console.log('Push notifications not available');
}
```

---

#### `PushNotification.isReady()`

Check if the Service Worker is ready to handle notifications.

**Returns:** `boolean`

**Example:**
```javascript
if (Funky.PushNotification.isReady()) {
    Funky.PushNotification.show('Ready!', { body: 'Service Worker is active' });
}
```

---

#### `PushNotification.getPermission()`

Get current notification permission status.

**Returns:** `string` - One of: `'granted'`, `'denied'`, `'default'`, or `'unsupported'`

**Example:**
```javascript
var permission = Funky.PushNotification.getPermission();

switch (permission) {
    case 'granted':
        console.log('Notifications allowed');
        break;
    case 'denied':
        console.log('Notifications blocked');
        break;
    case 'default':
        console.log('Permission not yet requested');
        break;
}
```

---

#### `PushNotification.requestPermission()`

Request notification permission from the user.

**Returns:** `Promise<string>` - Permission result

**Example:**
```javascript
Funky.PushNotification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
        console.log('Permission granted!');
        Funky.PushNotification.show('Welcome!', { body: 'Notifications enabled' });
    } else {
        console.log('Permission denied or dismissed');
    }
});
```

---

#### `PushNotification.init()`

Initialize and wait for Service Worker to be ready.

**Returns:** `Promise<boolean>` - True if ready

**Example:**
```javascript
Funky.PushNotification.init().then(function(ready) {
    if (ready) {
        console.log('Push notifications initialized');
    }
});
```

---

#### `PushNotification.show(title, options)`

Show a push notification via the Service Worker.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Notification title |
| options | object | No | Notification options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| body | string | '' | Notification body text |
| icon | string | (default) | Icon URL |
| badge | string | (default) | Badge icon URL |
| tag | string | null | Tag for grouping |
| delay | number | 0 | Delay in seconds before showing |
| data | object | {} | Custom data for click handler |
| renotify | boolean | true | Vibrate again if same tag |
| requireInteraction | boolean | false | Keep visible until interaction |
| silent | boolean | false | Suppress sound/vibration |
| vibrate | array | (default) | Vibration pattern |

**Returns:** `Promise<void>`

**Example:**
```javascript
// Simple notification
Funky.PushNotification.show('Hello!', {
    body: 'This is a notification'
});

// With delay
Funky.PushNotification.show('Reminder', {
    body: 'This appears in 5 seconds',
    delay: 5
});

// With custom options
Funky.PushNotification.show('New Message', {
    body: 'You have a new message from John',
    icon: '/icons/message.png',
    tag: 'message-123',
    data: { messageId: 123 }
});
```

---

#### `PushNotification.showNow(title, options)`

Show a notification immediately (no delay).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Notification title |
| options | object | No | Notification options (same as `show()`) |

**Returns:** `Promise<void>`

**Example:**
```javascript
Funky.PushNotification.showNow('Alert!', {
    body: 'This appears immediately'
});
```

---

#### `PushNotification.schedule(title, delaySeconds, options)`

Schedule a notification with a specific delay.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Notification title |
| delaySeconds | number | Yes | Delay in seconds |
| options | object | No | Notification options (same as `show()`) |

**Returns:** `Promise<void>`

**Example:**
```javascript
// Show notification in 10 seconds
Funky.PushNotification.schedule('Timer Complete', 10, {
    body: 'Your timer has finished'
});

// Schedule a reminder
Funky.PushNotification.schedule('Meeting Reminder', 300, {
    body: 'Your meeting starts in 5 minutes',
    tag: 'meeting-reminder'
});
```

---

#### `PushNotification.setDefaults(options)`

Update default notification options.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | Yes | New default values |

**Example:**
```javascript
Funky.PushNotification.setDefaults({
    icon: '/my-app-icon.png',
    badge: '/my-badge.png',
    vibrate: [100, 50, 100]
});
```

---

#### `PushNotification.getDefaults()`

Get current default options.

**Returns:** `object` - Copy of current defaults

**Example:**
```javascript
var defaults = Funky.PushNotification.getDefaults();
console.log('Default icon:', defaults.icon);
```

---

#### `PushNotification.getRegistration()`

Get the Service Worker registration.

**Returns:** `ServiceWorkerRegistration|null`

**Example:**
```javascript
var registration = Funky.PushNotification.getRegistration();
if (registration) {
    console.log('SW scope:', registration.scope);
}
```

---

### Event Methods

#### `PushNotification.on(event, handler)`

Register an event handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | Yes | Callback function |

**Events:**
| Event | Data | Description |
|-------|------|-------------|
| permission | `{ permission }` | Permission status changed |
| ready | `{ registration }` | Service Worker ready |
| show | `{ title, options }` | Notification sent |
| error | `{ error }` | Error occurred |

**Returns:** `PushNotification` - For chaining

**Example:**
```javascript
Funky.PushNotification.on('permission', function(data) {
    console.log('Permission changed:', data.permission);
});

Funky.PushNotification.on('ready', function(data) {
    console.log('SW ready');
});

Funky.PushNotification.on('show', function(data) {
    console.log('Notification sent:', data.title);
});
```

---

#### `PushNotification.off(event, handler)`

Remove an event handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | No | Handler to remove (all if omitted) |

**Returns:** `PushNotification` - For chaining

**Example:**
```javascript
// Remove specific handler
Funky.PushNotification.off('permission', myHandler);

// Remove all handlers for event
Funky.PushNotification.off('permission');
```

---

#### `PushNotification.once(event, handler)`

Register a one-time event handler.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | string | Yes | Event name |
| handler | function | Yes | Callback function |

**Returns:** `PushNotification` - For chaining

**Example:**
```javascript
// Wait for ready once
Funky.PushNotification.once('ready', function() {
    Funky.PushNotification.show('Initialized!', {
        body: 'Push notifications are ready'
    });
});
```

---

## Complete Examples

### Basic Usage

```javascript
// Check support and request permission
if (Funky.PushNotification.isSupported()) {
    Funky.PushNotification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
            Funky.PushNotification.show('Hello!', {
                body: 'Push notifications are enabled'
            });
        }
    });
}
```

### With Event Handling

```javascript
// Set up event handlers
Funky.PushNotification
    .on('ready', function() {
        console.log('Push notifications ready');
    })
    .on('permission', function(data) {
        if (data.permission === 'granted') {
            enableNotificationFeatures();
        }
    })
    .on('error', function(data) {
        console.error('Push error:', data.error);
    });

// Request permission
Funky.PushNotification.requestPermission();
```

### Scheduled Reminders

```javascript
// Set a reminder for 5 minutes
function setReminder(message, minutes) {
    var seconds = minutes * 60;

    Funky.PushNotification.schedule('Reminder', seconds, {
        body: message,
        tag: 'reminder-' + Date.now(),
        requireInteraction: true
    }).then(function() {
        console.log('Reminder set for', minutes, 'minutes');
    });
}

setReminder('Check the oven!', 5);
```

### Integration with Form Submission

```javascript
function submitForm(data) {
    return fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data)
    }).then(function(response) {
        return response.json();
    }).then(function(result) {
        // Show notification even if user navigates away
        Funky.PushNotification.show('Form Submitted', {
            body: 'Your form was submitted successfully',
            tag: 'form-submit'
        });
        return result;
    });
}
```

---

## Service Worker Integration

The component requires a Service Worker with a `SHOW_NOTIFICATION` message handler:

```javascript
// In your service worker (sw.js)
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        var data = event.data;
        var delayMs = (data.delay || 0) * 1000;

        var showNotif = function() {
            return self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                badge: data.badge,
                tag: data.tag,
                vibrate: data.vibrate,
                renotify: data.renotify,
                data: data.data
            });
        };

        if (delayMs > 0) {
            setTimeout(showNotif, delayMs);
        } else {
            showNotif();
        }
    }
});
```

---

## PubSub Events

The component emits events via `Funky.PubSub`:

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:push-notification:permission` | `{ permission }` | Permission changed |
| `funky:push-notification:ready` | `{ registration }` | SW ready |
| `funky:push-notification:show` | `{ title, options }` | Notification sent |
| `funky:push-notification:error` | `{ error }` | Error occurred |

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Notification API | Yes | Yes | Yes* | Yes |
| Service Worker | Yes | Yes | Yes | Yes |
| Push API | Yes | Yes | Yes* | Yes |

*Safari has limited support and requires additional configuration.

---

## See Also

- [Funky.NotificationCenter](notification-center.md) - In-app notification system
- [Funky.Toast](toast.md) - Toast notifications
- [Service Worker Guide](/docs/js/core/service-worker.md) - Service Worker setup
