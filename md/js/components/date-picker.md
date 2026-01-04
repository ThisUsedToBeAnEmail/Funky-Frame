# Funky.DatePicker

A lightweight, accessible date picker supporting single date and date range selection. Features time picker, preset ranges, LiveBinding integration, and full keyboard accessibility.

## Quick Start

```html
<input type="text" id="my-date" data-funky-datepicker>

<script>
// Auto-initialized from data attribute, or manual:
var picker = Funky.DatePicker.init('#my-date', {
    format: 'YYYY-MM-DD',
    minDate: '2024-01-01',
    maxDate: '2025-12-31'
});
</script>
```

### Range Mode

```html
<input type="text" id="date-range" data-funky-datepicker data-mode="range">

<script>
var rangePicker = Funky.DatePicker.init('#date-range', {
    mode: 'range',
    ranges: true,
    timePicker: true
});
</script>
```

## Installation

Include the CSS and JavaScript files:

```html
<link rel="stylesheet" href="/assets/css/components/date-picker.css">
<script src="/assets/js/core/date.js"></script>
<script src="/assets/js/components/date-picker.js"></script>
```

**Dependencies:** Requires `Funky.Date` (date.js) to be loaded first.

---

## API Reference

### Funky.DatePicker.init(selector, options)

Create a new DatePicker instance (primary factory method).

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |
| `options` | Object | Configuration options |

**Returns:** DatePicker instance

### Funky.DatePicker.getInstance(selector)

Get existing DatePicker instance for an element.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |

**Returns:** DatePicker instance or `null`

### Funky.DatePicker.initAll(container)

Initialize all date pickers with `data-funky-datepicker` attribute.

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | String/Element | Container to search (default: document) |

### Funky.DatePicker.destroy(selector)

Destroy a DatePicker instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | String/Element | CSS selector or DOM element |

### Funky.DatePicker.destroyAll()

Destroy all DatePicker instances.

---

## Configuration Options

### Mode & Display

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | String | `'single'` | Selection mode: `'single'` or `'range'` |
| `format` | String | `'YYYY-MM-DD'` | Display format pattern |
| `locale` | String | `'en-US'` | Locale for day/month names |
| `weekStarts` | Number | `0` | Week starts on: 0=Sunday, 1=Monday |
| `showWeekNumbers` | Boolean | `false` | Show ISO week numbers |
| `showDropdowns` | Boolean | `true` | Show month/year dropdown selectors |
| `numberOfMonths` | Number | `1` | Number of months to show (auto 2 for range) |
| `size` | String | `'default'` | Size: `'default'`, `'small'`, `'compact'` |
| `autoSize` | Boolean | `true` | Auto-downgrade size for small viewports |

### Range Mode

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `separator` | String | `' - '` | Separator for range display in input |
| `linkedCalendars` | Boolean | `true` | Link dual calendar navigation |
| `ranges` | Boolean/Object | `true` | Show preset ranges (true=default, object=custom, false=none) |

### Time Picker

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timePicker` | Boolean | `false` | Enable time selection |
| `timePicker24Hour` | Boolean | `true` | Use 24-hour format (false = 12-hour with AM/PM) |
| `timePickerIncrement` | Number | `15` | Minute increment (1, 5, 10, 15, 30) |
| `timePickerSeconds` | Boolean | `false` | Show seconds selector |

### Constraints

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minDate` | Date/String | `null` | Minimum selectable date |
| `maxDate` | Date/String | `null` | Maximum selectable date |
| `disabledDates` | Array/Function | `[]` | Array of disabled dates or function |
| `disabledDays` | Array | `[]` | Days of week to disable [0-6] |

### Behavior

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoApply` | Boolean | `false` | Apply selection immediately |
| `closeOnSelect` | Boolean | `true` | Close picker on date selection |
| `container` | String/Element | `null` | Container for inline mode (null = popup) |

### Positioning

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `opens` | String | `'right'` | Popup opens direction: `'left'`, `'right'`, `'center'` |
| `drops` | String | `'down'` | Popup drops direction: `'up'`, `'down'`, `'auto'` |

### Callbacks

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onOpen` | Function | `null` | Called when picker opens |
| `onClose` | Function | `null` | Called when picker closes |
| `onChange` | Function | `null` | Called when value changes |
| `onSelect` | Function | `null` | Called when date is selected |

### LiveBinding

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `liveBind` | String | `null` | LiveBinding source specification |
| `livePath` | String | `null` | Path within source data |
| `liveTwoway` | Boolean | `false` | Enable two-way binding |
| `liveBindStart` | String | `null` | Bind start date separately (range mode) |
| `liveBindEnd` | String | `null` | Bind end date separately (range mode) |
| `minDateBind` | String | `null` | Bind min date to source |
| `maxDateBind` | String | `null` | Bind max date to source |
| `disabledDatesBind` | String | `null` | Bind disabled dates to source |

---

## Data Attributes

Configure via HTML data attributes:

```html
<input type="text"
    data-funky-datepicker
    data-mode="range"
    data-format="DD/MM/YYYY"
    data-min-date="2024-01-01"
    data-max-date="2025-12-31"
    data-week-starts="1"
    data-show-week-numbers="true"
    data-auto-apply="true"
    data-opens="left"
    data-drops="up"
    data-separator=" to "
    data-show-ranges="true"
    data-linked-calendars="true"
    data-time-picker="true"
    data-time-picker-24-hour="false"
    data-time-picker-increment="15"
    data-time-picker-seconds="true"
    data-live-bind="cache:user.birthDate"
    data-live-path="profile.date"
    data-live-twoway="true">
```

---

## Instance Methods

### Opening & Closing

#### picker.open()

Open the picker popup.

```javascript
picker.open();
```

#### picker.close()

Close the picker popup.

```javascript
picker.close();
```

#### picker.toggle()

Toggle picker visibility.

```javascript
picker.toggle();
```

### Getting & Setting Values

#### picker.getValue()

Get the selected date value.

**Returns:**
- Single mode: `Date` or `null`
- Range mode: `{ start: Date|null, end: Date|null }`

```javascript
// Single mode
var date = picker.getValue(); // Date object

// Range mode
var range = picker.getValue();
console.log(range.start, range.end);
```

#### picker.setValue(date)

Set the selected date (single mode).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date/String/Number/null | Date to set |

```javascript
picker.setValue('2024-06-15');
picker.setValue(new Date());
picker.setValue(null); // Clear
```

#### picker.getRange()

Get range value (range mode only).

**Returns:** `{ start: Date|null, end: Date|null }`

```javascript
var range = picker.getRange();
```

#### picker.setRange(start, end)

Set range value (range mode only).

| Parameter | Type | Description |
|-----------|------|-------------|
| `start` | Date/String/Number/null | Start date |
| `end` | Date/String/Number/null | End date |

```javascript
picker.setRange('2024-06-01', '2024-06-30');
```

### Time Methods

#### picker.getTime()

Get time value (requires `timePicker: true`).

**Returns:**
- Single mode: `{ hour: 0-23, minute: 0-59, second: 0-59 }`
- Range mode: `{ start: {...}, end: {...} }`

```javascript
var time = picker.getTime();
console.log(time.hour, time.minute);
```

#### picker.setTime(hour, minute, second)

Set time value (single mode).

| Parameter | Type | Description |
|-----------|------|-------------|
| `hour` | Number | Hour (0-23) |
| `minute` | Number | Minute (0-59), optional |
| `second` | Number | Second (0-59), optional |

```javascript
picker.setTime(14, 30, 0);
```

#### picker.setStartTime(hour, minute, second)

Set start time (range mode only).

```javascript
picker.setStartTime(9, 0, 0);
```

#### picker.setEndTime(hour, minute, second)

Set end time (range mode only).

```javascript
picker.setEndTime(17, 30, 0);
```

### DateTime Methods (Combined Date + Time)

#### picker.getDateTime()

Get full datetime value (single mode). Returns date with time applied.

**Returns:** `Date` or `null`

```javascript
var datetime = picker.getDateTime();
console.log(datetime); // Date object with both date and time
```

#### picker.setDateTime(datetime)

Set full datetime value (single mode).

| Parameter | Type | Description |
|-----------|------|-------------|
| `datetime` | Date/String | Full datetime value |

```javascript
picker.setDateTime(new Date('2024-06-15T14:30:00'));
```

#### picker.setDateTimeRange(startDateTime, endDateTime)

Set full datetime range (range mode only).

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDateTime` | Date/String | Start datetime |
| `endDateTime` | Date/String | End datetime |

```javascript
picker.setDateTimeRange(
  new Date('2024-06-01T09:00:00'),
  new Date('2024-06-30T17:00:00')
);
```

### Constraints

#### picker.setMinDate(date)

Set minimum selectable date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date/String/Number/null | Minimum date |

```javascript
picker.setMinDate('2024-01-01');
picker.setMinDate(null); // Remove constraint
```

#### picker.setMaxDate(date)

Set maximum selectable date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date/String/Number/null | Maximum date |

```javascript
picker.setMaxDate('2025-12-31');
```

### Other Methods

#### picker.enable()

Enable the date picker.

```javascript
picker.enable();
```

#### picker.disable()

Disable the date picker.

```javascript
picker.disable();
```

#### picker.refresh()

Re-render the picker.

```javascript
picker.refresh();
```

#### picker.destroy()

Destroy the picker instance and clean up.

```javascript
picker.destroy();
picker = null;
```

---

## Events

Events are emitted on both the element and via `Funky.PubSub`.

### funky.datepicker.open

Fired when picker opens.

```javascript
// DOM event
element.addEventListener('funky.datepicker.open', function(e) {
    console.log('Picker opened:', e.detail.instance);
});

// PubSub
Funky.PubSub.on('funky:datepicker:open', function(data) {
    console.log('Picker opened:', data.instance);
});
```

### funky.datepicker.close

Fired when picker closes.

```javascript
element.addEventListener('funky.datepicker.close', function(e) {
    console.log('Picker closed');
});
```

### funky.datepicker.select

Fired when a date is selected.

```javascript
element.addEventListener('funky.datepicker.select', function(e) {
    console.log('Selected date:', e.detail.date);
    console.log('Instance:', e.detail.instance);
});
```

### funky.datepicker.change

Fired when value changes (after apply).

```javascript
element.addEventListener('funky.datepicker.change', function(e) {
    console.log('New value:', e.detail.value);
    console.log('Old value:', e.detail.oldValue);

    // Range mode
    if (e.detail.value && e.detail.value.start) {
        console.log('Start:', e.detail.value.start);
        console.log('End:', e.detail.value.end);
    }
});
```

### funky.datepicker.error

Fired on LiveBinding errors.

```javascript
element.addEventListener('funky.datepicker.error', function(e) {
    console.error('Error:', e.detail.error);
});
```

---

## Format Patterns

The `format` option supports these tokens:

| Token | Description | Example |
|-------|-------------|---------|
| `YYYY` | 4-digit year | 2024 |
| `YY` | 2-digit year | 24 |
| `MM` | 2-digit month | 01-12 |
| `M` | Month | 1-12 |
| `DD` | 2-digit day | 01-31 |
| `D` | Day | 1-31 |
| `HH` | 2-digit hour (24h) | 00-23 |
| `H` | Hour (24h) | 0-23 |
| `hh` | 2-digit hour (12h) | 01-12 |
| `h` | Hour (12h) | 1-12 |
| `mm` | 2-digit minute | 00-59 |
| `m` | Minute | 0-59 |
| `ss` | 2-digit second | 00-59 |
| `s` | Second | 0-59 |
| `A` | AM/PM | AM, PM |
| `a` | am/pm | am, pm |

**Examples:**
- `'YYYY-MM-DD'` → 2024-06-15
- `'DD/MM/YYYY'` → 15/06/2024
- `'YYYY-MM-DD HH:mm'` → 2024-06-15 14:30
- `'MM/DD/YYYY h:mm A'` → 06/15/2024 2:30 PM

---

## Custom Preset Ranges

Provide custom preset ranges:

```javascript
var picker = Funky.DatePicker.init('#date-range', {
    mode: 'range',
    ranges: {
        'Today': [new Date(), new Date()],
        'Yesterday': [
            Funky.Date.addDays(new Date(), -1),
            Funky.Date.addDays(new Date(), -1)
        ],
        'Last 7 Days': [
            Funky.Date.addDays(new Date(), -6),
            new Date()
        ],
        'This Month': [
            Funky.Date.startOfMonth(new Date()),
            Funky.Date.endOfMonth(new Date())
        ],
        'Last Month': [
            Funky.Date.startOfMonth(Funky.Date.addMonths(new Date(), -1)),
            Funky.Date.endOfMonth(Funky.Date.addMonths(new Date(), -1))
        ]
    }
});
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous day |
| `→` | Next day |
| `↑` | Previous week |
| `↓` | Next week |
| `Home` | First day of month |
| `End` | Last day of month |
| `Page Up` | Previous month |
| `Page Down` | Next month |
| `Shift + Page Up` | Previous year |
| `Shift + Page Down` | Next year |
| `Enter` | Select focused date |
| `Space` | Select focused date |
| `Escape` | Close picker / Cancel |
| `Tab` | Navigate focusable elements |

---

## Accessibility

The DatePicker follows WCAG 2.1 AA guidelines:

1. **Full Keyboard Navigation** - All features accessible via keyboard
2. **ARIA Roles** - Uses `dialog`, `grid`, and `gridcell` roles
3. **ARIA Labels** - Proper labels for all interactive elements
4. **Live Regions** - Announces navigation and selection changes
5. **Focus Management** - Focus trapped in popup, restored on close
6. **Color Contrast** - Meets AA contrast requirements
7. **Screen Reader Support** - Tested with VoiceOver, NVDA, JAWS

### Screen Reader Announcements

- Date selection is announced
- Month/year navigation is announced
- Disabled dates are indicated
- Range selection start/end is announced

---

## LiveBinding Integration

### Basic Binding

```html
<input type="text"
    data-funky-datepicker
    data-live-bind="cache:user.birthDate"
    data-live-twoway="true">
```

### Range with Separate Bindings

```html
<input type="text"
    data-funky-datepicker
    data-mode="range"
    data-live-bind-start="cache:filter.startDate"
    data-live-bind-end="cache:filter.endDate">
```

### Dynamic Constraints

```html
<input type="text"
    data-funky-datepicker
    data-min-date-bind="cache:booking.checkinDate"
    data-max-date-bind="cache:booking.maxDate"
    data-disabled-dates-bind="api:/unavailable-dates">
```

### Programmatic Binding

```javascript
var picker = Funky.DatePicker.init('#date', {
    liveBind: 'cache:form.date',
    livePath: 'value',
    liveTwoway: true
});
```

---

## Theming

The DatePicker uses CSS custom properties for theming:

```css
.funky-datepicker {
    /* Layout */
    --dp-padding: 0.75rem;
    --dp-gap: 0.5rem;
    --dp-radius: 0.375rem;
    --dp-radius-sm: 0.25rem;

    /* Colors */
    --dp-bg: var(--pro-bg-surface, #ffffff);
    --dp-text: var(--pro-text, #212529);
    --dp-text-muted: var(--pro-text-muted, #6c757d);
    --dp-border: var(--pro-border-color, #dee2e6);
    --dp-hover-bg: var(--pro-bg-hover, #f8f9fa);

    /* Selection */
    --dp-primary: var(--pro-primary, #0d6efd);
    --dp-primary-text: var(--pro-primary-text, #ffffff);
    --dp-range-bg: var(--pro-primary-subtle, #cfe2ff);
    --dp-range-text: var(--pro-primary, #0d6efd);

    /* Today */
    --dp-today-bg: transparent;
    --dp-today-border: var(--pro-primary, #0d6efd);

    /* Disabled */
    --dp-disabled-text: var(--pro-text-muted, #6c757d);
    --dp-disabled-bg: transparent;

    /* Other month */
    --dp-other-month-text: var(--pro-text-muted, #adb5bd);

    /* Weekend */
    --dp-weekend-text: inherit;

    /* Typography */
    --dp-font-size: 0.875rem;
    --dp-font-size-sm: 0.8125rem;
    --dp-line-height: 1.4;
}
```

### Size Variants

```css
/* Small */
.funky-datepicker--small {
    --dp-padding: 0.5rem;
    --dp-font-size: 0.8125rem;
}

/* Compact */
.funky-datepicker--compact {
    --dp-padding: 0.375rem;
    --dp-font-size: 0.75rem;
}
```

### Dark Mode

The picker automatically supports dark mode via:
- `prefers-color-scheme: dark` media query
- `.theme-dark` class on parent element
- `[data-theme="dark"]` attribute

---

## CSS Classes

### Container Classes

| Class | Description |
|-------|-------------|
| `.funky-datepicker` | Main container |
| `.funky-datepicker--open` | When picker is open |
| `.funky-datepicker--inline` | Inline mode |
| `.funky-datepicker--range` | Range mode |
| `.funky-datepicker--time` | Time picker enabled |
| `.funky-datepicker--small` | Small size variant |
| `.funky-datepicker--compact` | Compact size variant |
| `.funky-datepicker--horizontal` | Horizontal layout (range) |

### Calendar Classes

| Class | Description |
|-------|-------------|
| `.funky-datepicker-header` | Navigation header |
| `.funky-datepicker-prev` | Previous button |
| `.funky-datepicker-next` | Next button |
| `.funky-datepicker-title` | Month/year title |
| `.funky-datepicker-calendar` | Calendar grid |
| `.funky-datepicker-panel` | Calendar panel |
| `.funky-datepicker-panel--left` | Left panel (range) |
| `.funky-datepicker-panel--right` | Right panel (range) |

### Day Classes

| Class | Description |
|-------|-------------|
| `.funky-datepicker-day` | Day cell |
| `.funky-datepicker-day--today` | Today's date |
| `.funky-datepicker-day--selected` | Selected date |
| `.funky-datepicker-day--disabled` | Disabled date |
| `.funky-datepicker-day--other-month` | Day from adjacent month |
| `.funky-datepicker-day--weekend` | Saturday/Sunday |
| `.funky-datepicker-day--focused` | Keyboard focused |
| `.funky-datepicker-day--in-range` | Within selected range |
| `.funky-datepicker-day--range-start` | Range start date |
| `.funky-datepicker-day--range-end` | Range end date |
| `.funky-datepicker-day--hover-range` | Hover preview range |

### Action Classes

| Class | Description |
|-------|-------------|
| `.funky-datepicker-actions` | Actions container |
| `.funky-datepicker-buttons` | Buttons container |
| `.funky-datepicker-clear` | Clear button |
| `.funky-datepicker-cancel` | Cancel button |
| `.funky-datepicker-apply` | Apply button |

### Time Picker Classes

| Class | Description |
|-------|-------------|
| `.funky-datepicker-time` | Time picker container |
| `.funky-datepicker-times` | Time pickers wrapper (range) |
| `.funky-datepicker-time--start` | Start time picker |
| `.funky-datepicker-time--end` | End time picker |
| `.funky-datepicker-hour` | Hour select |
| `.funky-datepicker-minute` | Minute select |
| `.funky-datepicker-second` | Second select |
| `.funky-datepicker-period` | AM/PM select |

---

## Examples

### Basic Single Date

```javascript
var picker = Funky.DatePicker.init('#birthday', {
    format: 'MMMM D, YYYY',
    maxDate: new Date() // Can't select future dates
});
```

### Date Range for Booking

```javascript
var bookingPicker = Funky.DatePicker.init('#booking-dates', {
    mode: 'range',
    minDate: new Date(), // No past dates
    ranges: {
        'This Weekend': [
            getNextWeekend(),
            getNextSunday()
        ],
        'Next Week': [
            getNextMonday(),
            getNextFriday()
        ]
    },
    onSelect: function(date) {
        checkAvailability(date);
    }
});
```

### With Time Picker

```javascript
var meetingPicker = Funky.DatePicker.init('#meeting-time', {
    timePicker: true,
    timePicker24Hour: false,
    timePickerIncrement: 30,
    format: 'YYYY-MM-DD h:mm A'
});
```

### Inline Calendar

```javascript
var inlinePicker = Funky.DatePicker.init('#hidden-input', {
    container: '#calendar-container',
    autoApply: true
});
```

### Disabled Weekends

```javascript
var workdayPicker = Funky.DatePicker.init('#workday', {
    disabledDays: [0, 6], // Sunday, Saturday
    disabledDates: holidays // Array of holiday dates
});
```

### Dynamic Constraints

```javascript
// Check-out must be after check-in
var checkinPicker = Funky.DatePicker.init('#checkin', {
    onChange: function(e) {
        checkoutPicker.setMinDate(e.detail.value);
    }
});

var checkoutPicker = Funky.DatePicker.init('#checkout');
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Note: The component uses ES5 syntax for maximum compatibility.

---

## See Also

- [Funky.Date](../core/date.md) - Date utilities (dependency)
- [Funky.LiveBinding](../core/live-binding.md) - Real-time data binding
- [Funky.ComboBox](./combobox.md) - ComboBox component (used for month/year dropdowns)
- [Theming Guide](../../THEMING.md) - CSS variables
