# SPA Architecture Overview

A comprehensive guide to Funky's Single Page Application architecture, explaining the modular design, lifecycle patterns, and WebSocket-powered real-time updates.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Architecture Layers](#architecture-layers)
3. [Component Registry](#component-registry)
4. [SPA Navigation](#spa-navigation)
5. [Page Module System](#page-module-system)
6. [Caching Strategy](#caching-strategy)
7. [WebSocket Integration](#websocket-integration)
8. [Schema Abstraction](#schema-abstraction)
9. [Data Flow](#data-flow)
10. [Related Documentation](#related-documentation)

---

## Philosophy

Funky's SPA architecture follows these core principles:

### 1. Progressive Enhancement
The application works as a traditional multi-page app first. SPA behavior is layered on top, meaning:
- Full page loads work without JavaScript
- SPA intercepts navigation for a smoother experience
- Degradation is graceful if JavaScript fails

### 2. Modular Independence
Each component is self-contained:
- Registers itself with the global `Funky` namespace
- Has no hard dependencies on other components
- Communicates via events, not direct coupling

### 3. Convention Over Configuration
Predictable patterns reduce cognitive load:
- Page IDs derive from URL paths (`/trades` → `trades`)
- Entity types match API resource names
- Lifecycle methods have consistent signatures

### 4. Cache-First Navigation
Repeated visits are instant:
- First visit: Fetch from server, cache HTML + state
- Repeat visits: Restore from cache in <5ms
- Background: WebSocket invalidates stale cache entries

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │ Templates │  │   Table   │  │   Forms   │   ...         │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        └──────────────┼──────────────┘                      │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Funky.Pages (Page Registry)            │    │
│  │  • Page modules with init/destroy/update lifecycle  │    │
│  │  • Entity-based cache invalidation                  │    │
│  │  • State preservation (scroll, forms)               │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Funky.SPA (Navigation Core)            │    │
│  │  • Link interception                                │    │
│  │  • History API integration                          │    │
│  │  • Content loading and DOM replacement              │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Funky.Api (Data Layer)                 │    │
│  │  • Centralized API client                           │    │
│  │  • CSRF token management                            │    │
│  │  • Request/response handling                        │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   WebSocket                          │    │
│  │  • Real-time entity updates                         │    │
│  │  • Cache invalidation signals                       │    │
│  │  • Reconnection handling                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Registry

All Funky modules register with a central namespace via `Funky.register()`:

```javascript
// In /public/assets/js/core/registry.js
(function(window) {
  window.Funky = window.Funky || {};
  
  Funky.register = function(name, module) {
    Funky[name] = module;
    console.log('[Funky] Registered:', name);
  };
})(window);
```

### Registered Components

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| `Funky.SPA` | Navigation interception, content loading | [spa.md](js/core/spa.md) |
| `Funky.Pages` | Page registry, caching, lifecycle | [pages.md](js/core/pages.md) |
| `Funky.Api` | HTTP client with CSRF | [api.md](js/core/api.md) |
| `Funky.Storage` | LocalStorage abstraction | [storage.md](js/core/storage.md) |
| `Funky.PubSub` | Pub/sub event system | [pubsub.md](js/core/pubsub.md) |
| `Funky.Toast` | Notifications | [toast.md](js/components/toast.md) |
| `Funky.Table` | Native ES5 table component | [table.md](js/components/table.md) |

---

## SPA Navigation

`Funky.SPA` transforms the app into a Single Page Application:

### How It Works

1. **Intercept**: Click on internal link (`<a href="/trades">`)
2. **Check**: Is this link SPA-eligible? (not external, not file download, etc.)
3. **Unmount**: Call `destroy()` on current page module
4. **Load**: Fetch new content (from cache or server)
5. **Update**: Replace DOM content, update URL via History API
6. **Mount**: Call `init()` on new page module
7. **Event**: Dispatch `funky.spa.pageload` DOM event for other components

### Cache Integration

```
User clicks /trades
       │
       ▼
┌──────────────────┐
│ Is page cached?  │──── Yes ──→ Restore from cache (< 5ms)
└────────┬─────────┘                    │
         │ No                           │
         ▼                              │
   Fetch from server                    │
         │                              │
         ▼                              │
   Cache HTML + state                   │
         │                              │
         └──────────────────────────────┘
                     │
                     ▼
              Mount page module
```

### Configuration

```javascript
Funky.SPA.config = {
  contentSelector: '#spaContent',
  excludePatterns: [/^https?:\/\//, /\/api\//, /\.(pdf|csv)$/i],
  excludeSelectors: ['[data-no-spa]', '[target="_blank"]']
};
```

**Full documentation:** [Funky.SPA Reference](js/core/spa.md)

---

## Page Module System

Each page is a module with lifecycle hooks:

### Module Structure

```javascript
var TradesPage = {
  // Unique identifier (derived from URL: /trades → 'trades')
  id: 'trades',
  
  // Entities displayed on this page (for WebSocket updates)
  entities: ['trade', 'trade_allocation'],
  
  // Called when page becomes visible
  init: function(state) {
    // Initialize table, bind events, restore scroll position
    this.table = new Funky.Table('#tradesTable', {...});
    
    if (state && state.scrollY) {
      window.scrollTo(0, state.scrollY);
    }
  },
  
  // Called before navigating away
  destroy: function() {
    // Cleanup to prevent memory leaks
    if (this.table) {
      this.table.destroy();
      this.table = null;
    }
    
    // Return state to cache
    return { scrollY: window.scrollY };
  },
  
  // Called when WebSocket signals an entity update
  update: function(entityType, entityId, data, action) {
    // Targeted update without full page reload
    if (this.table) {
      this.table.ajax.reload(null, false);
    }
  }
};

// Register and auto-mount
Funky.Pages.register(TradesPage);
$(document).ready(function() {
  Funky.Pages.mount('trades');
});
```

### Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Page Lifecycle                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐               │
│  │ DORMANT │───▶│ MOUNTING │───▶│  ACTIVE  │               │
│  └─────────┘    └──────────┘    └────┬─────┘               │
│       ▲                              │                      │
│       │                              ▼                      │
│       │                        ┌──────────┐                 │
│       └────────────────────────│UNMOUNTING│                 │
│                                └──────────┘                 │
│                                                              │
│  Events:                                                     │
│  • pages:mounted   - After init() completes                 │
│  • pages:unmounted - After destroy() completes              │
│  • pages:updated   - After update() is called               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Full documentation:** [Funky.Pages Reference](js/core/pages.md)

---

## Caching Strategy

### What Gets Cached

| Data | Storage | TTL | Purpose |
|------|---------|-----|---------|
| Page HTML | Memory | 5 min | Instant navigation |
| Page state | Memory | 5 min | Scroll position, form values |
| Entity → Page map | Memory | Session | WebSocket invalidation |
| User preferences | LocalStorage | Persistent | Theme, table settings |

### Cache Invalidation

Cache is invalidated when:

1. **TTL expires** - Pages older than 5 minutes are refetched
2. **WebSocket update** - Entity change invalidates related pages
3. **Manual action** - User creates/edits/deletes data
4. **Logout** - Full cache clear

### Entity → Page Mapping

When a WebSocket message announces a `trade` update:

```javascript
// Server sends:
{ "entity": "trade", "action": "updated", "id": 123 }

// Client looks up which pages care about 'trade':
entityMap['trade'] = ['trades', 'dashboard', 'reports']

// Invalidates cache for those pages OR calls their update() method
```

---

## WebSocket Integration

### Message Flow

```
┌─────────────┐                           ┌─────────────┐
│   Server    │                           │   Client    │
├─────────────┤                           ├─────────────┤
│ Trade saved │                           │             │
│      │      │                           │             │
│      ▼      │                           │             │
│ Broadcast   │ ──── WebSocket ─────────▶ │ Receive     │
│ { entity:   │                           │ message     │
│   'trade',  │                           │      │      │
│   action:   │                           │      ▼      │
│   'updated',│                           │ Invalidate  │
│   id: 123 } │                           │ cache       │
│             │                           │      │      │
│             │                           │      ▼      │
│             │                           │ Call page   │
│             │                           │ update() or │
│             │                           │ mark stale  │
└─────────────┘                           └─────────────┘
```

### Update Strategies

| Strategy | When Used | Behavior |
|----------|-----------|----------|
| **Targeted** | Page is active, has `update()` | Call `update(entity, id, data, action)` |
| **Invalidate** | Page is cached, not active | Mark cache entry as stale |
| **Ignore** | Page doesn't list entity | No action |

---

## Schema Abstraction

*(Planned for Phase 6B)*

JSON schemas for forms are defined in the OpenAPI spec (`/api.json`) and fetched once:

```javascript
// Instead of inline schema definitions in every template:
var schema = Funky.Schema.enhance('CreateClient', {
  properties: {
    parent_id: {
      enum: clients.map(c => c.id),
      options: { enum_titles: clients.map(c => c.name) }
    }
  }
});

jsonEditor = new JSONEditor(container, { schema: schema });
```

### Benefits

- **Single source of truth** - Schemas in `api.json`, not scattered in templates
- **Consistency** - Same validation rules as API
- **Smaller templates** - No verbose inline schemas
- **Dynamic enhancement** - Add dropdown options at runtime

---

## Data Flow

### Create Operation

```
User clicks "Add Client"
         │
         ▼
  FormModal opens
         │
         ▼
  User fills form, submits
         │
         ▼
  Funky.Api.post('/api/clients', data)
         │
         ▼
  Server validates, saves
         │
         ▼
  Server broadcasts WebSocket: { entity: 'client', action: 'created', id: 456 }
         │
         ├──────────────────────────────────────┐
         ▼                                      ▼
  API returns { success: true, id: 456 }   WebSocket received
         │                                      │
         ▼                                      ▼
  Toast: "Client created"               Invalidate 'clients' cache
         │                                      │
         ▼                                      ▼
  Table reloads (or receives update)    If on page, call update()
```

### Navigation

```
User clicks "Clients" in sidebar
         │
         ▼
  SPA intercepts click
         │
         ▼
  Current page: destroy() called
         │       └── Returns { scrollY: 500 }
         ▼
  Is 'clients' in cache?
         │
   ┌─────┴─────┐
   │ Yes       │ No
   ▼           ▼
Restore HTML   Fetch from server
   │           │
   └─────┬─────┘
         │
         ▼
  Update URL: /clients
         │
         ▼
  Mount 'clients' page
         │
         ▼
  init(cachedState) called
         │
         ▼
  Dispatch 'funky.spa.pageload'
         │
         ▼
  Breadcrumb updates
```

---

## Related Documentation

### Core Modules
- [Funky.SPA](js/core/spa.md) - Navigation and content loading
- [Funky.Pages](js/core/pages.md) - Page registry and caching
- [Funky.Api](js/core/api.md) - HTTP client
- [Funky.PubSub](js/core/pubsub.md) - Pub/sub system
- [Funky.Storage](js/core/storage.md) - LocalStorage wrapper

### Components
- [Funky.Table](js/components/table.md) - Native ES5 table component
- [Funky.Toast](js/components/toast.md) - Notifications
- [Funky.Wizard](js/components/wizard.md) - Multi-step forms
- [Funky.Breadcrumb](js/components/breadcrumb.md) - Dynamic breadcrumbs

### Guides
- [Architecture Overview](ARCHITECTURE.md) - System architecture
- [Development Guide](DEVELOPMENT.md) - Local setup
- [API Security](API_SECURITY.md) - CSRF, rate limiting

---

## Implementation Phases

The SPA architecture is being implemented in phases:

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Foundation (Registry, Events, Storage) | ✅ Complete |
| 2 | Centralized API Layer | ✅ Complete |
| 3 | Component Extraction | ✅ Complete |
| 3B | Page SPA Architecture | ✅ Complete |
| 4 | WebSocket Infrastructure | 🔄 In Progress |
| 5 | Cache Layer | ⏳ Pending |
| 6 | Generic UI Components | ⏳ Pending |
| 6B | Schema Abstraction | ⏳ Pending |
| 7 | Template Refactor | ⏳ Pending |
| 8 | Smart Table Updates | ⏳ Pending |

---

## Best Practices

### DO ✅

```javascript
// Register page with clear entities
var MyPage = {
  id: 'clients',
  entities: ['client'],  // Be specific
  init: function(state) { ... },
  destroy: function() { 
    // Always clean up
    if (this.interval) clearInterval(this.interval);
    if (this.table) this.table.destroy();
    return { scrollY: window.scrollY };
  }
};

// Use Funky.Api for all requests
Funky.Api.post('/api/clients', data).then(...);

// Listen for DOM events (dot notation), don't poll
document.addEventListener('funky.spa.pageload', function() { ... });
```

### DON'T ❌

```javascript
// Don't use global variables
window.table = new Funky.Table('#table');  // Bad

// Don't forget cleanup
init: function() {
  setInterval(this.poll, 5000);  // Memory leak!
}

// Don't make raw fetch calls
fetch('/api/clients', { ... });  // Missing CSRF!

// Don't duplicate schemas
var schema = { type: 'object', ... };  // Should use Funky.Schema
```

---

*Last updated: December 2024*
