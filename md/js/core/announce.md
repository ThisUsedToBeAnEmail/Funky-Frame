# Funky.Announce - Screen Reader Announcements

Provides ARIA live regions for announcing dynamic content changes to screen readers.

## Overview

`Funky.Announce` manages screen reader announcements through ARIA live regions. It provides a simple API for making polite (non-interrupting) and assertive (interrupting) announcements to assistive technology users.

## API Reference

### Methods

#### `Announce.polite(message)`

Announce a message politely. The screen reader will announce the message when convenient, without interrupting the current reading.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Message to announce |

**Use for:** Updates, loading states, confirmations, non-critical information.

**Example:**
```javascript
Funky.Announce.polite('5 items loaded');
Funky.Announce.polite('Page content updated');
Funky.Announce.polite('Form saved successfully');
```

---

#### `Announce.assertive(message)`

Announce a message assertively. The screen reader will interrupt the current reading to announce the message immediately.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Message to announce |

**Use for:** Errors, urgent alerts, critical information that requires immediate attention.

**Example:**
```javascript
Funky.Announce.assertive('Error: Please check your input');
Funky.Announce.assertive('Connection lost');
Funky.Announce.assertive('Session expiring in 1 minute');
```

---

#### `Announce.clear()`

Clear all live region content. Useful when the announced information is no longer relevant.

**Example:**
```javascript
// Clear previous announcements
Funky.Announce.clear();
```

---

#### `Announce.init()`

Initialize the announce system. This is called automatically on DOM ready, but can be called manually if needed.

**Example:**
```javascript
// Manual initialization (usually not needed)
Funky.Announce.init();
```

## Live Regions

The module uses two ARIA live regions:

| ID | Type | Role | Purpose |
|----|------|------|---------|
| `#spa-announcer` | polite | status | Non-interrupting announcements |
| `#alert-announcer` | assertive | alert | Immediate announcements |

### Auto-Creation

If the live regions don't exist in the DOM, they are automatically created:

```html
<!-- Created automatically if missing -->
<div id="spa-announcer" class="visually-hidden" aria-live="polite" aria-atomic="true" role="status"></div>
<div id="alert-announcer" class="visually-hidden" aria-live="assertive" aria-atomic="true" role="alert"></div>
```

### Template Integration

The live regions are included in the app layout template (`templates/layouts/app.html.ep`):

```html
<!-- ARIA Live Regions for Screen Reader Announcements -->
<div id="spa-announcer" class="visually-hidden" aria-live="polite" aria-atomic="true" role="status"></div>
<div id="alert-announcer" class="visually-hidden" aria-live="assertive" aria-atomic="true" role="alert"></div>
```

## Implementation Details

- **Timing:** A 50ms delay is used between clearing and setting content to ensure screen readers notice the change.
- **Atomic:** Both regions use `aria-atomic="true"` to announce the entire content as a single unit.
- **Auto-init:** The module initializes automatically on DOM ready.

## Dependencies

- `Funky.register` (core registry)

## Examples

### SPA Page Navigation

```javascript
// Announce page change
Funky.Announce.polite('Navigated to Settings page');
```

### Form Submission

```javascript
function submitForm() {
  fetch('/api/save', { method: 'POST', body: formData })
    .then(function(response) {
      if (response.ok) {
        Funky.Announce.polite('Changes saved successfully');
      } else {
        Funky.Announce.assertive('Error: Failed to save changes');
      }
    })
    .catch(function() {
      Funky.Announce.assertive('Error: Network connection lost');
    });
}
```

### Loading States

```javascript
function loadData() {
  Funky.Announce.polite('Loading data...');

  fetch('/api/data')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      renderData(data);
      Funky.Announce.polite(data.length + ' items loaded');
    });
}
```

### Modal Dialogs

```javascript
function openModal(title) {
  // Open modal...
  Funky.Announce.polite('Dialog opened: ' + title);
}

function closeModal() {
  // Close modal...
  Funky.Announce.polite('Dialog closed');
}
```

### Timer Warnings

```javascript
function sessionWarning(minutes) {
  if (minutes <= 1) {
    Funky.Announce.assertive('Warning: Session expiring in ' + minutes + ' minute');
  } else {
    Funky.Announce.polite('Session expiring in ' + minutes + ' minutes');
  }
}
```

## Best Practices

1. **Use polite for most announcements** - Only use assertive for truly urgent messages.
2. **Keep messages concise** - Screen reader users benefit from brief, clear announcements.
3. **Avoid announcement spam** - Don't announce every small change; focus on meaningful updates.
4. **Provide context** - Include enough information for users to understand the announcement.
5. **Test with screen readers** - Verify announcements work with NVDA, VoiceOver, or JAWS.

## WCAG Compliance

This module helps meet the following WCAG 2.1 success criteria:

- **4.1.3 Status Messages (Level AA):** Status messages can be programmatically determined through role or properties.
