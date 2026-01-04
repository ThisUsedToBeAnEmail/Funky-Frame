# Funky.Date

Date utility module providing date manipulation, comparison, formatting, and calendar grid generation. Extracted from Calendar.js for reuse across components.

## Quick Start

```javascript
// Comparisons
Funky.Date.isSameDay(date1, date2);
Funky.Date.isToday(date);
Funky.Date.isInRange(date, start, end);

// Boundaries
Funky.Date.startOfDay(date);
Funky.Date.startOfMonth(date);

// Arithmetic
Funky.Date.addDays(date, 5);
Funky.Date.addMonths(date, -1);

// Calendar grid
var grid = Funky.Date.generateMonthGrid(date, 0);

// Formatting
Funky.Date.toDateString(date); // '2025-01-15'
Funky.Date.format(date, { month: 'long', day: 'numeric' });
```

## Installation

Include the JavaScript file after registry.js:

```html
<script src="/assets/js/core/registry.js"></script>
<script src="/assets/js/core/date.js"></script>
```

---

## Comparison Methods

### Funky.Date.isSameDay(date1, date2)

Check if two dates are the same day (ignoring time).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date1` | Date | First date |
| `date2` | Date | Second date |

**Returns:** `boolean`

```javascript
Funky.Date.isSameDay(new Date('2024-06-15'), new Date('2024-06-15')); // true
Funky.Date.isSameDay(new Date('2024-06-15 10:00'), new Date('2024-06-15 23:59')); // true
```

### Funky.Date.isToday(date)

Check if a date is today.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to check |

**Returns:** `boolean`

```javascript
Funky.Date.isToday(new Date()); // true
```

### Funky.Date.isSameMonth(date, reference)

Check if a date is in the same month and year as a reference date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to check |
| `reference` | Date | Reference date |

**Returns:** `boolean`

```javascript
Funky.Date.isSameMonth(new Date('2024-06-15'), new Date('2024-06-01')); // true
Funky.Date.isSameMonth(new Date('2024-06-15'), new Date('2024-07-01')); // false
```

### Funky.Date.isWeekend(date)

Check if a date falls on a weekend (Saturday or Sunday).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to check |

**Returns:** `boolean`

```javascript
Funky.Date.isWeekend(new Date('2024-06-15')); // true (Saturday)
Funky.Date.isWeekend(new Date('2024-06-17')); // false (Monday)
```

### Funky.Date.isBefore(date1, date2)

Check if date1 is before date2.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date1` | Date | First date |
| `date2` | Date | Second date |

**Returns:** `boolean`

```javascript
Funky.Date.isBefore(new Date('2024-06-01'), new Date('2024-06-15')); // true
```

### Funky.Date.isAfter(date1, date2)

Check if date1 is after date2.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date1` | Date | First date |
| `date2` | Date | Second date |

**Returns:** `boolean`

```javascript
Funky.Date.isAfter(new Date('2024-06-15'), new Date('2024-06-01')); // true
```

### Funky.Date.isInRange(date, start, end)

Check if a date is within a range (inclusive).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to check |
| `start` | Date/null | Range start (null for no lower bound) |
| `end` | Date/null | Range end (null for no upper bound) |

**Returns:** `boolean`

```javascript
var start = new Date('2024-06-01');
var end = new Date('2024-06-30');
Funky.Date.isInRange(new Date('2024-06-15'), start, end); // true
Funky.Date.isInRange(new Date('2024-07-01'), start, end); // false
```

### Funky.Date.compare(date1, date2)

Compare two dates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date1` | Date | First date |
| `date2` | Date | Second date |

**Returns:** `-1` if date1 < date2, `0` if equal, `1` if date1 > date2

```javascript
Funky.Date.compare(new Date('2024-06-01'), new Date('2024-06-15')); // -1
Funky.Date.compare(new Date('2024-06-15'), new Date('2024-06-15')); // 0
Funky.Date.compare(new Date('2024-06-15'), new Date('2024-06-01')); // 1
```

---

## Boundary Methods

### Funky.Date.startOfDay(date)

Get the start of a day (00:00:00.000).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |

**Returns:** `Date` - New date at start of day

```javascript
var d = Funky.Date.startOfDay(new Date('2024-06-15T14:30:00'));
// Sat Jun 15 2024 00:00:00
```

### Funky.Date.endOfDay(date)

Get the end of a day (23:59:59.999).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |

**Returns:** `Date` - New date at end of day

```javascript
var d = Funky.Date.endOfDay(new Date('2024-06-15'));
// Sat Jun 15 2024 23:59:59.999
```

### Funky.Date.startOfMonth(date)

Get the first day of the month at 00:00:00.000.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |

**Returns:** `Date` - New date at start of month

```javascript
var d = Funky.Date.startOfMonth(new Date('2024-06-15'));
// Sat Jun 01 2024 00:00:00
```

### Funky.Date.endOfMonth(date)

Get the last day of the month at 23:59:59.999.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |

**Returns:** `Date` - New date at end of month

```javascript
var d = Funky.Date.endOfMonth(new Date('2024-06-15'));
// Sun Jun 30 2024 23:59:59.999
```

### Funky.Date.startOfWeek(date, weekStarts)

Get the start of a week.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |
| `weekStarts` | Number | Week start day (0=Sunday, 1=Monday), default 0 |

**Returns:** `Date` - New date at start of week

```javascript
// Week starting Sunday
var d = Funky.Date.startOfWeek(new Date('2024-06-15'), 0);
// Sun Jun 09 2024 00:00:00

// Week starting Monday
var d = Funky.Date.startOfWeek(new Date('2024-06-15'), 1);
// Mon Jun 10 2024 00:00:00
```

### Funky.Date.endOfWeek(date, weekStarts)

Get the end of a week.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |
| `weekStarts` | Number | Week start day (0=Sunday, 1=Monday), default 0 |

**Returns:** `Date` - New date at end of week

```javascript
var d = Funky.Date.endOfWeek(new Date('2024-06-15'), 1);
// Sun Jun 16 2024 23:59:59.999
```

---

## Arithmetic Methods

### Funky.Date.addDays(date, days)

Add days to a date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |
| `days` | Number | Days to add (negative to subtract) |

**Returns:** `Date` - New date with days added

```javascript
Funky.Date.addDays(new Date('2024-06-15'), 5);   // 2024-06-20
Funky.Date.addDays(new Date('2024-06-15'), -5);  // 2024-06-10
```

### Funky.Date.addMonths(date, months)

Add months to a date. Handles month-end edge cases automatically (e.g., Jan 31 + 1 month = Feb 28/29).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |
| `months` | Number | Months to add (negative to subtract) |

**Returns:** `Date` - New date with months added

```javascript
Funky.Date.addMonths(new Date('2024-06-15'), 1);   // 2024-07-15
Funky.Date.addMonths(new Date('2024-01-31'), 1);   // 2024-02-29 (leap year)
Funky.Date.addMonths(new Date('2024-06-15'), -3);  // 2024-03-15
```

### Funky.Date.addYears(date, years)

Add years to a date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Input date |
| `years` | Number | Years to add (negative to subtract) |

**Returns:** `Date` - New date with years added

```javascript
Funky.Date.addYears(new Date('2024-06-15'), 1);   // 2025-06-15
Funky.Date.addYears(new Date('2024-06-15'), -10); // 2014-06-15
```

### Funky.Date.daysInMonth(date)

Get the number of days in a month.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Any date in the target month |

**Returns:** `number` - Number of days (28-31)

```javascript
Funky.Date.daysInMonth(new Date('2024-02-15')); // 29 (leap year)
Funky.Date.daysInMonth(new Date('2024-06-15')); // 30
```

### Funky.Date.clone(date)

Clone a date.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to clone |

**Returns:** `Date` - New Date object with same value

```javascript
var original = new Date('2024-06-15');
var copy = Funky.Date.clone(original);
// Modifying copy won't affect original
```

---

## Grid Generation Methods

### Funky.Date.generateMonthGrid(date, weekStarts)

Generate a 6-week × 7-day month grid (42 cells) suitable for calendar rendering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Any date in the target month |
| `weekStarts` | Number | Week start day (0=Sunday, 1=Monday), default 0 |

**Returns:** `Array` - Array of 6 week arrays, each containing 7 day objects

Each day object contains:
- `date` (Date) - The date
- `day` (number) - Day of month (1-31)
- `month` (number) - Month (0-11)
- `year` (number) - Year
- `isToday` (boolean) - Is today's date
- `isCurrentMonth` (boolean) - Is in the displayed month
- `isWeekend` (boolean) - Is Saturday or Sunday
- `dateString` (string) - YYYY-MM-DD format
- `isoString` (string) - ISO 8601 format

```javascript
var grid = Funky.Date.generateMonthGrid(new Date('2024-06'), 1);
// Returns 6 weeks, each with 7 days
grid.forEach(function(week) {
    week.forEach(function(day) {
        console.log(day.dateString, day.isCurrentMonth);
    });
});
```

### Funky.Date.generateWeekGrid(date, options)

Generate a week grid with time slots.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Any date in the target week |
| `options.weekStarts` | Number | Week start day (default 0) |
| `options.startHour` | Number | Start hour (default 0) |
| `options.endHour` | Number | End hour (default 24) |
| `options.slotDuration` | Number | Slot duration in minutes (default 30) |

**Returns:** `{ days: Array, slots: Array }`

```javascript
var grid = Funky.Date.generateWeekGrid(new Date('2024-06-15'), {
    weekStarts: 1,
    startHour: 8,
    endHour: 18,
    slotDuration: 30
});

// grid.days = 7 day objects
// grid.slots = time slot objects with hour, minute, time
```

### Funky.Date.generateDayGrid(date, options)

Generate time slots for a single day.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Target date |
| `options.startHour` | Number | Start hour (default 0) |
| `options.endHour` | Number | End hour (default 24) |
| `options.slotDuration` | Number | Slot duration in minutes (default 30) |

**Returns:** `{ day: Object, slots: Array }`

```javascript
var grid = Funky.Date.generateDayGrid(new Date('2024-06-15'), {
    startHour: 9,
    endHour: 17,
    slotDuration: 15
});

// grid.day = day object with date, isToday, etc.
// grid.slots = array of time slots
```

### Funky.Date.getViewRange(date, view, weekStarts)

Get the visible date range for a calendar view.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Reference date |
| `view` | String | View type: `'month'`, `'week'`, `'day'` |
| `weekStarts` | Number | Week start day (default 0) |

**Returns:** `{ start: Date, end: Date }`

```javascript
var range = Funky.Date.getViewRange(new Date('2024-06-15'), 'month', 1);
// range.start = first visible day (may be in May)
// range.end = last visible day (may be in July)
```

---

## Formatting Methods

### Funky.Date.toDateString(date)

Convert a date to YYYY-MM-DD string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to format |

**Returns:** `string` - Date in YYYY-MM-DD format

```javascript
Funky.Date.toDateString(new Date('2024-06-15')); // '2024-06-15'
```

### Funky.Date.toTimeString(date, includeSeconds)

Convert a date to HH:MM or HH:MM:SS string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to format |
| `includeSeconds` | Boolean | Include seconds (default false) |

**Returns:** `string` - Time string

```javascript
Funky.Date.toTimeString(new Date('2024-06-15T14:30:45')); // '14:30'
Funky.Date.toTimeString(new Date('2024-06-15T14:30:45'), true); // '14:30:45'
```

### Funky.Date.formatTime(hour, minute)

Format time as HH:MM from hour and minute values.

| Parameter | Type | Description |
|-----------|------|-------------|
| `hour` | Number | Hour (0-23) |
| `minute` | Number | Minute (0-59) |

**Returns:** `string` - Formatted time (e.g., '09:30')

```javascript
Funky.Date.formatTime(9, 5);  // '09:05'
Funky.Date.formatTime(14, 30); // '14:30'
```

### Funky.Date.format(date, options, locale)

Format a date using `Intl.DateTimeFormat`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to format |
| `options` | Object | Intl.DateTimeFormat options |
| `locale` | String | Locale string (default 'en-US') |

**Returns:** `string` - Formatted date string

```javascript
Funky.Date.format(new Date('2024-06-15'), {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
}); // 'June 15, 2024'

Funky.Date.format(new Date('2024-06-15'), {
    weekday: 'long'
}, 'de-DE'); // 'Samstag'
```

---

## Parsing Methods

### Funky.Date.parse(value)

Parse various date inputs to a Date object. Handles Date objects, strings, and timestamps intelligently.

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | Date/String/Number | Value to parse |

**Returns:** `Date` or `null` if invalid

```javascript
Funky.Date.parse('2024-06-15');           // Date object
Funky.Date.parse('2024-06-15T14:30:00');  // Date with time
Funky.Date.parse(new Date());              // Clone
Funky.Date.parse(1718445600);              // Unix timestamp (seconds)
Funky.Date.parse(1718445600000);           // Milliseconds
Funky.Date.parse('invalid');               // null
```

**Timestamp handling:**
- Values ≥ 10 billion are treated as milliseconds
- Values 1-10 billion are treated as seconds (years 2001-2286)
- Values < 1 billion are treated as milliseconds

---

## Localization Methods

### Funky.Date.getDayNames(locale, format, weekStarts)

Get localized day names.

| Parameter | Type | Description |
|-----------|------|-------------|
| `locale` | String | Locale string (default 'en-US') |
| `format` | String | Format: `'narrow'`, `'short'`, `'long'` (default 'short') |
| `weekStarts` | Number | Week start day (default 0) |

**Returns:** `Array<string>` - Array of 7 day names

```javascript
Funky.Date.getDayNames('en-US', 'short', 0);
// ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

Funky.Date.getDayNames('en-US', 'short', 1);
// ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

Funky.Date.getDayNames('de-DE', 'long', 1);
// ['Montag', 'Dienstag', 'Mittwoch', ...]
```

### Funky.Date.getMonthNames(locale, format)

Get localized month names.

| Parameter | Type | Description |
|-----------|------|-------------|
| `locale` | String | Locale string (default 'en-US') |
| `format` | String | Format: `'narrow'`, `'short'`, `'long'` (default 'long') |

**Returns:** `Array<string>` - Array of 12 month names

```javascript
Funky.Date.getMonthNames('en-US', 'long');
// ['January', 'February', ..., 'December']

Funky.Date.getMonthNames('fr-FR', 'short');
// ['janv.', 'févr.', ..., 'déc.']
```

---

## Week Number Methods

### Funky.Date.getWeekNumber(date)

Get the ISO week number (1-53).

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | Date | Date to check |

**Returns:** `number` - ISO week number (1-53)

```javascript
Funky.Date.getWeekNumber(new Date('2024-01-01')); // 1
Funky.Date.getWeekNumber(new Date('2024-06-15')); // 24
```

### Funky.Date.getWeeksInYear(year)

Get the number of ISO weeks in a year (52 or 53).

| Parameter | Type | Description |
|-----------|------|-------------|
| `year` | Number | Year to check |

**Returns:** `number` - 52 or 53

```javascript
Funky.Date.getWeeksInYear(2024); // 52
Funky.Date.getWeeksInYear(2020); // 53
```

---

## Examples

### Build a Simple Calendar Header

```javascript
var date = new Date('2024-06');
var dayNames = Funky.Date.getDayNames('en-US', 'short', 1);
var monthNames = Funky.Date.getMonthNames('en-US', 'long');

console.log(monthNames[date.getMonth()] + ' ' + date.getFullYear());
// 'June 2024'

console.log(dayNames.join(' | '));
// 'Mon | Tue | Wed | Thu | Fri | Sat | Sun'
```

### Date Range Validation

```javascript
function isDateSelectable(date, minDate, maxDate, disabledDays) {
    // Check if in allowed range
    if (!Funky.Date.isInRange(date, minDate, maxDate)) {
        return false;
    }

    // Check if day of week is disabled
    if (disabledDays && disabledDays.indexOf(date.getDay()) !== -1) {
        return false;
    }

    return true;
}

var selectable = isDateSelectable(
    new Date('2024-06-15'),
    new Date('2024-06-01'),
    new Date('2024-06-30'),
    [0, 6] // Disable weekends
);
```

### Generate Date Options for Select

```javascript
function generateDateOptions(startDate, days) {
    var options = [];
    var current = Funky.Date.clone(startDate);

    for (var i = 0; i < days; i++) {
        options.push({
            value: Funky.Date.toDateString(current),
            label: Funky.Date.format(current, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            })
        });
        current = Funky.Date.addDays(current, 1);
    }

    return options;
}

var options = generateDateOptions(new Date(), 7);
// [{ value: '2024-06-15', label: 'Sat, Jun 15' }, ...]
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Note: Uses ES5 syntax with polyfills for `String.prototype.padStart` and `String.prototype.repeat`.

---

## See Also

- [Funky.DatePicker](../components/date-picker.md) - Date picker component
- [Funky.Calendar](../components/calendar.md) - Calendar component
- [Funky.Timezone](./timezone.md) - Timezone utilities
