# Funky.InlineEdit

Click-to-edit any element with automatic API save, validation, undo support, and live data binding.

## Quick Start

```html
<span class="inline-edit" 
      role="button"
      tabindex="0"
      data-entity="client" 
      data-id="123" 
      data-field="name">John Smith</span>
```

No JavaScript initialization required - InlineEdit auto-initializes on `.inline-edit` elements.

## Attributes

### Required Attributes

| Attribute | Description |
|-----------|-------------|
| `data-entity` | Entity type (e.g., `client`, `trade`) |
| `data-id` | Entity ID |
| `data-field` | Field name to update |

### Optional Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-type` | string | 'text' | Input type: `text`, `number`, `select`, `date`, `textarea` |
| `data-api` | string | `/api/{entity}/{id}` | Custom API endpoint |
| `data-options` | JSON | null | Options for select type |
| `data-min` | number | null | Min value for number/date |
| `data-max` | number | null | Max value for number/date |
| `data-step` | number | null | Step for number input |
| `data-required` | boolean | false | Field is required |
| `data-placeholder` | string | '' | Placeholder text |
| `data-pattern` | string | null | Regex pattern for validation |
| `data-pattern-message` | string | 'Invalid format' | Custom pattern error message |

## Input Types

### Text (default)

```html
<span class="inline-edit" 
      data-entity="client" 
      data-id="123" 
      data-field="name">John Smith</span>
```

### Number

```html
<span class="inline-edit"
      data-entity="trade" 
      data-id="456" 
      data-field="quantity"
      data-type="number"
      data-min="1"
      data-max="1000000">5000</span>
```

### Select

```html
<span class="inline-edit"
      data-entity="client" 
      data-id="123" 
      data-field="status"
      data-type="select"
      data-options='[{"value":"active","label":"Active"},{"value":"inactive","label":"Inactive"}]'>Active</span>
```

### Date

```html
<span class="inline-edit"
      data-entity="trade" 
      data-id="456" 
      data-field="settlement_date"
      data-type="date">2025-01-15</span>
```

### Textarea

```html
<span class="inline-edit"
      data-entity="client" 
      data-id="123" 
      data-field="notes"
      data-type="textarea">Long text content...</span>
```

## Events

### Emitted Events

| Event | Payload | Description |
|-------|---------|-------------|
| `inlineedit:start` | `{ entity, id, field, element }` | Edit mode started |
| `inlineedit:save` | `{ entity, id, field, oldValue, newValue }` | Value saved |
| `inlineedit:cancel` | `{ entity, id, field }` | Edit cancelled |
| `inlineedit:error` | `{ entity, id, field, error }` | Save failed |
| `inlineedit:undo` | `{ entity, id, field, value }` | Change undone |
| `inlineedit:remote-update` | `{ entity, id, field, oldValue, newValue }` | Remote value changed |
| `inlineedit:conflict` | `{ entity, id, field, localValue, remoteValue }` | Edit conflict detected |

### Listening to Events

```javascript
Funky.Events.on('funky.inline-edit.save', function(data) {
    console.log('Saved:', data.field, '=', data.newValue);
});

Funky.Events.on('funky.inline-edit.error', function(data) {
    console.error('Error saving:', data.field, data.error);
});

Funky.Events.on('funky.inline-edit.remote-update', function(data) {
    console.log('Remote update:', data.field, data.oldValue, '->', data.newValue);
});
```

## JavaScript API

### Get Instance

```javascript
var editor = Funky.InlineEdit.getInstance('#clientName');
```

### Methods

```javascript
// Programmatically start edit
editor.startEdit();

// Cancel edit
editor.cancelEdit();

// Save current value
editor.save();

// Enable/disable editing
editor.setEnabled(false);

// Check if enabled
if (editor.isEnabled()) {
    // ...
}

// Destroy instance and clean up
editor.destroy();
```

## LiveBinding Integration

InlineEdit supports reactive data binding via `Funky.LiveBinding` for real-time updates.

### bindLive(options)

Bind to a live data source for automatic value and permission synchronization.

```javascript
var editor = Funky.InlineEdit.getInstance('#clientName');

// API-driven value and permissions
editor.bindLive({
    source: 'api',
    url: '/api/clients/123',
    valuePath: 'name',
    permissionPath: 'permissions.can_edit_name'
});

// WebSocket-driven updates
editor.bindLive({
    source: 'websocket',
    channel: 'client:123',
    valuePath: 'name'
});

// Event-driven updates
editor.bindLive({
    source: 'event',
    event: 'funky:client:updated',
    valuePath: 'name'
});
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `source` | string | Data source: `'api'`, `'event'`, `'state'`, `'websocket'` |
| `url` | string | API URL for `'api'` source |
| `event` | string | Event name for `'event'` source |
| `channel` | string | WebSocket channel for `'websocket'` source |
| `valuePath` | string | Dot-notation path to value (e.g., `'client.name'`) |
| `permissionPath` | string | Dot-notation path to permission (e.g., `'permissions.canEdit'`) |

### WebSocket Subscription

For real-time updates without LiveBinding:

```javascript
// Subscribe to WebSocket channel
editor.subscribeWebSocket('client:123');

// Unsubscribe
editor.unsubscribeWebSocket();
```

### Conflict Detection

When a remote update occurs while the user is editing, InlineEdit shows a conflict toast:

- **Keep mine** - Discards the remote value and keeps the current input
- **Use theirs** - Adopts the remote value and cancels the local edit

The `inlineedit:conflict` event is emitted when this occurs.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Start editing (when focused) |
| `Enter` | Save and close |
| `Escape` | Cancel and close |
| `Tab` | Save and move to next field |
| `Shift+Enter` | New line (textarea only) |

## Visual States

| State | CSS Class | Description |
|-------|-----------|-------------|
| Idle | - | Normal text with hover indicator |
| Editing | - | Input field with focus |
| Saving | `.inline-edit-saving` | Spinner shown |
| Success | `.inline-edit-success` | Green highlight |
| Error | `.inline-edit-error` | Red highlight with shake |
| Remote Update | `.inline-edit-remote-update` | Blue highlight pulse |
| Conflict | `.inline-edit-conflict` | Yellow border on input |
| Disabled | `.disabled`, `[aria-disabled]` | Grayed out |

## Styling

### CSS Variables

InlineEdit uses `--pro-*` variables for theming:

- `--pro-primary` - Focus ring color
- `--pro-surface` - Input background
- `--pro-success-bg` - Success highlight
- `--pro-danger-bg` - Error highlight
- `--pro-info-bg` - Remote update highlight
- `--pro-warning` - Conflict border
- `--pro-focus-ring-width` - Focus outline width
- `--pro-border-radius-sm` - Border radius

### Density Modes

InlineEdit adapts to density settings:

```html
<!-- Compact mode -->
<div data-density="compact">
    <span class="inline-edit" ...>Value</span>
</div>

<!-- Comfortable mode -->
<div data-density="comfortable">
    <span class="inline-edit" ...>Value</span>
</div>
```

### Custom Styling

```css
/* Larger edit icon */
.inline-edit::after {
    font-size: 0.75em;
}

/* Custom success color */
.inline-edit-success {
    background-color: rgba(0, 128, 0, 0.2);
}
```

## API Integration

InlineEdit sends a PATCH request to save changes:

```
PATCH /api/{entity}/{id}
Content-Type: application/json

{ "field_name": "new value" }
```

### Response Handling

| Status | Behavior |
|--------|----------|
| 200 | Success - value saved |
| 422 | Validation error - show message, rollback |
| 403 | Forbidden - show error, rollback |
| 500 | Server error - show error, rollback |

### Custom API Endpoint

```html
<span class="inline-edit"
      data-entity="client" 
      data-id="123" 
      data-field="status"
      data-api="/api/v2/clients/123/update-status">Active</span>
```

## Undo Support

After a successful save, a toast appears with an "Undo" button. Clicking undo sends another PATCH request to restore the original value.

## Validation

### Client-side

- `data-required` - Field cannot be empty
- `data-min` / `data-max` - Number range
- `data-pattern` - Regex pattern

### Server-side

Validation errors from the API are displayed to the user and the value is rolled back.

## Accessibility

- `role="button"` indicates clickability
- `tabindex="0"` enables keyboard focus
- `aria-label` describes the editable value
- Focus trap while editing
- Screen reader announces state changes

### Recommended ARIA

```html
<span class="inline-edit" 
      role="button"
      tabindex="0"
      aria-label="Edit client name: John Smith. Press Enter to edit."
      data-entity="client" 
      data-id="123" 
      data-field="name">John Smith</span>
```

## Integration

InlineEdit integrates with:

- **Funky.Api** - HTTP requests with CSRF
- **Funky.Toast** - Notifications with undo
- **Funky.Cache** - Invalidates entity cache on save
- **Funky.Events** - Broadcasts changes
- **Funky.LiveBinding** - Real-time data synchronization
- **Funky.WebSocket** - Push updates

## Security

- Always validate on server (client validation is UX only)
- Check field-level permissions in API
- Sanitize input before display
- Rate limit rapid edits

## See Also

- [LiveBinding](../core/livebinding.md) - Reactive data binding
- [Toast](./toast.md) - Notification system
- [Data Attributes](../conventions/data-attributes.md) - Naming conventions
