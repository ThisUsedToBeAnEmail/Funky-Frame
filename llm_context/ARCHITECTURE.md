# Funky Frame - Architecture

> SPA routing, PWA features, and service worker patterns.

## Overview

Funky Frame provides:
- **SPA Navigation** - Client-side routing without page reloads
- **PWA Support** - Installable, offline-capable web app
- **Service Worker** - Caching, background sync, push notifications

Full docs: [/md/SPA_ARCHITECTURE.md](/md/SPA_ARCHITECTURE.md), [/md/PWA.md](/md/PWA.md)

---

## SPA Navigation

### Core Modules
| Module | Purpose | Docs |
|--------|---------|------|
| Navigation | Route handling | [navigation.md](/md/js/core/navigation.md) |
| Pages | Page lifecycle | [pages.md](/md/js/core/pages.md) |
| SPA | SPA core | [spa.md](/md/js/core/spa.md) |
| History | Browser history | [history.md](/md/js/core/history.md) |

### Page Lifecycle

```javascript
// Register a page with lifecycle hooks
Funky.Pages.register('dashboard', {
    init: function(state) {
        // Called when page loads
        console.log('Dashboard initialized with state:', state);
        
        // Setup components
        this.table = Funky.Table.init('#data-table', { ... });
    },
    
    destroy: function() {
        // Called when navigating away
        console.log('Dashboard destroyed');
        
        // Cleanup components
        if (this.table) this.table.destroy();
        
        // Return state to preserve
        return { scrollPosition: window.scrollY };
    },
    
    resume: function(state) {
        // Called when returning to cached page
        console.log('Dashboard resumed');
        window.scrollTo(0, state.scrollPosition || 0);
    }
});
```

### Navigation Links

```html
<!-- Standard SPA link -->
<a href="/dashboard" data-spa-link>Dashboard</a>

<!-- SPA link with prefetch -->
<a href="/reports" data-spa-link data-prefetch>Reports</a>
```

### Programmatic Navigation

```javascript
// Navigate to URL
Funky.Navigation.navigate('/dashboard');

// Navigate with state
Funky.Navigation.navigate('/dashboard', { filter: 'active' });

// Replace current entry (no history)
Funky.Navigation.replace('/login');

// Go back
Funky.Navigation.back();
```

---

## Page Registration (HTML)

Pages declare themselves via data attributes:

```html
<main id="spaContent" 
      data-page="dashboard" 
      data-breadcrumb-title="Dashboard"
      data-skip-target="main"
      data-skip-label="main content">
    
    <!-- Page content -->
    
    <script>
        // Page-specific initialization
        Funky.Pages.register('dashboard', { ... });
    </script>
</main>
```

---

## PWA Features

### Manifest

```json
{
    "name": "Funky App",
    "short_name": "Funky",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#4361ee",
    "background_color": "#1a1a2e",
    "icons": [...]
}
```

### Service Worker Registration

```javascript
// In main app
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('SW registered:', registration);
        })
        .catch(function(error) {
            console.error('SW registration failed:', error);
        });
}
```

### Funky.ServiceWorker Module

Docs: [/md/js/core/service-worker.md](/md/js/core/service-worker.md)

```javascript
// Check if installed
if (Funky.ServiceWorker.isSupported()) {
    Funky.ServiceWorker.register('/sw.js', {
        onUpdate: function() {
            // New version available
            Funky.Toast.info('Update available. Refresh to apply.');
        },
        onOffline: function() {
            Funky.Toast.warning('You are offline');
        },
        onOnline: function() {
            Funky.Toast.success('Back online');
        }
    });
}
```

---

## Caching Strategies

### Cache-First (Static Assets)
```javascript
// In sw.js
self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('/assets/')) {
        event.respondWith(
            caches.match(event.request).then(function(response) {
                return response || fetch(event.request);
            })
        );
    }
});
```

### Network-First (API Calls)
```javascript
// In sw.js
if (event.request.url.includes('/api/')) {
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Clone and cache
                var clone = response.clone();
                caches.open('api-cache').then(function(cache) {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(function() {
                // Fallback to cache
                return caches.match(event.request);
            })
    );
}
```

---

## Offline Queue

Docs: [/md/QUEUE.md](/md/QUEUE.md)

Queue requests when offline, sync when back online:

```javascript
// Check online status
if (navigator.onLine) {
    Funky.Api.post('/api/orders', orderData);
} else {
    Funky.RequestQueue.add({
        url: '/api/orders',
        method: 'POST',
        data: orderData
    });
}

// Queue auto-syncs when online via Service Worker
```

### Queue Status Component

```javascript
// Show pending queue items
Funky.QueueStatus.init('#queue-indicator', {
    onSync: function(count) {
        Funky.Toast.success(count + ' items synced');
    }
});
```

---

## Live Binding

Docs: [/md/js/core/live-binding.md](/md/js/core/live-binding.md)

Reactive data binding for automatic UI updates:

```javascript
var state = Funky.LiveBinding.create({
    count: 0,
    items: []
});

// Subscribe to changes
state.subscribe('count', function(newValue, oldValue) {
    document.getElementById('counter').textContent = newValue;
});

// Update triggers subscribers
state.set('count', state.get('count') + 1);
```

---

## WebSocket Integration

Docs: [/md/js/core/websocket.md](/md/js/core/websocket.md)

Real-time updates:

```javascript
var ws = Funky.WebSocket.connect('/ws', {
    onMessage: function(data) {
        // Handle incoming message
        Funky.PubSub.publish('realtime', data.type, data.payload);
    },
    onReconnect: function() {
        console.log('WebSocket reconnected');
    }
});

// Send message
ws.send({ type: 'subscribe', channel: 'orders' });
```

---

## Key Architectural Patterns

### 1. Component Independence
Components don't directly reference each other. Use events:

```javascript
// Component A publishes
E.emit('order:created', orderData);

// Component B subscribes
E.on('order:created', function(order) {
    this.refresh();
}.bind(this));
```

### 2. Lazy Loading
Load components only when needed:

```javascript
// Load heavy component on demand
if (needsChart) {
    Funky.require('charts').then(function() {
        Funky.Charts.init('#chart', data);
    });
}
```

### 3. State Preservation
Preserve state across navigation:

```javascript
// In page destroy
return { 
    scrollPos: container.scrollTop,
    filters: this.getFilters()
};

// In page resume
container.scrollTop = state.scrollPos || 0;
this.setFilters(state.filters || {});
```

---

## Directory Integration

```
funky-frame/
├── index.html          # Entry point, loads SPA shell
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── core/
│   ├── navigation.js   # Routing
│   ├── pages.js        # Page lifecycle
│   ├── spa.js          # SPA core
│   └── service-worker.js # SW utilities
└── playground/         # Demo pages (each a mini-SPA page)
```
