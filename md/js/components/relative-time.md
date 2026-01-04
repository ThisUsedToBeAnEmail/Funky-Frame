# Funky.RelativeTime

Auto-updating relative time display. Converts ISO datetimes to human-readable 
format like "5 minutes ago" with automatic live updates.

## Quick Start

```html
<time datetime="2025-12-24T10:30:00Z" data-relative>10:30 AM</time>
```

No JavaScript initialization required - elements auto-initialize on page load.

## HTML Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `datetime` | string | - | ISO 8601 datetime (required) |
| `data-relative` | - | - | Marker attribute (required) |
| `data-refresh` | number\|'false' | 60000 | Refresh interval in ms, or 'false' to disable |

## Output Examples

| Input | Output |
|-------|--------|
| 30 seconds ago | just now |
| 5 minutes ago | 5 minutes ago |
| 2 hours ago | 2 hours ago |
| Yesterday | yesterday |
| 3 days ago | 3 days ago |
| 2 weeks ago | 2 weeks ago |
| 45 days ago | Nov 9, 2025 |
| In 2 hours | in 2 hours |
| Tomorrow | tomorrow |

## JavaScript API

### init(scope)

Initialize elements in a container:

```javascript
Funky.RelativeTime.init();           // All elements
Funky.RelativeTime.init('#content'); // Scoped
Funky.RelativeTime.init(element);    // Specific container
```

### format(date, options)

Format a date without an element:

```javascript
Funky.RelativeTime.format('2025-12-24T10:30:00Z');
// → "2 hours ago"

Funky.RelativeTime.format(new Date());
// → "just now"
```

### configure(options)

Set global configuration:

```javascript
Funky.RelativeTime.configure({
    refreshInterval: 60000,  // Refresh every 60 seconds
    thresholdDays: 30,       // Show absolute date after 30 days
    locale: 'en-US',         // Locale for formatting
    formats: {
        justNow: 'just now',
        yesterday: 'yesterday',
        tomorrow: 'tomorrow'
    }
});
```

### pause() / resume()

Control auto-refresh:

```javascript
Funky.RelativeTime.pause();
console.log(Funky.RelativeTime.isPaused()); // true
// ... times stop updating ...
Funky.RelativeTime.resume();
```

### refresh()

Trigger immediate refresh of all elements:

```javascript
Funky.RelativeTime.refresh();
```

### untrack(element)

Remove an element from tracking:

```javascript
var el = document.querySelector('time[data-relative]');
Funky.RelativeTime.untrack(el);
```

### destroy(element)

Remove an element from tracking (alias for `untrack`). Provides consistent API across all components.

```javascript
Funky.RelativeTime.destroy('#myTime');
// or
Funky.RelativeTime.destroy(document.querySelector('time[data-relative]'));
```

### getInstance(element)

Get tracking information for a specific element:

```javascript
var instance = Funky.RelativeTime.getInstance('#myTime');
if (instance) {
    console.log('Element:', instance.element);
    console.log('Timestamp:', instance.timestamp);
    console.log('Last refresh:', instance.lastRefresh);
}
```

**Returns:** Instance object with `element`, `timestamp`, `lastRefresh`, and `refreshDisabled` properties, or `null` if not tracked.

### getInstances()

Get all tracked elements:

```javascript
var elements = Funky.RelativeTime.getInstances();
console.log('Tracking', elements.length, 'elements');
```

### destroyAll()

Clean up all instances and stop timers:

```javascript
Funky.RelativeTime.destroyAll();
```

## Events Emitted

| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `relativetime:update` | element | `{ datetime, oldText, newText, isAbsolute }` | Time text updated |
| `relativetime:init` | document | `{ count, scope }` | Elements initialized |
| `relativetime:pause` | document | `{ instanceCount }` | Auto-refresh paused |
| `relativetime:resume` | document | `{ instanceCount }` | Auto-refresh resumed |
| `relativetime:hidden` | document | `{ instanceCount }` | Tab became hidden |
| `relativetime:visible` | document | `{ instanceCount }` | Tab became visible |
| `relativetime:threshold` | element | `{ datetime, text }` | Switched to absolute date |

### Listening to Events

```javascript
document.addEventListener('funky.relative-time.update', function(e) {
    console.log('Updated to:', e.detail.newText);
});

document.addEventListener('funky.relative-time.init', function(e) {
    console.log('Initialized', e.detail.count, 'elements');
});
```

## Events Listened To

| Event | Type | Action |
|-------|------|--------|
| `funky.spa.pageload` | DOM | Re-init on SPA navigation |
| `page:load` | DOM (external) | Re-init (generic) |
| `turbo:load` | DOM (external) | Re-init (Turbolinks/Hotwire) |
| `funky.datatable.draw` | DOM | Init elements in redrawn table |
| `funky.relative-time.refresh-request` | DOM | Trigger `refresh()` |
| `funky.relative-time.set` | DOM | Update single element datetime |
| `funky.relative-time.batch-set` | DOM | Update multiple elements |

### Triggering via Events

```javascript
// Trigger refresh from anywhere
Funky.Events.emit(document, 'funky.relative-time.refresh-request');

// Set datetime on element
Funky.Events.emit(document, 'funky.relative-time.set', {
    element: '#myTime',  // or DOM element
    datetime: '2025-12-24T12:00:00Z'
});

// Batch update
Funky.Events.emit(document, 'funky.relative-time.batch-set', {
    items: [
        { element: '#time1', datetime: '2025-12-24T12:00:00Z' },
        { element: '#time2', datetime: '2025-12-24T13:00:00Z' }
    ]
});
```

## DataTable Integration

Use the built-in column renderer:

```javascript
$('#myTable').DataTable({
    columns: [
        { data: 'name' },
        { 
            data: 'created_at',
            render: Funky.RelativeTime.dtRenderer()
        },
        {
            data: 'updated_at',
            render: Funky.RelativeTime.dtRenderer({ refresh: false })
        }
    ]
});
```

### dtRenderer Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `refresh` | boolean | true | Enable auto-refresh for this column |

## LiveBinding Integration

### createBound(options)

Create a time element bound to LiveBinding:

```javascript
var el = Funky.RelativeTime.createBound({
    source: 'api',
    url: '/api/entity/123',
    path: 'updated_at'
});
container.appendChild(el);
```

### bindToState(element, state, path)

Bind an existing element to reactive state:

```javascript
var state = { lastActivity: '2025-12-24T10:30:00Z' };
var el = document.querySelector('time[data-relative]');
Funky.RelativeTime.bindToState(el, state, 'lastActivity');

// Update state triggers element update
state.lastActivity = '2025-12-24T11:00:00Z';
Funky.LiveBinding.notify(state, 'lastActivity');
```

### batchUpdate(containerSelector, data)

Update multiple elements efficiently:

```javascript
Funky.RelativeTime.batchUpdate('#container', [
    { selector: '[data-id="1"]', datetime: '2025-12-24T12:00:00Z' },
    { selector: '[data-id="2"]', datetime: '2025-12-24T13:00:00Z' }
]);
```

## Seconds Display

Show "X seconds ago" for very recent times (5-59 seconds):

### Global Configuration

```javascript
Funky.RelativeTime.configure({
    showSeconds: true
});
```

When `showSeconds` is enabled, the refresh interval automatically adjusts to 1 second for accurate display.

### Per-Element Override

```html
<!-- Show seconds for this element only -->
<time datetime="2025-12-24T14:35:00Z" data-relative data-seconds="true">
    Loading...
</time>

<!-- Disable seconds even if globally enabled -->
<time datetime="2025-12-24T14:35:00Z" data-relative data-seconds="false">
    Loading...
</time>
```

### Output Examples

| Time Diff | showSeconds: false | showSeconds: true |
|-----------|-------------------|-------------------|
| 3 seconds | just now | just now |
| 15 seconds | just now | 15 seconds ago |
| 45 seconds | just now | 45 seconds ago |
| 1 minute | 1 minute ago | 1 minute ago |

**Note:** Times under 5 seconds always show "just now" to avoid flickering.

## Accessibility

- Uses semantic `<time>` element
- `datetime` attribute provides machine-readable value
- Tooltip (`title`) shows full date on hover
- `aria-label` updated with full date for screen readers
- Focus state with visible outline

## Performance

- Single global timer for all elements
- Pauses when browser tab is hidden (Page Visibility API)
- Debounced initialization for dynamic content
- MutationObserver for auto-detecting new elements
- Stale elements automatically cleaned up
- Custom per-element intervals supported

## Styling

Include the optional CSS for enhanced styling:

```html
<link rel="stylesheet" href="/assets/css/components/relative-time.css">
```

### CSS Classes

| Class | Description |
|-------|-------------|
| `.loading` | Shows muted italic text |
| `.just-updated` | Flash animation on update |
| `.badge` | Removes dotted underline |

## Browser Support

- Uses `Intl.RelativeTimeFormat` when available (modern browsers)
- Falls back to manual formatting for older browsers (ES5 compatible)
- MutationObserver polyfill not required (graceful degradation)
