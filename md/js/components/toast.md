# Funky.Toast - Toast Notifications

Toast notification system for success, error, warning, and info messages, plus confirmation dialogs.

## Overview

`Funky.Toast` provides a unified notification system using Bootstrap 5 toasts. It supports multiple notification types and confirmation dialogs with Yes/No buttons.

## API Reference

### Methods

#### `Toast.success(message, titleOrOptions)`

Show a success toast.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Toast message |
| titleOrOptions | string\|object | No | Custom title string, or options object |

**Example:**
```javascript
Funky.Toast.success('Trade saved successfully');
Funky.Toast.success('Record updated', 'Update Complete');
Funky.Toast.success('Saved', { duration: 3000 });
```

---

#### `Toast.error(message, titleOrOptions)`

Show an error toast.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Toast message |
| titleOrOptions | string\|object | No | Custom title string, or options object |

**Example:**
```javascript
Funky.Toast.error('Failed to save trade');
Funky.Toast.error('Connection failed', { duration: 10000 });
```

---

#### `Toast.warning(message, titleOrOptions)`

Show a warning toast.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Toast message |
| titleOrOptions | string\|object | No | Custom title string, or options object |

---

#### `Toast.info(message, titleOrOptions)`

Show an info toast.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| message | string | Yes | Toast message |
| titleOrOptions | string\|object | No | Custom title string, or options object |

---

#### `Toast.show(options)`

Show a toast with full configuration.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| message | string | '' | Toast message |
| type | string | 'info' | Type: 'success', 'error', 'warning', 'info' |
| title | string | (auto) | Title (defaults based on type) |
| duration | number | 5000 | Auto-dismiss time in ms |

**Example:**
```javascript
Funky.Toast.show({
  message: 'Custom notification',
  type: 'info',
  title: 'Custom Title',
  duration: 10000
});
```

---

#### `Toast.confirm(options)`

Show a confirmation dialog with Yes/No buttons.

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| message | string | 'Are you sure?' | Confirmation message |
| title | string | 'Confirm' | Dialog title |
| confirmText | string | 'Yes' | Confirm button text |
| cancelText | string | 'No' | Cancel button text |
| onConfirm | function | - | Callback when confirmed |
| onCancel | function | - | Callback when cancelled |

**Example:**
```javascript
Funky.Toast.confirm({
  message: 'Delete this trade?',
  title: 'Confirm Delete',
  onConfirm: function() {
    deleteTrade(tradeId);
  }
});
```

---

#### `Toast.hideAll()`

Hide all active toasts while keeping the container.

**Example:**
```javascript
// Hide all notifications
Funky.Toast.hideAll();
```

---

#### `Toast.destroyAll()`

Hide all active toasts and destroy the container.

**Example:**
```javascript
// Clean up on page navigation
Funky.Toast.destroyAll();
```

---

### Duration by Type

Different toast types have different default durations:

| Type | Duration | Reason |
|------|----------|--------|
| success | 5000ms | Standard notification |
| info | 5000ms | Standard notification |
| warning | 6000ms | Slightly longer to ensure user notices |
| error | 7000ms | Important - needs more reading time |

## Styling

Toasts use Bootstrap 5 classes with custom Funky styling:

| Type | Icon | Color |
|------|------|-------|
| success | ✓ check | Green |
| error | ✕ x-circle | Red |
| warning | ⚠ exclamation-triangle | Yellow |
| info | ℹ info-circle | Blue |

## Accessibility

Toast notifications include proper ARIA attributes:

| Type | Role | aria-live | Description |
|------|------|-----------|-------------|
| error | alert | assertive | Interrupts screen reader immediately |
| warning | alert | assertive | Interrupts screen reader immediately |
| success | status | polite | Announced when screen reader is idle |
| info | status | polite | Announced when screen reader is idle |

All toasts include `aria-atomic="true"` so the entire message is announced as a whole. Close buttons have `aria-label="Close"` for keyboard users.

## Dependencies

- Bootstrap 5 (for toast component)

## Examples

### API Response Handling

```javascript
function saveTrade(data) {
  Funky.Api.post('/api/trades', data)
    .then(function(response) {
      if (response.success) {
        Funky.Toast.success('Trade saved');
      } else {
        Funky.Toast.error(response.error);
      }
    })
    .catch(function(error) {
      Funky.Toast.error('Network error');
    });
}
```

### Delete Confirmation

```javascript
$('#deleteBtn').on('click', function() {
  var id = $(this).data('id');
  
  Funky.Toast.confirm({
    message: 'Are you sure you want to delete this record?',
    title: 'Confirm Delete',
    confirmText: 'Delete',
    onConfirm: function() {
      Funky.Api.delete('/api/records/' + id).then(function() {
        Funky.Toast.success('Record deleted');
        dataTable.ajax.reload();
      });
    }
  });
});
```

## Bindable Interface (LiveBinding)

Toast supports the LiveBinding system for streaming notifications.

> **Note:** Toast is a singleton component - there is no instance registry. All notifications are managed through the global `Funky.Toast` interface.

### Bindable Methods

#### `addData(notification)`

Add a new toast notification. Ideal for streaming notifications from WebSocket or Server-Sent Events.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| notification | object | Notification configuration |

**Notification Object:**
| Property | Type | Description |
|----------|------|-------------|
| type | string | Toast type: 'success', 'error', 'warning', 'info' |
| message | string | Notification message |
| title | string | Optional custom title |
| duration | number | Optional auto-dismiss time in ms |

**Example:**
```javascript
// Direct method call
Funky.Toast.addData({
    type: 'info',
    message: 'New trade received: AAPL 100 @ $150.25',
    title: 'Trade Alert'
});
```

### LiveBinding Integration

```javascript
// Bind to WebSocket notifications channel
Funky.LiveBinding.bind({
    source: { type: 'websocket', channel: 'notifications' },
    target: {
        type: 'component',
        component: 'Toast',
        method: 'addData'
    },
    transform: function(data) {
        return {
            type: data.severity || 'info',
            message: data.text,
            title: data.category
        };
    }
});

// Bind to Server-Sent Events
Funky.LiveBinding.bind({
    source: { type: 'sse', url: '/api/events/notifications' },
    target: {
        type: 'component',
        component: 'Toast',
        method: 'addData'
    }
});
```

### Streaming Notifications Example

```javascript
// Real-time trade alerts
Funky.LiveBinding.bind({
    source: { type: 'websocket', channel: 'trade-alerts' },
    target: {
        type: 'component',
        component: 'Toast',
        method: 'addData'
    },
    transform: function(trade) {
        var type = trade.status === 'executed' ? 'success' : 'warning';
        return {
            type: type,
            title: 'Trade ' + trade.status.toUpperCase(),
            message: trade.symbol + ' ' + trade.quantity + ' @ ' + trade.price
        };
    }
});
```
