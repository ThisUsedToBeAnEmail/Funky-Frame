# Funky.Clock

Real-time ticking clock display with configurable format, timezone, and date options.

## Quick Start

```html
<span data-clock></span>
```

No JavaScript initialization required - clocks auto-initialize on page load.

## HTML Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-clock` | - | - | Marker attribute (required) |
| `data-style` | `digital` \| `analog` | `digital` | Display style |
| `data-format` | `12h` \| `24h` | `24h` | Time format |
| `data-seconds` | `true` \| `false` | `true` | Show seconds |
| `data-date` | `false` \| `short` \| `long` | `false` | Date display (digital only) |
| `data-timezone` | string | local | IANA timezone identifier |
| `data-size` | `sm` \| `md` \| `lg` \| `xl` | `md` | Analog clock size |
| `data-countdown` | duration or ISO date | - | Enable countdown mode |
| `data-countdown-format` | `hms` \| `ms` \| `s` \| `auto` | `auto` | Countdown display format |
| `data-countdown-complete` | string | `00:00` | Text shown when complete |

## Examples

### Digital Clock

```html
<span data-clock></span>
<!-- Output: 14:35:22 -->
```

### 12-Hour Format

```html
<span data-clock data-format="12h"></span>
<!-- Output: 2:35:22 PM -->
```

### Without Seconds

```html
<span data-clock data-seconds="false"></span>
<!-- Output: 14:35 -->
```

### With Date

```html
<span data-clock data-date="short"></span>
<!-- Output: 24 Dec, 14:35:22 -->

<span data-clock data-date="long"></span>
<!-- Output: 24 December 2025, 14:35:22 -->
```

### Different Timezone

```html
<span data-clock data-timezone="America/New_York"></span>
<!-- Output: 09:35:22 (EST) -->

<span data-clock data-timezone="Asia/Tokyo"></span>
<!-- Output: 23:35:22 (JST) -->
```

### Styled Variants

```html
<!-- Large monospace -->
<span data-clock class="clock-xl mono"></span>

<!-- Large with blinking separators -->
<span data-clock class="clock-lg blink"></span>
```

### Analog Clock

```html
<!-- Basic 12-hour analog clock -->
<span data-clock data-style="analog"></span>

<!-- 24-hour analog clock (24 markers) -->
<span data-clock data-style="analog" data-format="24h"></span>

<!-- Different sizes -->
<span data-clock data-style="analog" data-size="sm"></span>  <!-- 60px -->
<span data-clock data-style="analog" data-size="md"></span>  <!-- 100px -->
<span data-clock data-style="analog" data-size="lg"></span>  <!-- 150px -->
<span data-clock data-style="analog" data-size="xl"></span>  <!-- 200px -->

<!-- Without seconds hand -->
<span data-clock data-style="analog" data-seconds="false"></span>

<!-- Analog with timezone -->
<span data-clock data-style="analog" data-timezone="Asia/Tokyo" data-size="lg"></span>
```

### Countdown Timer

```html
<!-- 5 minute countdown -->
<span data-clock data-countdown="5:00"></span>
<!-- Output: 05:00, 04:59, ... -->

<!-- 1 hour 30 minutes -->
<span data-clock data-countdown="1:30:00"></span>
<!-- Output: 01:30:00 -->

<!-- Countdown to specific date/time -->
<span data-clock data-countdown="2025-12-25T00:00:00"></span>
<!-- Shows time remaining until Christmas -->

<!-- Custom complete text -->
<span data-clock data-countdown="10" data-countdown-complete="🎉 Done!"></span>
<!-- Shows "🎉 Done!" when complete -->

<!-- Force HH:MM:SS format even for short durations -->
<span data-clock data-countdown="90" data-countdown-format="hms"></span>
<!-- Output: 00:01:30 instead of 01:30 -->
```

## JavaScript API

### init(scope)

Initialize clocks in a container:

```javascript
Funky.Clock.init();           // All clocks
Funky.Clock.init('#content'); // Scoped
Funky.Clock.init(element);    // Specific container
```

### configure(options)

Set global configuration:

```javascript
Funky.Clock.configure({
    tickInterval: 1000,  // Tick every 1 second
    format: '24h',       // Default format
    showSeconds: true,   // Default seconds display
    showDate: false,     // Default date display
    timezone: null,      // Default timezone (local)
    locale: 'en-US'      // Locale for formatting
});
```

### pause() / resume()

Control the timer:

```javascript
Funky.Clock.pause();
console.log(Funky.Clock.isPaused()); // true
// Clocks stop updating

Funky.Clock.resume();
// Clocks resume ticking
```

### getInstances()

Get all tracked clock elements:

```javascript
var clocks = Funky.Clock.getInstances();
console.log('Active clocks:', clocks.length);
```

### getInstance(element)

Get a specific clock instance by element or selector:

```javascript
var clock = Funky.Clock.getInstance('#myClock');
if (clock) {
    console.log('Clock timezone:', clock.timezone);
}

// Or by element reference
var el = document.querySelector('[data-clock]');
var clock = Funky.Clock.getInstance(el);
```

**Returns:** Clock instance object or `null`

### destroy(element)

Remove a specific clock from tracking:

```javascript
Funky.Clock.destroy('#myClock');
// or
Funky.Clock.destroy(document.querySelector('[data-clock]'));
```

### destroyAll()

Clean up all clocks and stop timer:

```javascript
Funky.Clock.destroyAll();
```

## Scheduling API

The Clock timer can be used to schedule callbacks at specific times or intervals.

### after(delay, callback, options)

Schedule a callback after a delay:

```javascript
// One-time callback in 30 seconds
var taskId = Funky.Clock.after(30000, function(e) {
    console.log('30 seconds passed!', e.timestamp);
});

// Repeating every 5 seconds
var repeatId = Funky.Clock.after(5000, function(e) {
    console.log('Every 5 seconds', e.count);
}, { repeat: true });
```

**Parameters:**
- `delay` (number) — Milliseconds to wait
- `callback` (function) — Called with `{ timestamp, count, id }`
- `options.repeat` (boolean) — Repeat indefinitely if true

**Returns:** Task ID (number)

### at(time, callback, options)

Schedule a callback at a specific time:

```javascript
// At a specific time today
Funky.Clock.at('15:00', function(e) {
    console.log('It is 3 PM!');
});

// At a specific date/time
Funky.Clock.at('2025-12-24T15:00:00', function(e) {
    console.log('Christmas Eve afternoon!');
});

// Daily repeating
Funky.Clock.at('09:00', function() {
    console.log('Good morning!');
}, { repeat: 'daily' });
```

**Parameters:**
- `time` (string|Date) — Target time (ISO string, HH:MM, or Date object)
- `callback` (function) — Called with `{ timestamp, id }`
- `options.repeat` (string) — `'daily'` for daily repeat

### cancel(taskId)

Cancel a scheduled task:

```javascript
var id = Funky.Clock.after(10000, myCallback);
// Later...
Funky.Clock.cancel(id); // Returns true if found
```

### getScheduled()

Get list of pending scheduled tasks:

```javascript
var tasks = Funky.Clock.getScheduled();
console.log('Pending:', tasks.length);
// Each task: { id, triggerAt, repeat, type }
```

### onTick(callback)

Subscribe to every clock tick:

```javascript
var unbind = Funky.Clock.onTick(function(data) {
    console.log('Time:', data.time, 'Date:', data.date);
});

// Later, unsubscribe:
unbind();
```

## Countdown Timer API

### countdown(target, duration, options)

Start or reset a countdown timer:

```javascript
// Start a 5-minute countdown
Funky.Clock.countdown('#my-timer', '5:00');

// Or with milliseconds
Funky.Clock.countdown('#my-timer', 300000);

// With options
Funky.Clock.countdown('#my-timer', '2:00', {
    format: 'hms',           // Force HH:MM:SS
    completeText: 'DONE!'    // Custom complete text
});
```

**Parameters:**
- `target` (string|HTMLElement) — Selector or element
- `duration` (string|number) — Duration as "MM:SS", "HH:MM:SS", or milliseconds
- `options.format` (string) — Display format: `hms`, `ms`, `s`, `auto`
- `options.completeText` (string) — Text when countdown reaches zero

### addTime(target, ms)

Add time to a running countdown:

```javascript
// Add 30 seconds
Funky.Clock.addTime('#my-timer', 30000);

// Add 5 minutes
Funky.Clock.addTime('#my-timer', 5 * 60 * 1000);
```

### getRemaining(target)

Get remaining time in milliseconds:

```javascript
var remaining = Funky.Clock.getRemaining('#my-timer');
console.log('Seconds left:', Math.ceil(remaining / 1000));

if (remaining === 0) {
    console.log('Countdown complete!');
}
```

### Countdown Complete Event

```javascript
// Listen on the element
document.querySelector('#my-timer').addEventListener('clock:countdown-complete', function(e) {
    console.log('Timer finished!', e.detail);
    // Play sound, show notification, etc.
});

// Or using Funky.Dom
D.one('#my-timer').on('clock:countdown-complete', function(e) {
    alert('Time is up!');
});
```

## Stopwatch API

Count-up timer with smooth millisecond display using `requestAnimationFrame`.

### stopwatch(target, options)

Start a stopwatch on an element:

```javascript
// Basic stopwatch
var sw = Funky.Clock.stopwatch('#timer');

// With options
var sw = Funky.Clock.stopwatch('#timer', {
    showMs: true,      // Show milliseconds (default: true)
    msDigits: 2,       // Millisecond digits 1-3 (default: 2)
    compact: true,     // Hide leading zeros (default: false)
    onTick: function(elapsed, formatted) {
        console.log('Elapsed:', elapsed, 'ms');
    },
    onStop: function(elapsed, formatted) {
        console.log('Final time:', formatted);
    }
});

// Output examples:
// compact: false → "0:00.00s", "1:23.45s", "1:02:30.00s"
// compact: true  → "0.00s", "1:23.45s", "1:02:30.00s"
```

**Parameters:**
- `target` (string|HTMLElement) — Selector or element
- `options.showMs` (boolean) — Show milliseconds (default: true)
- `options.msDigits` (number) — Millisecond precision 1-3 (default: 2)
- `options.compact` (boolean) — Hide leading "0:" for short times
- `options.onTick` (function) — Called each animation frame
- `options.onStop` (function) — Called when stopped

**Returns:** Stopwatch controller object

### Stopwatch Controller

The returned controller provides these methods:

```javascript
var sw = Funky.Clock.stopwatch('#timer');

// Stop and get elapsed time
var elapsed = sw.stop();
console.log('Total ms:', elapsed);

// Pause/resume
sw.pause();
sw.resume();

// Reset to zero (keeps running)
sw.reset();

// Get current elapsed time
var ms = sw.getElapsed();

// Check if running
if (sw.isRunning()) {
    console.log('Still timing...');
}

// Update display options
sw.setOptions({ msDigits: 3 });
```

### stopAllStopwatches()

Stop all running stopwatches:

```javascript
Funky.Clock.stopAllStopwatches();
```

### Example: Test Runner Timer

```javascript
// Start timing when tests begin
var timer = Funky.Clock.stopwatch('#duration', {
    showMs: true,
    msDigits: 2,
    compact: true
});

// Stop and show final time when complete
onTestsComplete(function(results) {
    var elapsed = timer.stop();
    console.log('Tests took:', elapsed, 'ms');
});
```

### Stopwatch Events

| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `clock:stopwatch-started` | element | `{ timestamp }` | Stopwatch started |
| `clock:stopwatch-stopped` | element | `{ elapsed, formatted }` | Stopwatch stopped |
| `clock:stopwatch-paused` | element | `{ elapsed }` | Stopwatch paused |
| `clock:stopwatch-resumed` | element | `{ elapsed }` | Stopwatch resumed |
| `clock:stopwatch-reset` | element | `{}` | Stopwatch reset |

## Events

### Emitted Events

| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `clock:tick` | document | `{ timestamp, time, date }` | Every tick (1s) |
| `clock:init` | document | `{ count }` | After initialization |
| `clock:pause` | document | `{ instanceCount }` | Timer paused |
| `clock:resume` | document | `{ instanceCount }` | Timer resumed |
| `clock:scheduled` | document | `{ id, delay, triggerAt, repeat }` | Task scheduled |
| `clock:triggered` | document | `{ id, timestamp }` | Task executed |
| `clock:cancelled` | document | `{ id }` | Task cancelled |
| `clock:countdown-started` | element | `{ element, duration, targetTime }` | Countdown started |
| `clock:countdown-complete` | element | `{ element, timestamp }` | Countdown finished |
| `clock:countdown-extended` | element | `{ element, added, newTarget }` | Time added |
| `clock:stopwatch-started` | element | `{ timestamp }` | Stopwatch started |
| `clock:stopwatch-stopped` | element | `{ elapsed, formatted }` | Stopwatch stopped |
| `clock:stopwatch-paused` | element | `{ elapsed }` | Stopwatch paused |
| `clock:stopwatch-resumed` | element | `{ elapsed }` | Stopwatch resumed |
| `clock:stopwatch-reset` | element | `{}` | Stopwatch reset |

### Listened Events

| Event | Payload | Description |
|-------|---------|-------------|
| `clock:schedule` | `{ delay, callback, options }` or `{ at, callback, options }` | Schedule via event |
| `clock:cancel-request` | `{ id }` | Cancel via event |

### Listening to Events

```javascript
// Log every tick
document.addEventListener('funky.clock.tick', function(e) {
    console.log('Tick:', e.detail.time);
});

// Track scheduled tasks
document.addEventListener('funky.clock.triggered', function(e) {
    console.log('Task', e.detail.id, 'fired at', e.detail.timestamp);
});

// Schedule from another component via events
Funky.Events.emit(document, 'funky.clock.schedule', {
    delay: 10000,
    callback: function() { alert('10 seconds!'); }
});
```

## CSS Classes

| Class | Description |
|-------|-------------|
| `.mono` | Monospace font |
| `.clock-lg` | Large size (2rem) |
| `.clock-xl` | Extra large (3rem) |
| `.blink` | Blinking separator animation |
| `.countdown-warning` | Yellow color (under 30s remaining) |
| `.countdown-danger` | Red color with blink (under 10s) |
| `.countdown-complete` | Green color with pulse animation |
| `.countdown-paused` | Reduced opacity when paused |

## Analog Clock CSS Classes

| Class | Description |
|-------|-------------|
| `.clock-analog` | SVG container |
| `.clock-face` | Circle background |
| `.clock-hand-hour` | Hour hand |
| `.clock-hand-minute` | Minute hand |
| `.clock-hand-second` | Second hand (red) |
| `.clock-center` | Center dot |
| `.clock-marker-hour` | Hour markers |
| `.clock-marker-min` | Minute markers |
| `.clock-number` | Hour numbers |
| `.clock-sm` | Small size (60px) |
| `.clock-md` | Medium size (100px) |
| `.clock-lg` | Large size (150px) |
| `.clock-xl` | Extra large (200px) |

## Timezones

Use IANA timezone identifiers:

| Region | Examples |
|--------|----------|
| Europe | `Europe/London`, `Europe/Paris`, `Europe/Berlin` |
| Americas | `America/New_York`, `America/Los_Angeles`, `America/Chicago` |
| Asia | `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Singapore` |
| Pacific | `Australia/Sydney`, `Pacific/Auckland` |

Full list: [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Performance

- Single global timer for all clock instances
- Pauses when browser tab is hidden (Page Visibility API)
- Stale elements automatically cleaned up
- Timer stops when no clocks are active

## Accessibility

- Uses semantic `<span>` with live content
- Consider adding `role="timer"` for screen readers
- `aria-live="polite"` for announcements (optional)

## Browser Support

- Uses `Intl.DateTimeFormat` for formatting (all modern browsers)
- Falls back to `toLocaleTimeString()` if timezone fails
- ES5 compatible
