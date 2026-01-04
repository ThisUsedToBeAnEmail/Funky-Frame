# Funky.SPA - Single Page Application Navigation

Intercepts internal navigation, loads content via AJAX, updates URL with History API, and reinitializes page-specific JavaScript.

## Overview

`Funky.SPA` transforms the application into a Single Page Application by intercepting link clicks, loading content asynchronously, and managing browser history.

## Features

- **Automatic link interception** for internal navigation
- **History API integration** for back/forward support
- **Content extraction** and DOM replacement
- **Script re-execution** for page-specific JS
- **Cleanup hooks** for proper teardown
- **Loading indicators** during transitions
- **Modal cleanup** on navigation

## Configuration

```javascript
Funky.SPA.config = {
  contentSelector: '#spaContent',      // Main content container
  loadingSelector: '#spaLoading',      // Loading indicator
  titleSelector: 'title',              // Page title element
  excludePatterns: [
    /^https?:\/\//,           // External links
    /^mailto:/,               // Email links
    /\.(pdf|zip|csv)$/i,      // File downloads
    /\/api\//,                // API endpoints
    /\/logout/,               // Logout (full reload)
    /\/login/                 // Login (different layout)
  ],
  excludeSelectors: [
    '[data-no-spa]',          // Opt-out attribute
    '[target="_blank"]',       // New tab links
    '[download]',              // Downloads
    '.no-spa'                  // Opt-out class
  ],

  // Idle detection options
  enableIdleDetection: true,           // Enable idle detection
  idleTimeout: 300000,                 // 5 minutes until idle
  awayTimeout: 60000,                  // 1 minute until away (when hidden)
  staleDataThreshold: 300000           // Refresh data if away > 5 min
};
```

## API Reference

### Methods

#### `SPA.init()`

Initialize the SPA system. Safe to call multiple times.

**Example:**
```javascript
// Usually called automatically, but can be called manually
Funky.SPA.init();
```

---

#### `SPA.navigate(url, pushState)`

Navigate to a URL via SPA.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to navigate to |
| pushState | boolean | No | Add to browser history (default: true) |

**Example:**
```javascript
Funky.SPA.navigate('/trades/new');
```

---

#### `SPA.loadPage(url, pushState)`

Load a page and replace content.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| url | string | Yes | URL to load |
| pushState | boolean | No | Add to browser history (default: true) |

**Returns:** `Promise<void>`

---

#### `SPA.registerPage(pageId, initFn)`

Register page-specific initialization function.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier (e.g., 'trades-list') |
| initFn | function | Yes | Initialization function |

**Example:**
```javascript
Funky.SPA.registerPage('trades-list', function() {
  initTradesTable();
  bindTradeFilters();
});
```

---

#### `SPA.registerCleanup(pageId, cleanupFn)`

Register page-specific cleanup function.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| pageId | string | Yes | Page identifier |
| cleanupFn | function | Yes | Cleanup function |

**Example:**
```javascript
Funky.SPA.registerCleanup('trades-list', function() {
  if (tradesTable) {
    tradesTable.destroy();
  }
});
```

---

#### `SPA.shouldHandleLink(link)`

Check if a link should be handled by SPA.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| link | Element | Yes | Anchor element |

**Returns:** `boolean`

---

#### `SPA.refresh()`

Reload current page via SPA (without browser reload).

**Example:**
```javascript
// Refresh content after action
Funky.Api.post('/api/trades', data).then(function() {
  Funky.SPA.refresh();
});
```

---

#### `SPA.detectCurrentPage()`

Detect current page identifier from body data attribute.

**Returns:** `string|null` - Page identifier

---


#### `SPA.registerTimeout(id)`

Register a timeout for automatic cleanup on navigation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | number | Yes | Timeout ID from `setTimeout` |

**Example:**
```javascript
var timeout = setTimeout(function() {
  refreshData();
}, 5000);
Funky.SPA.registerTimeout(timeout);  // Auto-cleared on navigation
```

---

#### `SPA.registerInterval(id)`

Register an interval for automatic cleanup on navigation.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | number | Yes | Interval ID from `setInterval` |

**Example:**
```javascript
var interval = setInterval(function() {
  pollForUpdates();
}, 10000);
Funky.SPA.registerInterval(interval);  // Auto-cleared on navigation
```

---

#### `SPA.destroy()`

Destroy the SPA system and clean up all resources.

**Example:**
```javascript
// Clean up when SPA is no longer needed
Funky.SPA.destroy();
```

---

### Idle Detection Methods

#### `SPA.isUserIdle()`

Check if user is currently idle.

**Returns:** `boolean`

---

#### `SPA.isUserAway()`

Check if user is away (tab hidden/blurred).

**Returns:** `boolean`

---

#### `SPA.getIdleTime()`

Get time since last user activity.

**Returns:** `number` - Milliseconds since last activity

---

#### `SPA.triggerActivity()`

Manually trigger activity (resets idle timer).

**Example:**
```javascript
// Reset idle timer after programmatic action
Funky.SPA.triggerActivity();
```

---

### Presence Integration Methods

#### `SPA.enablePresence(options)`

Enable presence tracking for SPA navigation. Automatically joins/leaves page channels as user navigates.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Presence options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| channelPrefix | string | `'page:'` | Prefix for page channels |
| defaultStatus | string | `'viewing'` | Default status when joining |
| trackQueryParams | boolean | `false` | Include query params in channel |

**Example:**
```javascript
Funky.SPA.enablePresence({
  channelPrefix: 'page:',
  defaultStatus: 'viewing'
});
```

---

#### `SPA.disablePresence()`

Disable presence tracking and leave current channel.

---

#### `SPA.isPresenceEnabled()`

Check if presence tracking is enabled.

**Returns:** `boolean`

---

#### `SPA.getCurrentPresenceChannel()`

Get current presence channel name.

**Returns:** `string|null` - Current channel or null

## Excluding Links from SPA

### Via Data Attribute

```html
<a href="/reports/download" data-no-spa>Download Report</a>
```

### Via Class

```html
<a href="/external-tool" class="no-spa">Open Tool</a>
```

### Via Target

```html
<a href="/docs" target="_blank">Documentation</a>
```

## Events

### PubSub Events (colon notation)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky:spa:navigate` | `{ url }` | Before navigation starts |
| `funky:spa:loading` | `{ url }` | Loading started |
| `funky:spa:loaded` | `{ url, title }` | Content loaded and inserted |
| `funky:spa:error` | `{ url, error }` | Navigation failed |
| `funky:spa:idle` | `{ idleTime }` | User became idle |
| `funky:spa:active` | `{ idleTime }` | User became active after being idle |
| `funky:spa:away` | `{ awayTime }` | User went away (tab hidden) |
| `funky:spa:return` | `{ awayDuration }` | User returned after being away |
| `funky:spa:refresh-stale` | `{ page, url }` | Data should be refreshed after long absence |

### DOM Events (dot notation)

| Event | Payload | Description |
|-------|---------|-------------|
| `funky.spa.pageload` | `{ url, title }` | Page loaded (for addEventListener) |

## Page Lifecycle

1. **Navigate** - User clicks link or calls `SPA.navigate()`
2. **Cleanup** - Run cleanup function for current page
3. **Cancel** - Cancel pending API requests via `Funky.Api.cancelAll()`
4. **Loading** - Show loading indicator
5. **Fetch** - Load new page via AJAX
6. **Extract** - Extract content and title from response
7. **Replace** - Replace DOM content
8. **History** - Update browser history
9. **Initialize** - Run initializer for new page
10. **Complete** - Hide loading indicator

## Dependencies

- `Funky.Api` - For page fetching (optional, falls back to fetch)
- `Funky.PubSub` - For event emission
- `Funky.IdleDetector` - For idle detection (optional)
- `Funky.Presence` - For presence tracking (optional)
- `Funky.PageAnimate` - For page transitions (optional)

## Examples

### Page-Specific Initialization

```html
<body data-page="trades-list">
  <!-- content -->
</body>

<script>
Funky.SPA.registerPage('trades-list', function() {
  // Initialize Funky.Table
  new Funky.Table('#tradesTable', {
    ajax: '/api/trades'
  });
  
  // Bind filters
  $('#filterForm').on('submit', handleFilter);
});

Funky.SPA.registerCleanup('trades-list', function() {
  // Destroy Funky.Table
  Funky.Table.getInstance('#tradesTable').destroy();
});
</script>
```

### Programmatic Navigation

```javascript
// Navigate after form submission
$('#createForm').on('submit', function(e) {
  e.preventDefault();
  var formData = new FormData(this);
  
  Funky.Api.post('/api/trades', formData).then(function(response) {
    if (response.success) {
      Funky.Toast.success('Trade created');
      Funky.SPA.navigate('/trades/' + response.data.id);
    }
  });
});
```

### Listen for Navigation

```javascript
Funky.PubSub.on('funky:spa:pageload', function(data) {
  console.log('Navigated to:', data.url);
  
  // Re-initialize global components
  Funky.Forms.initSelect2();
  initTooltips();
});
```
