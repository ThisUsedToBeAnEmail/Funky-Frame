# Progressive Web App (PWA)

Funky is a Progressive Web App (PWA) that can be installed on any device and works offline. This document describes the PWA implementation.

## Overview

The PWA implementation includes:

- **Service Worker** - Handles caching, offline support, and push notifications
- **Web App Manifest** - Enables app installation and defines appearance
- **Offline Support** - Core functionality works without network connection
- **Push Notifications** - Real-time alerts even when app is closed

## Installation

### Desktop (Chrome, Edge, Firefox)

1. Navigate to the application
2. Click the install icon in the address bar (or menu → "Install Funky")
3. Click "Install" in the prompt

### Mobile (iOS Safari)

1. Navigate to the application
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Mobile (Android Chrome)

1. Navigate to the application
2. Tap the "Install" banner, or menu → "Add to Home Screen"
3. Tap "Install"

## Service Worker

The service worker (`public/sw.js`) handles caching and offline functionality.

### Cache Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Cache Strategy                         │
├─────────────────────────────────────────────────────────┤
│  Static Assets    │  Cache on install, serve from cache │
│  HTML Pages       │  Network-first, cache fallback      │
│  API Calls        │  Network-first, cache for offline   │
│  Preferences API  │  Always network, never cache        │
└─────────────────────────────────────────────────────────┘
```

### Static Assets Cache

On install, the service worker pre-caches essential assets:

- Bootstrap CSS/JS
- Funky Table CSS/JS
- Font Awesome icons/fonts
- Select2
- Ace Editor
- jQuery
- Custom Funky CSS/JS
- App icons and manifest

### Cache Versioning

```javascript
const CACHE_VERSION = '1.4.4'; // Increment to force cache refresh
const CACHE_NAME = `funky-static-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `funky-runtime-v${CACHE_VERSION}`;
```

When the version changes:
1. New service worker installs
2. Old caches are deleted
3. Clients receive `SW_UPDATED` message
4. Page can prompt user to reload

### Lifecycle Events

**Install Event**
```javascript
self.addEventListener('install', (event) => {
  // Cache static assets
  // Skip waiting to activate immediately
});
```

**Activate Event**
```javascript
self.addEventListener('activate', (event) => {
  // Delete old caches
  // Claim all clients
  // Notify clients of update
});
```

**Fetch Event**
```javascript
self.addEventListener('fetch', (event) => {
  // Route requests through appropriate cache strategy
});
```

## Web App Manifest

The manifest (`public/site.webmanifest`) defines how the app appears when installed.

### Key Properties

| Property | Value | Description |
|----------|-------|-------------|
| `name` | "Funky Framework" | Full app name |
| `short_name` | "Funky" | Name on home screen |
| `display` | "standalone" | Runs without browser UI |
| `theme_color` | "#ff6600" | Status bar color |
| `background_color` | "#1a1a2e" | Splash screen background |
| `orientation` | "any" | Portrait or landscape |

### App Shortcuts

The manifest defines shortcuts for quick access:

- **Trades** - `/trades`
- **Clients** - `/clients`
- **Reports** - `/report_formats`

These appear in the app's context menu (right-click on desktop, long-press on mobile).

## Offline Support

### What Works Offline

- Cached pages from previous visits
- Static assets (CSS, JS, fonts, images)
- Previously fetched API data (read-only)
- Core navigation between cached pages

### What Requires Network

- Fresh data from API endpoints
- Submitting forms (create, update, delete)
- Real-time WebSocket updates
- Push notification subscription

### Offline Page

If a user navigates to an uncached page while offline, they see `public/offline.html`:

```html
<title>Offline - Funky Framework</title>
<!-- Explains offline state and offers retry -->
```

## Push Notifications

Push notifications are handled by the service worker. See [PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md) for full documentation.

### Service Worker Integration

```javascript
// Receive push message
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Funky', {
    body: data.body,
    icon: data.icon || '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url: data.url || '/' }
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Open or focus the app at the notification's URL
});
```

## Client Communication

The service worker communicates with the app via `postMessage`:

### Update Notification

```javascript
// Service worker sends on activation
client.postMessage({
  type: 'SW_UPDATED',
  version: CACHE_VERSION
});

// App listens for updates
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'SW_UPDATED') {
    // Show "New version available" prompt
  }
});
```

## Development

### Updating the Service Worker

1. Make changes to `public/sw.js`
2. Increment `CACHE_VERSION`
3. Deploy changes
4. Browser downloads new service worker
5. New SW installs and activates on next page load

### Testing Offline

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Navigate the app to test offline behavior

### Clearing Cache

1. Open DevTools → Application → Storage
2. Click "Clear site data"
3. Or increment `CACHE_VERSION` in sw.js

### Common Issues

**Cache not updating?**
- Increment `CACHE_VERSION`
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Clear site data in DevTools

**Service worker not installing?**
- Ensure HTTPS (localhost is allowed)
- Check console for errors
- Verify sw.js is served with correct MIME type

## Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Service worker with caching logic |
| `public/site.webmanifest` | Web app manifest |
| `public/offline.html` | Offline fallback page |
| `public/index.html` | PWA entry point |
| `public/*.png` | App icons for various sizes |

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅* | ✅ |
| App Installation | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |

*Safari push notifications require specific handling and have limitations.
