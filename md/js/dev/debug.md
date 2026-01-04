# Funky.Debug

Developer tools panel for inspecting Funky internals. Auto-initializes in development environments and provides real-time visibility into events, state, components, and performance.

## Quick Start

The debug panel auto-initializes when running on:
- `localhost` or `127.0.0.1`
- Hostnames ending in `.local`
- Ports `3000` or `5000`

**Toggle the panel:** `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)

```javascript
// Manual control
Funky.Debug.show();
Funky.Debug.hide();
Funky.Debug.toggle();
```

## Panel Overview

The debug panel has four tabs:

| Tab | Icon | Description |
|-----|------|-------------|
| Events | 📡 | Live event stream with filtering |
| State | 📊 | Inspect SPA, Pages, LiveBindings, WebSocket, Cache |
| Components | 🧩 | Registered Funky components tree |
| Perf | ⚡ | API metrics and custom timers |

---

## Events Tab

Captures all events flowing through the Funky framework:

### Event Types

| Type | Color | Description |
|------|-------|-------------|
| `pubsub` | Blue | PubSub.emit() calls |
| `dom` | Green | Events.emit() custom DOM events |
| `api` | Purple | API requests/responses |
| `spa` | Cyan | SPA navigation events |
| `pages` | Teal | Pages lifecycle events |
| `websocket` | Orange | WebSocket connection events |
| `channel` | Yellow | Channel join/leave/message |
| `presence` | Pink | Presence updates |
| `custom` | Gray | User-logged events via Debug.log() |

### Toolbar Controls

- **Filter input** - Filter events by name or type
- **Pause/Resume** - Stop/start event capture
- **Clear** - Remove all logged events
- **Frame filter** - Filter by parent/child frames (when iframes present)

### API

```javascript
// Get event log
var events = Funky.Debug.getEventLog();     // All events
var recent = Funky.Debug.getEventLog(10);   // Last 10

// Clear log
Funky.Debug.clearEventLog();

// Pause/resume
Funky.Debug.pauseEvents();
Funky.Debug.resumeEvents();
Funky.Debug.isEventsPaused();  // Check status

// Log custom events
Funky.Debug.log('my-event', { data: 'value' });
```

---

## State Tab

Inspect the current state of Funky subsystems:

### Sections

| Section | Description |
|---------|-------------|
| 🧭 SPA Navigation | Current page, idle state, presence info |
| 📄 Pages | Active page, registered pages, cache stats |
| 🔌 WebSocket | Connection status, channels, message counts |
| 📦 Cache | Cache stats and entries |
| 🎯 Focus Manager | Current focus state |
| ⚙️ Service Worker | Registration status, scope |
| 🔗 LiveBindings | All active bindings with data |
| 🖼️ Child Frames | Connected iframe states (when present) |

### Toolbar Controls

- **Refresh** - Manually refresh state
- **Auto-refresh** - Toggle 1-second auto-refresh

### API

```javascript
// Get SPA state
Funky.Debug.getSpaState();
// Returns: { available, initialized, currentPage, idleState, ... }

// Get Pages state
Funky.Debug.getPagesState();
// Returns: { available, activePage, registeredPages, cacheStats }

// Get all LiveBindings
Funky.Debug.getBindings();
// Returns: [{ id, selector, data, loading, error, paused }, ...]

// Get specific binding
Funky.Debug.getBinding('user-profile');

// Refresh state panel
Funky.Debug.refreshState();
```

### LiveBinding Deep Inspection

Enhanced inspection of LiveBindings with metrics tracking and data diffing:

**Features:**
- **Re-render Tracking** - Count how many times each binding re-renders
- **Data Diffing** - See what changed (old → new values)
- **Watch Mode** - Pin bindings for continuous monitoring
- **Element Highlighting** - Click to highlight the bound DOM element

**API:**

```javascript
// Get metrics for all bindings
Funky.Debug.getBindingMetrics();
// Returns: { bindingId: { renderCount, lastRenderTime, watched, historyLength }, ... }

// Get metrics for specific binding
Funky.Debug.getBindingMetrics('user-card');
// Returns: { id, renderCount, lastRenderTime, history, watched }

// Watch a binding (pins it for monitoring)
Funky.Debug.watchBinding('user-card');

// Unwatch a binding
Funky.Debug.unwatchBinding('user-card');

// Highlight binding's DOM element with overlay
Funky.Debug.highlightBinding('user-card');

// Clear metrics history
Funky.Debug.clearBindingHistory('user-card');  // Specific binding
Funky.Debug.clearBindingHistory();              // All bindings
```

**UI Features:**
- 📍/📌 - Toggle watch status
- 👁 - Highlight element on page
- Render count and time since last render
- Recent changes with diff visualization (red strikethrough → green new value)
- Watched bindings appear at top of list

---

## Components Tab

Browse all registered Funky components organized by category:

### Categories

- **Core** - Dom, Events, PubSub, Storage, Keyboard, etc.
- **Navigation** - SPA, Pages, Navigation, History
- **Data** - Api, LiveBinding, WebSocket, Channel, etc.
- **UI** - Modal, Toast, Tooltip, Table, Accordion, etc.
- **Forms** - Forms, Validation, Mask, Signature, etc.
- **Media** - ImageViewer, FileUpload, MediaQuery, etc.
- **Utils** - Debounce, Timing, FuzzySearch, Animate, etc.
- **Dev** - Debug, A11yValidator, Tests, etc.
- **Pages** - Page modules (dashboard, settings, etc.)

### Component Status Icons

| Icon | Meaning |
|------|---------|
| ✓ | Registered and available |
| ⚠ | Has debug() method with warnings |
| ✗ | Not registered |

### API

```javascript
// List all registered components
Funky.Debug.getComponents();
// Returns: ['Dom', 'Events', 'PubSub', ...]

// Get component debug info (if component has debug() method)
Funky.Debug.getComponentDebug('LiveBinding');
// Returns component-specific debug info

// Refresh components panel
Funky.Debug.refreshComponents();
```

---

## Performance Tab

Track API timing and custom performance metrics:

### Stats Grid

| Metric | Description |
|--------|-------------|
| Total Requests | API calls in last 5 minutes |
| Error Rate | Percentage of failed requests |
| Avg Duration | Average response time |
| Max Duration | Slowest request |
| Active Timers | Currently running custom timers |
| Timer History | Completed custom timers |

### Slow Requests

Requests exceeding the slow threshold (default 500ms) are highlighted.

### API

```javascript
// Get API metrics summary
Funky.Debug.getApiMetrics();
// Returns: { total, errors, errorRate, avgDuration, maxDuration, minDuration, requests }

// Custom timers
Funky.Debug.startTimer('my-operation');
// ... do work ...
var duration = Funky.Debug.endTimer('my-operation');
// Logs: [Funky.Debug] Timer my-operation: 234ms

// Get timer history
Funky.Debug.getTimerHistory();
// Returns: [{ name, duration, timestamp }, ...]

// Clear all metrics
Funky.Debug.clearMetrics();

// Set slow request threshold
Funky.Debug.setSlowThreshold(1000);  // 1 second
```

---

## Export

Export debug data for sharing or analysis:

### Export Menu (📥 button)

- **Copy as JSON** - Full structured export
- **Copy as Text** - Human-readable format
- **Download JSON** - Save as .json file
- **Download Text** - Save as .txt file
- **Sanitized Export** - Redacts sensitive data (passwords, tokens, etc.)

### API

```javascript
// Export with options
var report = Funky.Debug.export({
    includeEvents: true,
    includeState: true,
    includeComponents: true,
    includePerformance: true,
    format: 'json',        // 'json' or 'text'
    maxEvents: 100,
    sanitize: false
});

// Copy to clipboard
Funky.Debug.copyToClipboard({ format: 'json' });
Funky.Debug.copyToClipboard({ format: 'text', sanitize: true });

// Download file
Funky.Debug.downloadReport({ format: 'json' });
Funky.Debug.downloadReport({ format: 'text' });
```

---

## Iframe Support

The debug panel aggregates events from child iframes running Funky.

### Parent Window

The main debug panel automatically:
- Listens for child frame connections
- Aggregates events from all frames
- Shows child frame states in the State tab
- Provides frame filtering in Events tab

### Child Frames

Include `debug-reporter.js` in iframes:

```html
<script src="/assets/js/dev/debug-reporter.js"></script>
```

The reporter automatically:
- Detects iframe context
- Sends events to parent's debug panel
- Responds to state requests

### API

```javascript
// Get connected child frames
Funky.Debug.getChildFrames();
// Returns: { frameId: { id, url, connectedAt, lastActivity, state }, ... }

// Request state refresh from all children
Funky.Debug.refreshChildStates();
```

### Frame Labels

Events show frame origin:
- `[parent]` - From main window
- `[frame-id]` - From specific iframe

---

## Configuration

```javascript
Funky.Debug.init({
    shortcut: 'ctrl+shift+d',  // Toggle shortcut
    position: 'right',          // 'right' or 'left'
    width: 400,                 // Panel width in pixels
    maxLogEntries: 500,         // Max events to keep
    persist: true               // Remember visibility state
});

// Get current config
Funky.Debug.getConfig();
```

---

## Hard Refresh

The 🔄 button performs a complete cache clear:

1. Clears localStorage
2. Clears sessionStorage
3. Deletes all Cache API caches
4. Unregisters all Service Workers
5. Reloads the page

**Warning:** This action cannot be undone.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Toggle panel |
| `Arrow Left/Right` | Switch tabs (when tab focused) |
| `Home/End` | First/last tab |

---

## Complete API Reference

### Panel Control

| Method | Returns | Description |
|--------|---------|-------------|
| `init(options)` | Debug | Initialize with options |
| `show()` | Debug | Show panel |
| `hide()` | Debug | Hide panel |
| `toggle()` | Debug | Toggle visibility |
| `isVisible()` | boolean | Check if visible |
| `destroy()` | void | Remove panel |
| `switchTab(name)` | Debug | Switch to tab |
| `getActiveTab()` | string | Get current tab name |
| `getConfig()` | object | Get configuration |
| `hardRefresh()` | Debug | Clear all storage and reload |

### Events

| Method | Returns | Description |
|--------|---------|-------------|
| `getEventLog(count?)` | array | Get logged events |
| `clearEventLog()` | Debug | Clear event log |
| `pauseEvents()` | Debug | Pause logging |
| `resumeEvents()` | Debug | Resume logging |
| `isEventsPaused()` | boolean | Check pause state |
| `log(event, data)` | Debug | Log custom event |

### State

| Method | Returns | Description |
|--------|---------|-------------|
| `getBindings()` | array | Get all LiveBindings |
| `getBinding(id)` | object | Get specific binding |
| `getSpaState()` | object | Get SPA state |
| `getPagesState()` | object | Get Pages state |
| `refreshState()` | Debug | Refresh state panel |

### Components

| Method | Returns | Description |
|--------|---------|-------------|
| `getComponents()` | array | List registered components |
| `getComponentDebug(name)` | object | Get component debug info |
| `refreshComponents()` | Debug | Refresh components panel |

### Performance

| Method | Returns | Description |
|--------|---------|-------------|
| `startTimer(name)` | Debug | Start named timer |
| `endTimer(name)` | number | End timer, returns duration |
| `getApiMetrics()` | object | Get API metrics summary |
| `getTimerHistory()` | array | Get completed timers |
| `clearMetrics()` | Debug | Clear all metrics |
| `setSlowThreshold(ms)` | Debug | Set slow request threshold |

### Export

| Method | Returns | Description |
|--------|---------|-------------|
| `export(options)` | string/object | Export debug data |
| `copyToClipboard(options)` | Debug | Copy export to clipboard |
| `downloadReport(options)` | Debug | Download as file |

### Iframe Support

| Method | Returns | Description |
|--------|---------|-------------|
| `getChildFrames()` | object | Get connected frames |
| `refreshChildStates()` | Debug | Request child states |

### LiveBinding Deep Inspection

| Method | Returns | Description |
|--------|---------|-------------|
| `getBindingMetrics(id?)` | object | Get binding metrics (all or by ID) |
| `watchBinding(id)` | Debug | Watch a binding |
| `unwatchBinding(id)` | Debug | Unwatch a binding |
| `highlightBinding(id)` | Debug | Highlight binding element |
| `clearBindingHistory(id?)` | Debug | Clear metrics history |

---

## Events Emitted

The debug panel emits these PubSub events:

| Event | Data | When |
|-------|------|------|
| `funky:debug:shown` | none | Panel shown |
| `funky:debug:hidden` | none | Panel hidden |
| `funky:debug:tab:changed` | `{ tab }` | Tab switched |
| `funky:debug:child:connected` | `{ frameId, url }` | Iframe connected |
| `funky:debug:binding:updated` | `{ id, diff }` | Binding data changed |

---

## Files

| File | Description |
|------|-------------|
| `public/assets/js/dev/debug.js` | Main debug panel |
| `public/assets/js/dev/debug-reporter.js` | Lightweight iframe reporter |
| `public/assets/css/dev/debug.css` | Panel styles |
| `public/assets/js/dev/tests/dev/debug.test.js` | Tests |

---

## Browser Support

Works in all modern browsers. Uses ES5 syntax for compatibility.

---

## See Also

- [Test Framework](test-framework.md)
- [Test Runner](test-runner.md)
- [A11y Validator](a11y-validator.md)
