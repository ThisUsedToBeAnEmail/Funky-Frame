# Funky.Timeline

A chronological event display component with vertical and horizontal layouts, date grouping, real-time updates via LiveBinding, and full keyboard accessibility.

## Quick Start

```html
<div id="my-timeline"></div>

<script>
var timeline = Funky.Timeline.create('#my-timeline', {
    groupBy: 'day',
    showTimestamps: true
});

timeline.setEvents([
    {
        id: '1',
        title: 'Deployment completed',
        description: 'Version 2.0 deployed to production',
        timestamp: '2025-01-15T10:30:00',
        icon: 'fas fa-rocket',
        color: 'var(--pro-success)'
    }
]);
</script>
```

## Installation

Include the CSS and JavaScript files:

```html
<link rel="stylesheet" href="/assets/css/timeline.css">
<script src="/assets/js/components/timeline.js"></script>
```

---

## API Reference

### Funky.Timeline.create(selector, options)

Create a timeline instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |
| `options` | Object | Configuration options |

**Returns:** Timeline instance

---

## Configuration Options

### Layout Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orientation` | String | `'vertical'` | Layout: `'vertical'` or `'horizontal'` |
| `centered` | Boolean | `false` | Centered alternating layout (vertical only) |
| `density` | String | `'normal'` | Spacing: `'compact'`, `'normal'`, `'spacious'` |

### Grouping Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `groupBy` | String | `'day'` | Grouping: `'day'`, `'week'`, `'month'`, `'none'` |
| `groupLabels` | Object | `null` | Custom labels: `{ today: 'Today', yesterday: 'Yesterday' }` |

### Time Formatting

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeFormat` | String | `'absolute'` | Format: `'relative'`, `'absolute'`, `'both'` |
| `useRelativeTime` | Boolean | `true` | Use Funky.RelativeTime if available |
| `showTimestamps` | Boolean | `true` | Show event timestamps |

### Horizontal Mode

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `horizontal.showArrows` | Boolean | `true` | Show navigation arrows |
| `horizontal.showDots` | Boolean | `true` | Show dot navigation |
| `horizontal.scrollBehavior` | String | `'smooth'` | Scroll behavior |
| `horizontal.itemWidth` | Number | `200` | Event card width in pixels |
| `horizontal.gap` | Number | `24` | Gap between events |
| `horizontal.centerActive` | Boolean | `true` | Center active event |

### API & Pagination

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `api` | String/Object | `null` | API URL or config object |
| `pageSize` | Number | `20` | Events per page |
| `lazyLoad.enabled` | Boolean | `false` | Enable infinite scroll |
| `lazyLoad.threshold` | Number | `200` | Scroll threshold in pixels |

### LiveBinding (Real-time Updates)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `liveBinding.enabled` | Boolean | `false` | Enable real-time updates |
| `liveBinding.source` | String | `'websocket'` | Source: `'websocket'`, `'event'`, `'cache'`, `'api'` |
| `liveBinding.channel` | String | `'timeline:events'` | WebSocket channel |
| `liveBinding.keyField` | String | `'id'` | Event ID field |
| `liveBinding.actionField` | String | `'action'` | Field containing action type |
| `liveBinding.actionMap` | Object | `{}` | Map message types to actions |

### Animation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `animation.enabled` | Boolean | `true` | Enable animations |
| `animation.duration` | Number | `300` | Animation duration in ms |
| `animation.highlightDuration` | Number | `2000` | Highlight duration in ms |
| `animation.stagger` | Number | `50` | Stagger delay for batch inserts |
| `insertPosition` | String | `'top'` | Position: `'top'`, `'bottom'`, `'chronological'` |
| `showStatus` | Boolean | `false` | Show connection status indicator |

### Display Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `expandable` | Boolean | `true` | Enable expandable event details |
| `animate` | Boolean | `true` | Animate event appearance |
| `categories` | Object | `{}` | Category definitions with icon and color |

### Messages

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `emptyMessage` | String | `'No events to display'` | Empty state message |
| `loadingMessage` | String | `'Loading...'` | Loading indicator text |
| `errorMessage` | String | `'Failed to load events'` | Error state message |

---

## Instance Methods

### Data Management

#### timeline.setEvents(events)

Replace all events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `events` | Array | Array of event objects |

**Returns:** Timeline instance

```javascript
timeline.setEvents([
    { id: 1, title: 'Event 1', timestamp: '2025-01-15T10:00:00' },
    { id: 2, title: 'Event 2', timestamp: '2025-01-14T14:00:00' }
]);
```

#### timeline.addEvent(event)

Add a single event (prepends to top).

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object | Event object |

**Returns:** Timeline instance

```javascript
timeline.addEvent({
    id: 3,
    title: 'New Event',
    timestamp: new Date().toISOString(),
    icon: 'fas fa-star'
});
```

#### timeline.addEvents(events, prepend)

Add multiple events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `events` | Array | Array of event objects |
| `prepend` | Boolean | Prepend to top (default: true) |

**Returns:** Timeline instance

#### timeline.removeEvent(eventId)

Remove an event by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | String/Number | Event ID to remove |

**Returns:** Timeline instance

```javascript
timeline.removeEvent(123);
```

#### timeline.getEvent(eventId)

Get an event by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | String/Number | Event ID |

**Returns:** Event object or null

```javascript
var event = timeline.getEvent(123);
console.log(event.title);
```

### Live Updates

#### timeline.pushEvent(event)

Add an event with animation (for real-time updates).

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object | Event object |

**Returns:** Timeline instance

```javascript
timeline.pushEvent({
    id: 'live-1',
    title: 'Live update received',
    timestamp: new Date().toISOString()
});
```

#### timeline.updateEvent(event)

Update an existing event with flash animation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object | Event object with id |

**Returns:** Timeline instance

```javascript
timeline.updateEvent({
    id: 123,
    title: 'Updated title',
    description: 'Updated description'
});
```

#### timeline.isConnected()

Check if LiveBinding is connected.

**Returns:** Boolean

```javascript
if (timeline.isConnected()) {
    console.log('Receiving live updates');
}
```

#### timeline.rebind(options)

Switch to a different live source.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | Object | New LiveBinding options |

**Returns:** Timeline instance

```javascript
timeline.rebind({
    source: 'event',
    event: 'activity:new'
});
```

### API & Loading

#### timeline.load()

Load events from API.

**Returns:** Timeline instance

```javascript
timeline.load();
```

#### timeline.loadMore()

Load next page of events.

**Returns:** Timeline instance

```javascript
timeline.loadMore();
```

#### timeline.refresh()

Refresh events from API (resets to page 1).

**Returns:** Timeline instance

```javascript
timeline.refresh();
```

### Filtering

#### timeline.filter(options)

Apply filters and reload.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | Object | Filter options |

**Returns:** Timeline instance

```javascript
timeline.filter({
    category: 'deployment',
    startDate: '2025-01-01',
    endDate: '2025-01-31'
});
```

#### timeline.clearFilter()

Clear all filters.

**Returns:** Timeline instance

#### timeline.search(query)

Search events by query.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | String | Search query |

**Returns:** Timeline instance

```javascript
timeline.search('deployment');
```

#### timeline.setDateRange(startDate, endDate)

Set date range filter.

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | String/Date | Start date |
| `endDate` | String/Date | End date |

**Returns:** Timeline instance

### Navigation (Horizontal Mode)

#### timeline.scrollToEvent(eventId)

Scroll to a specific event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | String/Number | Event ID |

**Returns:** Timeline instance

### Lifecycle

#### timeline.clear()

Clear all events.

**Returns:** Timeline instance

#### timeline.destroy()

Destroy the timeline and clean up.

```javascript
timeline.destroy();
```

---

### Static Methods

#### Funky.Timeline.create(selector, options)

Create a timeline instance (documented above in main API Reference).

---

#### Funky.Timeline.getInstance(target)

Get a timeline instance by element or selector.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Element or CSS selector |

**Returns:** Timeline instance or null

**Example:**
```javascript
var timeline = Funky.Timeline.getInstance('#my-timeline');
if (timeline) {
    timeline.addEvent({ ... });
}
```

---

#### Funky.Timeline.init(container)

Auto-initialize all timelines with `[data-timeline]` attribute.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | HTMLElement | No | Container to search within (default: document) |

**Example:**
```javascript
// Initialize all timelines in document
Funky.Timeline.init();

// Initialize within specific container
Funky.Timeline.init(document.getElementById('section'));
```

---

#### Funky.Timeline.destroy(target)

Destroy a timeline instance by element.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Element or selector |

**Example:**
```javascript
Funky.Timeline.destroy('#my-timeline');
```

---

#### Funky.Timeline.destroyAll()

Destroy all timeline instances.

---

#### Funky.Timeline.getAll()

Get all timeline instances.

**Returns:** Object - Map of all instances keyed by ID

---

#### Funky.Timeline.DEFAULTS

Default configuration object. Modify to change global defaults.

**Example:**
```javascript
// View current defaults
console.log(Funky.Timeline.DEFAULTS);

// Change default grouping globally
Funky.Timeline.DEFAULTS.groupBy = 'month';
```

---

### Additional Instance Methods

#### timeline.getEvents()

Get all events as an array.

**Returns:** Array of event objects

**Example:**
```javascript
var events = timeline.getEvents();
console.log('Total events:', events.length);
```

---

## Events

Listen to timeline events using Funky.Events:

```javascript
Funky.Events.on(element, 'funky.timeline.eventClick', function(e) {
    console.log('Clicked:', e.detail.event);
});
```

| Event | Description | Detail |
|-------|-------------|--------|
| `funky.timeline.eventClick` | Event clicked | `{ event }` |
| `funky.timeline.eventExpand` | Event expanded/collapsed | `{ event, expanded }` |
| `funky.timeline.loadStart` | API loading started | `{}` |
| `funky.timeline.loadEnd` | API loading completed | `{ events, total }` |
| `funky.timeline.loadError` | API loading failed | `{ error }` |
| `funky.timeline.liveConnect` | LiveBinding connected | `{}` |
| `funky.timeline.liveDisconnect` | LiveBinding disconnected | `{}` |
| `funky.timeline.liveEvent` | Live event received | `{ event, action }` |
| `funky.timeline.activeChange` | Active event changed (horizontal) | `{ index, event }` |
| `funky.timeline.destroy` | Timeline destroyed | `{}` |

### Callback Options

You can also use callback options:

```javascript
var timeline = Funky.Timeline.create('#timeline', {
    onEventClick: function(event) {
        console.log('Clicked:', event.title);
    },
    onLiveEvent: function(event, action) {
        console.log('Live:', action, event);
    }
});
```

---

## Event Object

Events should have the following structure:

```javascript
{
    id: 1,                           // Required: unique identifier
    title: 'Event Title',            // Required: event title
    description: 'Details...',       // Optional: event description
    timestamp: '2025-01-15T10:00:00', // Required: ISO date string or Date
    
    // Optional display
    icon: 'fas fa-rocket',           // Font Awesome icon class
    color: 'var(--pro-success)',     // Marker/icon color
    category: 'deployment',          // Category key (matches categories config)
    
    // Optional details (shown when expanded)
    details: {
        'User': 'john@example.com',
        'Duration': '45 minutes'
    },
    
    // Optional link
    link: '/events/123',
    linkText: 'View Details',
    
    // Custom data
    type: 'deployment',              // For filtering
    metadata: { ... }                // Any additional data
}
```

---

## LiveBinding Integration

### WebSocket Source

```javascript
var timeline = Funky.Timeline.create('#timeline', {
    liveBinding: {
        enabled: true,
        source: 'websocket',
        channel: 'timeline:events',
        actionMap: {
            'event.created': 'add',
            'event.updated': 'update',
            'event.deleted': 'remove'
        }
    },
    showStatus: true,
    onLiveEvent: function(event, action) {
        console.log('Live:', action, event);
    }
});
```

### Event Source

```javascript
var timeline = Funky.Timeline.create('#timeline', {
    liveBinding: {
        enabled: true,
        source: 'event',
        event: 'activity:new'
    }
});

// Trigger from anywhere
Funky.Events.emit(document, 'activity:new', {
    id: 'evt-1',
    title: 'User logged in',
    timestamp: new Date().toISOString()
});
```

### WebSocket Message Format

```javascript
// Expected message format
{
    "type": "event.created",      // Mapped via actionMap
    "data": {
        "id": "evt-123",
        "title": "New Event",
        "timestamp": "2025-01-15T10:30:00Z"
    }
}
```

---

## Theming

Timeline uses CSS custom properties for theming:

```css
/* Container */
.funky-timeline {
    --timeline-line-color: var(--pro-border-color);
    --timeline-marker-size: 2.5rem;
    --timeline-marker-border: 3px;
    --timeline-content-gap: 1rem;
    --timeline-group-gap: 2rem;
    --timeline-event-gap: 1.5rem;
}
```

### Density Classes

```css
/* Compact */
.funky-timeline--compact { }

/* Spacious */
.funky-timeline--spacious { }
```

### Category Colors

```javascript
var timeline = Funky.Timeline.create('#timeline', {
    categories: {
        deployment: {
            icon: 'fas fa-rocket',
            color: 'var(--pro-success)'
        },
        error: {
            icon: 'fas fa-exclamation-circle',
            color: 'var(--pro-danger)'
        },
        build: {
            icon: 'fas fa-cogs',
            color: 'var(--pro-info)'
        }
    }
});
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between events |
| `Enter` / `Space` | Select/expand event |
| `Arrow Left/Right` | Navigate horizontal timeline |
| `Home` | Go to first event (horizontal) |
| `End` | Go to last event (horizontal) |

### ARIA Attributes

- Container has `role="feed"` with `aria-label`
- Events have `role="article"` with proper labels
- Status indicator uses `aria-live` for announcements
- Uses `Funky.Announce` for screen reader updates

### Reduced Motion

Respects `prefers-reduced-motion` media query:
- Animations are disabled
- Transitions are instant
- Highlights still apply (color only)

---

## Examples

### Activity Feed

```javascript
var feed = Funky.Timeline.create('#activity-feed', {
    groupBy: 'day',
    timeFormat: 'relative',
    categories: {
        login: { icon: 'fas fa-sign-in-alt', color: 'var(--pro-info)' },
        logout: { icon: 'fas fa-sign-out-alt', color: 'var(--pro-secondary)' },
        update: { icon: 'fas fa-edit', color: 'var(--pro-primary)' },
        delete: { icon: 'fas fa-trash', color: 'var(--pro-danger)' }
    }
});
```

### Deployment Pipeline

```javascript
var pipeline = Funky.Timeline.create('#pipeline', {
    orientation: 'horizontal',
    groupBy: 'none',
    horizontal: {
        showArrows: true,
        showDots: true,
        itemWidth: 200
    }
});

pipeline.setEvents([
    { id: 1, title: 'Build', icon: 'fas fa-hammer', color: 'var(--pro-success)' },
    { id: 2, title: 'Test', icon: 'fas fa-vial', color: 'var(--pro-success)' },
    { id: 3, title: 'Deploy', icon: 'fas fa-rocket', color: 'var(--pro-warning)' },
    { id: 4, title: 'Monitor', icon: 'fas fa-chart-line', color: 'var(--pro-secondary)' }
]);
```

### Audit Log with API

```javascript
var audit = Funky.Timeline.create('#audit-log', {
    api: '/api/audit-events',
    apiConfig: {
        pagination: { pageParam: 'page', pageSizeParam: 'limit' },
        responseMap: { data: 'events', total: 'count', hasMore: 'has_more' }
    },
    lazyLoad: { enabled: true, threshold: 300 },
    groupBy: 'day',
    expandable: true
});

audit.load();
```

### Real-time Notifications

```javascript
var notifications = Funky.Timeline.create('#notifications', {
    liveBinding: {
        enabled: true,
        source: 'websocket',
        channel: 'user:notifications',
        actionMap: {
            'notification.new': 'add',
            'notification.read': 'update',
            'notification.dismiss': 'remove'
        }
    },
    showStatus: true,
    insertPosition: 'top',
    animation: {
        enabled: true,
        duration: 300,
        highlightDuration: 3000
    }
});
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires:
- `Funky.Dom`
- `Funky.Events`
- Optional: `Funky.Api`, `Funky.LiveBinding`, `Funky.Animate`, `Funky.Announce`, `Funky.RelativeTime`, `Funky.ScrollTracker`
