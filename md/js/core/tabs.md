# Funky.Tabs - Native Tab System

Bootstrap 5 tab navigation without Bootstrap JavaScript dependency.

## Overview

`Funky.Tabs` provides a complete tab navigation system that replaces Bootstrap's JavaScript while maintaining full compatibility with Bootstrap CSS. It offers show/hide APIs, event support, keyboard navigation (arrow keys, Home, End), and accessibility features including ARIA attributes and focus management.

## Features

- **Bootstrap CSS compatible** - Works with existing Bootstrap tab markup
- **Zero Bootstrap JS dependency** - Pure vanilla JavaScript implementation
- **Full event system** - Emits both DOM and `Funky.Events` events
- **Keyboard navigation** - Arrow keys, Home, End keys for tab switching
- **Accessibility** - ARIA attributes, role attributes, keyboard support (Arrow keys, Enter, Space)
- **Animation support** - Respects `prefers-reduced-motion` and `data-animations` settings
- **Auto-initialization** - Automatically initializes tabs on page load
- **Data attribute triggers** - Works with `data-funky-tab` and `data-bs-toggle="tab"`
- **Flexible API** - Show tabs by ID, index, button, or panel element

## API Reference

### Constructor

#### `new Tabs(target, options)`

Create a tabs instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Tab container element or CSS selector |
| options | object | No | Configuration options |

**Options:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| activeTab | number\|string | 0 | Initial active tab (index or panel ID) |
| keyboard | boolean | true | Enable keyboard navigation |
| fade | boolean | true | Enable fade transitions |
| onChange | function | null | Callback when tab changes |

**Returns:** `Tabs` instance

**Example:**
```javascript
var tabs = new Funky.Tabs('#myTabs', {
  activeTab: 1,
  keyboard: true,
  onChange: function(tabId, panelId) {
    console.log('Tab changed to:', tabId);
  }
});
```

---

### Instance Methods

#### `tabs.show(target)`

Show a tab by button element, panel ID, or index.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement\|number | Yes | Tab button, panel selector, or index |

**Example:**
```javascript
// By index
tabs.show(0);

// By panel ID
tabs.show('#profile');
tabs.show('profile');

// By button element
var button = document.querySelector('[data-funky-tab="#profile"]');
tabs.show(button);
```

**Events emitted:**
- `tabs:show` - Before animation starts (cancelable)
- `tabs:shown` - After animation completes
- `tabs:hide` - Before current tab hides (cancelable)
- `tabs:hidden` - After current tab hidden

---

#### `tabs.getActive()`

Get the currently active tab information.

**Returns:** `Object` - `{ button, panel, tabId }` or `null`

**Example:**
```javascript
var active = tabs.getActive();
if (active) {
  console.log('Active tab ID:', active.tabId);
  console.log('Button element:', active.button);
  console.log('Panel element:', active.panel);
}
```

---

#### `tabs.getTab(target)`

Get a tab button by index or panel ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | number\|string | Yes | Tab index or panel ID |

**Returns:** `HTMLElement|null` - Tab button element

**Example:**
```javascript
var button = tabs.getTab(0);        // Get first tab button
var button = tabs.getTab('#profile'); // Get button for profile panel
```

---

#### `tabs.dispose()`

Destroy the tabs instance and remove event listeners.

**Example:**
```javascript
tabs.dispose();
```

---

### Static Methods

#### `Tabs.show(target, options)`

Show a specific tab (creates instance if needed).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Tab button or panel selector |
| options | object | No | Configuration options (if creating instance) |

**Example:**
```javascript
// Show tab by panel ID
Funky.Tabs.show('#profile');

// Show tab by button
Funky.Tabs.show('[data-funky-tab="#profile"]');
```

---

#### `Tabs.getInstance(target)`

Get existing tabs instance for a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Tab container element or selector |

**Returns:** `Tabs|null` - Existing instance or null

**Example:**
```javascript
var tabs = Funky.Tabs.getInstance('#myTabs');
if (tabs) {
  tabs.show(1);
}
```

---

#### `Tabs.getOrCreateInstance(target, options)`

Get existing instance or create a new one.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Tab container element or selector |
| options | object | No | Configuration options (if creating) |

**Returns:** `Tabs` - Tabs instance

**Example:**
```javascript
var tabs = Funky.Tabs.getOrCreateInstance('#myTabs', {
  activeTab: 'profile'
});
```

---

#### `Tabs.init(container)`

Initialize all tabs within a container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| container | string\|HTMLElement | No | Container to search (default: document) |

**Example:**
```javascript
// Initialize all tabs in document
Funky.Tabs.init();

// Initialize tabs in a specific container
Funky.Tabs.init('#dynamicContent');
```

---

#### `Tabs.destroy(target)`

Destroy a tabs instance.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| target | string\|HTMLElement | Yes | Tab container element or selector |

**Example:**
```javascript
Funky.Tabs.destroy('#myTabs');
```

---

## Configuration

### HTML Structure

Standard Bootstrap 5 tab markup is fully supported:

```html
<!-- Nav tabs -->
<ul class="nav nav-tabs" id="myTabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" data-funky-tab="#home" role="tab">
      Home
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" data-funky-tab="#profile" role="tab">
      Profile
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" data-funky-tab="#settings" role="tab">
      Settings
    </button>
  </li>
</ul>

<!-- Tab panels -->
<div class="tab-content">
  <div class="tab-pane fade show active" id="home" role="tabpanel">
    <p>Home content...</p>
  </div>
  <div class="tab-pane fade" id="profile" role="tabpanel">
    <p>Profile content...</p>
  </div>
  <div class="tab-pane fade" id="settings" role="tabpanel">
    <p>Settings content...</p>
  </div>
</div>
```

### Data Attributes

**`data-funky-tab`** - Tab trigger (preferred)

```html
<button class="nav-link" data-funky-tab="#profile">Profile</button>
```

**`data-bs-toggle="tab"`** - Bootstrap compatibility

```html
<button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile">Profile</button>
```

Both attributes are supported for backward compatibility.

---

## Events

All events are emitted to both the tab button element (DOM events) and `Funky.Events` (global event bus).

### Event Types

| Event | Timing | Cancelable | Payload |
|-------|--------|------------|---------|
| `tabs:show` | Before tab shown | Yes | `{ tabs, tabId, panelId, button, panel }` |
| `tabs:shown` | After tab shown | No | `{ tabs, tabId, panelId, button, panel }` |
| `tabs:hide` | Before tab hidden | Yes | `{ tabs, tabId, panelId, button, panel }` |
| `tabs:hidden` | After tab hidden | No | `{ tabs, tabId, panelId, button, panel }` |

### DOM Events

```javascript
var tabContainer = document.getElementById('myTabs');

tabContainer.addEventListener('funky.tabs.show', function(e) {
  console.log('Tab showing:', e.detail.tabId);
});

tabContainer.addEventListener('funky.tabs.shown', function(e) {
  console.log('Tab shown:', e.detail.tabId);
  // Initialize lazy content here
});

tabContainer.addEventListener('funky.tabs.hide', function(e) {
  console.log('Tab hiding:', e.detail.tabId);
});

tabContainer.addEventListener('funky.tabs.hidden', function(e) {
  console.log('Tab hidden:', e.detail.tabId);
});
```

### PubSub Events (Global Event Bus)

```javascript
Funky.PubSub.on('funky:tabs:show', function(data) {
  console.log('Any tab showing:', data.tabId);
});

Funky.PubSub.on('funky:tabs:shown', function(data) {
  console.log('Any tab shown:', data.tabId);
});
```

### Canceling Events (DOM)

```javascript
tabContainer.addEventListener('funky.tabs.show', function(e) {
  if (!validateBeforeTabSwitch()) {
    e.preventDefault(); // Cancel tab switch
  }
});
```

---

## Accessibility

Funky.Tabs implements full accessibility support:

- **ARIA attributes** - `role="tablist"`, `role="tab"`, `role="tabpanel"`
- **ARIA states** - `aria-selected`, `aria-controls`
- **Keyboard navigation** - Arrow keys, Home, End
- **Focus management** - Proper tabindex handling
- **Screen reader support** - Proper roles and labels

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Arrow Right** / **Arrow Down** | Move to next tab and activate it |
| **Arrow Left** / **Arrow Up** | Move to previous tab and activate it |
| **Home** | Move to first tab |
| **End** | Move to last tab |
| **Enter** / **Space** | Activate the currently focused tab |

---

## Examples

### Basic Tabs

```html
<ul class="nav nav-tabs" id="basicTabs" role="tablist">
  <li class="nav-item">
    <button class="nav-link active" data-funky-tab="#tab1">Tab 1</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-funky-tab="#tab2">Tab 2</button>
  </li>
</ul>

<div class="tab-content">
  <div class="tab-pane fade show active" id="tab1" role="tabpanel">
    Content 1
  </div>
  <div class="tab-pane fade" id="tab2" role="tabpanel">
    Content 2
  </div>
</div>
```

```javascript
// Auto-initialized on page load
// Or manually:
var tabs = new Funky.Tabs('#basicTabs');
```

### Programmatic Control

```javascript
// Create instance
var tabs = new Funky.Tabs('#myTabs', {
  activeTab: 1,
  onChange: function(tabId) {
    console.log('Tab changed to:', tabId);
  }
});

// Show specific tab
tabs.show(0);              // By index
tabs.show('#profile');     // By panel ID
tabs.show('settings');     // By panel ID (without #)

// Get active tab
var active = tabs.getActive();
console.log('Current tab:', active.tabId);

// Clean up
tabs.dispose();
```

### Static Methods

```javascript
// Quick show
Funky.Tabs.show('#profile');

// Get instance and control
var tabs = Funky.Tabs.getInstance('#myTabs');
if (tabs) {
  tabs.show(2);
}

// Initialize dynamically loaded content
Funky.Tabs.init('#newContent');
```

### Event Handling

```javascript
var tabContainer = document.getElementById('myTabs');

// Listen for tab shown
tabContainer.addEventListener('funky.tabs.shown', function(e) {
  var tabId = e.detail.tabId;

  // Lazy load content
  if (tabId === 'profile' && !profileLoaded) {
    loadProfileData();
    profileLoaded = true;
  }

  // Refresh Funky.Table in tab
  if (tabId === 'data' && table) {
    table.columns.adjust().responsive.recalc();
  }
});

// Prevent tab switch
tabContainer.addEventListener('funky.tabs.show', function(e) {
  if (e.detail.tabId === 'admin' && !isAdmin) {
    e.preventDefault();
    Funky.Toast.error('Access denied');
  }
});
```

### With Callbacks

```javascript
var tabs = new Funky.Tabs('#myTabs', {
  activeTab: 'home',
  onChange: function(tabId, panelId) {
    console.log('Switched to tab:', tabId);

    // Update URL
    history.replaceState(null, null, '#' + tabId);

    // Analytics
    trackPageView('tab-' + tabId);

    // Update UI
    updateBreadcrumb(tabId);
  }
});
```

### Lazy Loading Content

```javascript
var tabContainer = document.getElementById('myTabs');
var loadedTabs = {};

tabContainer.addEventListener('funky.tabs.shown', function(e) {
  var tabId = e.detail.tabId;

  // Load content only once
  if (!loadedTabs[tabId]) {
    var panel = e.detail.panel;

    Funky.Api.get('/api/content/' + tabId).then(function(response) {
      panel.innerHTML = response.html;
      loadedTabs[tabId] = true;
    });
  }
});
```

### Nav Pills

```html
<ul class="nav nav-pills" id="pillTabs" role="tablist">
  <li class="nav-item">
    <button class="nav-link active" data-funky-tab="#pill1">Pill 1</button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-funky-tab="#pill2">Pill 2</button>
  </li>
</ul>

<div class="tab-content mt-3">
  <div class="tab-pane fade show active" id="pill1" role="tabpanel">
    Pill 1 content
  </div>
  <div class="tab-pane fade" id="pill2" role="tabpanel">
    Pill 2 content
  </div>
</div>
```

### Vertical Tabs

```html
<div class="row">
  <div class="col-3">
    <div class="nav flex-column nav-pills" id="verticalTabs" role="tablist">
      <button class="nav-link active" data-funky-tab="#v-home">Home</button>
      <button class="nav-link" data-funky-tab="#v-profile">Profile</button>
      <button class="nav-link" data-funky-tab="#v-messages">Messages</button>
    </div>
  </div>
  <div class="col-9">
    <div class="tab-content">
      <div class="tab-pane fade show active" id="v-home" role="tabpanel">
        Home content
      </div>
      <div class="tab-pane fade" id="v-profile" role="tabpanel">
        Profile content
      </div>
      <div class="tab-pane fade" id="v-messages" role="tabpanel">
        Messages content
      </div>
    </div>
  </div>
</div>
```

### With Icons

```html
<ul class="nav nav-tabs" id="iconTabs" role="tablist">
  <li class="nav-item">
    <button class="nav-link active" data-funky-tab="#overview">
      <i class="fas fa-home"></i> Overview
    </button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-funky-tab="#analytics">
      <i class="fas fa-chart-bar"></i> Analytics
    </button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-funky-tab="#settings">
      <i class="fas fa-cog"></i> Settings
    </button>
  </li>
</ul>
```

### Funky.Table Integration

```javascript
var tabs = new Funky.Tabs('#reportTabs', {
  onChange: function(tabId) {
    // Recalculate Funky.Table columns when tab is shown
    var table = Funky.Table.getInstance('#' + tabId + ' table');
    if (table) {
      setTimeout(function() {
        table.columns.adjust().responsive.recalc();
      }, 150);
    }
  }
});
```

---

## Animation Control

Tabs respect animation preferences:

**Fade Animation** - Add `.fade` class to panels

```html
<div class="tab-pane fade" id="myPanel" role="tabpanel">...</div>
```

**Disable Animations** - Set global preference

```javascript
document.documentElement.setAttribute('data-animations', 'off');
```

**Prefers Reduced Motion** - Automatically detected

Tabs respect the `prefers-reduced-motion` media query for accessibility.

---

## Migration from Bootstrap

### Before (Bootstrap 5)

```html
<script src="bootstrap.bundle.min.js"></script>

<ul class="nav nav-tabs">
  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#home">Home</button>
</ul>
```

```javascript
// Show tab
var tab = new bootstrap.Tab(document.querySelector('[data-bs-target="#profile"]'));
tab.show();

// Events
document.querySelector('[data-bs-target="#profile"]').addEventListener('shown.bs.tab', function() {
  // ...
});
```

### After (Funky.Tabs)

```html
<!-- No Bootstrap JS needed -->
<script src="/assets/js/core/tabs.js"></script>

<ul class="nav nav-tabs">
  <!-- Both attributes work -->
  <button class="nav-link" data-funky-tab="#home">Home</button>
  <!-- Or keep Bootstrap attributes for compatibility -->
  <button class="nav-link" data-bs-toggle="tab" data-bs-target="#profile">Profile</button>
</ul>
```

```javascript
// Show tab
Funky.Tabs.show('#profile');

// Events
document.querySelector('[data-funky-tab="#profile"]').addEventListener('funky.tabs.shown', function() {
  // ...
});
```

### Event Name Mapping

| Bootstrap Event | Funky.Tabs Event |
|----------------|------------------|
| `show.bs.tab` | `funky.tabs.show` |
| `shown.bs.tab` | `funky.tabs.shown` |
| `hide.bs.tab` | `funky.tabs.hide` |
| `hidden.bs.tab` | `funky.tabs.hidden` |

---

## Dependencies

- **Funky.Dom** - DOM manipulation utilities
- **Funky.Events** - Event bus for global events
- **Bootstrap 5 CSS** - Tab styling (no Bootstrap JS required)

---

## See Also

- [Funky.Dom](./dom.md) - DOM manipulation
- [Funky.PubSub](./pubsub.md) - Event system
- [Tabbed](../components/tabbed.md) - Complex tab container using Funky.Tabs
- [Modal](./modal.md) - Modal dialogs
