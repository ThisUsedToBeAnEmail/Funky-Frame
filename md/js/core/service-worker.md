# Funky.ServiceWorker - Service Worker Client Module

A client-side module for registering, messaging, and interacting with service workers. Provides lifecycle events via PubSub and integrates with browser notification and push APIs.

## Overview

Service workers run in the background and enable:
- **Offline functionality** - Cache resources for offline access
- **Push notifications** - Receive notifications even when the app is closed
- **Background sync** - Defer actions until connectivity is restored
- **Performance** - Serve cached content instantly

`Funky.ServiceWorker` is the client-side API that your page uses to control the service worker. The actual caching logic lives in your service worker file (e.g., `/sw.js`).

## Registration

```javascript
// Registered as Funky.ServiceWorker
Funky.ServiceWorker.register('/sw.js', { scope: '/' });
```

---

## Quick Start

```javascript
// Check support
if (Funky.ServiceWorker.isSupported()) {
    // Register service worker
    Funky.ServiceWorker.register('/sw.js', {
        scope: '/',
        updateInterval: 60000  // Check for updates every 60s
    }).then(function(registration) {
        console.log('SW registered:', registration.scope);
    });
}

// Listen for lifecycle events
Funky.PubSub.on('funky:sw:activated', function(data) {
    console.log('SW is now controlling the page');
});

Funky.PubSub.on('funky:sw:updated', function(data) {
    console.log('New version available!');
    // Optionally prompt user to refresh
});
```

---

## Registration API

### `Funky.ServiceWorker.register(swPath, options)`

Register a service worker.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| swPath | string | Yes | Path to service worker file (e.g., `/sw.js`) |
| options.scope | string | No | URL scope the SW controls (default: `/`) |
| options.updateInterval | number | No | Check for updates every N ms (0 to disable) |
| options.onUpdate | function | No | Callback when update is available |
| options.autoReload | boolean | No | Auto-reload page when update activates |

**Returns:** `Promise<ServiceWorkerRegistration>`

**Example:**
```javascript
Funky.ServiceWorker.register('/sw.js', {
    scope: '/',
    updateInterval: 60000,
    onUpdate: function(registration) {
        if (confirm('New version available. Reload?')) {
            window.location.reload();
        }
    }
}).then(function(reg) {
    console.log('Registered with scope:', reg.scope);
}).catch(function(err) {
    console.error('Registration failed:', err);
});
```

---

### `Funky.ServiceWorker.unregister()`

Unregister the current service worker.

**Returns:** `Promise<boolean>` - true if unregistered

```javascript
Funky.ServiceWorker.unregister().then(function(success) {
    if (success) {
        console.log('Service worker unregistered');
    }
});
```

---

### `Funky.ServiceWorker.update()`

Force check for service worker updates.

**Returns:** `Promise<ServiceWorkerRegistration>`

```javascript
Funky.ServiceWorker.update().then(function(reg) {
    if (reg.waiting) {
        console.log('New version waiting to activate');
    }
});
```

---

### `Funky.ServiceWorker.skipWaiting()`

Activate a waiting service worker immediately.

**Returns:** `Promise<void>`

```javascript
// When user clicks "Update now"
Funky.ServiceWorker.skipWaiting().then(function() {
    window.location.reload();
});
```

---

## Messaging API

### `Funky.ServiceWorker.postMessage(type, data)`

Send a message to the active service worker.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Message type identifier |
| data | any | No | Data to send |

**Returns:** `Promise<void>`

```javascript
// Tell SW to clear a cache
Funky.ServiceWorker.postMessage('CACHE_CLEAR', { cacheName: 'api-cache' });

// Tell SW to precache URLs
Funky.ServiceWorker.postMessage('PRECACHE', {
    urls: ['/page1.html', '/page2.html']
});
```

---

### `Funky.ServiceWorker.onMessage(type, handler)`

Listen for messages from the service worker.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Message type to listen for |
| handler | function | Yes | Callback receiving the data |

**Returns:** `Function` - Unsubscribe function

```javascript
// Listen for cache updates
var unsub = Funky.ServiceWorker.onMessage('CACHE_UPDATED', function(data) {
    console.log('Cache updated:', data.cacheName);
});

// Later: stop listening
unsub();
```

---

### `Funky.ServiceWorker.offMessage(type, handler)`

Remove message listener.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Message type |
| handler | function | No | Specific handler to remove (omit to remove all) |

```javascript
// Remove specific handler
Funky.ServiceWorker.offMessage('CACHE_UPDATED', myHandler);

// Remove all handlers for type
Funky.ServiceWorker.offMessage('CACHE_UPDATED');
```

---

## Notifications API

### `Funky.ServiceWorker.showNotification(title, options)`

Show a notification via the service worker. This bypasses some browser restrictions compared to the direct Notification API.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | Notification title |
| options.body | string | No | Notification body text |
| options.icon | string | No | Icon URL |
| options.badge | string | No | Badge icon URL |
| options.tag | string | No | Tag for grouping/replacing |
| options.data | object | No | Custom data for click handler |
| options.requireInteraction | boolean | No | Keep notification visible |
| options.actions | array | No | Action buttons |

**Returns:** `Promise<void>`

```javascript
Funky.ServiceWorker.showNotification('New Message', {
    body: 'You have a new message from John',
    icon: '/icons/message.png',
    tag: 'message-notification',
    data: { messageId: 123 },
    actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
    ]
});
```

---

### `Funky.ServiceWorker.requestPermission()`

Request notification permission from the user.

**Returns:** `Promise<string>` - 'granted', 'denied', or 'default'

```javascript
Funky.ServiceWorker.requestPermission().then(function(permission) {
    if (permission === 'granted') {
        console.log('Notifications enabled!');
    }
});
```

---

### `Funky.ServiceWorker.getPermission()`

Get current notification permission state.

**Returns:** `string` - 'granted', 'denied', or 'default'

```javascript
if (Funky.ServiceWorker.getPermission() === 'granted') {
    // Can show notifications
}
```

---

## Push Subscription API

### `Funky.ServiceWorker.subscribe(vapidKey, options)`

Subscribe to push notifications.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| vapidKey | string | Yes | VAPID public key (base64) |
| options.userVisibleOnly | boolean | No | Only show visible notifications (default: true) |

**Returns:** `Promise<PushSubscription>`

```javascript
Funky.ServiceWorker.subscribe('BEl62iUYgUivxIkv4...')
    .then(function(subscription) {
        // Send subscription to your server
        return fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription)
        });
    });
```

---

### `Funky.ServiceWorker.unsubscribe()`

Unsubscribe from push notifications.

**Returns:** `Promise<boolean>`

```javascript
Funky.ServiceWorker.unsubscribe().then(function(success) {
    console.log('Unsubscribed:', success);
});
```

---

### `Funky.ServiceWorker.getSubscription()`

Get current push subscription.

**Returns:** `Promise<PushSubscription|null>`

```javascript
Funky.ServiceWorker.getSubscription().then(function(sub) {
    if (sub) {
        console.log('Subscribed:', sub.endpoint);
    } else {
        console.log('Not subscribed');
    }
});
```

---

## State API

### `Funky.ServiceWorker.isSupported()`

Check if service workers are supported.

**Returns:** `boolean`

```javascript
if (Funky.ServiceWorker.isSupported()) {
    // Safe to use SW APIs
}
```

---

### `Funky.ServiceWorker.isReady()`

Check if service worker is active and controlling the page.

**Returns:** `boolean`

```javascript
if (Funky.ServiceWorker.isReady()) {
    // SW is active and controlling
}
```

---

### `Funky.ServiceWorker.ready()`

Wait for service worker to be ready.

**Returns:** `Promise<ServiceWorkerRegistration>`

```javascript
Funky.ServiceWorker.ready().then(function(registration) {
    console.log('SW ready:', registration.active.scriptURL);
});
```

---

### `Funky.ServiceWorker.getRegistration()`

Get the service worker registration object.

**Returns:** `ServiceWorkerRegistration|null`

---

### `Funky.ServiceWorker.getActive()`

Get the active service worker.

**Returns:** `ServiceWorker|null`

---

### `Funky.ServiceWorker.getWaiting()`

Get the waiting service worker (if update available).

**Returns:** `ServiceWorker|null`

---

## PubSub Events

The module emits lifecycle events via `Funky.PubSub`:

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:sw:installing` | `{ registration }` | SW is installing |
| `funky:sw:installed` | `{ registration }` | SW installed (first time) |
| `funky:sw:activating` | `{ registration }` | SW is activating |
| `funky:sw:activated` | `{ registration }` | SW activated and controlling |
| `funky:sw:updated` | `{ registration, waiting }` | New version available |
| `funky:sw:error` | `{ error }` | Registration or update error |
| `funky:sw:message` | `{ type, data }` | Message received from SW |

**Example:**
```javascript
// Show update prompt
Funky.PubSub.on('funky:sw:updated', function(data) {
    Funky.Toast.info('A new version is available. Refresh to update.');
});

// Log all SW messages
Funky.PubSub.on('funky:sw:message', function(data) {
    console.log('[SW Message]', data.type, data.data);
});
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 45+ |
| Firefox | 44+ |
| Safari | 11.1+ |
| Edge | 17+ |

**Requirements:**
- HTTPS (except localhost for development)
- Service worker file must be served from same origin

---

## Common Patterns

### Update Prompt

```javascript
Funky.PubSub.on('funky:sw:updated', function(data) {
    var toast = Funky.Toast.show({
        type: 'info',
        message: 'New version available',
        duration: 0,  // Don't auto-dismiss
        actions: [{
            label: 'Refresh',
            onClick: function() {
                Funky.ServiceWorker.skipWaiting();
                window.location.reload();
            }
        }]
    });
});
```

### Offline Detection

```javascript
// Combine with online/offline events
window.addEventListener('online', function() {
    Funky.Toast.success('Back online');
});

window.addEventListener('offline', function() {
    Funky.Toast.warning('You are offline');
});
```

### Cache Management

```javascript
// Clear API cache
document.getElementById('clear-cache').onclick = function() {
    Funky.ServiceWorker.postMessage('CACHE_CLEAR', {
        cacheName: 'api-v1'
    });
};
```

---

## Writing a Service Worker

Funky provides composable utilities for building your service worker via `importScripts()`. Your application's `sw.js` imports these utilities and configures them for your needs.

### FunkySW Utilities

| Module | Purpose |
|--------|---------|
| `strategies.js` | Caching strategies (cacheFirst, networkFirst, etc.) |
| `cache-manager.js` | Cache lifecycle (precache, cleanup, prune) |
| `notifications.js` | Push notification handlers |
| `messaging.js` | Client ↔ SW message protocol |

### Example Service Worker

```javascript
// your-app/sw.js
importScripts('/assets/js/sw/strategies.js');
importScripts('/assets/js/sw/cache-manager.js');
importScripts('/assets/js/sw/notifications.js');
importScripts('/assets/js/sw/messaging.js');

var CACHE_VERSION = '1.0.0';
var CACHE_PREFIX = 'my-app-';
var STATIC_CACHE = CACHE_PREFIX + 'static-v' + CACHE_VERSION;
var RUNTIME_CACHE = CACHE_PREFIX + 'runtime';

// Assets to precache during install
var STATIC_ASSETS = [
    '/',
    '/assets/css/app.css',
    '/assets/js/app.js',
    '/offline.html'
];

// Route-based caching strategies
var ROUTES = {
    '/api/': 'networkFirst',
    '/assets/': 'cacheFirst',
    '/docs/': 'staleWhileRevalidate'
};

// Notification defaults
var NOTIFICATION_DEFAULTS = {
    icon: '/assets/img/icon-192.png',
    badge: '/assets/img/badge-72.png',
    vibrate: [200, 100, 200]
};

// Install: Precache static assets
self.addEventListener('install', function(event) {
    console.log('[SW] Installing version:', CACHE_VERSION);
    event.waitUntil(
        FunkySW.CacheManager.precache(STATIC_CACHE, STATIC_ASSETS)
            .then(function() {
                console.log('[SW] Static assets cached');
            })
    );
});

// Activate: Cleanup old caches
self.addEventListener('activate', function(event) {
    console.log('[SW] Activating version:', CACHE_VERSION);
    event.waitUntil(
        FunkySW.CacheManager.cleanup(CACHE_VERSION, CACHE_PREFIX)
            .then(function() {
                return self.clients.claim();
            })
            .then(function() {
                return FunkySW.Messaging.broadcast('SW_UPDATED', {
                    version: CACHE_VERSION
                });
            })
    );
});

// Fetch: Apply caching strategies
self.addEventListener('fetch', function(event) {
    var request = event.request;

    // Skip non-GET and cross-origin
    if (request.method !== 'GET') return;
    if (!request.url.startsWith(location.origin)) return;

    // Match route to strategy
    var strategy = FunkySW.matchRoute(request.url, ROUTES) || 'networkFirst';
    var cacheName = request.url.includes('/assets/') ? STATIC_CACHE : RUNTIME_CACHE;

    event.respondWith(
        FunkySW.strategies[strategy](request, { cacheName: cacheName })
    );
});

// Push: Handle incoming notifications
self.addEventListener('push', function(event) {
    event.waitUntil(
        FunkySW.Notifications.handlePush(event, NOTIFICATION_DEFAULTS)
    );
});

// Notification Click: Route actions
self.addEventListener('notificationclick', function(event) {
    event.waitUntil(
        FunkySW.Notifications.handleClick(event, {
            'view': function(data) {
                return clients.openWindow(data.url || '/');
            },
            'dismiss': function() {
                // Already closed
            },
            'default': function(data) {
                return clients.openWindow(data.url || '/');
            }
        })
    );
});

// Messages: Handle client messages
self.addEventListener('message', function(event) {
    FunkySW.Messaging.handleMessage(event, FunkySW.Messaging.standardHandlers);
});
```

---

## Caching Strategies

### FunkySW.strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `cacheFirst` | Check cache first, fetch if not found | Static assets (CSS, JS, images) |
| `networkFirst` | Try network first, fall back to cache | Dynamic content, API data |
| `staleWhileRevalidate` | Return cache immediately, update in background | Content that can be slightly stale |
| `networkOnly` | Always fetch from network | Real-time data, auth endpoints |
| `cacheOnly` | Only return from cache | Offline-first, precached content |

### Strategy Usage

```javascript
// In fetch handler
event.respondWith(
    FunkySW.strategies.cacheFirst(request, {
        cacheName: 'my-cache',
        cacheResponse: true  // Cache the response
    })
);

// Network-first with cache fallback
event.respondWith(
    FunkySW.strategies.networkFirst(request, {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3  // Fall back to cache after 3s
    })
);

// Stale-while-revalidate
event.respondWith(
    FunkySW.strategies.staleWhileRevalidate(request, {
        cacheName: 'docs-cache'
    })
);
```

### Route Matching

```javascript
var ROUTES = {
    '/api/': 'networkFirst',
    '/assets/': 'cacheFirst',
    '/images/': 'cacheFirst',
    '/docs/': 'staleWhileRevalidate'
};

// In fetch handler
var strategy = FunkySW.matchRoute(request.url, ROUTES);
// Returns strategy name or null if no match
```

---

## Cache Manager

### FunkySW.CacheManager

| Method | Description |
|--------|-------------|
| `precache(cacheName, urls, options)` | Cache list of URLs during install |
| `cleanup(currentVersion, prefix)` | Delete old version caches |
| `prune(cacheName, maxEntries, maxAge)` | Limit cache size and age |
| `delete(cacheName)` | Delete entire cache |

### Precaching

```javascript
// In install event
event.waitUntil(
    FunkySW.CacheManager.precache('my-cache-v1', [
        '/',
        '/app.js',
        '/styles.css'
    ], {
        logErrors: true  // Log failed fetches
    })
);
```

### Cleanup Old Caches

```javascript
// In activate event - removes caches with prefix that don't match version
event.waitUntil(
    FunkySW.CacheManager.cleanup('1.0.0', 'my-app-')
);
// Deletes: my-app-static-v0.9.0, my-app-runtime-v0.8.0
// Keeps: my-app-static-v1.0.0, my-app-runtime-v1.0.0
```

### Cache Pruning

```javascript
// Limit cache size
FunkySW.CacheManager.prune('api-cache', {
    maxEntries: 50,  // Keep only 50 most recent
    maxAge: 86400    // Remove entries older than 1 day (seconds)
});
```

---

## Message Protocol

### Standard Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `FUNKY_SW_READY` | SW → Client | SW activated and ready |
| `FUNKY_SW_UPDATED` | SW → Client | New version available |
| `FUNKY_SW_SKIP_WAITING` | Client → SW | Activate waiting SW immediately |
| `FUNKY_SW_CACHE_CLEAR` | Client → SW | Clear specified cache |
| `FUNKY_SW_NOTIFICATION` | Client → SW | Show notification via SW |
| `FUNKY_SW_PRECACHE` | Client → SW | Precache list of URLs |

### FunkySW.Messaging

```javascript
// Broadcast message to all clients
FunkySW.Messaging.broadcast('MY_EVENT', { data: 'value' });

// Handle incoming messages with standard + custom handlers
var handlers = FunkySW.Messaging.createHandlers({
    'MY_CUSTOM_TYPE': function(data, event) {
        console.log('Custom message:', data);
        // Reply to specific client
        event.source.postMessage({ type: 'MY_RESPONSE', data: 'ok' });
    }
});

self.addEventListener('message', function(event) {
    FunkySW.Messaging.handleMessage(event, handlers);
});
```

### Standard Handlers

The `standardHandlers` object includes:

```javascript
FunkySW.Messaging.standardHandlers = {
    'FUNKY_SW_SKIP_WAITING': function() {
        return self.skipWaiting();
    },
    'FUNKY_SW_CACHE_CLEAR': function(data) {
        return caches.delete(data.cacheName);
    },
    'FUNKY_SW_CACHE_CLEAR_ALL': function() {
        return caches.keys().then(function(names) {
            return Promise.all(names.map(function(name) {
                return caches.delete(name);
            }));
        });
    },
    'FUNKY_SW_PRECACHE': function(data) {
        return caches.open(data.cacheName).then(function(cache) {
            return cache.addAll(data.urls);
        });
    }
};
```

---

## Notifications

### FunkySW.Notifications

| Method | Description |
|--------|-------------|
| `handlePush(event, defaults)` | Process push event and show notification |
| `handleClick(event, actionHandlers)` | Route notification click actions |
| `handleClose(event, callback)` | Handle notification close |
| `setDefaults(options)` | Set default notification options |

### Push Handling

```javascript
self.addEventListener('push', function(event) {
    event.waitUntil(
        FunkySW.Notifications.handlePush(event, {
            title: 'Default Title',
            icon: '/icon.png',
            badge: '/badge.png',
            actions: [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
            ]
        })
    );
});
```

Push payload format:
```json
{
    "title": "New Message",
    "body": "You have a new message",
    "icon": "/custom-icon.png",
    "data": {
        "url": "/messages/123"
    }
}
```

### Click Handling

```javascript
self.addEventListener('notificationclick', function(event) {
    event.waitUntil(
        FunkySW.Notifications.handleClick(event, {
            'view': function(data) {
                // data comes from notification.data
                return clients.openWindow(data.url || '/');
            },
            'reply': function(data) {
                return clients.openWindow('/compose?reply=' + data.messageId);
            },
            'default': function(data) {
                // Clicked notification body (not a button)
                return clients.openWindow('/');
            }
        })
    );
});
```

---

## Troubleshooting

### SW Not Registering

**Symptom:** `register()` promise rejects

**Causes:**
- Not served over HTTPS (localhost is exempt)
- SW file path is incorrect
- SW file has syntax errors

**Debug:**
```javascript
Funky.ServiceWorker.register('/sw.js')
    .catch(function(error) {
        console.error('SW Registration failed:', error);
    });
```

### SW Not Updating

**Symptom:** Old version keeps running

**Causes:**
- Browser caching the SW file
- New SW waiting (not activated)

**Solutions:**
```javascript
// Force update check
Funky.ServiceWorker.update();

// Activate waiting SW
Funky.ServiceWorker.skipWaiting();

// Add cache-control header to sw.js on server:
// Cache-Control: max-age=0
```

### Notifications Not Showing

**Symptom:** `showNotification()` silently fails

**Causes:**
- Permission not granted
- SW not active
- Browser settings blocking

**Debug:**
```javascript
console.log('Permission:', Funky.ServiceWorker.getPermission());
console.log('SW Ready:', Funky.ServiceWorker.isReady());

// Request permission explicitly
Funky.ServiceWorker.requestPermission().then(function(perm) {
    console.log('Permission result:', perm);
});
```

### Push Subscription Failing

**Symptom:** `subscribe()` rejects

**Causes:**
- Invalid VAPID key
- Notification permission denied
- SW not ready

**Debug:**
```javascript
// Check SW is ready first
Funky.ServiceWorker.ready().then(function() {
    return Funky.ServiceWorker.subscribe(vapidKey);
}).then(function(sub) {
    console.log('Subscribed:', sub);
}).catch(function(err) {
    console.error('Subscribe failed:', err);
});
```

### Cache Not Working

**Symptom:** Resources not cached or stale

**Debug in DevTools:**
1. Application → Cache Storage → Inspect caches
2. Application → Service Workers → Check status
3. Network tab → Check if requests bypass SW

**Force cache refresh:**
```javascript
Funky.ServiceWorker.postMessage('FUNKY_SW_CACHE_CLEAR_ALL');
```

---

## Migration from Raw SW Code

If you have an existing service worker, migrate to FunkySW utilities:

### Before

```javascript
// Inline caching logic
self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    var clone = response.clone();
                    caches.open('api-cache').then(function(cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(function() {
                    return caches.match(event.request);
                })
        );
    }
});
```

### After

```javascript
importScripts('/assets/js/sw/strategies.js');

self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            FunkySW.strategies.networkFirst(event.request, {
                cacheName: 'api-cache'
            })
        );
    }
});
```

---

## See Also

- [pubsub.md](pubsub.md) - PubSub event system
- [notification-center.md](../components/notification-center.md) - NotificationCenter component
- [toast.md](../components/toast.md) - Toast notifications
