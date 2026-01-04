# Funky.Modal - Native Modal System

Bootstrap 5 modal dialogs without Bootstrap JavaScript dependency.

## Overview

`Funky.Modal` provides a complete modal dialog system that replaces Bootstrap's JavaScript while maintaining full compatibility with Bootstrap CSS. It offers show/hide/toggle APIs, event support, focus trapping, backdrop handling, and modal stacking with programmatic modal creation helpers.

## Features

- **Bootstrap CSS compatible** - Works with existing Bootstrap modal markup
- **Zero Bootstrap JS dependency** - Pure vanilla JavaScript implementation
- **Full event system** - Emits both DOM and `Funky.Events` events
- **Focus management** - Automatic focus trapping and return focus on close
- **Backdrop modes** - Dismissible, static, or no backdrop
- **Keyboard support** - ESC key closes, Tab key traps focus
- **Modal stacking** - Multiple modals with proper z-index and scroll locking
- **Accessibility** - ARIA attributes, keyboard navigation, screen reader support
- **Animation support** - Respects `prefers-reduced-motion` and `data-animations` settings
- **Programmatic creation** - Create modals dynamically with `Modal.init()`
- **Helper dialogs** - Built-in `confirm()`, `alert()`, and `prompt()` modals
- **Data attribute triggers** - Declarative modal activation

## API Reference

### Constructor

#### `new Modal(target, options)`

Create a modal instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or CSS selector |
| options | object | No | Configuration options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| backdrop | boolean\|'static' | true | Show backdrop. 'static' prevents close on click |
| keyboard | boolean | true | Close modal on ESC key |
| focus | boolean | true | Auto-focus modal when shown |
| presenceChannel | string | - | Custom presence channel name |
| recordId | string | - | Record ID for auto-generated presence channel |
| modalType | string | 'modal' | Modal type for presence channel (e.g., 'trade-edit') |
| presenceStatus | string | - | Custom presence status ('editing' or 'viewing') |
| readonly | boolean | false | If true, sets presence status to 'viewing' |
| warnOnConflict | boolean | true | Warn if others are editing the same record |

**Returns:** `Modal` instance

**Example:**
```javascript
var modal = new Funky.Modal('#myModal', {
  backdrop: 'static',
  keyboard: false
});
modal.show();
```

---

### Instance Methods

#### `modal.show()`

Show the modal with animation.

**Example:**
```javascript
var modal = new Funky.Modal('#myModal');
modal.show();
```

**Events emitted:**
- `modal:show` - Before animation starts (cancelable)
- `modal:shown` - After animation completes

---

#### `modal.hide()`

Hide the modal with animation.

**Example:**
```javascript
modal.hide();
```

**Events emitted:**
- `modal:hide` - Before animation starts (cancelable)
- `modal:hidden` - After animation completes, focus returned to trigger

---

#### `modal.toggle()`

Toggle modal visibility.

**Example:**
```javascript
modal.toggle();
```

---

#### `modal.dispose()`

Destroy the modal instance and remove event listeners.

**Example:**
```javascript
modal.dispose();
delete modal;
```

---

### Static Methods

#### `Modal.show(target, options)`

Show a modal (creates instance if needed).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or selector |
| options | object | No | Configuration options |

**Example:**
```javascript
Funky.Modal.show('#myModal');
Funky.Modal.show('#confirmModal', { backdrop: 'static' });
```

---

#### `Modal.hide(target)`

Hide a modal by selector.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or selector |

**Example:**
```javascript
Funky.Modal.hide('#myModal');
```

---

#### `Modal.toggle(target, options)`

Toggle a modal's visibility.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or selector |
| options | object | No | Configuration options |

**Example:**
```javascript
Funky.Modal.toggle('#myModal');
```

---

#### `Modal.getInstance(target)`

Get existing modal instance (Bootstrap compatibility).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or selector |

**Returns:** `Modal|null` - Existing instance or null

**Example:**
```javascript
var modal = Funky.Modal.getInstance('#myModal');
if (modal) {
  modal.hide();
}
```

---

#### `Modal.getOrCreateInstance(target, options)`

Get existing instance or create a new one.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Modal element or selector |
| options | object | No | Configuration options (if creating) |

**Returns:** `Modal` - Modal instance

**Example:**
```javascript
var modal = Funky.Modal.getOrCreateInstance('#myModal', { keyboard: false });
```

---

#### `Modal.hideAll()`

Hide all open modals.

**Example:**
```javascript
Funky.Modal.hideAll();
```

---

#### `Modal.getOpenModals()`

Get array of all currently open modals.

**Returns:** `Modal[]` - Array of open modal instances

**Example:**
```javascript
var openModals = Funky.Modal.getOpenModals();
console.log('Open modals:', openModals.length);
```

---

#### `Modal.hasOpenModals()`

Check if any modals are currently open. Useful for keyboard/focus management.

**Returns:** `boolean` - True if at least one modal is open

**Example:**
```javascript
if (Funky.Modal.hasOpenModals()) {
  console.log('A modal is currently visible');
}
```

---

#### `Modal.cleanupBackdrops()`

Remove orphaned backdrop elements and unlock scroll.

**Example:**
```javascript
// Clean up after modal issues
Funky.Modal.cleanupBackdrops();
```

---

### Presence Methods

#### `Modal.enablePresence(options)`

Enable presence tracking for all modals. Shows who else is viewing/editing.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | object | No | Presence options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| warnOnConflict | boolean | true | Show warning when someone else is editing |
| showPresenceIndicator | boolean | true | Show avatar stack in modal header |

**Example:**
```javascript
Funky.Modal.enablePresence({
  warnOnConflict: true,
  showPresenceIndicator: true
});
```

---

#### `Modal.disablePresence()`

Disable presence tracking and leave all modal channels.

**Example:**
```javascript
Funky.Modal.disablePresence();
```

---

#### `Modal.isPresenceEnabled()`

Check if presence tracking is currently enabled.

**Returns:** `boolean`

**Example:**
```javascript
if (Funky.Modal.isPresenceEnabled()) {
  console.log('Presence tracking is active');
}
```

---

### Modal Generators

#### `Modal.init(config)`

Programmatically create a modal element.

**Config:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Modal element ID |
| title | string | No | Modal title |
| body | string\|HTMLElement | No | Modal body content |
| size | string | No | Modal size: 'sm', 'lg', 'xl', 'fullscreen' |
| scrollable | boolean | No | Make body scrollable (default: true) |
| centered | boolean | No | Vertically center modal (default: false) |
| slidePanel | boolean | No | Use slide panel style (default: false) |
| slidePanelSize | string | No | Slide panel size: 'sm', 'lg', 'xl' |
| footerButtons | array | No | Array of button configs |
| showClose | boolean | No | Show close button in header (default: true) |
| bodyId | string | No | ID for modal body element |

**Footer Button Config:**
| Name | Type | Description |
|------|------|-------------|
| text | string | Button text |
| class | string | Button CSS classes |
| id | string | Button element ID |
| close | boolean | Close modal on click |
| onClick | function | Click handler |

**Returns:** `HTMLElement` - The created modal element

**Example:**
```javascript
var modal = Funky.Modal.init({
  id: 'dynamicModal',
  title: 'Dynamic Modal',
  body: '<p>This modal was created programmatically</p>',
  size: 'lg',
  centered: true,
  footerButtons: [
    {
      text: 'Cancel',
      class: 'btn btn-secondary',
      close: true
    },
    {
      text: 'Save',
      class: 'btn btn-primary',
      id: 'saveBtn',
      onClick: function() {
        console.log('Save clicked');
        Funky.Modal.hide('#dynamicModal');
      }
    }
  ]
});

Funky.Modal.show('#dynamicModal');
```

---

#### `Modal.confirm(config)`

Create and show a confirmation dialog.

**Config:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Confirm' | Modal title |
| message | string | 'Are you sure?' | Confirmation message |
| confirmText | string | 'Confirm' | Confirm button text |
| cancelText | string | 'Cancel' | Cancel button text |
| confirmClass | string | 'btn btn-primary' | Confirm button class |
| cancelClass | string | 'btn btn-secondary' | Cancel button class |
| danger | boolean | false | Use danger styling (red button) |
| onConfirm | function | - | Callback when confirmed |
| onCancel | function | - | Callback when cancelled |

**Returns:** `Modal` - The modal instance

**Example:**
```javascript
Funky.Modal.confirm({
  title: 'Delete Trade',
  message: 'Are you sure you want to delete this trade?',
  danger: true,
  confirmText: 'Delete',
  onConfirm: function() {
    Funky.Api.delete('/api/trades/' + tradeId).then(function(response) {
      Funky.Toast.success('Trade deleted');
      table.reload();
    });
  }
});
```

---

#### `Modal.alert(config)`

Create and show an alert dialog.

**Config:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Alert' | Modal title |
| message | string | '' | Alert message |
| buttonText | string | 'OK' | Button text |
| buttonClass | string | 'btn btn-primary' | Button CSS class |
| type | string | - | Alert type: 'success', 'warning', 'danger', 'info' |
| onClose | function | - | Callback when closed |

**Returns:** `Modal` - The modal instance

**Example:**
```javascript
Funky.Modal.alert({
  title: 'Success',
  message: 'Trade saved successfully!',
  type: 'success',
  onClose: function() {
    window.location.href = '/trades';
  }
});
```

---

#### `Modal.prompt(config)`

Create and show a prompt dialog with input field.

**Config:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Input' | Modal title |
| message | string | - | Message above input |
| placeholder | string | - | Input placeholder |
| defaultValue | string | - | Default input value |
| inputType | string | 'text' | Input type (text, email, number, etc.) |
| submitText | string | 'Submit' | Submit button text |
| cancelText | string | 'Cancel' | Cancel button text |
| onSubmit | function | - | Callback with input value |
| onCancel | function | - | Callback when cancelled |

**Returns:** `Modal` - The modal instance

**Example:**
```javascript
Funky.Modal.prompt({
  title: 'Rename Trade',
  message: 'Enter new trade name:',
  placeholder: 'Trade name',
  defaultValue: currentTradeName,
  onSubmit: function(value) {
    Funky.Api.patch('/api/trades/' + tradeId, { name: value }).then(function(response) {
      Funky.Toast.success('Trade renamed');
    });
  }
});
```

---

#### `Modal.initTriggers(container)`

Initialize modal triggers with `data-funky-modal` attribute.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|HTMLElement | No | Container to search (default: document) |

**Example:**
```javascript
// Initialize triggers in dynamically loaded content
Funky.Modal.initTriggers('#newContent');
```

---

## Configuration

### Data Attributes

Configure modals via HTML data attributes:

**`data-funky-modal`** - Modal trigger

```html
<button data-funky-modal="#myModal">Open Modal</button>
```

**`data-funky-modal-close`** - Close button

```html
<button data-funky-modal-close>Close</button>
```

**`data-bs-backdrop`** or **`data-backdrop`** - Backdrop behavior

```html
<div class="modal" data-bs-backdrop="static">...</div>
```

Values: `true` (default), `false`, `'static'`

**`data-bs-keyboard`** or **`data-keyboard`** - Keyboard behavior

```html
<div class="modal" data-bs-keyboard="false">...</div>
```

Values: `true` (default), `false`

---

## Events

All events are emitted to both the modal element (DOM events) and `Funky.Events` (global event bus).

### Event Types

| Event | Timing | Cancelable | Payload |
|-------|--------|------------|---------|
| `modal:show` | Before modal shown | Yes | `{ modal, id, element }` |
| `modal:shown` | After modal shown | No | `{ modal, id, element }` |
| `modal:hide` | Before modal hidden | Yes | `{ modal, id, element }` |
| `modal:hidden` | After modal hidden | No | `{ modal, id, element }` |

### DOM Events

```javascript
var modalEl = document.getElementById('myModal');

modalEl.addEventListener('funky.modal.show', function(e) {
  console.log('Modal showing:', e.detail);
});

modalEl.addEventListener('funky.modal.shown', function(e) {
  console.log('Modal shown');
});

modalEl.addEventListener('funky.modal.hide', function(e) {
  console.log('Modal hiding');
});

modalEl.addEventListener('funky.modal.hidden', function(e) {
  console.log('Modal hidden');
});
```

### PubSub Events

```javascript
Funky.PubSub.on('funky:modal:show', function(data) {
  console.log('Modal showing:', data.id);
});

Funky.PubSub.on('funky:modal:shown', function(data) {
  console.log('Modal shown:', data.id);
});
```

### DOM Events (CustomEvent)

```javascript
modalEl.addEventListener('funky.modal.show', function(e) {
  if (!validateForm()) {
    e.preventDefault(); // Cancel showing modal
  }
});
```

---

## Accessibility

Funky.Modal implements full accessibility support:

- **ARIA attributes** - `aria-modal`, `aria-hidden`, `aria-labelledby`
- **Focus management** - Auto-focus first focusable element on show
- **Focus trapping** - Tab key cycles through modal elements only
- **Focus return** - Returns focus to trigger element on close
- **Keyboard navigation** - ESC to close, Tab to navigate
- **Screen reader support** - Proper role and labels

### FocusManager Integration

When `Funky.FocusManager` is available, modal uses it for enhanced focus management:

- **`FocusManager.trapFocus()`** - Creates focus trap within modal with proper cleanup
- **`FocusManager.focusAndPush()`** - Pushes trigger element to focus history when opening
- **`FocusManager.popFocus()`** - Restores focus to trigger element when closing

This integration enables:
- Proper escape key hierarchy (modals integrate with global escape handler)
- Focus history tracking across nested modals
- Automatic cleanup of focus traps on disposal

### Focusable Elements

The modal automatically finds and manages focus for:
- Links (`<a href>`)
- Buttons (not disabled)
- Form inputs (not disabled or hidden)
- Select and textarea (not disabled)
- Elements with `tabindex` (not -1)

---

## Examples

### Basic Modal

```html
<button data-funky-modal="#exampleModal">Open Modal</button>

<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal Title</h5>
        <button type="button" class="btn-close" data-funky-modal-close></button>
      </div>
      <div class="modal-body">
        <p>Modal body content goes here.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-funky-modal-close>Close</button>
        <button type="button" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>
```

### Programmatic Control

```javascript
// Create instance
var modal = new Funky.Modal('#myModal', {
  backdrop: 'static',
  keyboard: false
});

// Show modal
modal.show();

// Hide after 3 seconds
setTimeout(function() {
  modal.hide();
}, 3000);

// Clean up
modal.dispose();
```

### Static Methods

```javascript
// Quick show
Funky.Modal.show('#myModal');

// Show with options
Funky.Modal.show('#myModal', { backdrop: 'static' });

// Hide
Funky.Modal.hide('#myModal');

// Toggle
Funky.Modal.toggle('#myModal');

// Hide all modals
Funky.Modal.hideAll();
```

### Event Handling

```javascript
var modalEl = document.getElementById('myModal');

// DOM events
modalEl.addEventListener('funky.modal.shown', function() {
  console.log('Modal is now visible');
  document.getElementById('nameInput').focus();
});

modalEl.addEventListener('funky.modal.hidden', function() {
  console.log('Modal is now hidden');
  resetForm();
});

// Global events via PubSub
Funky.PubSub.on('funky:modal:show', function(data) {
  if (data.id === 'myModal') {
    loadModalData();
  }
});
```

### Confirmation Dialog

```javascript
document.getElementById('deleteBtn').addEventListener('click', function() {
  var tradeId = this.dataset.tradeId;

  Funky.Modal.confirm({
    title: 'Delete Trade',
    message: 'Are you sure you want to delete trade #' + tradeId + '?',
    danger: true,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: function() {
      Funky.Api.delete('/api/trades/' + tradeId).then(function(response) {
        if (response.success) {
          Funky.Toast.success('Trade deleted');
          location.reload();
        }
      });
    }
  });
});
```

### Alert Dialog

```javascript
// Success alert
Funky.Modal.alert({
  title: 'Success',
  message: 'Your changes have been saved.',
  type: 'success'
});

// Error alert
Funky.Modal.alert({
  title: 'Error',
  message: 'Failed to process request.',
  type: 'danger',
  onClose: function() {
    console.log('Alert closed');
  }
});
```

### Prompt Dialog

```javascript
document.getElementById('renameBtn').addEventListener('click', function() {
  var currentName = this.dataset.name;

  Funky.Modal.prompt({
    title: 'Rename Item',
    message: 'Enter new name:',
    placeholder: 'Item name',
    defaultValue: currentName,
    submitText: 'Rename',
    onSubmit: function(newName) {
      if (newName && newName !== currentName) {
        Funky.Api.patch('/api/items/' + itemId, { name: newName });
      }
    }
  });
});
```

### Dynamic Modal Creation

```javascript
function showUserProfile(userId) {
  // Create modal
  var modal = Funky.Modal.init({
    id: 'userProfileModal',
    title: 'User Profile',
    body: '<div class="text-center"><div class="spinner-border"></div></div>',
    size: 'lg',
    scrollable: true,
    footerButtons: [
      {
        text: 'Close',
        class: 'btn btn-secondary',
        close: true
      },
      {
        text: 'Edit',
        class: 'btn btn-primary',
        id: 'editUserBtn',
        onClick: function() {
          editUser(userId);
        }
      }
    ]
  });

  // Show and load data
  Funky.Modal.show('#userProfileModal');

  Funky.Api.get('/api/users/' + userId).then(function(response) {
    var body = document.querySelector('#userProfileModal .modal-body');
    body.innerHTML = renderUserProfile(response.data);
  });
}
```

### Backdrop Modes

```javascript
// Dismissible backdrop (default)
Funky.Modal.show('#modal1', { backdrop: true });

// Static backdrop (can't click outside to close)
Funky.Modal.show('#modal2', { backdrop: 'static' });

// No backdrop
Funky.Modal.show('#modal3', { backdrop: false });
```

### Slide Panel Style

```javascript
var slidePanel = Funky.Modal.init({
  id: 'slidePanel',
  title: 'Settings',
  body: '<p>Panel content</p>',
  slidePanel: true,
  slidePanelSize: 'lg'
});

Funky.Modal.show('#slidePanel');
```

### Modal Stacking

```javascript
// First modal
Funky.Modal.show('#modal1');

// Second modal (stacks on top)
setTimeout(function() {
  Funky.Modal.show('#modal2');
}, 1000);

// Get all open modals
var openModals = Funky.Modal.getOpenModals();
console.log('Open modals:', openModals.length); // 2
```

### Presence Tracking

```javascript
// Enable presence globally
Funky.Modal.enablePresence({
  warnOnConflict: true,
  showPresenceIndicator: true
});

// Modal with presence - auto-detects channel from recordId
var modal = new Funky.Modal('#editTradeModal', {
  recordId: '12345',
  modalType: 'trade-edit'
});
// Channel: 'modal:trade-edit:12345'

// Custom presence channel
var modal2 = new Funky.Modal('#customModal', {
  presenceChannel: 'custom:my-channel',
  presenceStatus: 'reviewing'
});

// Readonly modal (status = 'viewing')
var modal3 = new Funky.Modal('#viewModal', {
  recordId: '12345',
  readonly: true,
  warnOnConflict: false  // Don't warn for readonly access
});
```

---

## Animation Control

Modals respect animation preferences:

**Fade Animation** - Add `.fade` class

```html
<div class="modal fade" id="myModal">...</div>
```

**Disable Animations** - Set global preference

```javascript
document.documentElement.setAttribute('data-animations', 'off');
```

**Prefers Reduced Motion** - Automatically detected

Modals respect the `prefers-reduced-motion` media query for accessibility.

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Funky.PubSub** - Event bus for global events
- **Bootstrap 5 CSS** - Modal styling (no Bootstrap JS required)
- **Funky.FocusManager** (optional) - Enhanced focus trapping and history
- **Funky.Presence** (optional) - Real-time presence tracking for modals
- **Funky.Animate** (optional) - Animation duration detection

---

## See Also

- [Funky.Dom](./dom.md) - DOM manipulation
- [Funky.PubSub](./pubsub.md) - Event system
- [FormModal](../components/form-modal.md) - Form-based modals with JSONEditor
- [ViewModal](../components/view-modal.md) - Read-only data display modals
- [SlidePanel](../components/slide-panel.md) - Slide-in panel component
- [Toast](../components/toast.md) - Toast notifications
