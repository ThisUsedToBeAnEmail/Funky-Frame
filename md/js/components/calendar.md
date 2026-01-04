# Funky.Calendar

A full-featured calendar component with month, week, day, and agenda views. Supports events, LiveBinding integration, drag-and-drop, and full keyboard accessibility.

## Quick Start

```html
<div id="my-calendar"></div>

<script>
var calendar = Funky.Calendar.init('#my-calendar', {
    view: 'month',
    events: [
        {
            id: '1',
            title: 'Team Meeting',
            start: '2024-01-15T10:00:00',
            end: '2024-01-15T11:00:00',
            color: '#0d6efd'
        }
    ]
});
</script>
```

## Installation

Include the CSS and JavaScript files:

```html
<link rel="stylesheet" href="/assets/css/components/calendar.css">
<script src="/assets/js/components/calendar.js"></script>
```

---

## API Reference

### Funky.Calendar.init(selector, options)

Initialize a calendar instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |
| `options` | Object | Configuration options |

**Returns:** Calendar instance

---

## Configuration Options

### Core Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `view` | String | `'month'` | Initial view: `'month'`, `'week'`, `'day'`, `'agenda'` |
| `date` | Date/String | `null` | Initial date to display (defaults to today) |
| `events` | Array | `null` | Initial events array (for local-only mode) |
| `locale` | String | `'en-US'` | Locale for date formatting |
| `timezone` | String | `null` | Timezone (null = local) |

### Data Source Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `api` | String | `null` | API endpoint URL (null for local-only mode) |
| `entity` | String | `'events'` | Entity name for events/cache |
| `source` | String | `'api'` | Data source: `'api'`, `'cache'`, `'websocket'`, `'event'` |
| `liveBinding` | Boolean | `true` | Use LiveBinding for data |

### Time Settings
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `startHour` | Number | `0` | First hour in week/day views (0-23) |
| `endHour` | Number | `24` | Last hour in week/day views (1-24) |
| `weekStarts` | Number | `0` | Week start day (0=Sunday, 1=Monday, 6=Saturday) |
| `slotDuration` | Number | `30` | Time slot duration in minutes |

### Display Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showWeekNumbers` | Boolean | `false` | Show ISO week numbers |
| `showToday` | Boolean | `true` | Highlight today |
| `maxEventsPerCell` | Number | `3` | Max visible events before "+more" |

### Editing Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `editable` | Boolean | `false` | Enable drag-and-drop |
| `clickable` | Boolean | `true` | Enable event clicks |

### Field Mapping Options

Map your event data properties to calendar fields:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dateField` | String | `'start'` | Event start date field |
| `endField` | String | `'end'` | Event end date field |
| `titleField` | String | `'title'` | Event title field |
| `colorField` | String | `null` | Field for color mapping |
| `colors` | Object | `{}` | Color value → theme color map |

### Form & Modal Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fields` | Object | `null` | Custom field definitions for modals |

### Callback Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onInit` | Function | `null` | Called after initialization |
| `onNavigate` | Function | `null` | Called on date navigation |
| `onViewChange` | Function | `null` | Called when view changes |
| `onEventClick` | Function | `null` | Called when event clicked |
| `onDateSelect` | Function | `null` | Called when date selected |

---

## Instance Methods

### Navigation

#### calendar.prev()

Navigate to previous period (month/week/day).

```javascript
calendar.prev();
```

#### calendar.next()

Navigate to next period.

```javascript
calendar.next();
```

#### calendar.today()

Navigate to today's date.

```javascript
calendar.today();
```

#### calendar.goto(date)

Navigate to a specific date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date/String | Target date |

```javascript
calendar.goto('2024-06-15');
calendar.goto(new Date(2024, 5, 15));
```

### Views

#### calendar.setView(view)

Switch to a different view.

| Parameter | Type | Description |
|-----------|------|-------------|
| `view` | String | `'month'`, `'week'`, `'day'`, `'agenda'` |

```javascript
calendar.setView('week');
```

#### calendar.getView()

Get current view name.

**Returns:** String

```javascript
var currentView = calendar.getView(); // 'month'
```

### Events

#### calendar.setEvents(events)

Replace all events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `events` | Array | Array of event objects |

```javascript
calendar.setEvents([
    { id: '1', title: 'Event 1', start: '2024-01-15T10:00:00', end: '2024-01-15T11:00:00' }
]);
```

#### calendar.addEvent(event)

Add a single event (optimistic update).

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object | Event object |

**Returns:** Event object with generated ID if none provided

```javascript
var newEvent = calendar.addEvent({
    title: 'New Meeting',
    start: '2024-01-20T14:00:00',
    end: '2024-01-20T15:00:00'
});
console.log(newEvent.id); // 'temp-xxx' if no ID provided
```

#### calendar.updateEvent(id, updates)

Update an existing event (optimistic update).

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Event ID |
| `updates` | Object | Properties to update |

```javascript
calendar.updateEvent('event-123', {
    title: 'Updated Title',
    color: '#198754'
});
```

#### calendar.removeEvent(id)

Remove an event (optimistic update).

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | String | Event ID |

```javascript
calendar.removeEvent('event-123');
```

#### calendar.getEvents()

Get all events.

**Returns:** Array of event objects

```javascript
var allEvents = calendar.getEvents();
```

#### calendar.getEventsInRange(start, end)

Get events within a date range.

| Parameter | Type | Description |
|-----------|------|-------------|
| `start` | Date/String | Range start |
| `end` | Date/String | Range end |

**Returns:** Array of event objects

```javascript
var events = calendar.getEventsInRange('2024-01-01', '2024-01-31');
```

### Date/Range

#### calendar.getDate()

Get the current focused date.

**Returns:** Date object

```javascript
var currentDate = calendar.getDate();
```

---

#### calendar.getRange()

Get the visible date range for the current view.

**Returns:** Object with `start` and `end` Date objects

```javascript
var range = calendar.getRange();
console.log('Visible from:', range.start, 'to', range.end);
```

---

### Modal Methods

These methods open modal dialogs for event management.

#### calendar.createEvent(defaults)

Open a modal to create a new event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `defaults` | Object | Default values for the new event |

```javascript
calendar.createEvent({
    start: '2024-01-20T10:00:00',
    end: '2024-01-20T11:00:00',
    allDay: false
});
```

---

#### calendar.viewEvent(event)

Open a view modal for an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object/String | Event object or event ID |

```javascript
calendar.viewEvent('event-123');
calendar.viewEvent(eventObject);
```

---

#### calendar.editEvent(event)

Open an edit modal for an event.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | Object/String | Event object or event ID |

```javascript
calendar.editEvent('event-123');
```

---

#### calendar.deleteEvent(eventId)

Delete an event (with confirmation if configured).

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | String | Event ID |

```javascript
calendar.deleteEvent('event-123');
```

---

### Accessibility

#### calendar.announce(message)

Announce a message to screen readers via live region.

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | String | Message to announce |

```javascript
calendar.announce('Event created successfully');
```

---

### Data Sources

#### calendar.setDataSource(config)

Configure data source for events.

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | Object | Data source configuration |

```javascript
// API source
calendar.setDataSource({
    type: 'api',
    endpoint: '/api/calendar/events',
    params: { calendar_id: 5 }
});

// Static source
calendar.setDataSource({
    type: 'static',
    events: [...]
});
```

#### calendar.bindTo(entity, options)

Bind to LiveBinding entity for real-time updates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `entity` | String | Entity name |
| `options` | Object | LiveBinding options |

```javascript
calendar.bindTo('calendar_event', {
    adapter: 'websocket',
    params: { user_id: 42 }
});
```

#### calendar.unbind()

Disconnect from LiveBinding.

```javascript
calendar.unbind();
```

### Rendering

#### calendar.refresh()

Re-render the calendar with current events.

```javascript
calendar.refresh();
```

### Lifecycle

#### calendar.destroy()

Destroy the calendar instance and clean up all event listeners.

```javascript
calendar.destroy();
calendar = null;
```

---

## Static Methods

#### Funky.Calendar.init(selector, options)

Initialize a new calendar instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |
| `options` | Object | Configuration options |

**Returns:** Calendar instance

```javascript
var calendar = Funky.Calendar.init('#my-calendar', {
    view: 'month',
    events: []
});
```

---

#### Funky.Calendar.getInstance(selector)

Get an existing calendar instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |

**Returns:** Calendar instance or null

```javascript
var calendar = Funky.Calendar.getInstance('#my-calendar');
```

---

#### Funky.Calendar.destroy(selector)

Destroy a calendar instance by selector.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |

```javascript
Funky.Calendar.destroy('#my-calendar');
```

---

#### Funky.Calendar.destroyAll()

Destroy all calendar instances.

```javascript
Funky.Calendar.destroyAll();
```

---

#### Funky.Calendar.initAll(container)

Initialize all calendars within a container (auto-discovers by data attributes).

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | Element | Container element (default: document) |

**Returns:** Number of calendars initialized

```javascript
var count = Funky.Calendar.initAll(document.getElementById('app'));
```

---

#### Funky.Calendar.observe()

Start observing DOM for new calendars (mutation observer).

```javascript
Funky.Calendar.observe();
```

All events are emitted via `Funky.Events` (E).

### Navigation Events

#### calendar:init

Fired when calendar initializes.

```javascript
E.on('funky.calendar.init', function(data) {
    console.log('Calendar ready:', data.instance);
});
```

#### calendar:navigate

Fired when navigating to a new date.

```javascript
E.on('funky.calendar.navigate', function(data) {
    console.log('Navigated to:', data.date);
    console.log('View:', data.view);
});
```

#### calendar:viewchange

Fired when switching views.

```javascript
E.on('funky.calendar.viewchange', function(data) {
    console.log('New view:', data.view);
    console.log('Previous:', data.previousView);
});
```

### Interaction Events

#### calendar:dayclick

Fired when clicking on a day cell.

```javascript
E.on('funky.calendar.dayclick', function(data) {
    console.log('Clicked date:', data.date);
    console.log('View:', data.view);
});
```

#### calendar:eventclick

Fired when clicking on an event.

```javascript
E.on('funky.calendar.eventclick', function(data) {
    console.log('Event:', data.event);
    console.log('Original event:', data.originalEvent);
});
```

#### calendar:daydblclick

Fired on double-click of a day.

```javascript
E.on('funky.calendar.daydblclick', function(data) {
    console.log('Double-clicked date:', data.date);
});
```

#### calendar:eventdblclick

Fired on double-click of an event.

```javascript
E.on('funky.calendar.eventdblclick', function(data) {
    console.log('Double-clicked event:', data.event);
});
```

### Selection Events

#### calendar:select

Fired when selecting a date range.

```javascript
E.on('funky.calendar.select', function(data) {
    console.log('Selected:', data.start, 'to', data.end);
    console.log('All day:', data.allDay);
});
```

### Drag Events

#### calendar:eventdrop

Fired when an event is moved via drag.

```javascript
E.on('funky.calendar.eventdrop', function(data) {
    console.log('Event:', data.event);
    console.log('Old start:', data.oldStart);
    console.log('New start:', data.newStart);
    console.log('Delta days:', data.deltaDays);
    console.log('Delta minutes:', data.deltaMinutes);
    
    // Revert if needed
    if (!confirm('Save changes?')) {
        data.revert();
    }
});
```

#### calendar:eventresize

Fired when an event is resized.

```javascript
E.on('funky.calendar.eventresize', function(data) {
    console.log('Event:', data.event);
    console.log('New end:', data.newEnd);
    console.log('Delta minutes:', data.deltaMinutes);
    
    data.revert(); // Undo if needed
});
```

#### calendar:eventcreate

Fired when creating event via drag selection.

```javascript
E.on('funky.calendar.eventcreate', function(data) {
    console.log('Start:', data.start);
    console.log('End:', data.end);
    console.log('All day:', data.allDay);
    
    // Open form modal
    Funky.FormModal.open('calendar_event', {
        defaultValues: {
            start: data.start.toISOString(),
            end: data.end.toISOString(),
            all_day: data.allDay
        }
    });
});
```

### Data Events

#### calendar:eventsloaded

Fired when events are loaded from data source.

```javascript
E.on('funky.calendar.eventsloaded', function(data) {
    console.log('Loaded events:', data.events.length);
    console.log('Source:', data.source);
});
```

#### calendar:error

Fired on data loading errors.

```javascript
E.on('funky.calendar.error', function(data) {
    console.error('Calendar error:', data.error);
    console.log('Source:', data.source);
});
```

---

## Event Object

Events follow this structure:

```javascript
{
    id: 'unique-id',           // Required: unique identifier
    title: 'Meeting',          // Required: display title
    start: '2024-01-15T10:00', // Required: ISO 8601 or Date
    end: '2024-01-15T11:00',   // Required: ISO 8601 or Date
    allDay: false,             // Optional: all-day event
    color: '#0d6efd',          // Optional: background color
    textColor: '#ffffff',      // Optional: text color
    className: 'my-event',     // Optional: additional CSS class
    editable: true,            // Optional: can drag/resize
    extendedProps: {           // Optional: custom properties
        location: 'Room 101',
        attendees: ['John', 'Jane']
    }
}
```

---

## Integration Examples

### With FormModal

```javascript
// Open form on day click
E.on('funky.calendar.dayclick', function(data) {
    Funky.FormModal.open('calendar_event', {
        defaultValues: {
            start: data.date.toISOString(),
            end: new Date(data.date.getTime() + 3600000).toISOString()
        },
        onSuccess: function(event) {
            calendar.addEvent(event);
        }
    });
});

// Open form on event click
E.on('funky.calendar.eventclick', function(data) {
    Funky.FormModal.open('calendar_event', {
        id: data.event.id,
        onSuccess: function(event) {
            calendar.updateEvent(event.id, event);
        },
        onDelete: function(id) {
            calendar.removeEvent(id);
        }
    });
});
```

### With ViewModal

```javascript
E.on('funky.calendar.eventclick', function(data) {
    Funky.ViewModal.open('calendar_event', data.event.id, {
        onEdit: function() {
            Funky.FormModal.open('calendar_event', { id: data.event.id });
        }
    });
});
```

### With LiveBinding

```javascript
// Bind to entity with real-time updates
calendar.bindTo('calendar_event', {
    adapter: 'websocket',
    params: { calendar_id: 5 },
    transform: function(record) {
        return {
            id: record.id,
            title: record.name,
            start: record.starts_at,
            end: record.ends_at,
            color: record.category_color
        };
    }
});
```

### With Funky.Api

```javascript
// Manual API integration
function loadEvents(start, end) {
    Funky.Api.get('/calendar/events', {
        start: start.toISOString(),
        end: end.toISOString()
    }).then(function(data) {
        calendar.setEvents(data.events);
    });
}

E.on('funky.calendar.navigate', function(data) {
    var range = calendar.getVisibleRange();
    loadEvents(range.start, range.end);
});
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `→` | Previous/next day in grid |
| `↑` / `↓` | Previous/next week in grid |
| `Home` | First day of current week |
| `End` | Last day of current week |
| `Page Up` | Previous month/week |
| `Page Down` | Next month/week |
| `Enter` | Select focused day or open focused event |
| `Space` | Toggle selection of focused day |
| `Escape` | Close popover, cancel drag |
| `t` | Go to today |
| `m` | Switch to month view |
| `w` | Switch to week view |
| `d` | Switch to day view |
| `a` | Switch to agenda view |

---

## Accessibility

The calendar follows WCAG 2.1 AA guidelines:

1. **Full Keyboard Navigation** - All features accessible via keyboard
2. **ARIA Labels** - Proper roles (`grid`, `gridcell`, `button`) and labels for screen readers
3. **Live Regions** - Navigation and action announcements via `aria-live`
4. **Focus Management** - Visible focus indicators, focus restored after navigation
5. **Color Contrast** - Events maintain readable contrast ratios
6. **Screen Reader Support** - Tested with VoiceOver, NVDA, JAWS

### Screen Reader Announcements

- View changes are announced ("Switched to week view")
- Navigation changes announce new date range ("December 2024")
- Event counts announced when focusing a day ("3 events")
- Error states are announced via live region

### High Contrast Mode

The calendar respects `prefers-contrast: high` media query with enhanced borders and outlines.

### Reduced Motion

Animations are disabled when `prefers-reduced-motion: reduce` is set.

---

## Theming

The calendar uses CSS custom properties for theming. All variables inherit from `--pro-*` theme variables with fallbacks:

```css
.funky-calendar {
    --calendar-bg: var(--pro-bg-surface, #fff);
    --calendar-border: var(--pro-border-color, #dee2e6);
    --calendar-text: var(--pro-text, #212529);
    --calendar-text-muted: var(--pro-text-muted, #6c757d);
    --calendar-header-bg: var(--pro-bg-subtle, #f8f9fa);
    --calendar-today-bg: var(--pro-primary-subtle, #cfe2ff);
    --calendar-today-border: var(--pro-primary, #0d6efd);
    --calendar-weekend-bg: var(--pro-bg-subtle, #f8f9fa);
    --calendar-hover-bg: var(--pro-bg-hover, #e9ecef);
    --calendar-selected-bg: var(--pro-primary-subtle, #cfe2ff);
    --calendar-time-indicator: var(--pro-danger, #dc3545);
    --calendar-slot-height: 2.5rem;
    --calendar-gutter-width: 50px;
}
```

### Custom Theme Example

```css
.my-calendar-theme .funky-calendar {
    --calendar-bg: #1a1a2e;
    --calendar-today-border: #e94560;
    --calendar-header-bg: #16213e;
}
```

### Dark Mode

The calendar automatically supports dark mode via:
- `prefers-color-scheme: dark` media query
- `.theme-dark` class on parent element
- `[data-theme="dark"]` attribute on parent element

---

## CSS Classes

### Container Classes

| Class | Description |
|-------|-------------|
| `.funky-calendar` | Main container |
| `.calendar-header` | Header with navigation and view buttons |
| `.calendar-month` | Month view table |
| `.calendar-week-view` | Week view container |
| `.calendar-day-view` | Day view container |
| `.calendar-agenda-view` | Agenda view container |

### Day Cell Classes

| Class | Description |
|-------|-------------|
| `.calendar-day` | Individual day cell |
| `.calendar-day--today` | Today's date |
| `.calendar-day--weekend` | Saturday/Sunday |
| `.calendar-day--other-month` | Days outside current month |
| `.calendar-day--selected` | Selected day |
| `.calendar-day--has-events` | Day with events |

### Event Classes

| Class | Description |
|-------|-------------|
| `.calendar-event` | Event element |
| `.calendar-event--timed` | Timed event in week/day view |
| `.calendar-event--span` | Multi-day spanning event |
| `.calendar-event--dragging` | Event being dragged |
| `.calendar-event--preview` | Drag preview |

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Note: The component uses ES5 syntax for maximum compatibility.

---

## See Also

- [Funky.Events](../core/events.md) - Event system
- [Funky.LiveBinding](../core/live-binding.md) - Real-time data binding
- [Funky.FormModal](./form-modal.md) - Form integration
- [Funky.ViewModal](./view-modal.md) - View modal
- [Theming Guide](../../THEMING.md) - CSS variables
