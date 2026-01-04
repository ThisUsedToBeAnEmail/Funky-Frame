# FunkyJS - JavaScript Framework Overview

The Funky JavaScript framework provides a modular, secure architecture for building interactive web applications. All modules are registered under the global `Funky` namespace using a locked registration pattern.

## Architecture

```
Funky (namespace)
├── Core Modules           # Foundation layer
│   ├── Funky.register()   # Component registration
│   ├── Funky.Api          # Centralized API layer
│   ├── Funky.CSRF         # CSRF token management
│   ├── Funky.PubSub       # Pub/sub event system
│   ├── Funky.Pages        # Page lifecycle & caching ★
│   ├── Funky.SPA          # SPA routing/navigation
│   ├── Funky.Storage      # Local/session storage
│   └── ...
│
├── Page Modules           # Page-level layer ★
│   ├── DashboardPage      # Home dashboard
│   ├── TradesPage         # Trades list
│   ├── ClientsPage        # Clients list
│   └── ...                # (registered via Funky.Pages)
│
└── Component Modules      # UI/Feature layer
    ├── Funky.Toast        # Notifications
    ├── Funky.Table        # Native table component
    ├── Funky.Wizard       # Multi-step forms
    └── ...
```

## Key Concepts

### Pages vs Components

| Aspect | Pages | Components |
|--------|-------|------------|
| **Scope** | Full page content | Reusable UI piece |
| **Lifecycle** | `init()`, `destroy()`, `update()` | Various |
| **Registration** | `Funky.Pages.register()` | `Funky.register()` |
| **Caching** | HTML + state cached | Not cached |
| **WebSocket** | Entity-based invalidation | Event-driven |

### The Page Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                      SPA Navigation                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   User clicks link                                        │
│         ↓                                                 │
│   SPA.navigate('/trades')                                 │
│         ↓                                                 │
│   Pages.unmount(currentPage)  ← destroy() called          │
│         ↓                                                 │
│   Check Pages.cache                                       │
│         ↓                                                 │
│   ┌─────────────┬────────────────┐                        │
│   │ Cache HIT   │  Cache MISS    │                        │
│   ├─────────────┼────────────────┤                        │
│   │ Inject HTML │ Fetch from     │                        │
│   │ from cache  │ server         │                        │
│   └──────┬──────┴───────┬────────┘                        │
│          ↓              ↓                                 │
│   Pages.mount('trades')                                   │
│          ↓                                                │
│   TradesPage.init(state)  ← with preserved state          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Registration Pattern

All Funky modules follow a consistent registration pattern:

```javascript
(function() {
  'use strict';
  
  // Guard against re-registration
  if (Funky.has('ModuleName')) {
    console.warn('[Funky.ModuleName] Already registered');
    return;
  }
  
  // Define the module
  var ModuleName = {
    // Module implementation
  };
  
  // Register with the namespace
  Funky.register('ModuleName', ModuleName);
})();
```

### Why This Pattern?

1. **Security**: Components are locked using `Object.defineProperty` - cannot be overwritten
2. **Consistency**: All modules accessed via `Funky.ModuleName`
3. **Load Order Independence**: Guard prevents duplicate registration
4. **Debugging**: Registration logged to console

## Core Modules

| Module | Purpose | Documentation |
|--------|---------|---------------|
| `Funky` | Namespace foundation with `register()` | [registry.md](core/registry.md) |
| `Funky.Api` | Centralized API calls with CSRF, retries | [api.md](core/api.md) |
| `Funky.CSRF` | CSRF token management | [csrf.md](core/csrf.md) |
| `Funky.Dom` | **Direct DOM manipulation & element creation** | [dom.md](core/dom.md) |
| `Funky.PubSub` | Pub/sub event system | [pubsub.md](core/pubsub.md) |
| `Funky.Form` | Form handling utilities | [forms.md](core/forms.md) |
| `Funky.Keyboard` | Keyboard shortcut management | [keyboard.md](core/keyboard.md) |
| `Funky.NavPosition` | Navigation position tracking | [nav-position.md](core/nav-position.md) |
| `Funky.Navigation` | Main navigation management | [navigation.md](core/navigation.md) |
| `Funky.Pages` | **Page lifecycle, caching, WebSocket integration** | [pages.md](core/pages.md) |
| `Funky.SPA` | Single-page application routing | [spa.md](core/spa.md) |
| `Funky.Storage` | Local/session storage abstraction | [storage.md](core/storage.md) |
| `Funky.Timezone` | Timezone handling | [timezone.md](core/timezone.md) |
| `Funky.Timing` | Debounce, throttle utilities | [timing.md](core/timing.md) |
| `Funky.Utils` | General utility functions | [util.md](core/util.md) |
| `Funky.VDom` | Virtual DOM with diff/patch for reactive UIs | [vdom.md](core/vdom.md) |

## Component Modules

| Module | Purpose | Documentation |
|--------|---------|---------------|
| `Funky.AdvancedFilter` | Data table filtering UI | [advanced-filter.md](components/advanced-filter.md) |
| `Funky.Aggregations` | Data aggregation calculations | [aggregations.md](components/aggregations.md) |
| `Funky.Audio` | Audio feedback/notifications | [audio.md](components/audio.md) |
| `Funky.AuditViewer` | Audit trail viewer | [audit-viewer.md](components/audit-viewer.md) |
| `Funky.Breadcrumbs` | Breadcrumb navigation | [breadcrumbs.md](components/breadcrumbs.md) |
| `Funky.BulkSelection` | Bulk selection handling | [bulk-selection.md](components/bulk-selection.md) |
| `Funky.Charts` | Chart visualizations | [charts.md](components/charts.md) |
| `Funky.ColumnProfiles` | Table column profiles | [column-profiles.md](components/column-profiles.md) |
| `Funky.ConditionalFormatting` | Cell/row formatting | [conditional-formatting.md](components/conditional-formatting.md) |
| `Funky.EvenFunkyer` | Theme effects | [even-funkyer.md](components/even-funkyer.md) |
| `Funky.FileManager` | File upload/download | [file-manager.md](components/file-manager.md) |
| `Funky.FilterBar` | Filter toolbar | [filter-bar.md](components/filter-bar.md) |
| `Funky.FormatBuilder` | Report format builder | [format-builder.md](components/format-builder.md) |
| `Funky.Formatters` | Data formatting | [formatters.md](components/formatters.md) |
| `Funky.Preferences` | User preferences | [preferences.md](components/preferences.md) |
| `Funky.Slider` | Sliding panel component | [slider.md](components/slider.md) |
| `Funky.SliderInput` | Slider input control | [slider-input.md](components/slider-input.md) |
| `Funky.StickyHeader` | Sticky header behavior | [sticky-header.md](components/sticky-header.md) |
| `Funky.Toast` | Toast notifications | [toast.md](components/toast.md) |
| `Funky.TradeWizard` | Trade creation wizard | [trade-wizard.md](components/trade-wizard.md) |
| `Funky.WipOverlay` | Work-in-progress overlay | [wip-overlay.md](components/wip-overlay.md) |
| `Funky.Wizard` | Generic wizard component | [wizard.md](components/wizard.md) |

## Quick Start

### Basic API Call

```javascript
// Make an authenticated API request
const response = await Funky.Api.get('/api/clients');
if (response.success) {
  console.log('Clients:', response.data);
}
```

### Show a Toast Notification

```javascript
Funky.Toast.success('Record saved successfully');
Funky.Toast.error('Something went wrong', 'Error');
```

### Subscribe to Events

```javascript
// Listen for trade creation
Funky.PubSub.on('funky:trade:created', function(trade) {
  console.log('New trade:', trade);
});

// Publish an event
Funky.PubSub.emit('funky:trade:created', { id: 123, type: 'BUY' });
```

### Use Storage

```javascript
// Store user preference
Funky.Storage.set('theme', 'dark');

// Retrieve later
const theme = Funky.Storage.get('theme');
```

## Page Modules

Pages are the heart of the Funky SPA - each page is a module with lifecycle hooks that integrates with caching and WebSocket updates.

### Creating a Page Module

```javascript
var TradesPage = {
  id: 'trades',                              // Matches URL path
  entities: ['trade', 'trade_allocation'],   // For WebSocket invalidation
  
  init: function(state) {
    // Initialize page, restore state if cached
    this.loadData();
    if (state && state.scrollY) {
      window.scrollTo(0, state.scrollY);
    }
  },
  
  destroy: function() {
    // Cleanup, return state to preserve
    return { scrollY: window.scrollY };
  },
  
  update: function(entityType, entityId, data, action) {
    // Handle WebSocket updates without full reload
    this.refreshTable();
  }
};

// Register with Pages system
Funky.Pages.register(TradesPage);
Funky.Pages.mount('trades');
```

### Page Lifecycle

| Method | When Called | Purpose |
|--------|-------------|---------|
| `init(state)` | Page becomes visible | Initialize, restore cached state |
| `destroy()` | Navigating away | Cleanup intervals, return state to cache |
| `update(entity, id, data, action)` | WebSocket data change | Targeted DOM update |

### Why Pages Matter

1. **Instant Navigation**: Cached pages load without network delay
2. **State Preservation**: Scroll position, form inputs preserved
3. **Targeted Updates**: WebSocket changes update specific elements, not full page
4. **Proper Cleanup**: Intervals/listeners cleaned up on navigation

See [pages.md](core/pages.md) for full API documentation.

## Load Order

Scripts must be loaded in the correct order:

1. **registry.js** - Must be first (creates `Funky` namespace)
2. **Core modules** - Foundation layer (including pages.js before spa.js)
3. **SPA module** - Depends on pages.js
4. **Component modules** - UI layer (depend on core)

```html
<!-- Core (order matters) -->
<script src="/assets/js/core/registry.js"></script>
<script src="/assets/js/core/storage.js"></script>
<script src="/assets/js/core/csrf.js"></script>
<script src="/assets/js/core/api.js"></script>
<script src="/assets/js/core/event-bus.js"></script>
<script src="/assets/js/core/pages.js"></script>
<script src="/assets/js/core/spa.js"></script>

<!-- Components (can be in any order) -->
<script src="/assets/js/components/toast.js"></script>
<script src="/assets/js/components/table.js"></script>
```

## Version

Current version: `Funky.version` → `1.0.0`
